## 서울소방 GPT – 미래 소방 지식 아카이브

React 19, Tailwind CSS 4, Supabase, Google Gemini 기반의 서울소방 지식 아카이브 웹앱입니다.

### 1. 기술 스택

- **Frontend**: React 19, Vite, TypeScript, React Router, Tailwind CSS 4, Lucide React
- **Backend(DB)**: Supabase (PostgreSQL, Storage, RLS)
- **AI**: Google Gemini 1.5 Pro (`@google/genai`) – Vercel Serverless Function

### 2. 개발 환경 설정

```bash
npm install
cp .env.example .env.local   # 값 채우기
```

`.env.local`에 다음 값을 설정합니다.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

### 3. Supabase 스키마 적용

Supabase 프로젝트 생성 후 SQL 에디터에서 [`supabase/schema.sql`](supabase/schema.sql)을 실행합니다.

- `knowledge_posts` / `post_images` 테이블과 `knowledge_category` enum 생성
- 익명 사용자의 `select` / `insert` 허용 (기여용)
- `update` / `delete`는 추후 관리자 정책 수립 후 열 수 있도록 기본 차단

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속:

- `/` : 홈 – 7개 카테고리 필터 + 지식 카드 리스트
- `/post/:id` : 상세 페이지 (마크다운 렌더링 + 레드 보더 요약 박스)
- `/write` : 글쓰기 페이지 (마크다운 에디터 텍스트 영역 + 미리보기)

모든 페이지 우측 하단에는 **서울소방 GPT 플로팅 버튼**이 있으며, 클릭 시 AI 챗 패널이 열립니다.

### 5. AI 챗 (서울소방 GPT)

- 프론트엔드: `src/components/chat/ChatFloating.tsx`, `ChatPanel.tsx`
- 백엔드: `api/gemini-chat.ts` (Vercel Serverless Function)

요청 바디:

```json
{
  "messages": [
    { "role": "user", "content": "질문 내용..." }
  ]
}
```

응답:

```json
{
  "reply": "서울소방 GPT의 답변"
}
```

### 6. Vercel 배포

1. Git 저장소로 커밋 후 Vercel에 연결합니다.
2. 프레임워크: `Vite` 자동 인식
3. 환경 변수 설정:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
4. 빌드 명령: `npm run build`, 출력 디렉터리: `dist`

루트의 `api/gemini-chat.ts`는 자동으로 Node Serverless Function으로 인식됩니다.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
