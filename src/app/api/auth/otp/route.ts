import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

// In-memory store for OTPs (strictly for Phase 2 prototype before a real cache/DB is used)
const otpStore = new Map<string, { otp: string; expiresAt: number; uid: string }>();

export async function POST(request: Request) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin credentials missing. Architecture boundary reached.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { action, enrollmentNumber, otp } = body;

    if (!enrollmentNumber) {
      return NextResponse.json({ error: 'Enrollment number required' }, { status: 400 });
    }

    // Lookup student
    const studentSnapshot = await adminDb
      .collection('students')
      .where('enrollmentNumber', '==', enrollmentNumber)
      .limit(1)
      .get();

    if (studentSnapshot.empty) {
      return NextResponse.json({ error: 'Student not found', code: 'not_found' }, { status: 404 });
    }

    const studentDoc = studentSnapshot.docs[0];
    const studentData = studentDoc.data();
    const uid = studentDoc.id;

    if (action === 'generate') {
      // 1. Generate 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 2. Store OTP temporarily (5 minute expiry)
      otpStore.set(enrollmentNumber, {
        otp: generatedOtp,
        expiresAt: Date.now() + 5 * 60 * 1000,
        uid
      });

      // 3. (Future) Send via Resend
      console.log(`[DEBUG] OTP for ${studentData.collegeEmail}: ${generatedOtp}`);

      // Mask email for UI
      const email = studentData.collegeEmail;
      const maskedEmail = email.substring(0, 2) + '****' + email.substring(email.indexOf('@'));

      return NextResponse.json({ message: 'OTP sent', maskedEmail });
    } 
    
    if (action === 'verify') {
      if (!otp) {
        return NextResponse.json({ error: 'OTP required' }, { status: 400 });
      }

      const record = otpStore.get(enrollmentNumber);
      
      if (!record) {
        return NextResponse.json({ error: 'No OTP requested or it expired' }, { status: 400 });
      }

      if (Date.now() > record.expiresAt) {
        otpStore.delete(enrollmentNumber);
        return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
      }

      if (record.otp !== otp) {
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
      }

      // Verification successful! Mint Custom Token
      otpStore.delete(enrollmentNumber);
      
      const customToken = await adminAuth.createCustomToken(record.uid);
      
      return NextResponse.json({ token: customToken });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: unknown) {
    console.error('OTP Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
