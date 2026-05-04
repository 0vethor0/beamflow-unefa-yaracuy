import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, ArrowRight, Sparkles } from "lucide-react";
import { Logo } from "@/components/neon/Logo";
import { NeonButton } from "@/components/neon/NeonButton";
import { NeonCard } from "@/components/neon/NeonCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BeamReserve — Reserva videobeams en segundos" },
      {
        name: "description",
        content:
          "Sistema de reservas de videobeams. Consulta disponibilidad y agenda equipos para tus clases o reuniones.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="min-h-screen bg-background px-5 py-12 flex flex-col items-center">
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Hero */}
        <div className="mt-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-500">
          <Logo size={72} />
          <h1 className="text-display-xl mt-6">BeamReserve</h1>
          <p className="text-text-secondary text-[15px] mt-2 max-w-xs">
            Reserva videobeams para tus clases o reuniones. Rápido, claro y sin filas.
          </p>
        </div>

        {/* Cards */}
        <div className="w-full mt-10 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-backwards">
          <NeonCard className="p-5 bg-gradient-card">
            <div className="flex items-start gap-4">
              <div className="size-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="size-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-display-sm">Ver Calendario</h3>
                <p className="text-text-secondary text-sm mt-1">
                  Consulta las reservas existentes sin necesidad de iniciar sesión.
                </p>
              </div>
            </div>
            <Link to="/calendar" className="mt-4 block">
              <NeonButton variant="secondary" fullWidth>
                Ver Calendario
                <ArrowRight className="size-5" />
              </NeonButton>
            </Link>
          </NeonCard>

          <NeonCard className="p-5 bg-gradient-card">
            <div className="flex items-start gap-4">
              <div className="size-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="size-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-display-sm">Realizar una reservación</h3>
                <p className="text-text-secondary text-sm mt-1">
                  Inicia sesión y agenda un videobeam en menos de un minuto.
                </p>
              </div>
            </div>
            <Link to="/login" className="mt-4 block">
              <NeonButton fullWidth>
                Realizar una reservación
                <ArrowRight className="size-5" />
              </NeonButton>
            </Link>
          </NeonCard>
        </div>

        <p className="mt-12 text-text-tertiary text-xs">
          © {new Date().getFullYear()} BeamReserve
        </p>
      </div>
    </main>
  );
}
