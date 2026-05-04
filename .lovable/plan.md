## BeamReserve — Plan de implementación

App móvil-first en español para reservar videobeams. Diseño "Neon White" (azul `#0066FF`, blancos suaves, sombras neon). Backend en **Lovable Cloud** (se aprovisiona Supabase automáticamente al implementar).

> Para empezar, pulsa **"Implement plan"** abajo. Eso activa el modo build, habilita Lovable Cloud y aplica las migraciones.

### Stack
- React + TypeScript + Tailwind v4 + TanStack Start (ya configurado).
- Lovable Cloud (Supabase gestionado) — *no* usamos las credenciales del proyecto Supabase externo que enviaste; mezclar dos backends rompería la app. Recreamos el esquema aquí.
- Auth: email/password + Google. Apple queda visible pero requiere Apple Developer Account para activarse.

### Esquema de base de datos
- **`profiles`** — `id` (FK `auth.users`), `email`, `full_name`, `department`, `avatar_url`. Trigger crea perfil al registrar.
- **`user_roles`** + enum `app_role` (`admin`, `user`) + función `has_role()` SECURITY DEFINER. Roles **nunca** en `profiles`.
- **`videobeams`** — `name`, `brand`, `model`, `status`, `image_url`. Seed con 4 equipos.
- **`reservations`** — `user_id`, `videobeam_id`, `date`, `start_time`, `end_time`, `status`, `notes`, `priority`. Constraint `end > start`.
- **Vista `public_reservations`** — sin `notes`, para el calendario público.
- **RLS**: profiles solo dueño; videobeams lectura pública/escritura admin; reservations lectura autenticados, insert/update/delete solo dueño o admin; vista pública vía `anon`.

### Rutas
```
/                              Landing pública
/login                         Login + registro + Google + Apple
/reset-password                Reset de contraseña
/calendar                      Calendario público
/_authenticated/reservation    Flujo de reserva (protegido)
```
Layout `_authenticated` con `beforeLoad` que redirige a `/login`.

### Pantallas
1. **Landing** — Logo BeamReserve, "Ver Calendario" → `/calendar`, "Realizar reservación" → `/login` (o `/reservation` si hay sesión).
2. **Login** — Replica el mockup: email + password con toggle, "Iniciar sesión" gradiente azul, "o continuar con", botones Google/Apple, link a registro y reset.
3. **Reservación** (protegida) — Header "Reservar" + icono calendario, selector horizontal de videobeams con glow neon en el seleccionado, calendario semanal navegable, hora inicio/fin con time pickers, textarea de notas, card "Resumen y confirmar" cuando todo está completo. Inserta `reservation` con `status: pending`. Validación servidor: sin solapamientos.
4. **Calendario público** — Lista + vista mensual de reservas (vista `public_reservations`), sin login.

### Componentes y estilo
- Tokens del design system añadidos a `src/styles.css` (`--primary-blue: #0066FF`, `--surface-light`, `--success`, etc.).
- Fuentes Poppins (títulos) + Inter (cuerpo) desde Google Fonts.
- `NeonCard`, `NeonButton`, `NeonInput` reutilizables.
- Animaciones fade-in con `tw-animate-css`.
- Bottom nav móvil (Dashboard / Reservar / Solicitudes) — *Reservar* funcional, los otros como placeholders.

### Lógica clave
- `useAuth` con `onAuthStateChange` (listener antes de `getSession`).
- Server functions con `requireSupabaseAuth` para crear reservas y validar conflictos.
- Validación con Zod + react-hook-form.

### Fuera de alcance (v1)
- Admin CRUD de videobeams (se puede añadir luego).
- Aprobación de reservas por admin (quedan en `pending`).
- Pantallas Dashboard / Solicitudes (placeholders).

Pulsa **Implement plan** para que active Cloud y empiece a construir.