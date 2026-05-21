import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarPlus } from "lucide-react";
import { NeonCard } from "@/components/neon/NeonCard";
import { NeonButton } from "@/components/neon/NeonButton";

export const Route = createFileRoute("/_authenticated/reservation")({
  head: () => ({
    meta: [{ title: "Reservar — BeamFlow" }],
  }),
  component: ReservationPlaceholder,
});

function ReservationPlaceholder() {
  return (
    <main className="min-h-screen bg-background px-5 py-12 flex flex-col items-center">
      <div className="w-full max-w-md">
        <NeonCard className="p-8 text-center bg-gradient-card">
          <CalendarPlus className="size-12 text-primary mx-auto" />
          <h1 className="text-display-xl mt-4">¡Bienvenido!</h1>
          <p className="text-text-secondary mt-3">
            Tu cuenta está aprobada. El flujo de reservación llegará en la siguiente fase.
          </p>
          <Link to="/calendar" className="block mt-6">
            <NeonButton variant="secondary" fullWidth>
              Ver calendario
            </NeonButton>
          </Link>
        </NeonCard>
      </div>
    </main>
  );
}
