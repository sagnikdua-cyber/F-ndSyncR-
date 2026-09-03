import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          {
            "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90": variant === "default",
            "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80": variant === "secondary",
            "border border-border bg-surface hover:bg-muted": variant === "outline",
            "hover:bg-muted text-foreground": variant === "ghost",
            "h-11 px-6 py-2": size === "default",
            "h-9 rounded-lg px-3": size === "sm",
            "h-14 rounded-2xl px-8 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
