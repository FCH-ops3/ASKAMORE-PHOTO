-- ============================================================
-- ASKAMORE — compteur de visites (à coller dans Supabase :
-- SQL Editor → New query → Run)
-- ============================================================
create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  page text not null default '',
  created_at timestamptz not null default now()
);

alter table public.visits enable row level security;

-- Les visiteurs peuvent enregistrer une visite (anonyme)
create policy "enregistrement visites" on public.visits
  for insert to anon, authenticated with check (true);

-- Seul l'admin connecté peut lire les statistiques
create policy "lecture visites admin" on public.visits
  for select to authenticated using (true);
