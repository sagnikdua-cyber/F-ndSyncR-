import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = 'FindSyncR <onboarding@resend.dev>'; // Using resend testing email domain
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export class EmailService {
  /**
   * Send a claim notification to the candidate with a secure single-use link
   */
  static async sendClaimNotification(toEmail: string, claimToken: string): Promise<boolean> {
    if (!resend) {
      console.warn('RESEND_API_KEY is not set. Email not sent.');
      return false;
    }

    try {
      const claimUrl = `${APP_URL}/claim/${claimToken}`;
      
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: toEmail,
        subject: 'Action Required: We may have found your lost item',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4A90E2;">F!ndSyncR Update</h2>
            <p>Good news! Our AI matching system indicates we may have found the belonging you reported lost.</p>
            <p>To verify ownership and claim your item securely, please use the unique link below:</p>
            <div style="margin: 30px 0;">
              <a href="${claimUrl}" style="background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review Found Item</a>
            </div>
            <p><strong>Security Notice:</strong></p>
            <ul>
              <li>This link is unique to you and single-use.</li>
              <li>It will expire in 24 hours.</li>
              <li>Do NOT share this link with anyone else.</li>
            </ul>
            <p>Thank you,<br/>The F!ndSyncR Team</p>
          </div>
        `,
      });

      if (error) {
        console.error('Resend Email Error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Failed to send claim notification:', e);
      return false;
    }
  }

  /**
   * Send ownership confirmation OTP
   */
  static async sendOwnershipOtp(toEmail: string, otp: string): Promise<boolean> {
    if (!resend) {
      console.warn('RESEND_API_KEY is not set. OTP Email not sent.');
      return false;
    }

    try {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: toEmail,
        subject: 'Your F!ndSyncR Verification Code',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4A90E2;">F!ndSyncR Verification</h2>
            <p>You have successfully answered the private verification question.</p>
            <p>To finalize your claim and confirm ownership, enter the following code on the claim page:</p>
            <div style="margin: 30px 0; padding: 20px; background-color: #f5f5f5; border-radius: 8px; text-align: center;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">${otp}</span>
            </div>
            <p>This code expires in 15 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
            <p>Thank you,<br/>The F!ndSyncR Team</p>
          </div>
        `,
      });

      if (error) {
        console.error('Resend OTP Email Error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Failed to send ownership OTP:', e);
      return false;
    }
  }
}
