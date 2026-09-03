import Image from "next/image";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="relative w-64 h-64 md:w-80 md:h-80 drop-shadow-xl">
          <Image 
            src="/assets/logo smart finding.png" 
            alt="F!ndSyncR Logo" 
            fill
            className="object-contain mix-blend-multiply"
            priority
          />
        </div>
        
        <div className="space-y-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-800">
            F!ndSyncR
          </h1>
          <p className="text-xl text-primary font-medium tracking-wide">
            Find. Sync. Recover.
          </p>
        </div>

        <div className="pt-8">
          <Link href="/dashboard">
            <Button size="lg" className="px-12 text-lg rounded-full shadow-md hover:shadow-lg transition-all">
              ENTER
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
