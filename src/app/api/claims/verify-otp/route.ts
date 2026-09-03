import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase/admin';
import { MatchRecord } from '@/types';

const MAX_OTP_ATTEMPTS = 3;

export async function POST(req: NextRequest) {
  try {
    const { token, otp } = await req.json();
    if (!token || !otp) return NextResponse.json({ error: 'Token and OTP are required' }, { status: 400 });

    const claimTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const otpHashInput = crypto.createHash('sha256').update(otp).digest('hex');

    if (!adminDb) return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });

    const result = await adminDb.runTransaction(async (t) => {
      const matchQuery = adminDb!.collection('matches')
        .where('claimTokenHash', '==', claimTokenHash);
      const matchSnap = await t.get(matchQuery);

      if (matchSnap.empty) {
        return { status: 404, error: 'Invalid claim token' };
      }

      const doc = matchSnap.docs[0];
      const matchData = doc.data() as MatchRecord;

      if (matchData.matchingStatus !== 'otp_pending') {
        return { status: 400, error: 'Invalid state' };
      }

      const attempts = matchData.otpAttempts || 0;
      if (attempts >= MAX_OTP_ATTEMPTS) {
        return { status: 403, error: 'Too many OTP attempts' };
      }

      if (matchData.otpExpiresAt && new Date(matchData.otpExpiresAt) < new Date()) {
        return { status: 400, error: 'OTP expired' };
      }

      const nowStr = new Date().toISOString();

      if (matchData.otpHash === otpHashInput) {
        // We must fetch all required documents before performing any writes
        const otherClaimsQuery = adminDb!.collection('matches')
          .where('foundItemId', '==', matchData.foundItemId)
          .where('matchingStatus', 'in', ['candidate-found', 'pending', 'contacted']);
        const otherClaimsSnap = await t.get(otherClaimsQuery);

        // 1. Mark claim as successful
        t.update(doc.ref, {
          matchingStatus: 'ownership_confirmed',
          ownershipConfirmedAt: nowStr,
          updatedAt: nowStr,
        });

        // 2. Mark Found Item as Ready for Collection & 48h expiry
        const collectionExpiresAt = new Date();
        collectionExpiresAt.setHours(collectionExpiresAt.getHours() + 48);

        const foundItemRef = adminDb!.collection('foundItems').doc(matchData.foundItemId);
        t.update(foundItemRef, {
          recoveryStatus: 'ready_for_collection',
          collectionCreatedAt: nowStr,
          collectionExpiresAt: collectionExpiresAt.toISOString(),
          updatedAt: nowStr
        });
        
        // 3. Mark Lost Item as awaiting collection
        const lostItemRef = adminDb!.collection('lostItems').doc(matchData.lostItemId);
        t.update(lostItemRef, {
          status: 'awaiting_collection',
          updatedAt: nowStr
        });

        // 4. Create Collection Session (Term I -> Term II Hardware Simulation)
        const sessionRef = adminDb!.collection('collectionSessions').doc();
        t.set(sessionRef, {
          collectionSessionId: sessionRef.id,
          studentId: matchData.candidateOwnerId,
          foundItemId: matchData.foundItemId,
          claimId: doc.id,
          status: 'ACTIVE',
          createdAt: nowStr,
          updatedAt: nowStr,
          expiresAt: collectionExpiresAt.toISOString()
        });

        // 5. Cancel competing claims
        otherClaimsSnap.docs.forEach(otherDoc => {
          if (otherDoc.id !== doc.id) {
            t.update(otherDoc.ref, {
              matchingStatus: 'cancelled',
              failureReason: 'Item claimed by another candidate',
              updatedAt: nowStr
            });
          }
        });

        return { status: 200, success: true, matchData };
      } else {
        const newAttempts = attempts + 1;
        
        if (newAttempts >= MAX_OTP_ATTEMPTS) {
          t.update(doc.ref, {
            matchingStatus: 'verification_failed',
            failureReason: 'Too many incorrect OTP attempts',
            otpAttempts: newAttempts,
            updatedAt: nowStr
          });
          return { status: 403, success: false, failed: true, message: 'Too many incorrect attempts. Claim rejected.', matchData };
        } else {
          t.update(doc.ref, {
            otpAttempts: newAttempts,
            updatedAt: nowStr
          });
          return { status: 400, success: false, attemptsRemaining: MAX_OTP_ATTEMPTS - newAttempts };
        }
      }
    });

    if (result.status === 200 && result.matchData) {
      // Notify student
      import('@/services/notification.service').then(({ NotificationService }) => {
        NotificationService.createNotification({
          userId: result.matchData!.candidateOwnerId,
          title: "Ownership Confirmed!",
          message: "Verification successful. Your item is now ready for collection.",
          type: "success",
          link: "/recovery"
        }).catch(console.error);
      });
      return NextResponse.json({ success: true });
    }

    if (result.failed && result.matchData) {
      // Trigger next candidate
      import('@/services/claim.service').then(({ ClaimService }) => {
        ClaimService.progressToNextCandidate(result.matchData!.foundItemId).catch(console.error);
      });
      return NextResponse.json({ success: false, failed: true, message: result.message }, { status: result.status });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: false, attemptsRemaining: result.attemptsRemaining }, { status: result.status });
    
  } catch (e: unknown) {
    console.error('Verify OTP error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
