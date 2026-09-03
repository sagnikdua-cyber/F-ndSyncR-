import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Box, AlertTriangle, Users } from "lucide-react";
import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let totalFoundItems = 0;
  let activeClaims = 0;
  let verifiedRecovered = 0;
  let expiredCount = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recentActivity: any[] = [];

  if (adminDb) {
    const foundItemsSnap = await adminDb.collection('foundItems').count().get();
    totalFoundItems = foundItemsSnap.data().count;

    const activeClaimsSnap = await adminDb.collection('matches')
      .where('matchingStatus', 'in', ['pending', 'contacted', 'verification_pending', 'otp_pending'])
      .count().get();
    activeClaims = activeClaimsSnap.data().count;

    const verifiedSnap = await adminDb.collection('matches')
      .where('matchingStatus', '==', 'ownership_confirmed')
      .count().get();
    verifiedRecovered = verifiedSnap.data().count;

    const expiredSnap = await adminDb.collection('foundItems')
      .where('recoveryStatus', '==', 'expired')
      .count().get();
    expiredCount = expiredSnap.data().count;

    const activitySnap = await adminDb.collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    recentActivity = activitySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
                <span className="text-2xl font-bold text-slate-800">{totalFoundItems}</span>
              </div>
              <p className="text-sm font-medium text-slate-600">Total Found Items</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-4">
                <Users className="w-5 h-5 text-secondary" />
                <span className="text-2xl font-bold text-slate-800">{activeClaims}</span>
              </div>
              <p className="text-sm font-medium text-slate-600">Active Claims</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-4">
                <ShieldCheck className="w-5 h-5 text-success" />
                <span className="text-2xl font-bold text-slate-800">{verifiedRecovered}</span>
              </div>
              <p className="text-sm font-medium text-slate-600">Verified & Recovered</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-100">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-2xl font-bold text-red-600">{expiredCount}</span>
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
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No recent activity.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentActivity.map((activity) => (
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
