import type { CSSProperties, ReactNode } from 'react'
import { Logo } from '../Logo'
import { useState, useEffect, useCallback } from 'react'
import {
  getSupabaseStatus,
  isDeploymentMissingSupabase,
  testSupabaseConnection,
  SUPABASE_RUNTIME_CONFIG_EVENT,
} from '../../lib/supabaseClient'
import { SupabaseConfigModal } from './SupabaseConfigModal'
import { Header } from './Header'
import { TopAnnouncementBanner } from './TopAnnouncementBanner'

interface PageShellProps {
  children: ReactNode
}

/** Supabase 상단 배너 높이(대략) — 헤더 `top` 오프셋과 맞춤 */
const SUPABASE_ALERT_OFFSET_PX = 56

export function PageShell({ children }: PageShellProps) {
  const [topBannerReservePx, setTopBannerReservePx] = useState(0)
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false)
  const [supabaseStatus, setSupabaseStatus] = useState<{ env: boolean; connection: boolean | null }>({ env: false, connection: null })

  const refreshSupabaseStatus = useCallback(() => {
    const { connected } = getSupabaseStatus()
    setSupabaseStatus((s) => ({ ...s, env: connected, connection: connected ? null : false }))
    if (connected) {
      testSupabaseConnection().then((r) => setSupabaseStatus((s) => ({ ...s, connection: r.ok })))
    }
  }, [])

  useEffect(() => {
    refreshSupabaseStatus()
  }, [refreshSupabaseStatus])

  useEffect(() => {
    const onCfg = () => refreshSupabaseStatus()
    window.addEventListener(SUPABASE_RUNTIME_CONFIG_EVENT, onCfg)
    return () => window.removeEventListener(SUPABASE_RUNTIME_CONFIG_EVENT, onCfg)
  }, [refreshSupabaseStatus])

  const showConfigError = isDeploymentMissingSupabase()
  const supabaseTopPx = showConfigError ? SUPABASE_ALERT_OFFSET_PX : 0
  const headerTopPx = supabaseTopPx + topBannerReservePx

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      {showConfigError && (
        <div
          className="sticky top-0 z-[100] border-b px-4 py-3 text-center text-sm leading-snug"
          role="alert"
          style={{
            background: 'rgba(127, 29, 29, 0.95)',
            borderColor: 'rgba(252, 165, 165, 0.4)',
            color: '#fecaca',
          }}
        >
          <strong className="text-white">Supabase 미연결:</strong> Vercel에{' '}
          <code className="rounded bg-black/30 px-1 py-0.5 text-xs">VITE_SUPABASE_URL</code>,{' '}
          <code className="rounded bg-black/30 px-1 py-0.5 text-xs">VITE_SUPABASE_ANON_KEY</code>를
          넣고 Redeploy 하거나,{' '}
          <button
            type="button"
            onClick={() => setSupabaseModalOpen(true)}
            className="mx-1 inline font-semibold text-white underline decoration-red-300 underline-offset-2 hover:decoration-white"
          >
            여기서 URL·키를 입력해 이 브라우저에 저장
          </button>
          할 수 있습니다.
        </div>
      )}

      <SupabaseConfigModal
        open={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
        onApplied={() => refreshSupabaseStatus()}
      />

      <TopAnnouncementBanner
        offsetTopPx={supabaseTopPx}
        onReserveHeightChange={setTopBannerReservePx}
      />

      <Header topOffsetPx={headerTopPx} />

      <main
        className="page-main-with-top-banner mx-auto max-w-6xl px-5 pb-8 md:px-8 md:pb-10"
        style={
          {
            '--top-banner-reserve': `${topBannerReservePx}px`,
          } as CSSProperties
        }
      >
        {children}
      </main>

      {/* Footer */}
      <footer className="footer-site mt-8 border-t border-white/5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-5 md:flex-row md:flex-wrap md:items-center md:justify-between md:px-8">
          <div className="flex items-start gap-3">
            <span className="inline-flex shrink-0">
              <Logo size={24} className="drop-shadow-[0_2px_8px_rgba(220,38,38,0.35)]" />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-xs text-[var(--color-text-faint)]">
                © {new Date().getFullYear()} 서울소방 GPT — AI 지식 아카이브
              </p>
              <p className="text-xs text-[var(--color-text-faint)]">검증된 정보만 제공합니다.</p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <div
              className="flex items-center gap-2 text-xs text-[var(--color-text-faint)]"
              title={
                supabaseStatus.env
                  ? supabaseStatus.connection === true
                    ? 'Supabase 연결됨'
                    : supabaseStatus.connection === false
                      ? 'Supabase 연결 실패 (URL·키·RLS 확인)'
                      : 'Supabase 연결 확인 중...'
                  : 'Supabase 미연동 — 연결 설정 또는 Vercel 환경 변수'
              }
            >
              {!supabaseStatus.env ? (
                <>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-zinc-500 shadow-[0_0_6px_rgba(113,113,122,0.35)]" />
                  <span className="flex flex-wrap items-center gap-x-1 gap-y-1">
                    <span>Supabase 미연동</span>
                    <button
                      type="button"
                      onClick={() => setSupabaseModalOpen(true)}
                      className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-red-500 hover:bg-red-500/10"
                    >
                      연결
                    </button>
                  </span>
                </>
              ) : supabaseStatus.connection === true ? (
                <>
                  <span
                    className="h-2 w-2 shrink-0 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]"
                    aria-hidden
                  />
                  <span className="text-green-500">Supabase 연결됨</span>
                </>
              ) : supabaseStatus.connection === false ? (
                <>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
                  <span className="text-red-400">Supabase 연결 실패</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.35)]" />
                  <span className="text-[var(--color-text-muted)]">Supabase 확인 중…</span>
                </>
              )}
            </div>
            <span
              className="font-mono text-[10px] tabular-nums text-[var(--color-text-faint)]"
              title="GitHub main과 동일한 짧은 해시면 동일 빌드입니다. local은 개발 모드입니다."
            >
              빌드 {__GIT_SHA__}
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
