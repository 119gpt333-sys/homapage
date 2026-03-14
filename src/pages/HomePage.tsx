import { useEffect, useState, useCallback } from 'react'
import {
  Flame,
  LayoutGrid,
  ArrowRight,
  GraduationCap,
  Bell,
  MessageSquare,
  FlaskConical,
  Sparkles,
  Pencil,
  Trash2,
  BookOpen,
  Youtube,
} from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import type { KnowledgePost, CategoryCode } from '../types/knowledge'
import { fetchPostsByCategory } from '../lib/supabaseClient'
import { LinkifyText } from '../lib/linkifyText'
import { DeleteConfirmModal } from '../components/DeleteConfirmModal'

function CategoryPill({
  cat,
  selected,
  onClick,
  style,
}: {
  cat: { code: CategoryCode | 'ALL'; label: string; icon: React.ReactNode; color: string }
  selected: boolean
  onClick: () => void
  style?: React.CSSProperties
}) {
  const [ripple, setRipple] = useState(false)
  const [ripplePos, setRipplePos] = useState({ x: 50, y: 50 })

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setRipplePos({ x, y })
      setRipple(true)
      onClick()
      setTimeout(() => setRipple(false), 500)
    },
    [onClick],
  )

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`dashboard-btn flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${ripple ? 'ripple' : ''}`}
      style={{
        ...style,
        '--ripple-x': `${ripplePos.x}%`,
        '--ripple-y': `${ripplePos.y}%`,
        background: selected ? 'var(--color-accent)' : 'var(--color-surface)',
        color: selected ? '#fff' : 'var(--color-text-secondary)',
        border: selected ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
        boxShadow: selected ? '0 4px 16px rgba(220,38,38,0.3)' : '0 1px 3px rgba(0,0,0,0.2)',
      } as React.CSSProperties}
    >
      <span
        className="inline-flex shrink-0 [&>svg]:text-current"
        style={{ color: selected ? '#fff' : cat.color }}
      >
        {cat.icon}
      </span>
      {cat.label}
    </button>
  )
}

const noticeCategory = { code: 'NOTICE' as const, label: '공지사항', color: '#fbbf24', icon: <Bell size={18} strokeWidth={2.5} /> }

const categories: {
  code: CategoryCode | 'ALL'
  label: string
  description: string
  icon: React.ReactNode
  color: string
}[] = [
  { code: 'ALL', label: '전체', description: '서울소방 지식 전체 보기', icon: <LayoutGrid size={18} strokeWidth={2.5} />, color: '#ef4444' },
  { code: 'AI_UTIL', label: 'AI 활용', description: 'AI 도구·활용 사례', icon: <Sparkles size={18} strokeWidth={2.5} />, color: '#22d3ee' },
  { code: 'LECTURE', label: '강의신청', description: '교육·훈련·강의', icon: <GraduationCap size={18} strokeWidth={2.5} />, color: '#a78bfa' },
  { code: 'BOARD', label: '자유게시판', description: '현장 노하우·자유 토론', icon: <MessageSquare size={18} strokeWidth={2.5} />, color: '#94a3b8' },
  { code: 'RESEARCH', label: '연구자료', description: '통계·분석·연구', icon: <FlaskConical size={18} strokeWidth={2.5} />, color: '#f472b6' },
  { code: 'BOOK', label: '추천도서', description: '꼭 읽어야 할 도서', icon: <BookOpen size={18} strokeWidth={2.5} />, color: '#f97316' },
  { code: 'YOUTUBE', label: '필독 유튜브', description: '중요 교육·훈련 영상', icon: <Youtube size={18} strokeWidth={2.5} />, color: '#ef4444' },
]

export function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selected, setSelected] = useState<CategoryCode | 'ALL'>('ALL')
  const [posts, setPosts] = useState<KnowledgePost[]>([])
  const [noticePosts, setNoticePosts] = useState<KnowledgePost[]>([])
  const [loading, setLoading] = useState(false)
  const [deletePostId, setDeletePostId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const data = await fetchPostsByCategory('NOTICE')
      if (!cancelled) setNoticePosts(data)
    })()
    return () => { cancelled = true }
  }, [location.search])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const data = await fetchPostsByCategory(
        selected === 'ALL' ? undefined : selected,
        selected === 'ALL' ? { excludeCategories: ['NOTICE'] } : undefined
      )
      if (!cancelled) { setPosts(data); setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [selected, location.search])

  return (
    <div className="space-y-6">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-2xl" style={{
        border: '1px solid var(--color-border)',
        minHeight: 260,
      }}>
        {/* Background fire image */}
        <img
          src="/hero-fire.png"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.45 }}
        />
        {/* Gradient overlay for text readability */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(5,5,5,0.92) 35%, rgba(5,5,5,0.55) 65%, rgba(5,5,5,0.3) 100%)' }} />

        <div className="relative z-10 px-6 py-6 md:px-10 md:py-10">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
            style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.25)', color: '#f87171' }}>
            <Flame className="h-3.5 w-3.5" />
            AI 시대를 선도하는 서울소방GPT
          </div>

          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight md:text-4xl"
            style={{ fontFamily: 'var(--font-heading)', color: '#fff' }}>
            서울소방 GPT의
            <br />
            <span style={{ color: '#f87171' }}>AI 지식 아카이브</span>
          </h1>

          <p className="mt-2 max-w-lg text-xs leading-relaxed md:text-sm"
            style={{ color: 'rgba(255,255,255,0.75)' }}>
            AI 활용·강의·자유게시판·연구자료를 한곳에서 탐색하세요.
          </p>

          <div className="mt-4">
            <Link
              to="/write"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
              style={{ background: 'var(--color-accent)', boxShadow: '0 4px 24px rgba(220,38,38,0.4)' }}
            >
              글쓰기
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 공지사항 (항상 상단 고정) ── */}
      {noticePosts.length > 0 && (
        <section
          className="rounded-2xl p-5"
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 20px rgba(0,0,0,0.2)',
          }}
        >
          <div className="mb-4 flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0.08) 100%)',
                border: '1px solid rgba(251,191,36,0.2)',
              }}
            >
              <Bell className="h-4 w-4" style={{ color: noticeCategory.color }} />
            </div>
            <div>
              <h2
                className="text-base font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
              >
                공지사항
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                서울소방GPT 주요안내
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {noticePosts.map((post) => {
              const handleClick = () => navigate(`/post/${post.id}`)
              return (
                <div
                  key={post.id}
                  role="button"
                  tabIndex={0}
                  onClick={handleClick}
                  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-1.5 transition-all hover:opacity-90"
                  style={{
                    background: 'rgba(251,191,36,0.08)',
                    border: '1px solid rgba(251,191,36,0.2)',
                  }}
                >
                  <span className="line-clamp-1 flex-1 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {post.title}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDeletePostId(post.id) }}
                      className="rounded p-1 opacity-60 transition-opacity hover:opacity-100"
                      style={{ color: '#dc2626' }}
                      title="삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(post.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── 콘텐츠 대시보드 ── */}
      <section
        className="dashboard-section rounded-2xl p-5"
        style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.2)',
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(220,38,38,0.2) 0%, rgba(220,38,38,0.08) 100%)',
                border: '1px solid rgba(220,38,38,0.2)',
              }}
            >
              <LayoutGrid className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
            </div>
            <div>
              <h2
                className="text-base font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
              >
                콘텐츠 대시보드
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                AI 활용·강의·자유게시판·연구자료
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {categories.map((cat, idx) => (
            <CategoryPill
              key={cat.code}
              cat={cat}
              selected={selected === cat.code}
              onClick={() => setSelected(cat.code)}
              style={{ animationDelay: `${idx * 40}ms` }}
            />
          ))}
        </div>
      </section>

      {/* ── Post Cards ── */}
      <section>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl p-5"
                style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
                <div className="mb-3 h-5 w-20 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="mb-2 h-5 w-3/4 rounded" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <div className="mb-4 h-12 w-full rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
                <div className="h-3 w-1/3 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="col-span-full rounded-2xl p-10 text-center"
              style={{ background: 'var(--color-card)', border: '1px dashed var(--color-border-hover)' }}>
              <Flame className="mx-auto mb-3 h-10 w-10" style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                등록된 지식 카드가 없습니다.
              </p>
              <Link to="/write" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: 'var(--color-accent-light)' }}>
                첫 지식을 기록해 보세요
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            posts.map((post) => {
              const cat = categories.find(c => c.code === post.category)
              const handleClick = () => navigate(`/post/${post.id}`)
              return (
                <div
                  key={post.id}
                  role="button"
                  tabIndex={0}
                  onClick={handleClick}
                  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
                  className="group flex cursor-pointer flex-col rounded-2xl overflow-hidden transition-all duration-200 glass-hover"
                  style={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {(post.thumbnail_url || (post.image_urls && post.image_urls[0])) && (
                    <div className="aspect-video w-full shrink-0 overflow-hidden" style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <img
                        src={post.thumbnail_url ?? post.image_urls?.[0]}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md px-2 py-0.5 text-xs font-semibold"
                      style={{ background: `${cat?.color ?? '#dc2626'}18`, color: cat?.color ?? '#dc2626' }}>
                      {cat?.label ?? post.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/post/${post.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium transition-all hover:opacity-90"
                        style={{
                          color: '#fff',
                          background: 'var(--color-accent)',
                          border: '1px solid var(--color-accent)',
                          boxShadow: '0 1px 2px rgba(220,38,38,0.3)',
                        }}
                      >
                        <Pencil className="h-2.5 w-2.5" />
                        수정
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeletePostId(post.id) }}
                        className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium transition-all hover:opacity-90"
                        style={{
                          color: '#fff',
                          background: '#dc2626',
                          border: '1px solid #dc2626',
                        }}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                        삭제
                      </button>
                      <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        {new Date(post.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>

                  <h3 className="mt-3 line-clamp-2 rounded-xl border-2 px-4 py-3 text-xl font-bold leading-snug md:text-2xl"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      color: 'var(--color-text-primary)',
                      borderColor: 'var(--color-border)',
                      background: 'rgba(255,255,255,0.05)',
                    }}>
                    {post.title}
                  </h3>

                  <p className="mt-2 line-clamp-3 flex-1 text-[13px] leading-relaxed"
                    style={{ color: 'var(--color-text-secondary)' }}>
                    <LinkifyText>{post.summary}</LinkifyText>
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t pt-3"
                    style={{ borderColor: 'var(--color-border)' }}>
                    <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                      {post.author_display_name || '익명 기여'}
                      {post.view_count != null ? ` · 조회 ${post.view_count}` : ''}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium transition-colors group-hover:underline"
                      style={{ color: 'var(--color-accent-light)' }}>
                      자세히 보기
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {deletePostId && (
        <DeleteConfirmModal
          open={!!deletePostId}
          onClose={() => setDeletePostId(null)}
          postId={deletePostId}
          postTitle={posts.find((p) => p.id === deletePostId)?.title ?? noticePosts.find((p) => p.id === deletePostId)?.title}
          onDeleted={() => {
            setPosts((prev) => prev.filter((p) => p.id !== deletePostId))
            setNoticePosts((prev) => prev.filter((p) => p.id !== deletePostId))
            setDeletePostId(null)
          }}
        />
      )}
    </div>
  )
}
