"use client";

import { useEffect, useState } from "react";
import { AdminMatchesClient } from "./ClientWrapper";
import { useAuth } from "@/components/providers/AuthProvider";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AdminMatchesPage() {
  const { user, claims, loading: authLoading } = useAuth();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [foundItems, setFoundItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || claims?.role !== "admin") {
      return;
    }

    const fetchData = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/admin/matches", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        
        if (!res.ok) throw new Error(json.error);
        setFoundItems(json.items || []);
      } catch (err: unknown) {
        const e = err as { message: string };
        setError(e.message || "Failed to load admin matches");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, claims, authLoading]);

  if (authLoading) {
    return <div className="min-h-screen bg-[#FAFAFA] p-6 lg:p-12 flex justify-center items-center">Loading authentication...</div>;
  }

  if (!user || claims?.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-12 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Unauthorized Access</h2>
          <p className="text-muted-foreground mb-6">
            You don&apos;t have permission to access the Admin Area. This feature is restricted to authorized administrators.
          </p>
          <Link href="/dashboard">
            <Button className="w-full">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen bg-[#FAFAFA] p-6 lg:p-12 flex justify-center items-center">Loading matches data...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="p-4 bg-red-50 text-red-600 rounded-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Match Pipeline Admin</h1>
            <p className="text-gray-500 mt-2">View AI analysis results and candidate rankings.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">Back to Dashboard</Button>
            </Link>
          </div>
        </header>

        {foundItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-xl font-medium text-gray-900">No Found Items Analyzed Yet</h3>
            <p className="text-gray-500 mt-2">Upload a found item to trigger AI matching.</p>
          </div>
        ) : (
          <AdminMatchesClient initialData={foundItems} />
        )}

      </div>
    </div>
  );
}
