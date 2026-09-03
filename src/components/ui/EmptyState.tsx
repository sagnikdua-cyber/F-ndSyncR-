import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./Card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed border-2 border-slate-200 bg-slate-50/50 p-12 text-center flex flex-col items-center justify-center min-h-[300px]", className)}>
      <div className="mx-auto w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-slate-700">{title}</h3>
      <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
        {description}
      </p>
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </Card>
  );
}
