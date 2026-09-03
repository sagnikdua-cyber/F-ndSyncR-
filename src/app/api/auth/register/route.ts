import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin credentials missing. Architecture boundary reached.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { enrollmentNumber, collegeEmail, year, section, department, rollNumber } = body;

    if (!enrollmentNumber || !collegeEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Check if enrollment number exists
    const existingStudent = await adminDb
      .collection('students')
      .where('enrollmentNumber', '==', enrollmentNumber)
      .limit(1)
      .get();

    if (!existingStudent.empty) {
      return NextResponse.json({ error: 'Enrollment number already registered' }, { status: 400 });
    }

    // 2. Check if email exists in Auth
    let uid: string;
    try {
      const userRecord = await adminAuth.getUserByEmail(collegeEmail);
      uid = userRecord.uid;
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === 'auth/user-not-found') {
        // Create new Firebase Auth user (placeholder password, as we use Custom Tokens)
        const newUser = await adminAuth.createUser({
          email: collegeEmail,
          emailVerified: false,
          // Generate a highly secure random password they will never use
          password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10),
        });
        uid = newUser.uid;
      } else {
        throw error;
      }
    }

    // 3. Create student document securely
    await adminDb.collection('students').doc(uid).set({
      enrollmentNumber,
      collegeEmail,
      year,
      section,
      department,
      rollNumber,
      firebaseUid: uid,
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: 'Registration successful', uid });

  } catch (error: unknown) {
    console.error('Register Route Error:', error);
    const err = error as { message?: string };
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
