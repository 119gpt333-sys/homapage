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

-- 3. image_urls 컬럼
alter table public.knowledge_posts add column if not exists image_urls jsonb;

-- 4. post-images Storage 정책
drop policy if exists "Anyone can upload to post-images" on storage.objects;
drop policy if exists "Anyone can read from post-images" on storage.objects;
create policy "Anyone can upload to post-images"
  on storage.objects for insert with check (bucket_id = 'post-images');
create policy "Anyone can read from post-images"
  on storage.objects for select using (bucket_id = 'post-images');
