import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdminAuth } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  try {
    const { decodedToken, error } = await requireAdminAuth(req);
    if (error || !decodedToken) return error || NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { foundItemId } = await req.json();
    if (!foundItemId) return NextResponse.json({ error: "Found Item ID is required" }, { status: 400 });

    if (!adminDb) return NextResponse.json({ error: "Database not initialized" }, { status: 500 });

    const itemDoc = await adminDb.collection("foundItems").doc(foundItemId).get();
    if (!itemDoc.exists) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const itemData = itemDoc.data();

    // Check if it's actually expired
    if (itemData?.recoveryStatus !== "expired") {
      return NextResponse.json({ error: "Item is not in expired status" }, { status: 400 });
    }

    const nowStr = new Date().toISOString();

    // Mark as physically removed
    await adminDb.collection("foundItems").doc(foundItemId).update({
      recoveryStatus: "physically_removed",
      removedAt: nowStr,
      removedBy: decodedToken.uid,
      updatedAt: nowStr
    });

    // Record an admin notification/activity
    await adminDb.collection("notifications").add({
      userId: "admin",
      title: "Item Removed",
      message: `Expired item ${foundItemId.substring(0,8)} was physically removed.`,
      type: "info",
      isRead: false,
      createdAt: nowStr
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin confirm removal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
