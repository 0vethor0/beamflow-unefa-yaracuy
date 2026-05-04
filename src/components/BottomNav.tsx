import { Link, useLocation } from "@tanstack/react-router";
import { Home, Calendar, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const location = useLocation();
  const path = location.pathname;
  const items = [
    { to: "/", label: "Dashboard", icon: Home, active: path === "/" },
    {
      to: "/reservation",
      label: "Reservar",
      icon: Calendar,
      active: path.startsWith("/reservation"),
    },
    { to: "/calendar", label: "Solicitudes", icon: Mail, active: path === "/calendar" },
  ] as const;
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-xl border-t border-border z-40">
      <div className="max-w-md mx-auto grid grid-cols-3 px-2 pt-2 pb-3">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex flex-col items-center gap-1 py-1.5 rounded-xl transition-colors",
                it.active ? "text-primary" : "text-text-tertiary",
              )}
            >
              <div
                className={cn(
                  "size-9 rounded-xl flex items-center justify-center transition-colors",
                  it.active && "bg-primary/10",
                )}
              >
                <Icon className="size-5" />
              </div>
              <span className="text-[11px] font-medium">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
