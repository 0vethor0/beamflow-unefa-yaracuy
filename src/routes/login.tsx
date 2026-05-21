import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Mail, Lock, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Logo } from "@/components/neon/Logo";
import { NeonButton } from "@/components/neon/NeonButton";
import { NeonCard } from "@/components/neon/NeonCard";
import { NeonInput } from "@/components/neon/NeonInput";
import { useAuth } from "@/hooks/useAuth";

const searchSchema = z.object({
  redirect: z.string().optional(),
  mode: z.enum(["login", "signup"]).optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Iniciar sesión — BeamFlow" },
      { name: "description", content: "Accede a BeamFlow para reservar videobeams." },
    ],
  }),
  component: LoginPage,
});

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(8, "Mínimo 8 caracteres").max(72);

function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const {
    isAuthenticated,
    loading,
    hasAdditionalData,
    userStatus,
    isLoadingAdditionalData,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
  } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">(search.mode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  // Post-auth routing (covers email/password and OAuth callback)
  useEffect(() => {
    if (loading || !isAuthenticated) return;
    if (hasAdditionalData === null || isLoadingAdditionalData) return;

    if (!hasAdditionalData) {
      navigate({ to: "/complete-profile" });
    } else if (userStatus === "pending" || userStatus === "rejected") {
      navigate({ to: "/waiting-approval" });
    } else if (userStatus === "approved") {
      navigate({ to: search.redirect ?? "/reservation" });
    }
  }, [
    isAuthenticated,
    loading,
    hasAdditionalData,
    userStatus,
    isLoadingAdditionalData,
    navigate,
    search.redirect,
  ]);

  const emailValid = emailSchema.safeParse(email).success;
  const passwordValid = passwordSchema.safeParse(password).success;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) {
      toast.error("Correo no válido");
      return;
    }
    if (!passwordValid) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await signUpWithEmail(email, password);
        if (error) throw error;
        toast.success("¡Cuenta creada! Revisa tu correo para confirmar.");
        setMode("login");
        setPassword("");
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        toast.success("¡Bienvenido!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setOauthLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        toast.error("No se pudo iniciar sesión con Google");
      }
    } catch {
      toast.error("Error al conectar con Google");
    } finally {
      setOauthLoading(false);
    }
  };

  const fieldGlow = (valid: boolean, value: string) =>
    value.length === 0
      ? ""
      : valid
        ? "border-success/60 shadow-[0_0_0_3px_oklch(var(--success)/.18)]"
        : "border-destructive/60 shadow-[0_0_0_3px_oklch(var(--destructive)/.18)]";

  return (
    <main className="min-h-screen bg-background px-5 py-10 flex flex-col items-center">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-500">
          <Logo size={64} />
          <h1 className="text-display-xl mt-6">BeamFlow</h1>
          <p className="text-text-secondary text-[15px] mt-2">
            {mode === "login" ? "Bienvenido de nuevo" : "Crea tu cuenta"}
          </p>
        </div>

        <NeonCard className="mt-8 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-backwards">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-display-sm block">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-tertiary z-10" />
                <NeonInput
                  type="email"
                  className={`pl-10 transition-shadow ${fieldGlow(emailValid, email)}`}
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                {emailValid && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-success" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-display-sm block">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-tertiary z-10" />
                <NeonInput
                  type={showPassword ? "text" : "password"}
                  className={`pl-10 pr-10 transition-shadow ${fieldGlow(passwordValid, password)}`}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                  aria-label={showPassword ? "Ocultar" : "Mostrar"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <NeonButton type="submit" fullWidth loading={submitting}>
              {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </NeonButton>
          </form>
        </NeonCard>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px bg-border flex-1" />
          <span className="text-text-secondary text-sm">o continúa con</span>
          <div className="h-px bg-border flex-1" />
        </div>

        <NeonButton
          variant="secondary"
          fullWidth
          loading={oauthLoading}
          onClick={handleGoogle}
        >
          <GoogleIcon />
          Continuar con Google
        </NeonButton>

        <p className="text-center text-text-secondary text-sm mt-8">
          {mode === "login" ? "¿No tienes una cuenta? " : "¿Ya tienes cuenta? "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-primary font-semibold hover:underline"
          >
            {mode === "login" ? "Regístrate" : "Inicia sesión"}
          </button>
        </p>

        <Link to="/" className="block text-center text-text-tertiary text-xs mt-6 hover:text-foreground">
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
