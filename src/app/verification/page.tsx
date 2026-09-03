import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Image as ImageIcon, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function VerificationPage() {
  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="max-w-xl w-full space-y-6">
        <Link href="/matches" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Matches
        </Link>
        
        <Card className="border-border shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Is this your belonging?</CardTitle>
            <p className="text-muted-foreground text-sm">Please review the image carefully.</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="w-full h-64 bg-muted rounded-xl border border-border flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-muted-foreground opacity-50" />
            </div>

            {/* Step 1: Binary Decision (Visible initially) */}
            <div className="flex gap-4">
              <Button variant="outline" className="w-1/2 h-14 border-red-200 hover:bg-red-50 hover:text-red-700">
                <XCircle className="w-5 h-5 mr-2 text-red-500" />
                No, it&apos;s not mine
              </Button>
              <Button className="w-1/2 h-14 bg-success hover:bg-success/90 text-success-foreground">
                <CheckCircle className="w-5 h-5 mr-2" />
                Yes, it&apos;s mine
              </Button>
            </div>

            {/* Step 2: Dynamic Challenge (Hidden until YES is clicked) */}
            <div className="pt-6 border-t border-border opacity-50 pointer-events-none">
              <h3 className="font-semibold text-slate-800 mb-2">Ownership Verification Challenge</h3>
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl mb-4 text-sm text-slate-700 font-medium">
                &quot;What distinctive mark is present below the cap?&quot;
              </div>
              <div className="space-y-4">
                <Input placeholder="Enter your answer..." className="bg-white" />
                <Button className="w-full">Verify Ownership</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
