import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function firstNonEmpty(...candidates: (string | undefined)[]): string {
  for (const c of candidates) {
    const t = c?.trim()
    if (t) return t
  }
  return ''
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vercel 빌드 시 process.env에 주입되는 값과 저장소 .env.* 를 합쳐 클라이언트 번들에 반영.
  const loaded = loadEnv(mode, process.cwd(), '')

  const supabaseUrl = firstNonEmpty(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_URL,
    loaded.VITE_SUPABASE_URL,
    loaded.SUPABASE_URL,
  )
  const supabaseAnonKey = firstNonEmpty(
    process.env.VITE_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    loaded.VITE_SUPABASE_ANON_KEY,
    loaded.SUPABASE_ANON_KEY,
    loaded.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  const gitSha =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
    process.env.GITHUB_SHA?.slice(0, 7) ??
    'local'

  return {
    plugins: [react()],
    define: {
      __GIT_SHA__: JSON.stringify(gitSha),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
    },
  }
})
