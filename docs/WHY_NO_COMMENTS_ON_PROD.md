# 배포 사이트에서만 댓글이 안 보일 때

로컬(`npm run dev`)에서는 댓글이 보이는데 **실제 사이트(119gpt.app 등)** 에서만 안 보이면, 아래를 순서대로 확인하세요.

## 1. 코드는 정상입니다

- 댓글 UI는 `src/components/PostComments.tsx`, 게시글 상세는 `src/pages/PostDetailPage.tsx`에 있습니다.
- 프로덕션 빌드(`npm run build`)에도 포함됩니다.

## 2. 흔한 원인

### A. 브라우저·CDN이 예전 JS를 쓰는 경우

- 예전에 연 `탭`을 그대로 쓰면, 예전 번들이 메모리에 남을 수 있습니다.
- **해결:** 탭을 닫고 주소를 다시 열거나, **강력 새로고침** (Windows: `Ctrl+Shift+R`).

### B. 커스텀 도메인이 다른 프로젝트를 가리키는 경우

- Vercel **프로젝트 A**에 GitHub를 연결해 배포했는데, **119gpt.app** 도메인은 **프로젝트 B**에만 연결되어 있으면, GitHub로 올린 최신 코드는 A에만 반영되고, 방문하는 사이트는 B(옛 코드)일 수 있습니다.
- **해결:** Vercel → **Domains** 에서 `119gpt.app`이 붙어 있는 **프로젝트 이름**이, GitHub `119gpt333-sys/homapage`와 연결한 프로젝트와 **같은지** 확인하세요.

### C. GitHub 푸시는 됐는데 Vercel 자동 배포가 꺼져 있거나 실패

- **해결:** 해당 Vercel 프로젝트 → **Deployments** 에서 최신 커밋이 **Ready** 인지, 실패(Error)가 아닌지 확인 후 **Redeploy**.

## 3. 배포가 최신인지 확인하는 방법

- 사이트 **푸터**에 `빌드 xxxxxxx` (7자)가 표시됩니다.
- [GitHub 저장소 커밋 목록](https://github.com/119gpt333-sys/homapage/commits/main)의 짧은 SHA와 같으면, 그 배포에 댓글 기능이 포함된 프론트가 맞습니다.

## 4. 댓글 저장(Supabase)만 안 되는 경우

- 화면에는 댓글 창이 보이는데 **등록이 안 되면**, Supabase에 `post_comments` 테이블·마이그레이션 적용 여부와 Vercel 환경 변수 `VITE_SUPABASE_*` 를 확인하세요.
