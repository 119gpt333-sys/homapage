import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel/GitHub Actions 빌드 시 커밋 해시 (배포본이 최신인지 푸터에서 확인)
const gitSha =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
  process.env.GITHUB_SHA?.slice(0, 7) ??
  'local'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __GIT_SHA__: JSON.stringify(gitSha),
  },
})
