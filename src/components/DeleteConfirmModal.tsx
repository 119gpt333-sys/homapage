import { type FormEvent, useState } from 'react'
import { Trash2, X } from 'lucide-react'
import { deletePost } from '../lib/supabaseClient'

interface DeleteConfirmModalProps {
  open: boolean
  onClose: () => void
  postId: string
  postTitle?: string
  onDeleted: () => void
}

export function DeleteConfirmModal({
  open,
  onClose,
  postId,
  postTitle,
  onDeleted,
}: DeleteConfirmModalProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    setError(null)
    const result = await deletePost(postId, password)
    setLoading(false)
    if (result.ok) {
      setPassword('')
      onClose()
      onDeleted()
    } else {
      setError(result.error ?? '삭제에 실패했습니다.')
    }
  }

  const handleClose = () => {
    setPassword('')
    setError(null)
    onClose()
  }

  if (!open) return null

  const titleId = 'delete-modal-title'
  const descId = 'delete-modal-desc'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={handleClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
            >
              <Trash2 className="h-4 w-4" />
            </span>
            <h3 id={titleId} className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              게시글 삭제
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p id={descId} className="mb-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {postTitle ? (
            <>
              <strong style={{ color: 'var(--color-text-primary)' }}>{postTitle}</strong>
              <br />
              이 글을 삭제하려면 관리자 비밀번호를 입력하세요.
            </>
          ) : (
            '이 글을 삭제하려면 관리자 비밀번호를 입력하세요.'
          )}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="관리자 비밀번호"
            autoComplete="current-password"
            disabled={loading}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
            }}
          />
          {error && (
            <p className="text-xs font-medium" style={{ color: '#f87171' }}>
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium"
              style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: '#dc2626', border: '1px solid #dc2626' }}
            >
              {loading ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
