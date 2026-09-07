import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border/60 bg-card text-card-foreground shadow-card transition-shadow duration-200",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

export { Card }
