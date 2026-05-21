import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Hourglass, XCircle, LogOut, LifeBuoy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type ProfileStatus } from "@/hooks/useAuth";
import { Logo } from "@/components/neon/Logo";
import { NeonCard } from "@/components/neon/NeonCard";
import { NeonButton } from "@/components/neon/NeonButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/waiting-approval")({
  head: () => ({
    meta: [{ title: "Esperando aprobación — BeamFlow" }],
  }),
  component: WaitingApprovalPage,
});

function WaitingApprovalPage() {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated, signOut } = useAuth();
  const [status, setStatus] = useState<ProfileStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [supportOpen, setSupportOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!user) return;

    let active = true;

    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from("perfiles")
        .select("status")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      if (!error && data) {
        const s = data.status as ProfileStatus;
        setStatus(s);
        if (s === "approved") {
          navigate({ to: "/reservation" });
        }
      }
      setLoadingStatus(false);
    };
    void fetchStatus();

    const channel = supabase
      .channel(`perfil-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "perfiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status?: ProfileStatus }).status;
          if (newStatus) {
            setStatus(newStatus);
            if (newStatus === "approved") {
              toast.success("¡Tu cuenta ha sido aprobada!");
              navigate({ to: "/reservation" });
            }
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  if (loading || loadingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const isRejected = status === "rejected";

  return (
    <main className="min-h-screen bg-background px-5 py-10 flex flex-col items-center">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <Logo size={56} />
        </div>

        <NeonCard className="mt-8 p-8 text-center animate-in fade-in zoom-in-95 duration-500">
          <div
            className={`mx-auto size-20 rounded-full flex items-center justify-center ${
              isRejected ? "bg-destructive/10" : "bg-primary/10"
            }`}
          >
            {isRejected ? (
              <XCircle className="size-10 text-destructive" />
            ) : (
              <Hourglass className="size-10 text-primary animate-pulse" />
            )}
          </div>

          <h1
            className={`text-display-xl mt-5 ${
              isRejected ? "text-destructive" : "text-foreground"
            }`}
          >
            {isRejected ? "Solicitud rechazada" : "Esperando aprobación"}
          </h1>

          <p className="text-text-secondary text-[15px] mt-3">
            {isRejected
              ? "Tu solicitud fue rechazada. Por favor, contacta al administrador para más información."
              : "Un administrador debe aprobar tu cuenta antes de que puedas reservar. Te avisaremos en cuanto esté lista."}
          </p>

          {!isRejected && (
            <div className="mt-6 flex items-center justify-center gap-2 text-text-tertiary text-sm">
              <Loader2 className="size-4 animate-spin" />
              <span>Verificando en tiempo real…</span>
            </div>
          )}
        </NeonCard>

        <div className="mt-6 space-y-3">
          <NeonButton variant="secondary" fullWidth onClick={() => setSupportOpen(true)}>
            <LifeBuoy className="size-5" />
            Contactar soporte
          </NeonButton>
          <NeonButton variant="ghost" fullWidth onClick={() => setLogoutOpen(true)}>
            <LogOut className="size-5" />
            Cerrar sesión
          </NeonButton>
        </div>
      </div>

      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contactar soporte</DialogTitle>
            <DialogDescription className="pt-2">
              Por favor, contacta al Coordinador de la carrera de Ing de Sistemas, el
              Ing. Rafael Lopez, para obtener más información.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <NeonButton onClick={() => setSupportOpen(false)}>Entendido</NeonButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cerrar sesión?</DialogTitle>
            <DialogDescription className="pt-2">
              Tendrás que iniciar sesión de nuevo la próxima vez.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <NeonButton variant="secondary" onClick={() => setLogoutOpen(false)}>
              Cancelar
            </NeonButton>
            <NeonButton onClick={handleLogout}>Cerrar sesión</NeonButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
