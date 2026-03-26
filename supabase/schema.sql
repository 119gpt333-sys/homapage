-- 서울소방 GPT 지식 아카이브 Supabase 스키마

create type public.knowledge_category as enum (
  'AI_UTIL',     -- AI 활용
  'FIELD',       -- 현장활동
  'EQUIPMENT',   -- 장비관리
  'PREVENTION',  -- 예방정보
  'LECTURE',     -- 강의신청
  'NOTICE',      -- 공지사항
  'BOARD',       -- 자유게시판
  'RESEARCH',    -- 연구자료
  'BOOK',        -- 추천도서
  'YOUTUBE'      -- 필독 유튜브
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

create index if not exists idx_knowledge_posts_category
  on public.knowledge_posts (category);

create index if not exists idx_knowledge_posts_created_at
  on public.knowledge_posts (created_at desc);

create table if not exists public.post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.knowledge_posts(id) on delete cascade,
  image_url text not null,
  alt_text text,
  created_at timestamptz not null default now()
);

-- Storage 버킷: post-images (대시보드에서 생성, Public 설정 권장)
-- 마이그레이션: storage_post_images_policies.sql 실행

-- RLS 설정
alter table public.knowledge_posts enable row level security;
alter table public.post_images enable row level security;

-- 누구나 조회 가능
create policy "Anyone can read posts"
  on public.knowledge_posts
  for select
  using (true);

create policy "Anyone can read post images"
  on public.post_images
  for select
  using (true);

-- 익명 포함 누구나 글 작성 가능 (기여용)
create policy "Anyone can insert posts"
  on public.knowledge_posts
  for insert
  with check (true);

create policy "Anyone can insert post images"
  on public.post_images
  for insert
  with check (true);

-- 누구나 수정 가능 (기여용)
create policy "Anyone can update posts"
  on public.knowledge_posts
  for update
  using (true)
  with check (true);

-- 삭제는 향후 관리자 역할에만 허용 (지금은 차단)

create policy "No one deletes posts yet"
  on public.knowledge_posts
  for delete
  using (false);

create policy "No one updates images yet"
  on public.post_images
  for update
  using (false)
  with check (false);

create policy "No one deletes images yet"
  on public.post_images
  for delete
  using (false);

