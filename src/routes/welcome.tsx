import { createFileRoute } from "@tanstack/react-router";
import { Smartphone } from "lucide-react";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Bienvenido — BeamFlow" },
      {
        name: "description",
        content: "Pantalla de bienvenida de BeamFlow. Abre la app móvil para continuar.",
      },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const handleOpenApp = () => {
    // Intenta abrir la app móvil mediante deep link.
    // Si la app no está instalada, el navegador simplemente no hará nada.
    window.location.href = "beamflow://open";
  };

  return (
    <main className="min-h-screen bg-background px-5 py-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-md flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-500">
        <div
          className="flex items-center justify-center rounded-2xl bg-card shadow-neon border border-border/50"
          style={{ width: 72, height: 72 }}
        >
          <Smartphone className="text-primary" style={{ width: 32, height: 32 }} />
        </div>

        <h1 className="text-display-xl mt-6">¡Bienvenido a BeamFlow!</h1>
        <p className="text-text-secondary text-[15px] mt-3 max-w-xs">
          Para continuar con la mejor experiencia, abre la app móvil en tu dispositivo.
        </p>

        <button
          type="button"
          onClick={handleOpenApp}
          className="mt-10 inline-flex items-center justify-center gap-2 rounded-2xl font-display font-semibold text-base h-14 px-6 w-full bg-gradient-primary text-primary-foreground shadow-neon hover:shadow-neon-strong transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Smartphone className="size-5" />
          Abrir la app móvil
        </button>

        <p className="mt-12 text-text-tertiary text-xs">
          © {new Date().getFullYear()} BeamFlow
        </p>
      </div>
    </main>
  );
}
