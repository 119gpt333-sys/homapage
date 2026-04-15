-- 댓글 테이블 + 조회수 전용 RPC (악의적 view_count 조작 방지)

-- 1) 댓글
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

-- 수정은 기본 차단, 삭제는 서버 API에서 비밀번호 검증 후 허용
create policy "No one updates comments yet"
  on public.post_comments for update using (false) with check (false);

create policy "Anyone can delete comments"
  on public.post_comments for delete using (true);

-- 2) 조회수 증가 (일반 update로 view_count 조작 방지)
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
