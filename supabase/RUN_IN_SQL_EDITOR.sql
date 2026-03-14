-- Supabase SQL Editor에 붙여넣기 후 실행
-- post-images 버킷은 대시보드에서 먼저 생성하고 Public으로 설정

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
