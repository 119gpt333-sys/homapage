import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, Eye, User, Calendar, Flame, Pencil, Trash2 } from 'lucide-react'
import { fetchPostById, incrementPostViewCount } from '../lib/supabaseClient'
import { DeleteConfirmModal } from '../components/DeleteConfirmModal'
import { PostComments } from '../components/PostComments'
import { LinkifyText } from '../lib/linkifyText'
import { extractUrlsFromMarkdown } from '../lib/linkEmbed'
import { LinkEmbeds } from '../components/LinkEmbed'
import type { KnowledgePost } from '../types/knowledge'

const categoryLabels: Record<string, string> = {
  AI_UTIL: 'AI 활용',
  FIELD: '현장활동',
  EQUIPMENT: '장비관리',
  PREVENTION: '예방정보',
  LECTURE: '강의신청',
  NOTICE: '공지사항',
  BOARD: '자유게시판',
  RESEARCH: '연구자료',
  BOOK: '추천도서',
  YOUTUBE: '필독 유튜브',
}

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<KnowledgePost | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const viewIncrementedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const data = await fetchPostById(id)
      if (!cancelled) { setPost(data); setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [id])

  /** 상세 진입 시 조회수 +1 (React Strict Mode 중복 호출 방지) */
  useEffect(() => {
    if (!id) return
    if (viewIncrementedRef.current === id) return
    viewIncrementedRef.current = id
    void incrementPostViewCount(id).then((n) => {
      if (n != null) setPost((p) => (p ? { ...p, view_count: n } : p))
    })
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {[200, 40, 300].map((h, i) => (
          <div key={i} className="animate-pulse rounded-2xl"
            style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', height: h }} />
        ))}
      </div>
    )
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl p-10 text-center"
        style={{ background: 'var(--color-card)', border: '1px dashed var(--color-border-hover)' }}>
        <Flame className="mx-auto mb-3 h-10 w-10" style={{ color: 'var(--color-text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          지식 카드를 찾을 수 없습니다.
        </p>
        <Link to="/" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold"
          style={{ color: 'var(--color-accent-light)' }}>
          <ArrowLeft className="h-3 w-3" />
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* 이미지 최우선 배치 - 클릭 시 가장 먼저 보이도록 */}
      {post.image_urls && post.image_urls.length > 0 && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {post.image_urls.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
              className="block rounded-2xl transition-transform hover:scale-[1.01]"
              style={{ border: '1px solid var(--color-border)' }}>
              <img src={url} alt={`첨부 사진 ${i + 1}`}
                className="w-full h-auto object-contain" />
            </a>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: 'var(--color-text-muted)' }}>
          <ArrowLeft className="h-3.5 w-3.5" />
          목록으로 돌아가기
        </Link>
        <div className="flex items-center gap-1">
          <Link
            to={`/post/${post.id}/edit`}
            className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors"
            style={{
              color: 'var(--color-accent-light)',
              border: '1px solid rgba(220,38,38,0.3)',
              background: 'rgba(220,38,38,0.08)',
            }}
          >
            <Pencil className="h-2.5 w-2.5" />
            수정
          </Link>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors"
            style={{
              color: '#f87171',
              border: '1px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.08)',
            }}
          >
            <Trash2 className="h-2.5 w-2.5" />
            삭제
          </button>
        </div>
      </div>

      <DeleteConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        postId={post.id}
        postTitle={post.title}
        onDeleted={() => navigate('/?refresh=' + Date.now(), { replace: true })}
      />

      <header className="space-y-3">
        <span className="inline-block rounded-md px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: 'rgba(220,38,38,0.12)', color: '#f87171' }}>
          {categoryLabels[post.category] ?? post.category}
        </span>

        <h1 className="rounded-xl border-2 px-5 py-4 text-3xl font-bold leading-tight md:text-4xl"
          style={{
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-text-primary)',
            borderColor: 'var(--color-border)',
            background: 'rgba(255,255,255,0.05)',
          }}>
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-xs"
          style={{ color: 'var(--color-text-muted)' }}>
          <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.author_display_name || '익명 기여'}</span>
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(post.created_at).toLocaleString('ko-KR')}</span>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />조회 {post.view_count ?? 0}</span>
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          이 글 하단에 <strong style={{ color: 'var(--color-text-secondary)' }}>댓글</strong>을 남길 수 있습니다. 요약 바로 아래에 댓글창이 있습니다.
        </p>
      </header>

      {/* Summary box with red border */}
      <div className="rounded-2xl p-5"
        style={{
          background: 'rgba(220,38,38,0.06)',
          border: '1px solid rgba(220,38,38,0.25)',
        }}>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider"
          style={{ color: '#f87171', fontFamily: 'var(--font-heading)' }}>
          핵심 요약
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
          <LinkifyText>{post.summary}</LinkifyText>
        </p>
      </div>

      {/* 댓글: 본문보다 위에 두어 스크롤 없이도 보이게 함 */}
      <PostComments postId={post.id} />

      {/* 링크 임베드 - 자기 사이트·이미지 URL 제외 (중복 표시 및 CORS 방지) */}
      {(() => {
        const allUrls = extractUrlsFromMarkdown(post.content_markdown)
        const imageUrlSet = new Set(post.image_urls ?? [])
        const imageExts = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i
        const urls = allUrls.filter((url) => {
          try {
            if (new URL(url).origin === window.location.origin) return false
            if (imageUrlSet.has(url)) return false
            if (imageExts.test(url)) return false
            return true
          } catch {
            return true
          }
        })
        return urls.length > 0 ? <LinkEmbeds urls={urls} className="mt-5" /> : null
      })()}

      {/* Markdown body */}
      <article className="rounded-2xl p-6 md:p-8"
        style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <div className="prose-custom">
          <ReactMarkdown
            components={{
              a: ({ href, children, ...props }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" {...props}
                  style={{ color: 'var(--color-accent-light)', textDecoration: 'underline' }}>
                  {children}
                </a>
              ),
              img: ({ src, alt, ...props }) => {
                if (!src?.trim()) return null
                const inImageUrls = post.image_urls?.includes(src)
                if (inImageUrls) return null
                return (
                  <img src={src} alt={alt ?? ''} {...props}
                    className="max-w-full h-auto object-contain" style={{ display: 'block' }} />
                )
              },
            }}
          >
            {post.content_markdown}
          </ReactMarkdown>
        </div>
      </article>

      <p className="text-center text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
        <a href="#comments" className="font-medium underline underline-offset-2" style={{ color: 'var(--color-accent-light)' }}>
          ↑ 댓글은 요약 아래에 있습니다
        </a>
      </p>
    </div>
  )
}
