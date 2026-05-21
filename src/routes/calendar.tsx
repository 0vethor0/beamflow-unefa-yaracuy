import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { NeonCard } from "@/components/neon/NeonCard";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendario — BeamFlow" },
      { name: "description", content: "Consulta las reservas existentes de videobeams." },
    ],
  }),
  component: CalendarPlaceholder,
});

function CalendarPlaceholder() {
  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="px-5 pt-10 pb-6 max-w-md mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-text-secondary text-sm hover:text-foreground">
          <ArrowLeft className="size-4" /> Volver
        </Link>
        <h1 className="text-display-xl mt-4">Calendario General</h1>
      </header>
      <section className="px-5 max-w-md mx-auto">
        <NeonCard className="p-8 text-center">
          <CalendarClock className="size-10 text-primary mx-auto" />
          <h2 className="text-display-md mt-4">Próximamente</h2>
          <p className="text-text-secondary text-sm mt-2">
            El calendario rediseñado estará disponible en la siguiente fase.
          </p>
        </NeonCard>
      </section>
    </main>
  );
}
