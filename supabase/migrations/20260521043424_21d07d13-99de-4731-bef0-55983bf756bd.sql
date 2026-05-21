-- =========================================
-- DROP previous schema (Phase 1 migration)
-- =========================================
DROP VIEW IF EXISTS public.public_reservations CASCADE;
DROP TABLE IF EXISTS public.reservations CASCADE;
DROP TABLE IF EXISTS public.videobeams CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.reservation_status CASCADE;
DROP TYPE IF EXISTS public.reservation_priority CASCADE;
DROP TYPE IF EXISTS public.videobeam_status CASCADE;

-- Drop trigger/function from old schema; rebuild after
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- =========================================
-- estados_producto (catalog)
-- =========================================
CREATE TABLE public.estados_producto (
  id INT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

INSERT INTO public.estados_producto (id, nombre) VALUES
  (1, 'disponible'),
  (2, 'en uso'),
  (3, 'inhabilitado'),
  (4, 'mantenimiento');

ALTER TABLE public.estados_producto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Estados publicly readable"
  ON public.estados_producto FOR SELECT
  USING (true);

-- =========================================
-- productos
-- =========================================
CREATE TABLE public.productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  marca TEXT,
  modelo TEXT,
  descripcion TEXT,
  ubicacion TEXT,
  id_estado INT NOT NULL DEFAULT 1 REFERENCES public.estados_producto(id),
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Productos publicly readable"
  ON public.productos FOR SELECT
  USING (true);

CREATE POLICY "Admins insert productos"
  ON public.productos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update productos"
  ON public.productos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete productos"
  ON public.productos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- perfiles
-- =========================================
CREATE TABLE public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  primer_nombre TEXT,
  primer_apellido TEXT,
  correo TEXT,
  foto_url TEXT,
  carrera TEXT,
  especialidad TEXT,
  rol TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfiles viewable by authenticated"
  ON public.perfiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users insert own perfil"
  ON public.perfiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own perfil"
  ON public.perfiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER perfiles_updated_at
  BEFORE UPDATE ON public.perfiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- reservas
-- =========================================
CREATE TABLE public.reservas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  id_producto UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  hora_inicio TIMESTAMPTZ NOT NULL,
  hora_fin TIMESTAMPTZ NOT NULL,
  estado_reserva TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado_reserva IN ('pendiente','aprobada','rechazada','en_curso','finalizada','cancelada')),
  notas TEXT,
  leido_por_admin BOOLEAN NOT NULL DEFAULT false,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservas_producto_fecha ON public.reservas (id_producto, hora_inicio);
CREATE INDEX idx_reservas_usuario ON public.reservas (id_usuario);

ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reservas publicly readable"
  ON public.reservas FOR SELECT
  USING (true);

CREATE POLICY "Users create own reservas"
  ON public.reservas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id_usuario);

CREATE POLICY "Users update own reservas"
  ON public.reservas FOR UPDATE TO authenticated
  USING (auth.uid() = id_usuario OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = id_usuario OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users delete own reservas"
  ON public.reservas FOR DELETE TO authenticated
  USING (auth.uid() = id_usuario OR public.has_role(auth.uid(), 'admin'));

-- =========================================
-- Trigger: auto-create perfil on signup
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfiles (id, correo, primer_nombre, foto_url, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- Storage: profile-photos bucket
-- =========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Profile photos publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Users upload own profile photo"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own profile photo"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own profile photo"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =========================================
-- Realtime
-- =========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.perfiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.productos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservas;
ALTER TABLE public.perfiles REPLICA IDENTITY FULL;
ALTER TABLE public.productos REPLICA IDENTITY FULL;
ALTER TABLE public.reservas REPLICA IDENTITY FULL;