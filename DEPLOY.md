# 배포 체크리스트

## Vercel 배포 전 확인

### 1. 환경 변수 (Vercel 대시보드 → Settings → Environment Variables)

| 변수명 | 용도 | 필수 |
|--------|------|------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase 익명 키 (공개 가능) | ✅ |
| `GEMINI_API_KEY` | Google Gemini API 키 (서버리스 함수용) | ✅ (AI 챗 사용 시) |

### 2. Supabase 설정

**상세 가이드: [`supabase/SETUP.md`](supabase/SETUP.md)**

- [ ] `supabase/schema.sql` 실행
- [ ] Storage 버킷 `post-images` 생성 (Public)
- [ ] `migrations/storage_post_images_policies.sql` 실행
- [ ] (선택) `supabase/seed.sql` 실행

### 게시글이 안 보일 때

- **Supabase 미설정**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`가 없으면 localStorage 사용. 첫 방문 시 샘플 게시글이 자동 표시됩니다.
- **Supabase 설정됨, DB 비어 있음**: Supabase SQL 에디터에서 `supabase/seed.sql` 실행

### 3. 빌드 설정 (Vercel 기본값)

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. SPA 라우팅

`vercel.json`에 rewrites 설정이 있어 `/post/:id`, `/write` 등 직접 접근 시에도 `index.html`이 제공됩니다.
