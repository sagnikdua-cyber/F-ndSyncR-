import { adminDb } from '@/lib/firebase/admin';

export interface AIAnalysisResult {
  objectType: string;
  publicCharacteristics: {
    color?: string;
    shape?: string;
    brand?: string;
    visibleText?: string;
  };
  privateCharacteristics: Record<string, string>;
}

interface Candidate {
  id: string;
  lostItem: Record<string, unknown>;
  score: number;
}

export class MatchingService {
  private static THRESHOLD = 50; // 50% minimum Potential Match Score

  /**
   * Compare AI public characteristics with lost item records and rank them.
   */
  static async findMatchesForFoundItem(foundItemId: string, aiResult: AIAnalysisResult) {
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }

    try {
      // 1. Fetch eligible lost items
      const snapshot = await adminDb.collection('lostItems')
        .where('status', '==', 'reported')
        .get();

      if (snapshot.empty) {
        return { matchingStatus: 'no-match', matchesFound: 0 };
      }

      const candidates: Candidate[] = [];

      // 2. Score each lost item
      snapshot.forEach(doc => {
        const lostItem = doc.data();
        const score = this.calculateMatchScore(aiResult, lostItem);

        if (score >= this.THRESHOLD) {
          candidates.push({
            id: doc.id,
            lostItem,
            score
          });
        }
      });

      // 3. Rank candidates
      candidates.sort((a, b) => b.score - a.score);

      if (candidates.length === 0) {
        return { matchingStatus: 'no-match', matchesFound: 0 };
      }

      // 4. Save matches to Firestore
      const now = new Date().toISOString();
      let rank = 1;

      for (const candidate of candidates) {
        await adminDb.collection('matches').add({
          foundItemId,
          lostItemId: candidate.id,
          candidateOwnerId: candidate.lostItem.ownerId,
          matchScore: candidate.score,
          matchedCharacteristics: aiResult.publicCharacteristics, // Public AI output only
          matchingStatus: 'candidate-found',
          rank,
          createdAt: now,
          updatedAt: now,
        });

        // Optional: Update the lostItem status to 'matching' if it is a strong match
        await adminDb.collection('lostItems').doc(candidate.id).update({
          matchingStatus: 'candidate-found',
          updatedAt: now,
        });

        // Trigger notification to the candidate
        import('./notification.service').then(({ NotificationService }) => {
          NotificationService.createNotification({
            userId: String(candidate.lostItem.ownerId),
            title: "Potential Match Found!",
            message: `Our AI found a ${candidate.score}% potential match for your lost item.`,
            type: "info",
            link: "/matches"
          }).catch(console.error);
        });

        rank++;
      }
      // 5. Trigger Candidate Progression
      // We run this asynchronously so we don't block the API response
      import('./claim.service').then(({ ClaimService }) => {
        ClaimService.progressToNextCandidate(foundItemId).catch(console.error);
      });

      return { matchingStatus: 'candidate-found', matchesFound: candidates.length };
    } catch (error) {
      console.error('MatchingService Error:', error);
      throw error;
    }
  }

  /**
   * Calculates a weighted percentage match score.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static calculateMatchScore(foundItemAI: AIAnalysisResult, lostItem: any): number {
    let score = 0;
    const weights = {
      type: 40,
      color: 25,
      brand: 20,
      shape: 15
    };

    const normalize = (str: string | undefined) => (str ? str.toLowerCase().trim() : '');
    const isUncertain = (str: string) => !str || str === 'unknown' || str === 'none' || str === 'n/a';

    const foundType = normalize(foundItemAI.objectType);
    const lostType = normalize(lostItem.itemType);
    const lostName = normalize(lostItem.itemName);

    // 1. Type Match (40 points)
    // If exact match or partial match in name/type
    if (!isUncertain(foundType) && (lostType.includes(foundType) || foundType.includes(lostType) || lostName.includes(foundType))) {
      score += weights.type;
    } else if (!isUncertain(foundType) && !isUncertain(lostType)) {
      // Partial points for some overlap, crude approximation
      const foundWords = foundType.split(' ');
      if (foundWords.some(w => lostType.includes(w) || lostName.includes(w))) {
        score += (weights.type / 2);
      }
    }

    const pubLost = lostItem.publicCharacteristics || {};
    const pubFound = foundItemAI.publicCharacteristics || {};

    // 2. Color Match (25 points)
    const foundColor = normalize(pubFound.color);
    const lostColor = normalize(pubLost.color);
    if (!isUncertain(foundColor) && !isUncertain(lostColor)) {
      if (foundColor.includes(lostColor) || lostColor.includes(foundColor)) {
        score += weights.color;
      }
    }

    // 3. Brand Match (20 points)
    const foundBrand = normalize(pubFound.brand);
    const lostBrand = normalize(pubLost.brand);
    if (!isUncertain(foundBrand) && !isUncertain(lostBrand)) {
      if (foundBrand.includes(lostBrand) || lostBrand.includes(foundBrand)) {
        score += weights.brand;
      }
    }

    // 4. Shape/Design Match (15 points)
    const foundShape = normalize(pubFound.shape);
    const lostShape = normalize(pubLost.shape);
    const foundDesign = normalize(pubFound.visibleText);
    const lostDesign = normalize(pubLost.visibleDesign); // Note: UI uses visibleDesign

    let shapeDesignScore = 0;
    if (!isUncertain(foundShape) && !isUncertain(lostShape) && (foundShape.includes(lostShape) || lostShape.includes(foundShape))) {
      shapeDesignScore += (weights.shape / 2);
    }
    if (!isUncertain(foundDesign) && !isUncertain(lostDesign) && (foundDesign.includes(lostDesign) || lostDesign.includes(foundDesign))) {
      shapeDesignScore += (weights.shape / 2);
    }
    score += shapeDesignScore;

    return Math.min(Math.round(score), 100); // Cap at 100
  }
}
