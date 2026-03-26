-- ═══════════════════════════════════════════════════════════════
-- 한 번에 실행할 통합 마이그레이션 (기존 DB용)
-- 새 프로젝트는 schema.sql만 실행하면 됩니다.
-- ═══════════════════════════════════════════════════════════════

-- 1. 게시글 수정 허용
drop policy if exists "No one updates posts yet" on public.knowledge_posts;
create policy "Anyone can update posts"
  on public.knowledge_posts for update using (true) with check (true);

-- 2. AI 활용 카테고리 (없을 때만 추가)
do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'knowledge_category' and e.enumlabel = 'AI_UTIL'
  ) then
    alter type public.knowledge_category add value 'AI_UTIL';
  end if;
end $$;

-- 2b. 추천도서·필독 유튜브 (없을 때만 추가)
do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'knowledge_category' and e.enumlabel = 'BOOK'
  ) then
    alter type public.knowledge_category add value 'BOOK';
  end if;

  if not exists (
    select 1 from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'knowledge_category' and e.enumlabel = 'YOUTUBE'
  ) then
    alter type public.knowledge_category add value 'YOUTUBE';
  end if;
end $$;

-- 3. image_urls 컬럼
alter table public.knowledge_posts add column if not exists image_urls jsonb;

-- 4. post-images Storage 정책
drop policy if exists "Anyone can upload to post-images" on storage.objects;
drop policy if exists "Anyone can read from post-images" on storage.objects;
create policy "Anyone can upload to post-images"
  on storage.objects for insert with check (bucket_id = 'post-images');
create policy "Anyone can read from post-images"
  on storage.objects for select using (bucket_id = 'post-images');

-- 5. 조회수 컬럼(구 스키마) + 댓글 + 조회수 RPC
--    앱의 댓글·조회수 기능에 필요. 기존 knowledge_posts 행은 그대로 유지됩니다.
alter table public.knowledge_posts add column if not exists view_count integer not null default 0;

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.knowledge_posts(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 4000),
  author_display_name text,
  created_at timestamptz not null default now()
);

create index if not exists idx_post_comments_post_id_created
  on public.post_comments (post_id, created_at desc);

alter table public.post_comments enable row level security;

drop policy if exists "Anyone can read comments" on public.post_comments;
drop policy if exists "Anyone can insert comments" on public.post_comments;
drop policy if exists "No one updates comments yet" on public.post_comments;
drop policy if exists "No one deletes comments yet" on public.post_comments;

create policy "Anyone can read comments"
  on public.post_comments for select using (true);

create policy "Anyone can insert comments"
  on public.post_comments for insert with check (true);

create policy "No one updates comments yet"
  on public.post_comments for update using (false) with check (false);

create policy "No one deletes comments yet"
  on public.post_comments for delete using (false);

create or replace function public.increment_post_view_count(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.knowledge_posts
  set view_count = coalesce(view_count, 0) + 1
  where id = p_post_id;
end;
$$;

grant execute on function public.increment_post_view_count(uuid) to anon, authenticated;
grant execute on function public.increment_post_view_count(uuid) to service_role;
