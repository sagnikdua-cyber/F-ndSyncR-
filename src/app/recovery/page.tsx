"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { BackButton } from "@/components/ui/BackButton";
import { CheckCircle, MapPin, Package, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";

interface RecoveryItem {
  matchId: string;
  foundItemId: string;
  lostItemName: string;
  lostItemType: string;
  recoveryStatus: string;
  ownershipConfirmedAt: string;
}

export default function RecoveryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<RecoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRecoveryItems = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const res = await fetch("/api/recovery", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems(data.items || []);
    } catch (err: unknown) {
      const e = err as { message: string };
      setError(e.message || "Failed to load recovery details");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/recovery", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!ignore) {
          if (!res.ok) throw new Error(data.error);
          setItems(data.items || []);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const e = err as { message: string };
          setError(e.message || "Failed to load recovery details");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 relative overflow-hidden">
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        <header className="flex flex-col gap-2">
          <BackButton href="/dashboard" />
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Recovery & Collection</h1>
          <p className="text-muted-foreground mt-1">
            Instructions for collecting your verified belongings.
          </p>
        </header>

        {error && <ErrorBanner message={error} onRetry={fetchRecoveryItems} />}

        {loading ? (
          <div className="space-y-6">
            <LoadingSkeleton className="h-64 w-full" count={2} />
          </div>
        ) : items.length === 0 ? (
          <EmptyState 
            icon={Package}
            title="No items awaiting collection"
            description="You don't have any items that have passed ownership verification yet."
          />
        ) : (
          <div className="space-y-6">
            {items.map(item => {
              const isRecovered = item.recoveryStatus === 'recovered';
              
              return (
                <Card key={item.matchId} className="border-border/50 shadow-sm overflow-hidden">
                  <CardHeader className={cn("pb-4", isRecovered ? "bg-slate-50" : "bg-success/10")}>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{item.lostItemName}</CardTitle>
                        <p className="text-sm text-slate-600 mt-1">{item.lostItemType}</p>
                      </div>
                      {isRecovered ? (
                        <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" /> Recovered
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-success text-success-foreground rounded-full text-xs font-bold uppercase tracking-wider flex items-center">
                          <Package className="w-3 h-3 mr-1" /> Ready for Collection
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    
                    {/* Status Tracker */}
                    <div className="flex items-center justify-between text-sm mb-8 relative">
                      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10 -translate-y-1/2"></div>
                      <div className="flex flex-col items-center gap-2 bg-white px-2">
                        <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-medium text-slate-600 hidden sm:block">Verified</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 bg-white px-2">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", isRecovered ? "bg-success text-white" : "bg-success text-white")}>
                          <Package className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-medium text-slate-600 hidden sm:block">Ready</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 bg-white px-2">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", isRecovered ? "bg-success text-white" : "bg-slate-200 text-slate-400")}>
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-medium text-slate-600 hidden sm:block">Recovered</span>
                      </div>
                    </div>

                    {!isRecovered ? (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                        <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                          <MapPin className="w-5 h-5 text-primary" />
                          Collection Instructions
                        </h4>
                        <p className="text-sm text-slate-600 mb-4">
                          Please proceed to the Main Campus Security Desk to collect your item. You must bring your Student ID.
                        </p>
                        <div className="bg-white border border-slate-100 rounded-lg p-3 inline-flex flex-col">
                          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Reference ID</span>
                          <span className="font-mono text-lg font-bold tracking-tight text-slate-800">{item.foundItemId.substring(0, 8).toUpperCase()}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-success/5 border border-success/20 rounded-xl p-5 text-center">
                        <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="w-6 h-6 text-success" />
                        </div>
                        <h4 className="font-semibold text-success-700 mb-1">Item Recovered Successfully</h4>
                        <p className="text-sm text-success-600/80">
                          This item has been physically collected.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
