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

      <div className="relative w-full max-w-4xl h-[70vh] flex flex-col items-center justify-center">
        
        {/* First Speech Bubble (Boy) */}
        <div className={cn(
          "absolute top-[10%] md:left-[20%] left-[5%] max-w-[250px] transition-all duration-700 ease-out z-20",
          step >= 1 && step < 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <div className="bg-white p-4 rounded-3xl rounded-br-sm shadow-lg border border-slate-100">
            <p className="text-lg text-slate-800 font-medium">
              &quot;Have you lost your belongings?&quot;
            </p>
          </div>
        </div>

        {/* Central Image */}
        <div className={cn(
          "relative w-72 h-72 md:w-96 md:h-96 transition-all duration-1000 ease-in-out z-10",
          step === 0 ? "opacity-0 scale-90 translate-y-10" : 
          step < 3 ? "opacity-100 scale-100 translate-y-0" : 
          "opacity-0 scale-110 -translate-y-10"
        )}>
          <Image 
            src="/assets/Animation img.png" 
            alt="F!ndSyncR Characters" 
            fill
            className="object-contain drop-shadow-xl"
            priority
          />
        </div>

        {/* Second Speech Bubble (Girl) */}
        <div className={cn(
          "absolute bottom-[10%] md:right-[20%] right-[5%] max-w-[280px] transition-all duration-700 ease-out z-20",
          step >= 2 && step < 3 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        )}>
          <div className="bg-primary p-4 rounded-3xl rounded-tl-sm shadow-lg border border-primary/20 text-primary-foreground">
            <p className="text-lg font-medium">
              &quot;Don&apos;t worry! Our friend F!ndSyncR will help you get it back.&quot;
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
