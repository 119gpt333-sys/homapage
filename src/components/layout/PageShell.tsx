import type { ReactNode } from 'react'
import { Flame, PenLine, Menu, X, Database, CheckCircle, XCircle } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import {
  getSupabaseStatus,
  isDeploymentMissingSupabase,
  testSupabaseConnection,
  SUPABASE_RUNTIME_CONFIG_EVENT,
} from '../../lib/supabaseClient'
import { SupabaseConfigModal } from './SupabaseConfigModal'

interface PageShellProps {
  children: ReactNode
}

const navLinks = [
  { to: '/', label: '홈' },
]

export function PageShell({ children }: PageShellProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
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
      {/* Header */}
      <header className="sticky top-0 z-50 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 md:px-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="group flex items-center gap-2.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent shadow-lg"
              style={{ boxShadow: '0 4px 20px rgba(220, 38, 38, 0.35)' }}>
              <Flame className="h-5 w-5 text-white" />
            </span>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold tracking-wide text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                서울소방 GPT
              </span>
              <span className="text-[10px] font-light" style={{ color: 'var(--color-text-muted)' }}>
                AI 지식 아카이브
              </span>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const active =
                link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.to)
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors"
                  style={{
                    color: active ? '#fff' : 'var(--color-text-secondary)',
                    background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                  }}
                >
                  {link.label}
                </Link>
              )
            })}
            <button
              type="button"
              onClick={() => navigate('/write')}
              className="ml-3 flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-all"
              style={{
                background: 'var(--color-accent)',
                boxShadow: '0 2px 16px rgba(220, 38, 38, 0.3)',
              }}
            >
              <PenLine className="h-3.5 w-3.5" />
              글쓰기
            </button>
          </nav>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 md:hidden"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t px-5 py-4 md:hidden" style={{ borderColor: 'var(--color-border)' }}>
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => { navigate('/write'); setMobileOpen(false) }}
                className="mt-1 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                style={{ background: 'var(--color-accent)' }}
              >
                <PenLine className="h-4 w-4" />
                글쓰기
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-5 py-6 text-center md:flex-row md:justify-between md:px-8 md:text-left">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            © {new Date().getFullYear()} 서울소방 GPT – AI 지식 아카이브
          </span>
          <div className="flex items-center gap-3">
            <span
              className="flex items-center gap-1.5 text-[11px]"
              style={{ color: 'var(--color-text-muted)' }}
              title={supabaseStatus.env
                ? supabaseStatus.connection === true
                  ? 'Supabase 연결됨'
                  : supabaseStatus.connection === false
                    ? 'Supabase 연결 실패 (URL·키·RLS 확인)'
                    : 'Supabase 연결 확인 중...'
                : 'Supabase 미연동 — 푸터의 연결 설정 또는 Vercel 환경 변수'}
            >
              <Database className="h-3 w-3" />
              Supabase:{' '}
              {!supabaseStatus.env ? (
                <span className="flex items-center gap-1" style={{ color: '#94a3b8' }}>
                  미연동
                  <button
                    type="button"
                    onClick={() => setSupabaseModalOpen(true)}
                    className="ml-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-400 hover:bg-white/10 hover:text-white"
                  >
                    연결
                  </button>
                </span>
              ) : supabaseStatus.connection === true ? (
                <span className="flex items-center gap-1" style={{ color: '#22c55e' }}>
                  <CheckCircle className="h-3 w-3" /> 연결됨
                </span>
              ) : supabaseStatus.connection === false ? (
                <span className="flex items-center gap-1" style={{ color: '#f87171' }}>
                  <XCircle className="h-3 w-3" /> 연결 실패
                </span>
              ) : (
                <span style={{ color: '#94a3b8' }}>확인 중...</span>
              )}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              검증된 정보만 제공합니다.
            </span>
            <span
              className="text-[10px] font-mono tabular-nums"
              style={{ color: 'var(--color-text-muted)' }}
              title="최신 배포인지 확인: GitHub main과 같은 짧은 커밋이면 동일 빌드입니다. local이면 개발 모드입니다."
            >
              빌드 {__GIT_SHA__}
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
