"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthService } from "@/services/auth.service";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    enrollmentNumber: "",
    collegeEmail: "",
    year: "",
    section: "",
    department: "",
    rollNumber: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic Validation
    if (!formData.collegeEmail.includes("@")) {
      setError("Please enter a valid college email address.");
      setLoading(false);
      return;
    }

    const res = await AuthService.register(formData);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full border-border/50 shadow-xl shadow-slate-200/50 text-center">
          <CardHeader>
            <div className="mx-auto bg-success/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-8 h-8 text-success" />
            </div>
            <CardTitle className="text-2xl text-slate-800">Registration Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Your enrollment number has been successfully linked to your college email.
            </p>
            <Button className="w-full" onClick={() => router.push("/login")}>
              Proceed to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 p-8 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />
      
      <div className="w-full max-w-md space-y-6">
        <Link href="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Student Registration</h1>
          <p className="text-muted-foreground mt-2 font-medium">Link your enrollment to F!ndSyncR</p>
        </div>

        <Card className="border-border/50 shadow-xl shadow-slate-200/50">
          <CardContent className="pt-6">
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Enrollment Number</label>
                <Input 
                  name="enrollmentNumber"
                  placeholder="e.g. 120230020" 
                  className="bg-slate-50"
                  value={formData.enrollmentNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">College Email</label>
                <Input 
                  name="collegeEmail"
                  type="email"
                  placeholder="e.g. a120230020@college.edu" 
                  className="bg-slate-50"
                  value={formData.collegeEmail}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Year</label>
                  <Input 
                    name="year"
                    placeholder="e.g. 3rd" 
                    className="bg-slate-50"
                    value={formData.year}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Section</label>
                  <Input 
                    name="section"
                    placeholder="e.g. A" 
                    className="bg-slate-50"
                    value={formData.section}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Department</label>
                  <Input 
                    name="department"
                    placeholder="e.g. CSE" 
                    className="bg-slate-50"
                    value={formData.department}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Roll Number</label>
                  <Input 
                    name="rollNumber"
                    placeholder="e.g. 45" 
                    className="bg-slate-50"
                    value={formData.rollNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-6 h-12 text-md shadow-sm" disabled={loading}>
                {loading ? "Registering..." : "Complete Registration"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
