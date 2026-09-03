"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LostItemService } from "@/services/lost-item.service";
import Link from "next/link";
import { ArrowLeft, Clock, Search, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";

interface LostItem {
  id: string;
  itemName: string;
  imageUrl?: string;
  status: string;
  createdAt: string;
  description: string;
}

export default function MyLostItemsPage() {
  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      const res = await LostItemService.getMyLostItems();
      if (res.error) {
        setError(res.error);
      } else {
        setItems(res.items || []);
      }
      setLoading(false);
    };

    fetchItems();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "reported":
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center"><Search className="w-3 h-3 mr-1" /> Reported</span>;
      case "matched":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Matched</span>;
      case "recovered":
        return <span className="px-2 py-1 bg-success/20 text-success rounded-full text-xs font-semibold flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Recovered</span>;
      case "expired":
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center"><XCircle className="w-3 h-3 mr-1" /> Expired</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">Unknown</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 relative overflow-hidden">
      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">My Lost Items</h1>
            <p className="text-muted-foreground mt-1">Track the status of the items you&apos;ve reported.</p>
          </div>
          <Link href="/report-lost">
            <Button className="shadow-sm">Report New Item</Button>
          </Link>
        </header>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <Card key={i} className="h-64 bg-slate-100 border-border/50" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700">No items reported</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              You haven&apos;t reported any lost items yet. If you lose something, you can report it here to start the matching process.
            </p>
            <Link href="/report-lost">
              <Button variant="outline" className="mt-6">Report Lost Item</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <Card key={item.id} className="border-border/50 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="h-40 bg-slate-100 relative">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.itemName} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                      <Search className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(item.status)}
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-1">{item.itemName}</CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
                </CardContent>
                <CardFooter className="bg-slate-50 border-t border-border/50 pt-4 pb-4">
                  <Link href="/matches" className="w-full">
                    <Button variant="outline" className="w-full text-xs h-9">View Matches</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
