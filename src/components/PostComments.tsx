import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { MessageCircle, Send, Trash2, User } from 'lucide-react'
import { fetchComments, createComment } from '../lib/supabaseClient'
import type { PostComment } from '../types/knowledge'
import { Button } from './ui/Button'
import { Textarea } from './ui/Textarea'
import { Input } from './ui/Input'
import { CommentDeleteModal } from './CommentDeleteModal'

interface PostCommentsProps {
  postId: string
}

export function PostComments({ postId }: PostCommentsProps) {
  const [comments, setComments] = useState<PostComment[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PostComment | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const list = await fetchComments(postId)
    setComments(list)
    setLoading(false)
  }, [postId])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = body.trim()
    if (!trimmed) {
      setError('댓글 내용을 입력해 주세요.')
      return
    }
    setSubmitting(true)
    try {
      const row = await createComment(postId, trimmed, authorName || null)
      setComments((prev) => [...prev, row])
      setBody('')
      setAuthorName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  function commentPreviewText(body: string, max = 120) {
    const t = body.trim().replace(/\s+/g, ' ')
    return t.length <= max ? t : `${t.slice(0, max)}…`
  }

  return (
    <section
      id="comments"
      className="scroll-mt-28 mt-2 min-h-[240px] rounded-2xl p-5 md:p-6"
      style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 0 0 1px rgba(220,38,38,0.12), 0 8px 32px rgba(0,0,0,0.35)',
      }}
      aria-label="댓글"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
        <MessageCircle className="h-6 w-6 shrink-0" style={{ color: 'var(--color-accent-light)' }} />
        <h2 className="text-2xl font-bold md:text-[1.65rem]" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}>
          댓글 {comments.length > 0 ? `(${comments.length})` : ''}
        </h2>
        <span className="text-sm font-normal md:text-base" style={{ color: 'var(--color-text-muted)' }}>
          이 글에 대한 의견을 남겨 주세요
        </span>
      </div>

      {loading ? (
        <p className="text-base" style={{ color: 'var(--color-text-muted)' }}>
          불러오는 중…
        </p>
      ) : comments.length === 0 ? (
        <p className="mb-4 text-base md:text-lg" style={{ color: 'var(--color-text-muted)' }}>
          아직 댓글이 없습니다. 첫 댓글을 남겨 보세요.
        </p>
      ) : (
        <ul className="mb-6 space-y-4">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border px-4 py-4 md:px-5 md:py-4"
              style={{ borderColor: 'var(--color-border)', background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                  <span className="post-comment-author-display inline-flex items-center gap-2 text-lg font-semibold md:text-xl">
                    <User className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
                    <span className="truncate">{c.author_display_name?.trim() || '익명'}</span>
                  </span>
                  <span className="text-sm tabular-nums md:text-base" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(c.created_at).toLocaleString('ko-KR')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(c)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors md:text-sm"
                  style={{
                    color: '#f87171',
                    border: '1px solid rgba(239,68,68,0.35)',
                    background: 'rgba(239,68,68,0.08)',
                  }}
                  aria-label="댓글 삭제"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  삭제
                </button>
              </div>
              <p className="whitespace-pre-wrap text-base leading-relaxed md:text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      )}

      <CommentDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        postId={postId}
        commentId={deleteTarget?.id ?? ''}
        commentPreview={deleteTarget ? commentPreviewText(deleteTarget.body) : undefined}
        onDeleted={() => {
          const id = deleteTarget?.id
          setDeleteTarget(null)
          if (id) setComments((prev) => prev.filter((x) => x.id !== id))
        }}
      />

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="comment-author-name" className="post-comment-author-label mb-2 block text-lg font-semibold md:text-xl">
            닉네임 (선택)
          </label>
          <Input
            id="comment-author-name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="익명"
            maxLength={80}
            autoComplete="nickname"
            className="post-comment-author-input h-12 text-lg md:h-14 md:text-xl"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium md:text-base" style={{ color: 'var(--color-text-secondary)' }}>
            댓글
          </label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="내용을 입력하세요 (최대 4,000자)"
            rows={4}
            maxLength={4000}
            className="text-base md:text-lg"
          />
        </div>
        {error && (
          <p className="text-sm" style={{ color: '#f87171' }}>
            {error}
          </p>
        )}
        <Button type="submit" disabled={submitting} leftIcon={<Send className="h-4 w-4" />} size="md">
          {submitting ? '등록 중…' : '댓글 등록'}
        </Button>
      </form>
    </section>
  )
}
