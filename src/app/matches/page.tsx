"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { BackButton } from "@/components/ui/BackButton";
import Link from "next/link";
import { Search, Info } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

interface MatchDisplay {
  id: string;
  matchScore: number;
  matchingStatus: string;
  createdAt: string;
  matchedCharacteristics: Record<string, string>;
  lostItemName: string;
  lostItemType: string;
  foundItemId: string;
}

export default function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMatches = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/matches", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMatches(data.matches || []);
    } catch (err: unknown) {
      const e = err as { message: string };
      setError(e.message || "Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchMatches();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'candidate-found': return { label: 'Potential Match', variant: 'secondary' as const };
      case 'pending': return { label: 'Waiting in Queue', variant: 'outline' as const };
      case 'contacted': return { label: 'Action Required', variant: 'secondary' as const };
      case 'verification_pending': return { label: 'Verifying', variant: 'secondary' as const };
      case 'otp_pending': return { label: 'OTP Required', variant: 'secondary' as const };
      case 'ownership_confirmed': return { label: 'Confirmed', variant: 'success' as const };
      case 'declined': return { label: 'Declined', variant: 'outline' as const };
      case 'expired': return { label: 'Expired', variant: 'outline' as const };
      case 'cancelled': return { label: 'Cancelled', variant: 'outline' as const };
      default: return { label: status, variant: 'outline' as const };
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 relative overflow-hidden">
      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <BackButton href="/dashboard" className="mb-4" />
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Potential Matches</h1>
            <p className="text-muted-foreground mt-1">
              AI matching helps identify possible matches. Ownership is confirmed separately through verification.
            </p>
          </div>
        </header>

        {error && <ErrorBanner message={error} onRetry={fetchMatches} />}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <LoadingSkeleton className="h-64 w-full" count={3} />
          </div>
        ) : matches.length === 0 ? (
          <EmptyState 
            icon={Search}
            title="No potential matches yet"
            description="Our AI hasn't found any strong matches for your items yet. We'll notify you if something turns up."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map(match => {
              const statusInfo = getStatusDisplay(match.matchingStatus);
              
              return (
                <Card key={match.id} className="flex flex-col border-border/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-4 bg-primary/5 flex items-start gap-3">
                    <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-primary/80 font-medium">
                      This is a <strong>potential</strong> AI match based on public traits.
                    </p>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <CardTitle className="text-lg line-clamp-1">{match.lostItemName}</CardTitle>
                        <p className="text-sm text-muted-foreground">{match.lostItemType}</p>
                      </div>
                      <Badge variant={statusInfo.variant} className="whitespace-nowrap">{statusInfo.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">AI Match:</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${Math.min(100, Math.max(0, match.matchScore))}%` }} 
                        />
                      </div>
                      <span className="text-sm font-bold text-blue-700">{match.matchScore}%</span>
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                      <p className="font-medium text-slate-700 mb-2">Matched on:</p>
                      {Object.entries(match.matchedCharacteristics || {}).map(([key, val]) => (
                        val ? <p key={key}><span className="text-slate-500 capitalize">{key}:</span> {val}</p> : null
                      ))}
                      {(!match.matchedCharacteristics || Object.keys(match.matchedCharacteristics).length === 0) && (
                        <p className="text-slate-500 italic">General type match</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-slate-50 border-t border-border/50 pt-4 pb-4">
                    {match.matchingStatus === 'contacted' ? (
                      <p className="text-sm text-amber-600 font-medium w-full text-center">
                        Please check your email for the secure claim link.
                      </p>
                    ) : match.matchingStatus === 'ownership_confirmed' ? (
                      <Link href="/recovery" className="w-full">
                        <Button className="w-full h-9 text-xs bg-success hover:bg-success/90 text-success-foreground" variant="default">View Recovery Details</Button>
                      </Link>
                    ) : (
                      <Button variant="outline" className="w-full text-xs h-9" disabled>
                        Awaiting your turn...
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
