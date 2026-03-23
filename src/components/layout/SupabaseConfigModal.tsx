import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import {
  saveRuntimeSupabaseConfig,
  clearRuntimeSupabaseConfig,
  testSupabaseConnection,
  getRuntimeSupabaseFormValues,
} from '../../lib/supabaseClient'

interface SupabaseConfigModalProps {
  open: boolean
  onClose: () => void
  onApplied?: () => void
}

export function SupabaseConfigModal({ open, onClose, onApplied }: SupabaseConfigModalProps) {
  const [url, setUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    if (!open) return
    setMessage(null)
    const { url: u, anonKey: k } = getRuntimeSupabaseFormValues()
    setUrl(u)
    setAnonKey(k)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  async function handleSave() {
    setBusy(true)
    setMessage(null)
    try {
      saveRuntimeSupabaseConfig(url, anonKey)
      const test = await testSupabaseConnection()
      if (!test.ok) {
        setMessage({ type: 'err', text: test.error ?? '연결에 실패했습니다. URL·키를 확인해 주세요.' })
        setBusy(false)
        return
      }
      setMessage({ type: 'ok', text: '저장되었고 게시글 테이블과 통신에 성공했습니다.' })
      onApplied?.()
      setTimeout(() => onClose(), 600)
    } catch (e) {
      setMessage({
        type: 'err',
        text: e instanceof Error ? e.message : '저장에 실패했습니다.',
      })
    } finally {
      setBusy(false)
    }
  }

  function handleClear() {
    if (!confirm('이 브라우저에 저장된 Supabase URL·키를 삭제할까요?')) return
    clearRuntimeSupabaseConfig()
    setUrl('')
    setAnonKey('')
    setMessage({ type: 'ok', text: '저장된 설정을 지웠습니다.' })
    onApplied?.()
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="supabase-config-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border p-5 shadow-2xl"
        style={{
          background: 'var(--color-surface, #1e293b)',
          borderColor: 'var(--color-border, #334155)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="supabase-config-title" className="text-base font-semibold text-white">
            Supabase 연결
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          배포 환경 변수 없이 이 기기의 브라우저에만 저장합니다. Supabase 대시보드 →{' '}
          <strong className="text-slate-300">Project Settings → API</strong>에서 Project URL과 anon(public)
          키를 복사해 넣어 주세요.
        </p>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-slate-400">Project URL</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://xxxx.supabase.co"
            className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            autoComplete="off"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-medium text-slate-400">anon / publishable 키</span>
          <input
            type="password"
            value={anonKey}
            onChange={(e) => setAnonKey(e.target.value)}
            placeholder="sb_publishable_… 또는 eyJ…"
            className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 font-mono text-sm text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            autoComplete="off"
          />
        </label>

        {message && (
          <p
            className="mb-3 rounded-lg px-3 py-2 text-xs"
            style={{
              background: message.type === 'ok' ? 'rgba(34,197,94,0.15)' : 'rgba(248,113,113,0.12)',
              color: message.type === 'ok' ? '#86efac' : '#fecaca',
            }}
          >
            {message.text}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSave()}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
          >
            {busy ? '확인 중…' : '저장 및 연결'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleClear}
            className="rounded-xl border border-slate-500 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"
          >
            저장 삭제
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm text-slate-400 hover:text-white"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
