-- À exécuter dans Supabase > SQL Editor.
-- Lire publiquement, créer et modifier uniquement pour le propriétaire connecté.
create table if not exists public.rogue_progress (
 slug text primary key check (slug ~ '^[a-z0-9-]{3,60}$'),
 owner_id uuid not null references auth.users(id) on delete cascade,
 level integer not null default 14 check (level between 10 and 70),
 checked jsonb not null default '[]'::jsonb check (jsonb_typeof(checked)='array'),
 updated_at timestamptz not null default now()
);
alter table public.rogue_progress enable row level security;
create policy "public read rogue progress" on public.rogue_progress for select to anon,authenticated using (true);
create policy "owner insert rogue progress" on public.rogue_progress for insert to authenticated with check (auth.uid()=owner_id);
create policy "owner update rogue progress" on public.rogue_progress for update to authenticated using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
-- Aucun DELETE public et aucune écriture anonyme.
