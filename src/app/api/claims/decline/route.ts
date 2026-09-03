import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase/admin';
import { MatchRecord } from '@/types';

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

    if (matchData.matchingStatus !== 'contacted') {
      return NextResponse.json({ error: 'Invalid state for declining' }, { status: 400 });
    }

    const nowStr = new Date().toISOString();

    // 1. Mark as declined
    await doc.ref.update({
      matchingStatus: 'declined',
      declinedAt: nowStr,
      updatedAt: nowStr,
      claimTokenUsedAt: nowStr,
    });

    // 2. Trigger Next Candidate
    // Run asynchronously to not block
    import('@/services/claim.service').then(({ ClaimService }) => {
      ClaimService.progressToNextCandidate(matchData.foundItemId).catch(console.error);
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error('Decline claim error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
