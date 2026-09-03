'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ClaimPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ status: string; foundItem: { id: string; imageUrl?: string; location?: string } } | null>(null);
  
  const [step, setStep] = useState<'initial' | 'verify' | 'otp' | 'success' | 'declined'>('initial');
  
  // Verify state
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // OTP state
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await fetch('/api/claims/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const resData = await res.json();
        
        if (!res.ok) {
          setError(resData.error || 'Invalid or expired token.');
          setLoading(false);
          return;
        }

        setData(resData);
        if (resData.status === 'verification_pending') {
          // If already in verification pending, fetch question
          setLoading(true);
          try {
            const vRes = await fetch('/api/claims/start-verification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token })
            });
            const vData = await vRes.json();
            if (!vRes.ok) throw new Error(vData.error);
            
            setQuestion(vData.question);
            setStep('verify');
          } catch {
            setError('Error starting verification.');
          } finally {
            setLoading(false);
          }
        } else if (resData.status === 'otp_pending') {
          setStep('otp');
        } else {
          setStep('initial');
        }
      } catch {
        setError('Network error validating token.');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleDecline = async () => {
    setLoading(true);
    try {
      await fetch('/api/claims/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      setStep('declined');
    } catch {
      setError('Error declining claim.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartVerification = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/claims/start-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setQuestion(data.question);
      setStep('verify');
    } catch {
      setError('Error starting verification.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setVerifyLoading(true);
    setVerifyError('');
    try {
      const res = await fetch('/api/claims/verify-private', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answer })
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.failed) {
          setError(data.message);
          setStep('declined');
        } else {
          setVerifyError(`Incorrect answer. Attempts remaining: ${data.attemptsRemaining}`);
        }
        return;
      }
      
      // Success, send OTP
      const otpRes = await fetch('/api/claims/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      if (otpRes.ok) {
        setStep('otp');
      } else {
        setError('Failed to send OTP.');
      }
    } catch {
      setVerifyError('Error verifying answer.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const submitOtp = async () => {
    if (!otp.trim()) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch('/api/claims/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, otp })
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.failed) {
          setError(data.message);
          setStep('declined');
        } else {
          setOtpError(`Incorrect code. Attempts remaining: ${data.attemptsRemaining}`);
        }
        return;
      }
      
      setStep('success');
    } catch {
      setOtpError('Error verifying OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Verification Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">You may close this window.</p>
        </div>
      </div>
    );
  }

  if (step === 'declined') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Thank You</h2>
          <p className="text-gray-600 mb-6">Thank you for your cooperation. We&apos;ll continue searching for the actual owner.</p>
          <p className="text-sm text-gray-500">You may close this window.</p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm text-center border-t-4 border-green-500">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Ownership Successfully Verified!</h2>
          <p className="text-gray-600 mb-4 font-medium">Your belonging has been successfully verified.</p>
          <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl mb-6 text-left border border-blue-100">
            <strong>Term I:</strong> The physical F!ndSyncR Box is not yet connected. Gate opening will be enabled in Phase II after hardware integration.
          </div>
          <Link href="/recovery" className="w-full inline-flex justify-center py-3 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
            View Recovery Status
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-50/50 px-6 py-4 border-b border-slate-100">
            <h1 className="text-xl font-semibold text-slate-800">F!ndSyncR Secure Claim</h1>
          </div>
          
          <div className="p-6">
            {step === 'initial' && data && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-lg font-medium text-slate-700">Is this your belonging?</h2>
                  <p className="text-sm text-slate-500 mt-1">Found at: {data.foundItem.location}</p>
                </div>
                
                {data.foundItem.imageUrl && (
                  <div className="rounded-xl overflow-hidden bg-slate-100 aspect-video relative flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={data.foundItem.imageUrl} alt="Found Item" className="max-h-full object-contain" />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button 
                    onClick={handleDecline}
                    className="w-full py-3 px-4 rounded-xl border-2 border-slate-200 text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  >
                    NO, THIS IS NOT MINE
                  </button>
                  <button 
                    onClick={handleStartVerification}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    YES, THIS IS MINE
                  </button>
                </div>
              </div>
            )}

            {step === 'verify' && (
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
                  <p>Before we confirm ownership, we need to verify a private detail about your belonging.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {question}
                  </label>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full border-slate-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[100px] p-3 border"
                    placeholder="Provide your answer here..."
                  />
                  {verifyError && <p className="mt-2 text-sm text-red-600">{verifyError}</p>}
                </div>
                
                <button
                  onClick={submitAnswer}
                  disabled={verifyLoading || !answer.trim()}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {verifyLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Answer'}
                </button>
              </div>
            )}

            {step === 'otp' && (
              <div className="space-y-6 text-center">
                <h2 className="text-xl font-semibold text-slate-800">Verification Code</h2>
                <p className="text-slate-600 text-sm">
                  Enter the verification code sent to your registered email.
                </p>
                
                <div className="max-w-xs mx-auto">
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full text-center text-3xl tracking-[0.5em] border-slate-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-blue-500 p-4 border uppercase"
                    placeholder="------"
                  />
                  {otpError && <p className="mt-2 text-sm text-red-600">{otpError}</p>}
                </div>
                
                <button
                  onClick={submitOtp}
                  disabled={otpLoading || otp.length < 6}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {otpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
