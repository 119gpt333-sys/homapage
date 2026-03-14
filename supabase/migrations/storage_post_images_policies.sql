-- post-images 버킷: 업로드 및 공개 조회 허용
-- 버킷은 Supabase 대시보드에서 생성 후 이 스크립트 실행

drop policy if exists "Anyone can upload to post-images" on storage.objects;
drop policy if exists "Anyone can read from post-images" on storage.objects;

create policy "Anyone can upload to post-images"
  on storage.objects
  for insert
  with check (bucket_id = 'post-images');

create policy "Anyone can read from post-images"
  on storage.objects
  for select
  using (bucket_id = 'post-images');
