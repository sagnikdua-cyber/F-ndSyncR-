"use client";

import Image from "next/image";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function IntroPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      setTimeout(() => setStep(3), 0); // Skip to final static state
      const timer = setTimeout(() => router.push("/welcome"), 3000);
      return () => clearTimeout(timer);
    }

    const timers = [
      setTimeout(() => setStep(1), 500),   // Show image & first bubble
      setTimeout(() => setStep(2), 2500),  // Show second bubble
      setTimeout(() => setStep(3), 4500),  // Start exit
      setTimeout(() => router.push("/welcome"), 5000) // Navigate
    ];

    return () => timers.forEach(clearTimeout);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 overflow-hidden relative">
      <div className="absolute top-8 right-8 z-50">
        <Link href="/welcome">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 bg-white/50 backdrop-blur-sm shadow-sm rounded-full px-6">
            Skip Intro
          </Button>
        </Link>
      </div>

      <div className="relative w-full max-w-4xl h-[80vh] flex items-end justify-between px-4 md:px-12 pb-12">
        
        {/* Boy Character & Message (Left) */}
        <div className={cn(
          "relative flex flex-col items-center justify-end transition-all duration-1000 ease-out z-10 w-1/2",
          step >= 1 && step < 3 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-32"
        )}>
          <div className="relative w-full aspect-[3/4] max-w-[300px] md:max-w-[400px] drop-shadow-xl">
             <Image 
               src="/assets/boy.png" 
               alt="Boy with message" 
               fill 
               className="object-contain mix-blend-multiply pointer-events-none" 
               priority
             />
          </div>
        </div>

        {/* Girl Character & Message (Right) */}
        <div className={cn(
          "relative flex flex-col items-center justify-end transition-all duration-1000 ease-out z-10 w-1/2",
          step >= 2 && step < 3 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-32"
        )}>
          <div className="relative w-full aspect-[3/4] max-w-[300px] md:max-w-[400px] drop-shadow-xl">
             <Image 
               src="/assets/girl.png" 
               alt="Girl with message" 
               fill 
               className="object-contain mix-blend-multiply pointer-events-none" 
               priority
             />
          </div>
        </div>

      </div>
    </div>
  );
}
