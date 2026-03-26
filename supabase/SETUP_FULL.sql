-- ============================================================
-- 서울소방 GPT - Supabase 전체 설정 (SQL Editor에서 한 번에 실행)
-- ============================================================
-- 실행 전: Storage → New bucket → 이름 'post-images' → Public 체크 → Create
-- ============================================================

-- 1. 스키마 (테이블, enum, RLS)
create type public.knowledge_category as enum (
  'AI_UTIL', 'FIELD', 'EQUIPMENT', 'PREVENTION', 'LECTURE', 'NOTICE', 'BOARD', 'RESEARCH',
  'BOOK', 'YOUTUBE'
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

-- 3. 댓글 + 조회수 RPC (기존 DB는 supabase/migrations/add_post_comments_and_view_rpc.sql 만 실행)
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.knowledge_posts(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 4000),
  author_display_name text,
  created_at timestamptz not null default now()
);

create index if not exists idx_post_comments_post_id_created on public.post_comments (post_id, created_at desc);
alter table public.post_comments enable row level security;

drop policy if exists "Anyone can read comments" on public.post_comments;
drop policy if exists "Anyone can insert comments" on public.post_comments;
drop policy if exists "No one updates comments yet" on public.post_comments;
drop policy if exists "No one deletes comments yet" on public.post_comments;

create policy "Anyone can read comments" on public.post_comments for select using (true);
create policy "Anyone can insert comments" on public.post_comments for insert with check (true);
create policy "No one updates comments yet" on public.post_comments for update using (false) with check (false);
create policy "No one deletes comments yet" on public.post_comments for delete using (false);

create or replace function public.increment_post_view_count(p_post_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.knowledge_posts
  set view_count = coalesce(view_count, 0) + 1
  where id = p_post_id;
end;
$$;

grant execute on function public.increment_post_view_count(uuid) to anon, authenticated;
grant execute on function public.increment_post_view_count(uuid) to service_role;
