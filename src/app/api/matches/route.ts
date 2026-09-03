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
    const userId = decodedToken.uid;
    if (!adminDb) return NextResponse.json({ error: "Database not initialized" }, { status: 500 });

    // Fetch matches for this student without orderBy to avoid requiring a composite index
    const snapshot = await adminDb.collection("matches")
      .where("candidateOwnerId", "==", userId)
      .get();

    const matches = await Promise.all(snapshot.docs.map(async (doc) => {
      const matchData = doc.data() as MatchRecord;
      
      // Fetch lost item details
      let lostItem = null;
      try {
        const lostDoc = await adminDb!.collection("lostItems").doc(matchData.lostItemId).get();
        if (lostDoc.exists) lostItem = lostDoc.data();
      } catch (e) {
        console.error("Error fetching lost item:", e);
      }

      // We don't fetch the full found item here to prevent exposing private characteristics.
      // We just need a reference ID to link to the claim page, and we rely on the claimToken 
      // which should be accessed via the secure claim workflow, not here.
      // Actually, if the status is "contacted", the user should have a claim token link.
      // For general "Potential Match", we just show the score and status.
      
      return {
        id: doc.id,
        matchScore: matchData.matchScore,
        matchingStatus: matchData.matchingStatus,
        createdAt: matchData.createdAt,
        matchedCharacteristics: matchData.matchedCharacteristics,
        lostItemName: lostItem?.itemName || "Unknown Item",
        lostItemType: lostItem?.itemType || "Unknown Type",
        foundItemId: matchData.foundItemId,
      };
    }));

    // Sort matches locally by descending creation date
    matches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Fetch matches error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
