import * as React from "react";
import { cn } from "@/lib/utils";

export const NeonInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-xl border border-border bg-surface px-4 py-2 text-[15px]",
        "font-sans text-foreground placeholder:text-text-tertiary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary",
        "transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
NeonInput.displayName = "NeonInput";
