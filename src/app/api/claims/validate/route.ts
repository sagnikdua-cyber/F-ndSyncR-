import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase/admin';
import { MatchRecord } from '@/types';
import { StorageService } from '@/services/storage.service';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const claimTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    if (!adminDb) {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const query = await adminDb.collection('matches')
      .where('claimTokenHash', '==', claimTokenHash)
      .get();

    if (query.empty) {
      return NextResponse.json({ error: 'Invalid claim token' }, { status: 404 });
    }

    const doc = query.docs[0];
    const matchData = doc.data() as MatchRecord;

    // Check expiration
    if (matchData.claimTokenExpiresAt && new Date(matchData.claimTokenExpiresAt) < new Date()) {
      return NextResponse.json({ error: 'Claim token expired' }, { status: 400 });
    }

    // Only allow access if the claim is active
    if (!['contacted', 'verification_pending', 'otp_pending'].includes(matchData.matchingStatus)) {
      return NextResponse.json({ error: 'Claim is no longer active' }, { status: 400 });
    }

    // Fetch Found Item details safely (excluding admin/internal details)
    const foundItemDoc = await adminDb.collection('foundItems').doc(matchData.foundItemId).get();
    if (!foundItemDoc.exists) {
      return NextResponse.json({ error: 'Found item not found' }, { status: 404 });
    }

    const foundItemData = foundItemDoc.data();
    
    // Generate Signed URL for private image access
    let imageUrl = foundItemData?.imageUrl;
    if (imageUrl) {
      const signedUrl = await StorageService.getSignedUrl(imageUrl, 'found-items');
      if (signedUrl) {
        imageUrl = signedUrl;
      }
    }

    // Safe return data
    const safeData = {
      matchId: doc.id,
      status: matchData.matchingStatus,
      foundItem: {
        id: foundItemDoc.id,
        imageUrl,
        objectType: foundItemData?.aiAnalysis?.objectType || 'Unknown Item',
        foundAt: foundItemData?.createdAt,
        location: foundItemData?.location || 'Campus',
      }
    };

    return NextResponse.json(safeData);
  } catch (e: unknown) {
    console.error('Validate token error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
