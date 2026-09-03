"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LostItemService } from "@/services/lost-item.service";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function ReportLostPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    itemName: "",
    itemType: "",
    description: "",
  });

  const [publicChars, setPublicChars] = useState({
    color: "",
    brand: "",
    shape: "",
    visibleDesign: "",
  });

  const [privateChars, setPrivateChars] = useState({
    distinctiveScratch: "",
    hiddenMark: "",
    exactContents: "",
  });

  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePublicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPublicChars(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePrivateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrivateChars(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('itemName', formData.itemName);
      formDataToSend.append('itemType', formData.itemType);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('publicCharacteristics', JSON.stringify(publicChars));
      formDataToSend.append('privateCharacteristics', JSON.stringify(privateChars));

      if (image) {
        formDataToSend.append('image', image);
      }

      const res = await LostItemService.reportLostItem(formDataToSend);
      
      if (res.error) {
        throw new Error(res.error);
      }
      
      setSuccess(true);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full border-border/50 shadow-xl shadow-slate-200/50 text-center p-8">
          <div className="mx-auto bg-success/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Report Submitted!</h2>
          <p className="text-muted-foreground mb-6">
            Your lost item has been securely recorded. Our AI will now actively match it against any found items.
          </p>
          <Button className="w-full" onClick={() => router.push("/my-lost-items")}>
            View My Lost Items
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Report Lost Item</h1>
          <p className="text-muted-foreground mt-2">Provide details to help us find your item.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* General Information */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Item Name</label>
                  <Input name="itemName" placeholder="e.g. Blue Hydroflask" value={formData.itemName} onChange={handleFormChange} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Item Type</label>
                  <Input name="itemType" placeholder="e.g. Water Bottle, Wallet" value={formData.itemType} onChange={handleFormChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  name="description" 
                  className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]" 
                  placeholder="Where did you last see it?"
                  value={formData.description}
                  onChange={handleFormChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Upload Image (Optional)</label>
                <div className="flex items-center gap-4">
                  <Input type="file" accept="image/*" onChange={handleImageChange} className="w-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Public Characteristics */}
          <Card className="border-border/50 shadow-sm bg-blue-50/30">
            <CardHeader>
              <CardTitle className="text-lg text-blue-800">Public Characteristics</CardTitle>
              <p className="text-xs text-slate-500">Visible to anyone at a glance. Used by our AI for broad matching.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Color</label>
                  <Input name="color" placeholder="e.g. Navy Blue" value={publicChars.color} onChange={handlePublicChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Brand</label>
                  <Input name="brand" placeholder="e.g. Hydroflask" value={publicChars.brand} onChange={handlePublicChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Shape / Size</label>
                  <Input name="shape" placeholder="e.g. 32oz Cylindrical" value={publicChars.shape} onChange={handlePublicChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Visible Design / Text</label>
                  <Input name="visibleDesign" placeholder="e.g. Large supreme sticker" value={publicChars.visibleDesign} onChange={handlePublicChange} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Private Characteristics */}
          <Card className="border-red-100 shadow-sm bg-red-50/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldAlert className="w-24 h-24" /></div>
            <CardHeader>
              <CardTitle className="text-lg text-red-800 flex items-center">
                <ShieldAlert className="w-5 h-5 mr-2" /> Private Characteristics
              </CardTitle>
              <p className="text-xs text-red-600/80 max-w-lg">
                <strong>CRITICAL:</strong> These details prove ownership. They are HIDDEN from other students and NEVER shown publicly. Only you and the verification AI will see them.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Distinctive Scratch or Damage</label>
                  <Input name="distinctiveScratch" placeholder="e.g. Deep scratch under the cap" value={privateChars.distinctiveScratch} onChange={handlePrivateChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hidden Mark</label>
                  <Input name="hiddenMark" placeholder="e.g. My initials 'SK' carved on the bottom" value={privateChars.hiddenMark} onChange={handlePrivateChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Exact Contents</label>
                  <Input name="exactContents" placeholder="e.g. Contains a red pen and 2 dollars" value={privateChars.exactContents} onChange={handlePrivateChange} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full h-14 text-lg" disabled={loading}>
            {loading ? "Submitting securely..." : "Submit Lost Item Report"}
          </Button>

        </form>
      </div>
    </div>
  );
}
