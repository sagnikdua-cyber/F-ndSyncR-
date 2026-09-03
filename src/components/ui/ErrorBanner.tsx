import { AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface ErrorBannerProps {
  message: string;
  title?: string;
  className?: string;
  onRetry?: () => void;
  variant?: "warning" | "error";
}

export function ErrorBanner({ message, title, className, onRetry, variant = "error" }: ErrorBannerProps) {
  const Icon = variant === "warning" ? AlertTriangle : XCircle;
  
  return (
    <div className={cn(
      "p-4 rounded-xl border flex items-start gap-3",
      variant === "warning" ? "bg-yellow-50 border-yellow-200 text-yellow-800" : "bg-red-50 border-red-200 text-red-800",
      className
    )}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm font-medium">
        {title && <h4 className="font-bold mb-1">{title}</h4>}
        <p>{message}</p>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry} 
            className={cn("mt-3 h-8 bg-white/50 hover:bg-white", variant === "warning" ? "border-yellow-300 text-yellow-900" : "border-red-300 text-red-900")}
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
