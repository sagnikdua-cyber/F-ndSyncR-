"use client";

import { useState } from "react";
import Image from "next/image";
import { ShieldAlert, CheckCircle, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AdminMatchesClient({ initialData }: { initialData: any[] }) {
  const [items, setItems] = useState(initialData);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRemove = async (foundItemId: string) => {
    if (!confirm("Confirm that this item has been physically removed from the lost-and-found box?")) return;
    
    setLoadingId(foundItemId);
    try {
      // In a real app we'd pass the auth token.
      const res = await fetch("/api/admin/confirm-removal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foundItemId })
      });
      
      if (res.ok) {
        setItems(prev => prev.map(item => 
          item.id === foundItemId ? { ...item, recoveryStatus: "physically_removed" } : item
        ));
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to remove item.");
    } finally {
      setLoadingId(null);
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === "expired" && item.recoveryStatus !== "expired") return false;
    if (filter === "active" && (item.recoveryStatus === "expired" || item.recoveryStatus === "physically_removed")) return false;
    if (filter === "removed" && item.recoveryStatus !== "physically_removed") return false;

    if (search) {
      const searchLower = search.toLowerCase();
      const typeMatch = item.objectType?.toLowerCase().includes(searchLower);
      const idMatch = item.id.toLowerCase().includes(searchLower);
      if (!typeMatch && !idMatch) return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex-1">
          <Input 
            placeholder="Search by ID or Type..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All</Button>
          <Button variant={filter === "active" ? "default" : "outline"} onClick={() => setFilter("active")}>Active</Button>
          <Button variant={filter === "expired" ? "default" : "outline"} onClick={() => setFilter("expired")}>Expired</Button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="text-xl font-medium text-gray-900">No Items Match Filters</h3>
        </div>
      ) : (
        <div className="space-y-12">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0">
                
                {/* Found Item Source */}
                <div className="p-6 bg-gray-50/50 border-r border-gray-100 relative">
                  {item.recoveryStatus === "expired" && (
                    <div className="absolute top-2 right-2 z-10">
                      <Button size="sm" variant="outline" className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200" onClick={() => handleRemove(item.id)} disabled={loadingId === item.id}>
                        <Trash2 className="w-4 h-4 mr-2" /> 
                        {loadingId === item.id ? "Removing..." : "Remove"}
                      </Button>
                    </div>
                  )}
                  {item.recoveryStatus === "physically_removed" && (
                    <div className="absolute top-4 right-4 z-10 bg-slate-800 text-white text-xs px-2 py-1 rounded">
                      Removed
                    </div>
                  )}

                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-blue-500" /> 
                    Found Item Intake
                  </h3>
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-4">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt="Found Item" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Source:</span>
                      <span className="font-medium text-gray-900">{item.sourceType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{item.processingStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Match Status:</span>
                      <span className="font-medium text-gray-900">{item.matchingStatus}</span>
                    </div>
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="p-6 border-r border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Gemini AI Analysis
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Public Characteristics</h4>
                      <div className="bg-blue-50/50 rounded-xl p-3 space-y-2 text-sm">
                        <p><span className="font-medium">Type:</span> {item.objectType}</p>
                        <p><span className="font-medium">Color:</span> {item.publicCharacteristics?.color || 'N/A'}</p>
                        <p><span className="font-medium">Brand:</span> {item.publicCharacteristics?.brand || 'N/A'}</p>
                        <p><span className="font-medium">Shape:</span> {item.publicCharacteristics?.shape || 'N/A'}</p>
                        <p><span className="font-medium">Visible Text:</span> {item.publicCharacteristics?.visibleText || 'N/A'}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2 flex items-center">
                        <ShieldAlert className="w-3 h-3 mr-1" />
                        Private Characteristics
                      </h4>
                      <div className="bg-red-50/50 rounded-xl p-3 space-y-2 text-sm">
                         {Object.entries(item.privateCharacteristics || {}).map(([key, val]) => (
                           <p key={key}><span className="font-medium capitalize">{key}:</span> {String(val)}</p>
                         ))}
                         {Object.keys(item.privateCharacteristics || {}).length === 0 && (
                           <p className="text-gray-500 italic">No distinctive private marks found.</p>
                         )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ranked Candidates */}
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Ranked Candidates</h3>
                  
                  {item.candidates && item.candidates.length > 0 ? (
                    <div className="space-y-4">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {item.candidates.map((candidate: any) => (
                        <div key={candidate.id} className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 flex flex-col relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-bl-xl">
                            Rank #{candidate.rank}
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 relative overflow-hidden">
                              {typeof candidate.lostItemData?.imageUrl === 'string' && (
                                <Image src={candidate.lostItemData.imageUrl} alt="Candidate" fill className="object-cover" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 text-sm">{candidate.lostItemData?.itemName || 'Unknown Item'}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">{candidate.lostItemData?.itemType}</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                  Score: {candidate.matchScore}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-100 rounded-2xl">
                      <p className="text-gray-500">No candidates reached the 50% threshold.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
