import { createFileRoute } from "@tanstack/react-router";
import { Smartphone, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [redirecting, setRedirecting] = useState(false);

  // Con PKCE flow (tu configuración actual): Supabase añade ?code=XXXX a esta URL.
  // Con implicit flow: añade #access_token=XXX&refresh_token=YYY al hash.
  // DEBEMOS reenviar TODO a la app mediante el deep link.
  const authSearch = typeof window !== "undefined" ? window.location.search : "";
  const authHash = typeof window !== "undefined" ? window.location.hash : "";

  const hasAuthParams =
    authSearch.includes("code=") ||
    authSearch.includes("access_token=") ||
    authHash.includes("access_token=");

  const handleOpenApp = () => {
    setRedirecting(true);
    // CRÍTICO: reenviar los parámetros de autenticación al deep link.
    // authSearch = "?code=XXXX" (PKCE) o "?access_token=XXX" (implicit)
    // authHash   = "#access_token=XXX&refresh_token=YYY" (implicit)
    const deepLink = `io.supabase.flutter://callback/${authSearch}${authHash}`;
    window.location.href = deepLink;

    // Fallback: si el sistema no abre la app en 3 s, mostrar instrucciones
    setTimeout(() => {
      setRedirecting(false);
    }, 3000);
  };

  // Auto-redirigir cuando hay parámetros de auth (el usuario viene de Google OAuth)
  useEffect(() => {
    if (!hasAuthParams) return;
    const timer = setTimeout(handleOpenApp, 1200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-background px-5 py-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-md flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-500">
        {/* Icono */}
        <div
          className="flex items-center justify-center rounded-2xl bg-card shadow-neon border border-border/50"
          style={{ width: 72, height: 72 }}
        >
          <Smartphone className="text-primary" style={{ width: 32, height: 32 }} />
        </div>

        <h1 className="text-display-xl mt-6">¡Bienvenido a BeamFlow!</h1>

        {hasAuthParams ? (
          <>
            <p className="text-text-secondary text-[15px] mt-3 max-w-xs">
              Autenticación completada. Abriendo la app automáticamente…
            </p>

            {redirecting ? (
              <div className="mt-8 flex flex-col items-center gap-3">
                <Loader2 className="size-8 text-primary animate-spin" />
                <p className="text-text-secondary text-sm">Abriendo BeamFlow…</p>
              </div>
            ) : (
              <p className="text-text-secondary text-sm mt-6">
                Si la app no se abrió automáticamente, pulsa el botón:
              </p>
            )}
          </>
        ) : (
          <p className="text-text-secondary text-[15px] mt-3 max-w-xs">
            Para continuar con la mejor experiencia, abre la app móvil en tu dispositivo.
          </p>
        )}

        <button
          type="button"
          onClick={handleOpenApp}
          disabled={redirecting}
          className="mt-10 inline-flex items-center justify-center gap-2 rounded-2xl font-display font-semibold text-base h-14 px-6 w-full bg-gradient-primary text-primary-foreground shadow-neon hover:shadow-neon-strong transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-70"
        >
          {redirecting ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Abriendo…
            </>
          ) : (
            <>
              <Smartphone className="size-5" />
              Abrir la app móvil
            </>
          )}
        </button>

        <p className="mt-12 text-text-tertiary text-xs">
          © {new Date().getFullYear()} BeamFlow
        </p>
      </div>
    </main>
  );
}