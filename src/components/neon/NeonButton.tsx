import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  fullWidth?: boolean;
}

export const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
  (
    { className, variant = "primary", loading, fullWidth, children, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-2xl font-display font-semibold text-base transition-all duration-200",
          "h-14 px-6",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:opacity-60 disabled:pointer-events-none",
          "active:scale-[0.98]",
          variant === "primary" &&
            "bg-gradient-primary text-primary-foreground shadow-neon hover:shadow-neon-strong",
          variant === "secondary" &&
            "bg-card text-foreground border border-border hover:bg-surface shadow-soft",
          variant === "ghost" && "bg-transparent text-foreground hover:bg-surface",
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? <Loader2 className="size-5 animate-spin" /> : children}
      </button>
    );
  },
);
NeonButton.displayName = "NeonButton";
