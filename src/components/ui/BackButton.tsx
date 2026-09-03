import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  href: string;
  label?: string;
  className?: string;
}

export function BackButton({ href, label = "Back to Dashboard", className }: BackButtonProps) {
  return (
    <Link 
      href={href} 
      className={cn(
        "inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1 py-0.5 -ml-1", 
        className
      )}
    >
      <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
      {label}
    </Link>
  );
}
