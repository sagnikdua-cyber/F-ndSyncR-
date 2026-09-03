"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PlusCircle, Search, Bell, ShieldCheck, User, LogOut } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { AuthService } from "@/services/auth.service";

export default function DashboardPage() {
  const { studentData, claims } = useAuth();
  
  const handleLogout = async () => {
    await AuthService.signOut();
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Hello, {studentData?.enrollmentNumber || "Student"}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">Welcome back to F!ndSyncR.</p>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/profile">
              <Button variant="ghost" className="rounded-full w-12 h-12 p-0 bg-surface shadow-sm border border-border">
                <User className="w-5 h-5 text-primary" />
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-primary/10 border-primary/20 shadow-none hover:bg-primary/15 transition-colors">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Report Lost Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">Lost something on campus? Provide details to start the search.</p>
              <Link href="/report-lost">
                <Button className="w-full shadow-sm">Report Now</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-secondary/10 border-secondary/20 shadow-none hover:bg-secondary/15 transition-colors">
            <CardHeader>
              <CardTitle className="text-secondary flex items-center gap-2">
                <Search className="w-5 h-5" />
                Possible Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">Check if your lost items have been found by our system.</p>
              <Link href="/matches">
                <Button variant="secondary" className="w-full shadow-sm">View Matches</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-semibold text-slate-800 pt-4">Quick Links</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/my-lost-items">
            <Card className="hover:border-primary/50 cursor-pointer h-full transition-all active:scale-[0.98]">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-2 h-full">
                <Search className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm font-medium">My Lost Items</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/notifications">
            <Card className="hover:border-primary/50 cursor-pointer h-full transition-all active:scale-[0.98]">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-2 h-full">
                <Bell className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm font-medium">Notifications</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/verification">
            <Card className="hover:border-primary/50 cursor-pointer h-full transition-all active:scale-[0.98]">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-2 h-full">
                <ShieldCheck className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm font-medium">Verification</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/recovery">
            <Card className="hover:border-primary/50 cursor-pointer h-full transition-all active:scale-[0.98]">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-2 h-full">
                <ShieldCheck className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm font-medium">Recovery Status</span>
              </CardContent>
            </Card>
          </Link>
          {claims?.role === 'admin' && (
            <Link href="/admin">
              <Card className="hover:border-primary/50 cursor-pointer h-full transition-all active:scale-[0.98] bg-slate-50">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-2 h-full">
                  <ShieldCheck className="w-6 h-6 text-slate-400" />
                  <span className="text-sm font-medium text-slate-500">Admin Area</span>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
