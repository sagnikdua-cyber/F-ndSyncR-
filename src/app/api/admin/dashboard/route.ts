import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdminAuth } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req);
    if (error) return error;

    if (!adminDb) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const foundItemsSnap = await adminDb.collection("foundItems").count().get();
    const totalFoundItems = foundItemsSnap.data().count;

    const activeClaimsSnap = await adminDb.collection("matches")
      .where("matchingStatus", "in", ["pending", "contacted", "verification_pending", "otp_pending"])
      .count().get();
    const activeClaims = activeClaimsSnap.data().count;

    const verifiedSnap = await adminDb.collection("matches")
      .where("matchingStatus", "==", "ownership_confirmed")
      .count().get();
    const verifiedRecovered = verifiedSnap.data().count;

    const expiredSnap = await adminDb.collection("foundItems")
      .where("recoveryStatus", "==", "expired")
      .count().get();
    const expiredCount = expiredSnap.data().count;

    const activitySnap = await adminDb.collection("notifications")
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();
    
    const recentActivity = activitySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({
      totalFoundItems,
      activeClaims,
      verifiedRecovered,
      expiredCount,
      recentActivity
    });
  } catch (err) {
    console.error("Admin dashboard fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
