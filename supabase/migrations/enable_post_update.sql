-- 게시글 수정 기능 활성화
-- 기존 "No one updates posts yet" 정책 제거 후 수정 허용 정책 추가

drop policy if exists "No one updates posts yet" on public.knowledge_posts;

create policy "Anyone can update posts"
  on public.knowledge_posts
  for update
  using (true)
  with check (true);
