-- Roles enum and table
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view their own roles"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id);

create policy "Admins can manage roles"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  department text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, department, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Videobeams
create type public.videobeam_status as enum ('available', 'maintenance', 'unavailable');

create table public.videobeams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  model text,
  status public.videobeam_status not null default 'available',
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.videobeams enable row level security;

create policy "Videobeams publicly readable"
  on public.videobeams for select using (true);

create policy "Admins insert videobeams"
  on public.videobeams for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins update videobeams"
  on public.videobeams for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins delete videobeams"
  on public.videobeams for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Reservations
create type public.reservation_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type public.reservation_priority as enum ('low', 'normal', 'high');

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  videobeam_id uuid not null references public.videobeams(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  status public.reservation_status not null default 'pending',
  notes text,
  priority public.reservation_priority not null default 'normal',
  created_at timestamptz not null default now(),
  constraint end_after_start check (end_time > start_time)
);

create index reservations_videobeam_date_idx on public.reservations(videobeam_id, date);
create index reservations_user_idx on public.reservations(user_id);

alter table public.reservations enable row level security;

create policy "Anyone can view reservations"
  on public.reservations for select using (true);

create policy "Users create own reservations"
  on public.reservations for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own reservations"
  on public.reservations for update to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'))
  with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "Users delete own reservations"
  on public.reservations for delete to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- Public view (no notes)
create or replace view public.public_reservations
with (security_invoker = true) as
select
  r.id,
  r.videobeam_id,
  v.name as videobeam_name,
  r.date,
  r.start_time,
  r.end_time,
  r.status,
  coalesce(p.full_name, 'Usuario') as user_name
from public.reservations r
left join public.videobeams v on v.id = r.videobeam_id
left join public.profiles p on p.id = r.user_id;

grant select on public.public_reservations to anon, authenticated;