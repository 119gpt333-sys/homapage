import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { runDeleteComment, type DeleteCommentBody } from './api/delete-comment-core'

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

  /** `npm run dev` 에서만: Vercel 없이 `/api/delete-comment` 처리 (Supabase + 서비스 롤) */
  function devDeleteCommentApiPlugin(): Plugin {
    return {
      name: 'dev-delete-comment-api',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const pathname = req.url?.split('?')[0] ?? ''
          if (pathname !== '/api/delete-comment' || req.method !== 'POST') {
            return next()
          }

          const serviceKey = firstNonEmpty(
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            loaded.SUPABASE_SERVICE_ROLE_KEY,
          )
          const adminPassword = firstNonEmpty(process.env.ADMIN_PASSWORD, loaded.ADMIN_PASSWORD)
          const url = supabaseUrl.trim()

          const sendJson = (status: number, payload: object) => {
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(payload))
          }

          if (!serviceKey || !adminPassword || !url) {
            sendJson(500, {
              error:
                '로컬 댓글 삭제: .env.local에 SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSWORD를 설정한 뒤 dev 서버를 재시작하세요.',
            })
            return
          }

          const chunks: Buffer[] = []
          req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
          req.on('end', () => {
            void (async () => {
              try {
                const raw = chunks.length ? Buffer.concat(chunks).toString('utf8') : '{}'
                let body: DeleteCommentBody
                try {
                  body = JSON.parse(raw) as DeleteCommentBody
                } catch {
                  sendJson(400, { error: 'JSON 파싱 오류' })
                  return
                }
                const result = await runDeleteComment(body, {
                  adminPassword,
                  serviceRoleKey: serviceKey,
                  supabaseUrl: url,
                })
                if (!result.ok) {
                  sendJson(result.status, { error: result.error })
                  return
                }
                sendJson(200, { success: true })
              } catch (e) {
                sendJson(500, { error: e instanceof Error ? e.message : '서버 오류' })
              }
            })()
          })
          req.on('error', () => {
            if (!res.headersSent) sendJson(500, { error: '요청 오류' })
          })
        })
      },
    }
  }

  return {
    plugins: [react(), devDeleteCommentApiPlugin()],
    define: {
      __GIT_SHA__: JSON.stringify(gitSha),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
    },
  }
})
