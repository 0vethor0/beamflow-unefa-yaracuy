import { Video } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, size = 56 }: { className?: string; size?: number }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl bg-card shadow-neon border border-border/50",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Video className="text-primary" style={{ width: size * 0.45, height: size * 0.45 }} />
    </div>
  );
}
