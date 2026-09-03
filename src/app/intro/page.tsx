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
        
        {/* Boy Character & Bubble (Left) */}
        <div className={cn(
          "relative flex flex-col items-center transition-all duration-1000 ease-out z-10 w-1/2",
          step >= 1 && step < 3 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-32"
        )}>
          {/* Boy's Speech Bubble */}
          <div className="bg-white p-4 mb-4 rounded-3xl rounded-br-sm shadow-lg border border-slate-100 max-w-[250px] relative z-20">
            <p className="text-sm md:text-lg text-slate-800 font-medium">
              &quot;Have you lost your belongings?&quot;
            </p>
          </div>
          {/* Boy Sprite (Clipping the left third of the image) */}
          <div className="relative w-48 h-72 md:w-64 md:h-96 overflow-hidden drop-shadow-xl">
             <Image 
               src="/assets/Animation img.png" 
               alt="Boy" 
               fill 
               className="object-cover object-[20%_60%] scale-[2.2] translate-y-8 mix-blend-multiply pointer-events-none" 
               priority
             />
          </div>
        </div>

        {/* Girl Character & Bubble (Right) */}
        <div className={cn(
          "relative flex flex-col items-center transition-all duration-1000 ease-out z-10 w-1/2",
          step >= 2 && step < 3 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-32"
        )}>
          {/* Girl's Speech Bubble */}
          <div className="bg-primary p-4 mb-4 rounded-3xl rounded-bl-sm shadow-lg border border-primary/20 text-primary-foreground max-w-[280px] relative z-20">
            <p className="text-sm md:text-lg font-medium">
              &quot;Don&apos;t worry! Our friend F!ndSyncR will help you get it back.&quot;
            </p>
          </div>
          {/* Girl Sprite (Clipping the middle third of the image) */}
          <div className="relative w-48 h-72 md:w-64 md:h-96 overflow-hidden drop-shadow-xl">
             <Image 
               src="/assets/Animation img.png" 
               alt="Girl" 
               fill 
               className="object-cover object-[50%_60%] scale-[2.2] translate-y-8 mix-blend-multiply pointer-events-none" 
               priority
             />
          </div>
        </div>

      </div>
    </div>
  );
}
