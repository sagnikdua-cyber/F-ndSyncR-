import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { MatchRecord } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth?.verifyIdToken(idToken);
    
    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decodedToken.enrollmentNumber || decodedToken.uid;

    if (!adminDb) return NextResponse.json({ error: "Database not initialized" }, { status: 500 });

    const snapshot = await adminDb.collection("matches")
      .where("candidateOwnerId", "==", userId)
      .where("matchingStatus", "==", "ownership_confirmed")
      .orderBy("createdAt", "desc")
      .get();

    const recoveryItems = await Promise.all(snapshot.docs.map(async (doc) => {
      const matchData = doc.data() as MatchRecord;
      
      let lostItem = null;
      let foundItem = null;
      try {
        const lostDoc = await adminDb!.collection("lostItems").doc(matchData.lostItemId).get();
        if (lostDoc.exists) lostItem = lostDoc.data();
        
        const foundDoc = await adminDb!.collection("foundItems").doc(matchData.foundItemId).get();
        if (foundDoc.exists) foundItem = foundDoc.data();
      } catch (e) {
        console.error("Error fetching items:", e);
      }

      return {
        matchId: doc.id,
        foundItemId: matchData.foundItemId,
        lostItemName: lostItem?.itemName || "Unknown Item",
        lostItemType: lostItem?.itemType || "Unknown Type",
        recoveryStatus: foundItem?.recoveryStatus || 'awaiting_collection',
        ownershipConfirmedAt: matchData.ownershipConfirmedAt,
      };
    }));

    return NextResponse.json({ items: recoveryItems });
  } catch (error) {
    console.error("Fetch recovery items error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
