"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Upload, Box } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/components/providers/AuthProvider";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

export default function FoundItemPage() {
  const { user } = useAuth();
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");

  const generateIdempotencyKey = () => {
    setIdempotencyKey(crypto.randomUUID());
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Basic client-side validation
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be under 5MB");
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError("Only JPG, PNG, and WEBP formats are supported");
        return;
      }

      setImage(file);
      setPreview(URL.createObjectURL(file));
      setSuccess(false);
      setError("");
      generateIdempotencyKey();
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !user) return;

    setLoading(true);
    setError("");

    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("image", image);
      formData.append("sourceType", "web-upload");
      formData.append("captureDeviceId", "term-I-operator-browser");

      const res = await fetch("/api/found-items", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Idempotency-Key": idempotencyKey || crypto.randomUUID()
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setSuccess(true);
      setImage(null);
      setPreview(null);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || "Failed to submit found item");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setError("");
    setImage(null);
    setPreview(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <Box className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Found a Belonging?</h1>
          <p className="text-muted-foreground text-sm">
            Upload an image of the found item. F!ndSyncR AI will analyze and queue it for matching.
          </p>
        </div>

        {error && <ErrorBanner message={error} onRetry={() => setError("")} />}

        <Card className="border-border/50 shadow-xl shadow-slate-200/50">
          <CardContent className="pt-6">
            {success ? (
              <div className="space-y-6">
                <div className="p-6 bg-success/10 border border-success/20 rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                    <Box className="w-6 h-6 text-success" />
                  </div>
                  <h3 className="text-lg font-semibold text-success-foreground">Item Submitted Successfully</h3>
                  <p className="text-sm text-success-foreground/80">
                    Image uploaded and AI analysis is complete. The item is now queued for potential matches.
                  </p>
                </div>
                <Button variant="outline" className="w-full" onClick={handleReset}>
                  Submit Another Item
                </Button>
              </div>
            ) : (
              <form onSubmit={handleUpload} className="space-y-6">
                
                <div className="space-y-2">
                  <div 
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${preview ? 'border-primary/50 bg-primary/5' : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'}`}
                  >
                    <Input 
                      type="file" 
                      accept="image/jpeg, image/png, image/webp" 
                      onChange={handleImageChange} 
                      className="hidden" 
                      id="image-upload" 
                      disabled={loading}
                    />
                    
                    <label htmlFor={loading ? undefined : "image-upload"} className={`block ${loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                      {preview ? (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden shadow-sm">
                          <Image src={preview} alt="Preview" fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="space-y-3 py-6">
                          <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                            <Upload className="w-6 h-6 text-slate-500" />
                          </div>
                          <div className="text-sm font-medium text-slate-700">Click to select an image</div>
                          <p className="text-xs text-slate-500">Supports JPG, PNG, WEBP (Max 5MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                  {preview && !loading && (
                    <div className="text-right">
                      <label htmlFor="image-upload" className="text-xs text-primary font-semibold cursor-pointer hover:underline">
                        Change Image
                      </label>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full h-12 text-md shadow-sm" disabled={!image || loading || !user}>
                  {loading ? "F!ndSyncR is analyzing the item..." : "Analyze Found Item"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
