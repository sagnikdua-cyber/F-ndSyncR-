import { auth } from '@/lib/firebase/config';
import { signInWithCustomToken, signOut as firebaseSignOut } from 'firebase/auth';

export class AuthService {
  /**
   * Request OTP for a given enrollment number
   */
  static async requestOtp(enrollmentNumber: string): Promise<{ maskedEmail?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', enrollmentNumber }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        return { error: data.error || 'Failed to request OTP' };
      }
      return { maskedEmail: data.maskedEmail };
    } catch (e: unknown) {
      const error = e as { message?: string };
      return { error: error.message || 'Network error' };
    }
  }

  /**
   * Verify OTP and sign in to Firebase
   */
  static async verifyOtp(enrollmentNumber: string, otp: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', enrollmentNumber, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to verify OTP' };
      }

      // We have the custom token!
      const { token } = data;
      await signInWithCustomToken(auth, token);
      
      return { success: true };
    } catch (e: unknown) {
      const error = e as { message?: string };
      return { success: false, error: error.message || 'Network error' };
    }
  }

  /**
   * Register a new student
   */
  static async register(studentData: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to register' };
      }

      return { success: true };
    } catch (e: unknown) {
      const error = e as { message?: string };
      return { success: false, error: error.message || 'Network error' };
    }
  }

  static async signOut() {
    await firebaseSignOut(auth);
  }
}
