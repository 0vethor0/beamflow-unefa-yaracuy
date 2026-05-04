import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/neon/Logo";
import { NeonButton } from "@/components/neon/NeonButton";
import { NeonCard } from "@/components/neon/NeonCard";
import { NeonInput } from "@/components/neon/NeonInput";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Restablecer contraseña — BeamReserve" },
      { name: "description", content: "Define una nueva contraseña para tu cuenta." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().min(6).max(72).safeParse(password);
    if (!parsed.success) {
      toast.error("La contraseña debe tener entre 6 y 72 caracteres");
      return;
    }
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Contraseña actualizada");
      navigate({ to: "/reservation" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-5 py-10 flex flex-col items-center">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <Logo size={64} />
          <h1 className="text-display-xl mt-6">Nueva contraseña</h1>
          <p className="text-text-secondary text-[15px] mt-2">Define tu nueva contraseña</p>
        </div>

        <NeonCard className="mt-8 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-display-sm block">Nueva contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-tertiary" />
                <NeonInput
                  type="password"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-display-sm block">Confirmar contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-tertiary" />
                <NeonInput
                  type="password"
                  className="pl-10"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <NeonButton type="submit" fullWidth loading={submitting}>
              Actualizar contraseña
            </NeonButton>
          </form>
        </NeonCard>
      </div>
    </main>
  );
}
