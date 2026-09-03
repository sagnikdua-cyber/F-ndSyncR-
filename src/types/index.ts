export type ClaimStatus = 
  | 'candidate-found'
  | 'pending'
  | 'contacted'
  | 'verification_pending'
  | 'verification_failed'
  | 'otp_pending'
  | 'ownership_confirmed'
  | 'declined'
  | 'expired'
  | 'cancelled';

export interface MatchRecord {
  id?: string;
  foundItemId: string;
  lostItemId: string;
  candidateOwnerId: string;
  matchScore: number;
  matchedCharacteristics: Record<string, string>;
  matchingStatus: ClaimStatus;
  rank: number;
  
  // Claim Process State
  claimTokenHash?: string;
  claimTokenExpiresAt?: string;
  claimTokenUsedAt?: string;
  
  contactedAt?: string;
  declinedAt?: string;
  verificationStartedAt?: string;
  verificationCompletedAt?: string;
  otpSentAt?: string;
  ownershipConfirmedAt?: string;
  failureReason?: string;
  
  verificationAttempts?: number;
  otpHash?: string;
  otpExpiresAt?: string;
  otpAttempts?: number;

  createdAt: string;
  updatedAt: string;
}
