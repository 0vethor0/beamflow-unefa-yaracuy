import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Video,
  CheckCircle2,
} from "lucide-react";
import {
  addDays,
  addWeeks,
  format,
  isSameDay,
  isWeekend,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/neon/Logo";
import { NeonCard } from "@/components/neon/NeonCard";
import { NeonButton } from "@/components/neon/NeonButton";
import { NeonInput } from "@/components/neon/NeonInput";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/reservation")({
  head: () => ({
    meta: [
      { title: "Reservar — BeamReserve" },
      { name: "description", content: "Reserva un videobeam para tu próximo evento." },
    ],
  }),
  component: ReservationPage,
});

interface Videobeam {
  id: string;
  name: string;
  brand: string | null;
  status: "available" | "maintenance" | "unavailable";
}

function ReservationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videobeams, setVideobeams] = useState<Videobeam[]>([]);
  const [selectedBeam, setSelectedBeam] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from("videobeams")
      .select("id, name, brand, status")
      .order("name")
      .then(({ data }) => {
        if (data) setVideobeams(data as Videobeam[]);
      });
  }, []);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const canShowSummary = selectedBeam && startTime && endTime;
  const selectedBeamObj = videobeams.find((v) => v.id === selectedBeam);

  const handleSubmit = async () => {
    if (!user) return;
    if (!selectedBeam) return toast.error("Selecciona un videobeam");
    if (!startTime || !endTime) return toast.error("Selecciona el horario");
    if (endTime <= startTime) return toast.error("La hora de cierre debe ser posterior al inicio");
    const notesParsed = z.string().max(500).safeParse(notes);
    if (!notesParsed.success) return toast.error("Las notas son demasiado largas");

    setSubmitting(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      // Conflict check
      const { data: conflicts } = await supabase
        .from("reservations")
        .select("id")
        .eq("videobeam_id", selectedBeam)
        .eq("date", dateStr)
        .in("status", ["pending", "approved"])
        .lt("start_time", endTime)
        .gt("end_time", startTime);

      if (conflicts && conflicts.length > 0) {
        toast.error("Ese horario ya está reservado para este videobeam");
        return;
      }

      const { error } = await supabase.from("reservations").insert({
        user_id: user.id,
        videobeam_id: selectedBeam,
        date: dateStr,
        start_time: startTime,
        end_time: endTime,
        notes: notes.trim() || null,
        status: "pending",
        priority: "normal",
      });
      if (error) throw error;
      toast.success("¡Reserva creada! Estado: pendiente");
      // Reset
      setSelectedBeam(null);
      setStartTime("");
      setEndTime("");
      setNotes("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear la reserva");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-28">
      <div className="max-w-md mx-auto px-5 pt-10">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <h1 className="text-display-xl">Reservar</h1>
          </div>
          <Link
            to="/calendar"
            aria-label="Ver calendario"
            className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
          >
            <CalendarIcon className="size-5 text-primary" />
          </Link>
        </div>

        {/* Videobeam selector */}
        <section className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h2 className="text-display-sm mb-3">Selecciona el Videobeam</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 snap-x snap-mandatory">
            {videobeams.length === 0 && (
              <div className="text-text-tertiary text-sm">Cargando equipos…</div>
            )}
            {videobeams.map((b) => {
              const selected = b.id === selectedBeam;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => b.status === "available" && setSelectedBeam(b.id)}
                  disabled={b.status !== "available"}
                  className={cn(
                    "snap-start shrink-0 w-[140px] p-4 rounded-2xl border text-left transition-all",
                    selected
                      ? "bg-primary/[0.08] border-primary border-[2.5px] shadow-neon-strong"
                      : "bg-surface border-border/40",
                    b.status !== "available" && "opacity-50",
                  )}
                >
                  <Video
                    className={cn(
                      "size-6",
                      selected ? "text-primary" : "text-primary/80",
                    )}
                  />
                  <p className="text-sm font-display font-semibold mt-3 line-clamp-2 min-h-[2.5em]">
                    {b.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        b.status === "available" ? "bg-success" : "bg-text-tertiary",
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-medium",
                        b.status === "available" ? "text-success" : "text-text-tertiary",
                      )}
                    >
                      {b.status === "available" ? "Disponible" : "No disp."}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Calendar */}
        <section className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75 fill-mode-backwards">
          <h2 className="text-display-sm mb-3">Selecciona la Fecha</h2>
          <NeonCard className="p-4 shadow-neon">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setWeekStart(subWeeks(weekStart, 1))}
                aria-label="Semana anterior"
                className="size-8 flex items-center justify-center text-primary hover:bg-primary/10 rounded-lg"
              >
                <ChevronLeft className="size-5" />
              </button>
              <p className="text-display-md capitalize">
                {format(selectedDate, "MMMM 'de' yyyy", { locale: es })}
              </p>
              <button
                type="button"
                onClick={() => setWeekStart(addWeeks(weekStart, 1))}
                aria-label="Semana siguiente"
                className="size-8 flex items-center justify-center text-primary hover:bg-primary/10 rounded-lg"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((d) => (
                <div
                  key={d.toISOString() + "h"}
                  className={cn(
                    "text-center text-xs font-medium pb-2",
                    isWeekend(d) ? "text-text-secondary" : "text-text-secondary",
                  )}
                >
                  {format(d, "EEE", { locale: es }).slice(0, 3)}
                </div>
              ))}
              {weekDays.map((d) => {
                const isSelected = isSameDay(d, selectedDate);
                const isPast = d < new Date(new Date().setHours(0, 0, 0, 0));
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    disabled={isPast}
                    onClick={() => setSelectedDate(d)}
                    className={cn(
                      "aspect-square flex items-center justify-center rounded-full text-sm font-display font-semibold transition-all",
                      isSelected &&
                        "bg-primary text-primary-foreground shadow-neon-strong",
                      !isSelected && !isPast && "text-foreground hover:bg-primary/10",
                      isPast && "text-text-tertiary opacity-50",
                    )}
                  >
                    {format(d, "d")}
                  </button>
                );
              })}
            </div>
          </NeonCard>
        </section>

        {/* Time selectors */}
        <section className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 fill-mode-backwards">
          <h2 className="text-display-md mb-3">Selecciona el Horario</h2>
          <div className="grid grid-cols-2 gap-3">
            <TimeField
              label="Hora de Inicio"
              value={startTime}
              onChange={setStartTime}
            />
            <TimeField label="Hora de Cierre" value={endTime} onChange={setEndTime} />
          </div>
        </section>

        {/* Notes */}
        <section className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-backwards">
          <h2 className="text-display-md mb-3">Descripción / Notas</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Añade detalles adicionales para tu reserva..."
            className="w-full rounded-2xl bg-surface border border-border/40 p-4 text-[15px] placeholder:text-text-tertiary resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary transition-colors"
          />
        </section>

        {/* Summary */}
        {canShowSummary && (
          <section className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <NeonCard className="p-5 bg-gradient-card shadow-neon-strong border-primary/30">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="size-5 text-primary" />
                <h2 className="text-display-md">Resumen y confirmar</h2>
              </div>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-text-secondary">Equipo</dt>
                  <dd className="font-semibold text-right">{selectedBeamObj?.name}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-text-secondary">Fecha</dt>
                  <dd className="font-semibold text-right capitalize">
                    {format(selectedDate, "EEE d MMM yyyy", { locale: es })}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-text-secondary">Horario</dt>
                  <dd className="font-semibold text-right">
                    {startTime} – {endTime}
                  </dd>
                </div>
                {notes.trim() && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-text-secondary flex items-center gap-1">
                      <FileText className="size-3.5" /> Notas
                    </dt>
                    <dd className="text-right text-text-secondary text-xs max-w-[60%]">
                      {notes.trim()}
                    </dd>
                  </div>
                )}
              </dl>
              <NeonButton
                fullWidth
                className="mt-5"
                loading={submitting}
                onClick={handleSubmit}
              >
                Confirmar Reservación
              </NeonButton>
            </NeonCard>
          </section>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm text-text-secondary block mb-2">{label}</span>
      <div className="relative">
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full h-12 rounded-xl bg-surface border border-border/40 px-4 pr-10 text-[15px] font-display",
            value ? "text-foreground" : "text-text-tertiary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary",
          )}
        />
        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-primary pointer-events-none" />
      </div>
    </label>
  );
}
