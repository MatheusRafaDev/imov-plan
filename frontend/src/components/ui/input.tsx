import * as React from "react"
import { cn } from "@/lib/utils"

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Layout
          "flex h-11 w-full rounded-lg px-3.5 py-2.5 text-sm",
          // Colors
          "border border-border/70 bg-input text-foreground",
          "placeholder:text-muted-foreground/50",
          // Focus
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:border-accent/50",
          // Hover
          "hover:border-border transition-all duration-150",
          // File input
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          // Disabled
          "disabled:cursor-not-allowed disabled:opacity-40",
          // Ring offset
          "ring-offset-background",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
