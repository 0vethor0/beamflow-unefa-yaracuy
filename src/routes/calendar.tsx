import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Calendar as CalendarIcon, Clock, Video } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { NeonCard } from "@/components/neon/NeonCard";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendario público — BeamReserve" },
      { name: "description", content: "Consulta las reservas existentes de videobeams." },
    ],
  }),
  component: CalendarPage,
});

interface PublicReservation {
  id: string;
  videobeam_id: string | null;
  videobeam_name: string | null;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  user_name: string;
}

function CalendarPage() {
  const [reservations, setReservations] = useState<PublicReservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("public_reservations")
        .select("*")
        .gte("date", today)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(100);
      if (!error && data) setReservations(data as PublicReservation[]);
      setLoading(false);
    };
    load();
  }, []);

  const grouped = reservations.reduce<Record<string, PublicReservation[]>>((acc, r) => {
    (acc[r.date] = acc[r.date] || []).push(r);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="px-5 pt-10 pb-6 max-w-md mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-text-secondary text-sm hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver
        </Link>
        <h1 className="text-display-xl mt-4">Calendario</h1>
        <p className="text-text-secondary text-[15px] mt-1">
          Reservas próximas de todos los videobeams
        </p>
      </header>

      <section className="px-5 max-w-md mx-auto space-y-6">
        {loading ? (
          <SkeletonList />
        ) : reservations.length === 0 ? (
          <NeonCard className="p-8 text-center">
            <CalendarIcon className="size-10 text-text-tertiary mx-auto" />
            <p className="text-text-secondary text-sm mt-3">
              Aún no hay reservas próximas. ¡Sé el primero!
            </p>
          </NeonCard>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-display-md capitalize">
                {format(parseISO(date), "EEEE d 'de' MMMM", { locale: es })}
              </h2>
              <div className="space-y-2">
                {items.map((r) => (
                  <NeonCard key={r.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="size-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Video className="size-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-display-sm truncate">
                            {r.videobeam_name ?? "Videobeam"}
                          </p>
                          <StatusBadge status={r.status} />
                        </div>
                        <p className="text-text-secondary text-sm mt-0.5 truncate">
                          Reservado por {r.user_name}
                        </p>
                        <div className="flex items-center gap-1.5 text-text-secondary text-xs mt-2">
                          <Clock className="size-3.5" />
                          <span>
                            {r.start_time.slice(0, 5)} – {r.end_time.slice(0, 5)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </NeonCard>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pendiente", cls: "bg-warning/15 text-warning-foreground" },
    approved: { label: "Aprobada", cls: "bg-success/15 text-success" },
    rejected: { label: "Rechazada", cls: "bg-destructive/15 text-destructive" },
    cancelled: { label: "Cancelada", cls: "bg-muted text-text-secondary" },
  };
  const v = map[status] ?? map.pending;
  return (
    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${v.cls}`}>
      {v.label}
    </span>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <NeonCard key={i} className="p-4 animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-2" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </NeonCard>
      ))}
    </div>
  );
}
