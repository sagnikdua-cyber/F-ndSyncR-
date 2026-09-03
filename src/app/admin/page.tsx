"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Box, AlertTriangle, Users } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

export default function AdminPage() {
  const { user, claims, loading: authLoading } = useAuth();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
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
        const res = await fetch("/api/admin/dashboard", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        
        if (!res.ok) throw new Error(json.error);
        setData(json);
      } catch (err: unknown) {
        const e = err as { message: string };
        setError(e.message || "Failed to load admin dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, claims, authLoading]);

  if (authLoading) {
    return <div className="min-h-screen bg-slate-50 p-8 flex justify-center items-center">Loading authentication...</div>;
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
    return <div className="min-h-screen bg-slate-50 p-8 flex justify-center items-center">Loading dashboard data...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="p-4 bg-red-50 text-red-600 rounded-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-slate-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
              <p className="text-sm text-slate-500">System Overview & Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/matches">
              <Button variant="default" size="sm">Manage Matches</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">Exit Admin</Button>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-4">
                <Box className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold text-slate-800">{data?.totalFoundItems || 0}</span>
              </div>
              <p className="text-sm font-medium text-slate-600">Total Found Items</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-4">
                <Users className="w-5 h-5 text-secondary" />
                <span className="text-2xl font-bold text-slate-800">{data?.activeClaims || 0}</span>
              </div>
              <p className="text-sm font-medium text-slate-600">Active Claims</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-4">
                <ShieldCheck className="w-5 h-5 text-success" />
                <span className="text-2xl font-bold text-slate-800">{data?.verifiedRecovered || 0}</span>
              </div>
              <p className="text-sm font-medium text-slate-600">Verified & Recovered</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-100">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-2xl font-bold text-red-600">{data?.expiredCount || 0}</span>
              </div>
              <p className="text-sm font-medium text-red-700">Expired (Removal Req.)</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white border-slate-200">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg">Recent System Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!data?.recentActivity || data.recentActivity.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No recent activity.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {data.recentActivity.map((activity: any) => (
                  <li key={activity.id} className="p-4 flex gap-4 items-start hover:bg-slate-50">
                    <div className="mt-1">
                      {activity.type === 'success' && <ShieldCheck className="w-5 h-5 text-success" />}
                      {activity.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                      {activity.type === 'info' && <Box className="w-5 h-5 text-blue-500" />}
                      {activity.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-slate-800">{activity.title}</p>
                        <span className="text-xs text-slate-500">{new Date(activity.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{activity.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
