-- ============================================================
-- ASKAMORE PHOTOGRAPHY — création de la base Supabase
-- À coller tel quel dans : Supabase → SQL Editor → Run
-- ============================================================

-- Tables ------------------------------------------------------
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  url text not null,
  path text not null default '',
  caption text not null default '',
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value text
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service text not null default '',
  rating int not null default 5 check (rating between 1 and 5),
  text text not null,
  created_at timestamptz not null default now()
);

-- Sécurité (RLS) ----------------------------------------------
alter table public.photos enable row level security;
alter table public.settings enable row level security;
alter table public.reviews enable row level security;

-- Tout le monde peut LIRE le contenu du site
create policy "lecture publique photos"   on public.photos   for select using (true);
create policy "lecture publique settings" on public.settings for select using (true);
create policy "lecture publique avis"     on public.reviews  for select using (true);

-- Seul l'admin connecté peut MODIFIER photos et réglages
create policy "admin ajout photos"        on public.photos   for insert to authenticated with check (true);
create policy "admin modif photos"        on public.photos   for update to authenticated using (true);
create policy "admin suppression photos"  on public.photos   for delete to authenticated using (true);
create policy "admin ajout settings"      on public.settings for insert to authenticated with check (true);
create policy "admin modif settings"      on public.settings for update to authenticated using (true);

-- Les visiteurs peuvent DÉPOSER un avis ; seul l'admin supprime
create policy "depot avis public"         on public.reviews  for insert to anon, authenticated with check (true);
create policy "admin suppression avis"    on public.reviews  for delete to authenticated using (true);

-- Stockage des images -----------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "lecture publique images"   on storage.objects for select using (bucket_id = 'photos');
create policy "admin envoi images"        on storage.objects for insert to authenticated with check (bucket_id = 'photos');
create policy "admin modif images"        on storage.objects for update to authenticated using (bucket_id = 'photos');
create policy "admin suppression images"  on storage.objects for delete to authenticated using (bucket_id = 'photos');
