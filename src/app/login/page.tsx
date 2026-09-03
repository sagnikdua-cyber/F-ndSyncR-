"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { AuthService } from "@/services/auth.service";
import Link from "next/link";
import { ShieldCheck, Mail, ArrowRight } from "lucide-react";

type LoginStep = "enrollment" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [step, setStep] = useState<LoginStep>("enrollment");
  const [enrollment, setEnrollment] = useState("");
  const [otp, setOtp] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, they shouldn't be here, but middleware/provider will redirect them
  if (user) {
    router.replace("/dashboard");
    return null;
  }

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollment) return;
    
    setLoading(true);
    setError("");

    const res = await AuthService.requestOtp(enrollment);
    setLoading(false);

    if (res.error) {
      if (res.error === "Student not found" || res.error === "Firebase Admin credentials missing. Architecture boundary reached.") {
        // Architecture boundary fallback or actual not found
        setError(res.error);
        if (res.error === "Student not found") {
           // Provide link to register
           setError("Enrollment number not found.");
        }
      } else {
        setError(res.error);
      }
    } else {
      setMaskedEmail(res.maskedEmail || "");
      setStep("otp");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    setError("");

    const res = await AuthService.verifyOtp(enrollment, otp);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      // Success! AuthProvider will catch the onAuthStateChanged and redirect
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 p-8 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />
      
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight">F!ndSyncR</h1>
          <p className="text-muted-foreground mt-2 font-medium">College Lost & Found</p>
        </div>

        <Card className="border-border/50 shadow-xl shadow-slate-200/50">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center text-slate-800">
              {step === "enrollment" ? "Student Login" : "Verify Email"}
            </CardTitle>
            <p className="text-sm text-center text-muted-foreground">
              {step === "enrollment" 
                ? "Enter your Enrollment Number to continue." 
                : `We sent a 6-digit OTP to ${maskedEmail}`}
            </p>
          </CardHeader>
          
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 font-medium">
                {error}
                {error === "Enrollment number not found." && (
                  <div className="mt-2">
                    <Link href="/register" className="underline font-semibold">Click here to register.</Link>
                  </div>
                )}
              </div>
            )}

            {step === "enrollment" && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input 
                      placeholder="e.g. 120230020" 
                      className="pl-10 h-12 bg-slate-50"
                      value={enrollment}
                      onChange={(e) => setEnrollment(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-md shadow-sm" disabled={loading}>
                  {loading ? "Checking..." : "Continue"}
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
                <div className="text-center mt-4 text-sm text-slate-500">
                  New student? <Link href="/register" className="text-primary font-semibold hover:underline">Create an account</Link>
                </div>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input 
                      placeholder="Enter 6-digit OTP" 
                      className="pl-10 h-12 bg-slate-50 text-center tracking-widest text-lg font-semibold"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-md shadow-sm bg-success hover:bg-success/90 text-success-foreground" disabled={loading}>
                  {loading ? "Verifying..." : "Verify & Login"}
                </Button>
                <div className="text-center mt-4">
                  <button 
                    type="button" 
                    onClick={() => setStep("enrollment")} 
                    className="text-sm text-muted-foreground hover:text-slate-700 underline"
                  >
                    Use a different enrollment number
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
