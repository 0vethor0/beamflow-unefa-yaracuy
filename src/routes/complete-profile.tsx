import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/neon/Logo";
import { NeonCard } from "@/components/neon/NeonCard";
import { NeonInput } from "@/components/neon/NeonInput";
import { NeonButton } from "@/components/neon/NeonButton";

export const Route = createFileRoute("/complete-profile")({
  head: () => ({
    meta: [{ title: "Completa tu perfil — BeamFlow" }],
  }),
  component: CompleteProfilePage,
});

const CARRERAS = [
  "Ingeniería de Sistemas",
  "Ingeniería Civil",
  "Ingeniería Agroindustrial",
  "ADS",
  "Enfermería",
  "Ingeniería Mecánica",
  "Ingeniería Agronómica",
  "Otros",
];

const schema = z.object({
  primer_nombre: z.string().trim().min(1).max(100),
  primer_apellido: z.string().trim().min(1).max(100),
  especialidad: z.string().trim().min(1).max(100),
  carrera: z.string().trim().max(100).optional().nullable(),
});

function CompleteProfilePage() {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [primerNombre, setPrimerNombre] = useState("");
  const [primerApellido, setPrimerApellido] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [carrera, setCarrera] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [loading, isAuthenticated, navigate]);

  const isStudent = especialidad.trim().toLowerCase() === "estudiante";

  useEffect(() => {
    if (!isStudent) setCarrera("");
  }, [isStudent]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("La foto debe ser JPG o PNG");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La foto no puede superar 2 MB");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!photoFile) {
      toast.error("Sube una foto de perfil");
      return;
    }

    const parsed = schema.safeParse({
      primer_nombre: primerNombre,
      primer_apellido: primerApellido,
      especialidad,
      carrera: isStudent ? carrera : null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (isStudent && !carrera) {
      toast.error("Selecciona tu carrera");
      return;
    }

    setSubmitting(true);
    try {
      // Upload photo
      const ext = photoFile.type === "image/png" ? "png" : "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("profile-photos")
        .upload(path, photoFile, { upsert: true, contentType: photoFile.type });
      if (uploadErr) throw uploadErr;

      const { data: pub } = supabase.storage.from("profile-photos").getPublicUrl(path);
      const fotoUrl = `${pub.publicUrl}?t=${Date.now()}`;

      // Upsert perfil
      const { error: upsertErr } = await supabase
        .from("perfiles")
        .upsert(
          {
            id: user.id,
            correo: user.email ?? null,
            primer_nombre: parsed.data.primer_nombre,
            primer_apellido: parsed.data.primer_apellido,
            especialidad: parsed.data.especialidad,
            carrera: parsed.data.carrera ?? null,
            foto_url: fotoUrl,
            rol: "usuario",
          },
          { onConflict: "id" },
        );
      if (upsertErr) throw upsertErr;

      toast.success("Perfil guardado. Esperando aprobación.");
      navigate({ to: "/waiting-approval" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el perfil");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background px-5 py-10 flex flex-col items-center">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-500">
          <Logo size={56} />
          <h1 className="text-display-xl mt-5">Completa tu perfil</h1>
          <p className="text-text-secondary text-[15px] mt-2 max-w-xs">
            Necesitamos algunos datos antes de que un administrador apruebe tu cuenta.
          </p>
        </div>

        <NeonCard className="mt-8 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Photo */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative size-[120px] rounded-full overflow-hidden border-2 border-dashed border-primary/40 bg-surface hover:border-primary transition-colors flex items-center justify-center"
                aria-label="Subir foto de perfil"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Vista previa" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="size-8 text-primary" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleFileChange}
              />
              <p className="text-text-tertiary text-xs mt-2">
                JPG o PNG, máximo 2 MB
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-display-sm block">Primer nombre</label>
              <NeonInput
                value={primerNombre}
                onChange={(e) => setPrimerNombre(e.target.value)}
                placeholder="Tu nombre"
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <label className="text-display-sm block">Primer apellido</label>
              <NeonInput
                value={primerApellido}
                onChange={(e) => setPrimerApellido(e.target.value)}
                placeholder="Tu apellido"
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <label className="text-display-sm block">Perfil / Rol</label>
              <NeonInput
                value={especialidad}
                onChange={(e) => setEspecialidad(e.target.value)}
                placeholder="estudiante, docente, coordinador-docente…"
                required
                maxLength={100}
                className={
                  isStudent
                    ? "border-success/60 shadow-[0_0_0_3px_oklch(var(--success)/.18)] transition-shadow"
                    : ""
                }
              />
              <p className="text-text-tertiary text-xs">
                Si eres estudiante, se habilitará el selector de carrera.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-display-sm block">Carrera / Programa</label>
              <select
                value={carrera}
                onChange={(e) => setCarrera(e.target.value)}
                disabled={!isStudent}
                className="flex h-12 w-full rounded-xl border border-border bg-surface px-4 text-[15px] text-foreground disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary"
              >
                <option value="">— Selecciona —</option>
                {CARRERAS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <NeonButton type="submit" fullWidth loading={submitting}>
              Guardar y continuar
            </NeonButton>
          </form>
        </NeonCard>
      </div>
    </main>
  );
}
