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
      setTimeout(() => setStep(5), 0); // Skip to final static state
      const timer = setTimeout(() => router.push("/welcome"), 3000);
      return () => clearTimeout(timer);
    }

    const timers = [
      setTimeout(() => setStep(1), 500),   // Boy in
      setTimeout(() => setStep(2), 1500),  // Boy message
      setTimeout(() => setStep(3), 2500),  // Girl in
      setTimeout(() => setStep(4), 3500),  // Girl message
      setTimeout(() => setStep(5), 5500),  // Exit
      setTimeout(() => router.push("/welcome"), 6000)
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
          step >= 1 && step < 5 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-32"
        )}>
          {/* Boy Message */}
          <div className={cn(
            "relative w-full max-w-[250px] aspect-[2/1] mb-4 transition-all duration-700 ease-out",
            step >= 2 && step < 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}>
            <Image 
              src="/assets/boy_message.png" 
              alt="Boy Message" 
              fill 
              className="object-contain" 
            />
          </div>
          {/* Boy Sprite */}
          <div className="relative w-48 h-72 md:w-64 md:h-96 drop-shadow-xl">
             <Image 
               src="/assets/boy.png" 
               alt="Boy" 
               fill 
               className="object-contain drop-shadow-md" 
               priority
             />
          </div>
        </div>

        {/* Girl Character & Message (Right) */}
        <div className={cn(
          "relative flex flex-col items-center justify-end transition-all duration-1000 ease-out z-10 w-1/2",
          step >= 3 && step < 5 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-32"
        )}>
          {/* Girl Message */}
          <div className={cn(
            "relative w-full max-w-[280px] aspect-[2/1] mb-4 transition-all duration-700 ease-out",
            step >= 4 && step < 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}>
            <Image 
              src="/assets/girl_message.png" 
              alt="Girl Message" 
              fill 
              className="object-contain" 
            />
          </div>
          {/* Girl Sprite */}
          <div className="relative w-48 h-72 md:w-64 md:h-96 drop-shadow-xl">
             <Image 
               src="/assets/girl.png" 
               alt="Girl" 
               fill 
               className="object-contain drop-shadow-md" 
               priority
             />
          </div>
        </div>

      </div>
    </div>
  );
}
