-- À exécuter dans Supabase > SQL Editor, pour le projet déjà configuré.
-- Mode partagé sans connexion : chacun peut modifier Fandebr et Fandenibard.
-- Migration réexécutable ; aucune progression ni aucun propriétaire existant n'est effacé.
begin;
create table if not exists public.rogue_progress (
 slug text primary key check (slug ~ '^[a-z0-9-]{3,60}$'),
 owner_id uuid references auth.users(id) on delete cascade,
 level integer not null default 14 check (level between 10 and 70),
 checked jsonb not null default '[]'::jsonb check (jsonb_typeof(checked)='array'),
 updated_at timestamptz not null default now()
);
-- Conserver la colonne historique, mais ne plus exiger de compte utilisateur.
alter table public.rogue_progress alter column owner_id drop not null;
alter table public.rogue_progress enable row level security;

-- Les privilèges SQL sont nécessaires en plus des politiques RLS.
grant usage on schema public to anon, authenticated;
grant select on public.rogue_progress to anon, authenticated;
grant insert (slug,level,checked,updated_at), update (slug,level,checked,updated_at)
 on public.rogue_progress to anon, authenticated;

drop policy if exists "public read rogue progress" on public.rogue_progress;
drop policy if exists "owner insert rogue progress" on public.rogue_progress;
drop policy if exists "owner update rogue progress" on public.rogue_progress;
drop policy if exists "shared insert character progress" on public.rogue_progress;
drop policy if exists "shared update character progress" on public.rogue_progress;
create policy "public read rogue progress" on public.rogue_progress
 for select to anon,authenticated using (true);
create policy "shared insert character progress" on public.rogue_progress
 for insert to anon,authenticated with check (slug in ('fandebr','fandenibard'));
create policy "shared update character progress" on public.rogue_progress
 for update to anon,authenticated using (slug in ('fandebr','fandenibard'))
 with check (slug in ('fandebr','fandenibard'));
-- Pas de droit DELETE ajouté. Les écritures utilisent ON CONFLICT (slug).
-- Chaque ligne est créée automatiquement lors de la première ouverture du tracker.
commit;
