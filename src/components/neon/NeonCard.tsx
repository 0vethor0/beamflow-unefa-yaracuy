import * as React from "react";
import { cn } from "@/lib/utils";

interface NeonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "none" | "soft" | "strong";
  selected?: boolean;
}

export const NeonCard = React.forwardRef<HTMLDivElement, NeonCardProps>(
  ({ className, glow = "soft", selected = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border bg-card transition-all duration-300",
          glow === "soft" && "shadow-soft",
          glow === "strong" && "shadow-neon",
          selected && "border-primary border-[2.5px] shadow-neon-strong",
          !selected && "border-border/40",
          className,
        )}
        {...props}
      />
    );
  },
);
NeonCard.displayName = "NeonCard";
