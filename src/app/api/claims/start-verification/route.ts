import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase/admin';
import { MatchRecord } from '@/types';
import { ClaimService } from '@/services/claim.service';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 });

    const claimTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    if (!adminDb) return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });

    const query = await adminDb.collection('matches')
      .where('claimTokenHash', '==', claimTokenHash)
      .get();

    if (query.empty) return NextResponse.json({ error: 'Invalid claim token' }, { status: 404 });

    const doc = query.docs[0];
    const matchData = doc.data() as MatchRecord;

    if (!['contacted', 'verification_pending'].includes(matchData.matchingStatus)) {
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
    }

    const nowStr = new Date().toISOString();

    // Transition to verification_pending if not already
    if (matchData.matchingStatus === 'contacted') {
      await doc.ref.update({
        matchingStatus: 'verification_pending',
        verificationStartedAt: nowStr,
        updatedAt: nowStr,
        verificationAttempts: 0,
        claimTokenUsedAt: nowStr // They used the link to click YES
      });
    }

    // Generate Verification Question
    const lostItemDoc = await adminDb.collection('lostItems').doc(matchData.lostItemId).get();
    const lostItemData = lostItemDoc.data();
    const privateCharacteristics = lostItemData?.privateCharacteristics || {};

    const question = await ClaimService.generateVerificationQuestion(privateCharacteristics);

    return NextResponse.json({ question });
  } catch (e: unknown) {
    console.error('Start verification error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
