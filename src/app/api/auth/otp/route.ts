import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { EmailService } from '@/services/email.service';



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
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute expiry
      
      // 2. Store OTP in Firestore (stateless compatible)
      await adminDb.collection('students').doc(uid).update({
        loginOtp: generatedOtp,
        loginOtpExpiresAt: expiresAt,
      });

      // 3. Send via Resend
      console.log(`[DEBUG] Generating OTP for ${studentData.collegeEmail}`);
      
      const emailSent = await EmailService.sendLoginOtp(studentData.collegeEmail, generatedOtp);
      if (!emailSent) {
        // We log the error but still return success to the UI in prototype mode 
        // to not break the flow if Resend is missing API keys
        console.warn(`[WARNING] Failed to send OTP to ${studentData.collegeEmail}. Did you set RESEND_API_KEY?`);
      }

      // Mask email for UI
      const email = studentData.collegeEmail;
      const maskedEmail = email.substring(0, 2) + '****' + email.substring(email.indexOf('@'));

      return NextResponse.json({ message: 'OTP sent', maskedEmail });
    } 
    
    if (action === 'verify') {
      if (!otp) {
        return NextResponse.json({ error: 'OTP required' }, { status: 400 });
      }

      // Read OTP from the student's Firestore document
      const storedOtp = studentData.loginOtp;
      const expiresAt = studentData.loginOtpExpiresAt;
      
      if (!storedOtp || !expiresAt) {
        return NextResponse.json({ error: 'No OTP requested or it expired' }, { status: 400 });
      }

      if (Date.now() > expiresAt) {
        await adminDb.collection('students').doc(uid).update({
          loginOtp: null,
          loginOtpExpiresAt: null,
        });
        return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
      }

      if (storedOtp !== otp) {
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
      }

      // Verification successful! Clear the OTP and Mint Custom Token
      await adminDb.collection('students').doc(uid).update({
        loginOtp: null,
        loginOtpExpiresAt: null,
      });
      
      const customToken = await adminAuth.createCustomToken(uid);
      
      return NextResponse.json({ token: customToken });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: unknown) {
    console.error('OTP Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
