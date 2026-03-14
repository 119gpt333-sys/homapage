# Supabase + Vercel 연동 설정

## 1. Supabase 프로젝트 설정

### 1) 프로젝트 생성
1. [supabase.com](https://supabase.com) 로그인
2. **New Project** → 이름 입력 → 비밀번호 설정 → **Create**

### 2) 스키마 적용
1. **SQL Editor** → **New query**
2. `schema.sql` 전체 복사 후 실행
3. (선택) `seed.sql` 실행 → 샘플 게시글 추가

### 3) Storage 버킷 생성
1. **Storage** → **New bucket**
2. Name: `post-images`
3. **Public bucket** 체크
4. **Create bucket**

### 4) Storage 정책 적용
1. **SQL Editor** → **New query**
2. `migrations/storage_post_images_policies.sql` 내용 실행

### 5) API 키 확인
1. **Settings** → **API**
2. **Project URL** 복사
3. **anon public** 키 복사
4. **service_role** 키 복사 (삭제 기능용)

---

## 2. Vercel 환경 변수 설정 (배포 필수)

**배포 사이트에서 Supabase가 동작하려면 반드시 Vercel에 환경 변수를 설정해야 합니다.**

1. [vercel.com](https://vercel.com) → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 아래 변수 추가 (Production, Preview 체크):

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Supabase Project URL (예: https://xxxx.supabase.co) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public 또는 publishable 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role 키 |
| `ADMIN_PASSWORD` | 관리자 비밀번호 (삭제용) |
| `GEMINI_API_KEY` | Google Gemini API 키 (AI 챗용) |

> **참고:** anon 키는 JWT 형식(eyJ로 시작) 또는 publishable 형식(sb_publishable_로 시작) 모두 사용 가능합니다. Supabase 대시보드 → Settings → API에서 확인하세요.

### 4) 재배포
**Deployments** → 최신 배포 **⋯** → **Redeploy** (환경 변수 추가/수정 후 반드시 재배포)

---

## 3. 로컬 개발

```bash
cp .env.example .env.local
# .env.local에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 입력
npm run dev
```

---

## 4. 확인

배포 후 사이트 접속 → 푸터에 **Supabase: 연결됨** (초록색) 표시되면 성공.

---

## 5. 문제 해결 (연동 안 될 때)

### 1) 브라우저 콘솔 확인
배포 사이트 접속 → **F12** → **Console** 탭

- `[Supabase] 환경 변수 누락: VITE_SUPABASE_URL: 없음` → Vercel에 변수 추가 후 **Redeploy**
- `401` / `403` → Supabase 키 확인 (anon/publishable 키가 맞는지)
- `Failed to fetch` → Supabase 프로젝트가 **Paused** 상태인지 확인 → Restore

### 2) Vercel 환경 변수 체크리스트
| 확인 항목 | 설명 |
|-----------|------|
| 변수 이름 | 반드시 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (오타 X) |
| 적용 환경 | Production, Preview 모두 체크 |
| 재배포 | 변수 추가/수정 후 **Deployments → Redeploy** 필수 |

### 3) Supabase 체크리스트
| 확인 항목 | 설명 |
|-----------|------|
| 프로젝트 상태 | Paused면 **Restore project** |
| 테이블 | SQL Editor에서 `schema.sql` 실행했는지 |
| Storage | `post-images` 버킷 생성 + Public 체크 |
| Storage 정책 | `storage_post_images_policies.sql` 실행 |
