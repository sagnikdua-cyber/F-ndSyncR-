import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { MatchRecord } from "@/types";
import { requireAdminAuth } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req);
    if (error) return error;

    const { matchId } = await req.json();
    if (!matchId) return NextResponse.json({ error: "Match ID is required" }, { status: 400 });

    if (!adminDb) return NextResponse.json({ error: "Database not initialized" }, { status: 500 });

    const matchDoc = await adminDb.collection("matches").doc(matchId).get();
    if (!matchDoc.exists) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    const matchData = matchDoc.data() as MatchRecord;

    if (matchData.matchingStatus !== "ownership_confirmed") {
      return NextResponse.json({ error: "Invalid match state" }, { status: 400 });
    }

    const nowStr = new Date().toISOString();

    // Mark the Found Item as recovered
    await adminDb.collection("foundItems").doc(matchData.foundItemId).update({
      recoveryStatus: "recovered",
      updatedAt: nowStr
    });

    // Notify the student
    import('@/services/notification.service').then(({ NotificationService }) => {
      NotificationService.createNotification({
        userId: matchData.candidateOwnerId,
        title: "Item Recovered",
        message: "Your item has been successfully collected from the security desk.",
        type: "success",
        link: "/recovery"
      }).catch(console.error);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin confirm recovery error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
