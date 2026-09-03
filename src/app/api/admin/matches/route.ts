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

    const foundSnapshot = await adminDb.collection("foundItems")
      .where("processingStatus", "in", ["analyzed", "matched"])
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const foundItems = await Promise.all(foundSnapshot.docs.map(async (doc) => {
      const data = doc.data();
      
      const matchesSnapshot = await adminDb!.collection("matches")
        .where("foundItemId", "==", doc.id)
        .orderBy("rank", "asc")
        .get();

      const candidates = await Promise.all(matchesSnapshot.docs.map(async (mDoc) => {
        const matchData = mDoc.data();
        const lostDoc = await adminDb!.collection("lostItems").doc(matchData.lostItemId).get();
        return {
          id: mDoc.id,
          ...matchData,
          lostItemData: lostDoc.data() || null
        };
      }));

      return {
        id: doc.id,
        ...data,
        candidates
      };
    }));

    return NextResponse.json({ items: foundItems });
  } catch (err) {
    console.error("Admin matches fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
