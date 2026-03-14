# 배포 가이드 (GitHub + Vercel + 119gpt.app)

## 1. GitHub 업로드

### 1) 저장소 생성
- https://github.com/new 접속
- Repository name: `homapage`
- **Create repository** 클릭

### 2) 푸시
```powershell
cd c:\coding\homapage
git remote add origin https://github.com/YOUR_USERNAME/homapage.git
git branch -M main
git push -u origin main
```
`YOUR_USERNAME`을 본인 GitHub 사용자명으로 변경

---

## 2. Vercel 배포

### 1) 프로젝트 연결
- https://vercel.com 로그인
- **Add New** → **Project**
- **Import Git Repository** → `homapage` 선택
- **Deploy** 클릭

### 2) 환경 변수 설정 (Settings → Environment Variables)
| 변수명 | 값 |
|--------|-----|
| `VITE_SUPABASE_URL` | .env.local의 값 |
| `VITE_SUPABASE_ANON_KEY` | .env.local의 값 |
| `SUPABASE_SERVICE_ROLE_KEY` | .env.local의 값 |
| `ADMIN_PASSWORD` | .env.local의 값 |
| `GEMINI_API_KEY` | .env.local의 값 |

환경 변수 추가 후 **Redeploy** 실행

---

## 3. 도메인 119gpt.app 연결

### 1) Vercel에서 도메인 추가
- 프로젝트 **homapage** → **Settings** → **Domains**
- **Add** → `119gpt.app` 입력 → **Add**

### 2) DNS 설정 (도메인 등록업체에서)
119gpt.app을 구매한 곳(가비아, Cloudflare 등)에서:

| 유형 | 이름 | 값 |
|------|------|-----|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

또는 Vercel이 안내하는 NS 레코드로 네임서버 변경

---

## 4. 확인
- 배포 URL: https://homapage-xxx.vercel.app
- 커스텀 도메인: https://119gpt.app (DNS 전파 후)
