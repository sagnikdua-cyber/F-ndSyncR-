import crypto from 'crypto';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { EmailService } from './email.service';
import { MatchRecord } from '@/types';
import { GoogleGenAI } from '@google/genai';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class ClaimService {
  /**
   * Progress to the next eligible candidate for a given found item.
   * If there's an active non-expired claim, it does nothing.
   */
  static async progressToNextCandidate(foundItemId: string): Promise<void> {
    if (!adminDb) throw new Error('Firebase Admin not initialized');

    try {
      const nowStr = new Date().toISOString();
      const activeStates = ['contacted', 'verification_pending', 'otp_pending', 'ownership_confirmed'];

      const result = await adminDb.runTransaction(async (t) => {
        const activeQuery = adminDb!.collection('matches')
          .where('foundItemId', '==', foundItemId)
          .where('matchingStatus', 'in', activeStates);
        
        const activeSnap = await t.get(activeQuery);

        let hasValidActiveClaim = false;
        for (const doc of activeSnap.docs) {
          const data = doc.data() as MatchRecord;
          if (data.matchingStatus === 'ownership_confirmed') {
            return { action: 'done' };
          }
          
          if (data.claimTokenExpiresAt && new Date(data.claimTokenExpiresAt) < new Date()) {
            t.update(doc.ref, {
              matchingStatus: 'expired',
              updatedAt: nowStr
            });
          } else {
            hasValidActiveClaim = true;
          }
        }

        if (hasValidActiveClaim) {
          return { action: 'wait' };
        }

        const pendingQuery = adminDb!.collection('matches')
          .where('foundItemId', '==', foundItemId)
          .where('matchingStatus', 'in', ['candidate-found', 'pending'])
          .orderBy('rank', 'asc')
          .limit(1);

        const pendingSnap = await t.get(pendingQuery);

        if (pendingSnap.empty) {
          return { action: 'done' };
        }

        const candidateDoc = pendingSnap.docs[0];
        const candidateData = candidateDoc.data() as MatchRecord;

        const token = crypto.randomBytes(32).toString('hex');
        const claimTokenHash = crypto.createHash('sha256').update(token).digest('hex');
        
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        if (!adminAuth) throw new Error('Firebase Admin Auth not initialized');
        const userRecord = await adminAuth.getUser(candidateData.candidateOwnerId);
        if (!userRecord.email) {
          t.update(candidateDoc.ref, {
            matchingStatus: 'verification_failed',
            failureReason: 'User has no registered email',
            updatedAt: nowStr
          });
          return { action: 'retry' };
        }

        t.update(candidateDoc.ref, {
          matchingStatus: 'contacted',
          claimTokenHash,
          claimTokenExpiresAt: expiresAt.toISOString(),
          contactedAt: nowStr,
          updatedAt: nowStr
        });

        return { action: 'email', email: userRecord.email, token, docRef: candidateDoc.ref };
      });

      if (result.action === 'retry') {
        return this.progressToNextCandidate(foundItemId);
      }

      if (result.action === 'email' && result.email && result.token && result.docRef) {
        const emailSent = await EmailService.sendClaimNotification(result.email, result.token);
        if (!emailSent) {
          await result.docRef.update({
            matchingStatus: 'pending',
            claimTokenHash: null,
            claimTokenExpiresAt: null,
            contactedAt: null,
            updatedAt: nowStr
          });
          console.error('Failed to send claim notification email.');
        }
      }
    } catch (error) {
      console.error('Error in progressToNextCandidate:', error);
    }
  }

  /**
   * Generates a dynamic verification question using Gemini based on private characteristics
   */
  static async generateVerificationQuestion(privateCharacteristics: Record<string, string>): Promise<string> {
    if (Object.keys(privateCharacteristics).length === 0) {
      return "Can you describe a specific hidden or private detail about this item?";
    }

    const characteristicsText = Object.entries(privateCharacteristics)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    const prompt = `You are a helpful assistant for a lost-and-found system. 
The owner reported the following private characteristics for their lost item: "${characteristicsText}".
Generate ONE clear, specific question to ask the claimant to verify they know this private detail.
Do NOT reveal the answer in the question.
Example: "What distinctive mark is present near the bottom of your bottle?"`;

    try {
      const response = await genai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt
      });
      return response.text?.trim() || "Can you describe a specific hidden or private detail about this item?";
    } catch (e) {
      console.error('Gemini error generating question:', e);
      return "Can you describe a specific hidden or private detail about this item?";
    }
  }

  /**
   * Verifies the user's answer against the private characteristics using Gemini
   */
  static async verifyPrivateAnswer(privateCharacteristics: Record<string, string>, answer: string): Promise<boolean> {
    if (!answer || answer.trim() === '') return false;
    
    if (Object.keys(privateCharacteristics).length === 0) {
      // If there are no private characteristics, we might accept any reasonable answer, or fail.
      // Usually, there should be some evidence. Let's do a strict check.
      return false;
    }

    const characteristicsText = Object.entries(privateCharacteristics)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    const prompt = `You are verifying a lost-and-found claim.
The true private characteristic is: "${characteristicsText}".
The claimant's answer is: "${answer}".
Does the claimant's answer reasonably match the true characteristic? Allow for synonyms and rephrasing, but reject vague or incorrect answers.
Reply exactly with "YES" or "NO".`;

    try {
      const response = await genai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt
      });
      return response.text?.trim().toUpperCase().includes('YES') || false;
    } catch (e) {
      console.error('Gemini error verifying answer:', e);
      return false;
    }
  }
}
