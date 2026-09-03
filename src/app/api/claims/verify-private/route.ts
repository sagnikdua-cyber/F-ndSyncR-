import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase/admin';
import { MatchRecord } from '@/types';
import { ClaimService } from '@/services/claim.service';

const MAX_VERIFICATION_ATTEMPTS = 3;

export async function POST(req: NextRequest) {
  try {
    const { token, answer } = await req.json();
    if (!token || !answer) return NextResponse.json({ error: 'Token and answer are required' }, { status: 400 });

    const claimTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    if (!adminDb) return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });

    const canAttempt = await adminDb.runTransaction(async (t) => {
      const query = await t.get(adminDb!.collection('matches').where('claimTokenHash', '==', claimTokenHash));
      if (query.empty) return { allowed: false, error: 'Invalid claim token', status: 404 };
      
      const doc = query.docs[0];
      const matchData = doc.data() as MatchRecord;

      if (matchData.matchingStatus !== 'verification_pending') {
        return { allowed: false, error: 'Invalid state', status: 400 };
      }

      if (matchData.claimTokenExpiresAt && new Date(matchData.claimTokenExpiresAt) < new Date()) {
        return { allowed: false, error: 'Claim token expired', status: 400 };
      }

      const attempts = matchData.verificationAttempts || 0;
      if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
        return { allowed: false, error: 'Too many attempts', status: 403 };
      }

      t.update(doc.ref, { verificationAttempts: attempts + 1 });
      return { allowed: true, docId: doc.id, matchData, attempts };
    });

    if (!canAttempt.allowed) {
      return NextResponse.json({ error: canAttempt.error }, { status: canAttempt.status });
    }

    const { docId, matchData, attempts } = canAttempt;

    const lostItemDoc = await adminDb.collection('lostItems').doc(matchData!.lostItemId).get();
    const lostItemData = lostItemDoc.data();
    const privateCharacteristics = lostItemData?.privateCharacteristics || {};

    const isCorrect = await ClaimService.verifyPrivateAnswer(privateCharacteristics, answer);
    const nowStr = new Date().toISOString();

    const docRef = adminDb.collection('matches').doc(docId!);

    if (isCorrect) {
      await docRef.update({
        matchingStatus: 'otp_pending',
        verificationCompletedAt: nowStr,
        updatedAt: nowStr,
      });
      return NextResponse.json({ success: true });
    } else {
      const newAttempts = attempts! + 1;
      
      if (newAttempts >= MAX_VERIFICATION_ATTEMPTS) {
        // Fail candidate
        await docRef.update({
          matchingStatus: 'verification_failed',
          failureReason: 'Too many incorrect verification attempts',
          updatedAt: nowStr
        });

        // Trigger next candidate
        import('@/services/claim.service').then(({ ClaimService }) => {
          ClaimService.progressToNextCandidate(matchData!.foundItemId).catch(console.error);
        });

        return NextResponse.json({ success: false, failed: true, message: 'Too many incorrect attempts. We will continue searching.' });
      } else {
        await docRef.update({ updatedAt: nowStr });
        return NextResponse.json({ success: false, attemptsRemaining: MAX_VERIFICATION_ATTEMPTS - newAttempts });
      }
    }
  } catch (e: unknown) {
    console.error('Verify private answer error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
