import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { MatchRecord } from '@/types';
import { EmailService } from '@/services/email.service';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 });

    const claimTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    if (!adminDb || !adminAuth) return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });

    const query = await adminDb.collection('matches')
      .where('claimTokenHash', '==', claimTokenHash)
      .get();

    if (query.empty) return NextResponse.json({ error: 'Invalid claim token' }, { status: 404 });

    const doc = query.docs[0];
    const matchData = doc.data() as MatchRecord;

    if (matchData.matchingStatus !== 'otp_pending') {
      return NextResponse.json({ error: 'Invalid state for OTP' }, { status: 400 });
    }

    // Generate 6 digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 mins expiry

    const userRecord = await adminAuth.getUser(matchData.candidateOwnerId);
    if (!userRecord.email) {
      return NextResponse.json({ error: 'Candidate email not found' }, { status: 400 });
    }

    const nowStr = new Date().toISOString();

    await doc.ref.update({
      otpHash,
      otpExpiresAt: expiresAt.toISOString(),
      otpSentAt: nowStr,
      otpAttempts: 0,
      updatedAt: nowStr,
    });

    const emailSent = await EmailService.sendOwnershipOtp(userRecord.email, otp);
    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP Sent' });
  } catch (e: unknown) {
    console.error('Send OTP error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
