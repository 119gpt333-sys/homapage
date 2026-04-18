-- ─────────────────────────────────────────────
-- 홈페이지 중앙 배너 이미지 (site banner)
--   1) site_settings 테이블: key=value 형태로 배너 URL 보관
--   2) site-banners 스토리지 버킷: 이미지 파일 저장
--
-- 보안 모델
--   - 읽기(select): anon 허용  → 모든 방문자가 배너 URL/이미지 조회 가능
--   - 쓰기(insert/update): service_role 만 허용
--     → /api/upload-banner 서버 라우트에서 SUPABASE_SERVICE_ROLE_KEY 로 업로드
--     → 클라이언트 anon 키로는 직접 업로드/수정 불가
-- ─────────────────────────────────────────────

-- 1) 설정 테이블 (단일 행: key='hero_banner_url')
create table if not exists public.site_settings (
  key         text primary key,
  value       text,
  updated_at  timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "Anyone can read site_settings"        on public.site_settings;
drop policy if exists "Anyone can insert site_settings"      on public.site_settings;
drop policy if exists "Anyone can update site_settings"      on public.site_settings;
drop policy if exists "Service role can write site_settings" on public.site_settings;

-- 누구나 읽기 가능
create policy "Anyone can read site_settings"
  on public.site_settings for select using (true);

-- service_role 만 insert/update/delete 가능
-- (service_role 키로 호출하면 RLS 우회되므로 명시적 정책은 사실상 문서용)
create policy "Service role can write site_settings"
  on public.site_settings for all
  to service_role
  using (true)
  with check (true);

-- 2) 스토리지 버킷 (대시보드에서 만들거나 아래 한 줄로 생성)
insert into storage.buckets (id, name, public)
values ('site-banners', 'site-banners', true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone can upload to site-banners"      on storage.objects;
drop policy if exists "Anyone can read from site-banners"      on storage.objects;
drop policy if exists "Anyone can update site-banners"         on storage.objects;
drop policy if exists "Service role can write site-banners"    on storage.objects;
drop policy if exists "Public read site-banners"               on storage.objects;

-- 누구나 이미지 조회 가능 (public 버킷)
create policy "Public read site-banners"
  on storage.objects for select
  using (bucket_id = 'site-banners');

-- service_role 만 업로드/수정/삭제 가능
create policy "Service role can write site-banners"
  on storage.objects for all
  to service_role
  using (bucket_id = 'site-banners')
  with check (bucket_id = 'site-banners');
