import { adminDb } from "@/lib/firebase/admin";
import Image from "next/image";
import { ShieldAlert, CheckCircle, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

interface AdminCandidate {
  id: string;
  rank: number;
  matchScore: number;
  lostItemData: Record<string, unknown> | null;
}

interface AdminFoundItem {
  id: string;
  sourceType: string;
  imageUrl?: string;
  processingStatus: string;
  matchingStatus: string;
  objectType: string;
  publicCharacteristics?: Record<string, unknown>;
  privateCharacteristics?: Record<string, unknown>;
  candidates?: AdminCandidate[];
}

// Server component to fetch matches directly using Admin SDK
async function getMatchesData() {
  if (!adminDb) return [];

  try {
    // Fetch all found items that have been analyzed/matched
    const foundSnapshot = await adminDb.collection("foundItems")
      .where("processingStatus", "in", ["analyzed", "matched"])
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const foundItems = await Promise.all(foundSnapshot.docs.map(async (doc) => {
      const data = doc.data();
      
      // Fetch candidates for this found item
      const matchesSnapshot = await adminDb!.collection("matches")
        .where("foundItemId", "==", doc.id)
        .orderBy("rank", "asc")
        .get();

      const candidates = await Promise.all(matchesSnapshot.docs.map(async (mDoc) => {
        const matchData = mDoc.data();
        // Fetch corresponding lost item
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

    return foundItems;
  } catch (error) {
    console.error("Firestore disabled or failed during build:", error);
    return [];
  }
}

import { AdminMatchesClient } from "./ClientWrapper";

export default async function AdminMatchesPage() {
  const foundItems = await getMatchesData();

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Match Pipeline Admin</h1>
            <p className="text-gray-500 mt-2">View AI analysis results and candidate rankings.</p>
          </div>
        </header>

        {foundItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-xl font-medium text-gray-900">No Found Items Analyzed Yet</h3>
            <p className="text-gray-500 mt-2">Upload a found item to trigger AI matching.</p>
          </div>
        ) : (
          <AdminMatchesClient initialData={foundItems} />
        )}

      </div>
    </div>
  );
}
