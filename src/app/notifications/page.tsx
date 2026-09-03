"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { BackButton } from "@/components/ui/BackButton";
import { Bell, CheckCircle, Info, AlertTriangle, XCircle } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNotifications(data.notifications || []);
    } catch (err: unknown) {
      const e = err as { message: string };
      setError(e.message || "Failed to load notifications");
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
        const res = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!ignore) {
          if (!res.ok) throw new Error(data.error);
          setNotifications(data.notifications || []);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const e = err as { message: string };
          setError(e.message || "Failed to load notifications");
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

  const markAsRead = async (id: string, currentReadState: boolean) => {
    if (currentReadState || !user) return;
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      const token = await user.getIdToken();
      await fetch(`/api/notifications/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      const token = await user.getIdToken();
      await fetch(`/api/notifications`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'markAllAsRead' })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-success" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 relative overflow-hidden">
      <div className="max-w-3xl mx-auto space-y-6 relative z-10">
        
        <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <BackButton href="/dashboard" className="mb-4" />
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Notifications</h1>
            <p className="text-muted-foreground mt-1">Updates on your lost items and claims.</p>
          </div>
          {notifications.some(n => !n.isRead) && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="shadow-sm">
              Mark all as read
            </Button>
          )}
        </header>

        {error && <ErrorBanner message={error} onRetry={fetchNotifications} />}

        {loading ? (
          <div className="space-y-4">
            <LoadingSkeleton className="h-24 w-full" count={3} />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState 
            icon={Bell}
            title="You're all caught up"
            description="No notifications yet. We'll let you know when there's an update on your items."
          />
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <Card 
                key={notif.id} 
                className={cn(
                  "border-border/50 shadow-sm transition-all hover:shadow-md cursor-pointer",
                  !notif.isRead ? "bg-primary/5 border-primary/20" : "bg-white"
                )}
                onClick={() => markAsRead(notif.id, notif.isRead)}
              >
                <CardContent className="p-4 sm:p-6 flex gap-4">
                  <div className="shrink-0 mt-1">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className={cn("font-medium", !notif.isRead ? "text-slate-900" : "text-slate-700")}>
                        {notif.title}
                      </h4>
                      <span className="text-xs text-muted-foreground shrink-0 mt-1">
                        {new Date(notif.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className={cn("text-sm", !notif.isRead ? "text-slate-700" : "text-muted-foreground")}>
                      {notif.message}
                    </p>
                    {notif.link && (
                      <div className="mt-3">
                        <Link href={notif.link} className="text-primary text-sm font-medium hover:underline">
                          View details
                        </Link>
                      </div>
                    )}
                  </div>
                  {!notif.isRead && (
                    <div className="shrink-0 flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
