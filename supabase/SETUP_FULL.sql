-- ============================================================
-- 서울소방 GPT - Supabase 전체 설정 (SQL Editor에서 한 번에 실행)
-- ============================================================
-- 실행 전: Storage → New bucket → 이름 'post-images' → Public 체크 → Create
-- ============================================================

-- 1. 스키마 (테이블, enum, RLS)
create type public.knowledge_category as enum (
  'AI_UTIL', 'FIELD', 'EQUIPMENT', 'PREVENTION', 'LECTURE', 'NOTICE', 'BOARD', 'RESEARCH'
);

create table if not exists public.knowledge_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category public.knowledge_category not null,
  summary text not null,
  content_markdown text not null,
  thumbnail_url text,
  image_urls jsonb,
  author_display_name text,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_knowledge_posts_category on public.knowledge_posts (category);
create index if not exists idx_knowledge_posts_created_at on public.knowledge_posts (created_at desc);

create table if not exists public.post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.knowledge_posts(id) on delete cascade,
  image_url text not null,
  alt_text text,
  created_at timestamptz not null default now()
);

alter table public.knowledge_posts enable row level security;
alter table public.post_images enable row level security;

create policy "Anyone can read posts" on public.knowledge_posts for select using (true);
create policy "Anyone can read post images" on public.post_images for select using (true);
create policy "Anyone can insert posts" on public.knowledge_posts for insert with check (true);
create policy "Anyone can insert post images" on public.post_images for insert with check (true);
create policy "Anyone can update posts" on public.knowledge_posts for update using (true) with check (true);
create policy "No one deletes posts yet" on public.knowledge_posts for delete using (false);
create policy "No one updates images yet" on public.post_images for update using (false) with check (false);
create policy "No one deletes images yet" on public.post_images for delete using (false);

-- 2. Storage 정책 (post-images 버킷 필요)
drop policy if exists "Anyone can upload to post-images" on storage.objects;
drop policy if exists "Anyone can read from post-images" on storage.objects;
create policy "Anyone can upload to post-images" on storage.objects for insert with check (bucket_id = 'post-images');
create policy "Anyone can read from post-images" on storage.objects for select using (bucket_id = 'post-images');
