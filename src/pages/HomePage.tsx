import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  Bell,
  Eye,
  Brain,
  GraduationCap,
  FlaskConical,
  BookOpen,
  PlayCircle,
  MessageCircle,
  PenLine,
  ArrowRight,
  Flame,
  LayoutGrid,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import type { KnowledgePost, CategoryCode } from '../types/knowledge'
import { fetchPostsByCategory, fetchKnowledgeStats, type KnowledgeStats } from '../lib/supabaseClient'
import { StatsSection } from '../components/StatsSection'
import { LinkifyText } from '../lib/linkifyText'
import { DeleteConfirmModal } from '../components/DeleteConfirmModal'

/** 공지 행 배지: 최근 7일 NEW, 조회수 높으면 HOT (NEW 우선) */
function getNoticeBadge(post: KnowledgePost): 'NEW' | 'HOT' | null {
  const ageDays = (Date.now() - new Date(post.created_at).getTime()) / 86_400_000
  if (ageDays <= 7) return 'NEW'
  if ((post.view_count ?? 0) >= 40) return 'HOT'
  return null
}

const heroVisualCategories: {
  code: CategoryCode
  label: string
  icon: React.ReactNode
}[] = [
  { code: 'AI_UTIL', label: 'AI 활용', icon: <Brain className="h-7 w-7" strokeWidth={2} /> },
  { code: 'LECTURE', label: '강의신청', icon: <GraduationCap className="h-7 w-7" strokeWidth={2} /> },
  { code: 'RESEARCH', label: '연구자료', icon: <FlaskConical className="h-7 w-7" strokeWidth={2} /> },
  { code: 'BOOK', label: '추천도서', icon: <BookOpen className="h-7 w-7" strokeWidth={2} /> },
]

const categories: {
  code: CategoryCode | 'ALL'
  label: string
  description: string
  icon: React.ReactNode
  color: string
}[] = [
  { code: 'ALL', label: '전체', description: '서울소방 지식 전체 보기', icon: <LayoutGrid className="h-4 w-4 shrink-0" strokeWidth={2.25} />, color: '#ef4444' },
  { code: 'AI_UTIL', label: 'AI 활용', description: 'AI 도구·활용 사례', icon: <Brain className="h-4 w-4 shrink-0" strokeWidth={2.25} />, color: '#22d3ee' },
  { code: 'LECTURE', label: '강의신청', description: '교육·훈련·강의', icon: <GraduationCap className="h-4 w-4 shrink-0" strokeWidth={2.25} />, color: '#a78bfa' },
  { code: 'BOARD', label: '자유게시판', description: '현장 노하우·자유 토론', icon: <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={2.25} />, color: '#94a3b8' },
  { code: 'RESEARCH', label: '연구자료', description: '통계·분석·연구', icon: <FlaskConical className="h-4 w-4 shrink-0" strokeWidth={2.25} />, color: '#f472b6' },
  { code: 'BOOK', label: '추천도서', description: '꼭 읽어야 할 도서', icon: <BookOpen className="h-4 w-4 shrink-0" strokeWidth={2.25} />, color: '#f97316' },
  { code: 'YOUTUBE', label: '필독 유튜브', description: '중요 교육·훈련 영상', icon: <PlayCircle className="h-4 w-4 shrink-0" strokeWidth={2.25} />, color: '#ef4444' },
]

function getCategoryCardUi(category: CategoryCode): { badge: string; thumbBg: string; icon: ReactNode } {
  const iconCls = 'h-14 w-14 shrink-0 opacity-40'
  switch (category) {
    case 'AI_UTIL':
      return {
        badge: 'text-violet-400 bg-violet-500/15',
        thumbBg: 'bg-violet-600/35',
        icon: <Brain className={iconCls} strokeWidth={1.5} />,
      }
    case 'LECTURE':
      return {
        badge: 'text-yellow-400 bg-yellow-500/15',
        thumbBg: 'bg-yellow-600/30',
        icon: <GraduationCap className={iconCls} strokeWidth={1.5} />,
      }
    case 'BOARD':
      return {
        badge: 'text-blue-400 bg-blue-500/15',
        thumbBg: 'bg-blue-600/35',
        icon: <MessageCircle className={iconCls} strokeWidth={1.5} />,
      }
    case 'RESEARCH':
      return {
        badge: 'text-green-400 bg-green-500/15',
        thumbBg: 'bg-green-600/35',
        icon: <FlaskConical className={iconCls} strokeWidth={1.5} />,
      }
    case 'BOOK':
      return {
        badge: 'text-pink-400 bg-pink-500/15',
        thumbBg: 'bg-pink-600/35',
        icon: <BookOpen className={iconCls} strokeWidth={1.5} />,
      }
    case 'YOUTUBE':
      return {
        badge: 'text-red-400 bg-red-500/15',
        thumbBg: 'bg-red-600/35',
        icon: <PlayCircle className={iconCls} strokeWidth={1.5} />,
      }
    default:
      return {
        badge: 'text-zinc-400 bg-zinc-500/15',
        thumbBg: 'bg-zinc-600/35',
        icon: <LayoutGrid className={iconCls} strokeWidth={1.5} />,
      }
  }
}

/** 대시보드 탭 배지용 — NOTICE 제외한 글만 집계 */
type TabCountKey = CategoryCode | 'ALL'

function computeTabCountsFromRows(rows: KnowledgePost[]): Record<TabCountKey, number> {
  const byCategory: Partial<Record<CategoryCode, number>> = {}
  for (const p of rows) {
    byCategory[p.category] = (byCategory[p.category] ?? 0) + 1
  }
  const counts = {} as Record<TabCountKey, number>
  counts.ALL = rows.length
  for (const cat of categories) {
    if (cat.code !== 'ALL') counts[cat.code] = byCategory[cat.code] ?? 0
  }
  return counts
}

export function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selected, setSelected] = useState<CategoryCode | 'ALL'>('ALL')
  const [posts, setPosts] = useState<KnowledgePost[]>([])
  const [noticePosts, setNoticePosts] = useState<KnowledgePost[]>([])
  const [loading, setLoading] = useState(false)
  const [deletePostId, setDeletePostId] = useState<string | null>(null)
  const [knowledgeStats, setKnowledgeStats] = useState<KnowledgeStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [tabCounts, setTabCounts] = useState<Record<TabCountKey, number> | null>(null)

  /** 공지 제외 전체 글을 다시 불러와 탭 배지 숫자 갱신 (삭제·외부 갱신 후 호출) */
  const updateTabCounts = useCallback(async () => {
    const rows = await fetchPostsByCategory(undefined, { excludeCategories: ['NOTICE'] })
    setTabCounts(computeTabCountsFromRows(rows))
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setStatsLoading(true)
      const st = await fetchKnowledgeStats()
      if (!cancelled) {
        setKnowledgeStats(st)
        setStatsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [location.search])

  useEffect(() => {
    void updateTabCounts()
  }, [location.search, updateTabCounts])

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
      const q = new URLSearchParams(location.search).get('q')?.trim() ?? ''
      const data = await fetchPostsByCategory(
        selected === 'ALL' ? undefined : selected,
        {
          excludeCategories: selected === 'ALL' ? ['NOTICE'] : undefined,
          search: q || undefined,
        },
      )
      if (!cancelled) { setPosts(data); setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [selected, location.search])

  const scrollToDashboard = () => {
    document.getElementById('content-dashboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-6">
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] px-6 py-10 md:px-10 md:py-14"
        style={{ background: 'var(--color-card)' }}
      >
        {/* 빨간 glow (radial + blur) */}
        <div
          className="pointer-events-none absolute left-[55%] top-1/2 h-[min(120%,520px)] w-[min(90vw,640px)] -translate-x-1/2 -translate-y-1/2 blur-[80px] md:left-[65%] md:blur-[100px]"
          style={{
            background: 'radial-gradient(ellipse at center, rgb(220 38 38) 0%, transparent 68%)',
            opacity: 0.08,
          }}
          aria-hidden
        />

        <div className="relative z-10 grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          {/* 좌측: 카피 + CTA */}
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-500">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              AI 시대를 선도하는 서울소방 GPT
            </div>

            <h1
              className="mt-5 text-balance text-[2.45rem] font-bold leading-[1.12] tracking-tight sm:text-5xl md:text-6xl lg:text-[3.35rem]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {/* 좁은 창(절반 등): 4줄 */}
              <span className="block xl:hidden">
                <span className="block text-[var(--color-text-primary)]">서울소방</span>
                <span className="mt-0.5 block text-[var(--color-text-primary)] sm:mt-1">GPT의</span>
                <span className="mt-1 block text-red-500 sm:mt-1.5">AI 지식</span>
                <span className="mt-0.5 block text-red-500 sm:mt-1">아카이브</span>
              </span>
              {/* 넓은 화면(xl+): 2줄 */}
              <span className="hidden xl:block">
                <span className="block text-[var(--color-text-primary)]">서울소방 GPT의</span>
                <span className="mt-1 block text-red-500 sm:mt-1.5">AI 지식 아카이브</span>
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-[1.65] text-[var(--color-text-secondary)] md:mt-6 md:text-xl md:leading-relaxed">
              AI 활용·강의·연구자료·추천도서까지 — 현장과 사무실에서 필요한 지식을 한곳에서 탐색하고 기록하세요.
            </p>

            <div className="mt-8">
              <Link
                to="/write"
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-red-500"
              >
                글쓰기
                <PenLine className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          {/* 우측: 플로팅 카드 4 */}
          <div className="grid grid-cols-2 gap-4 md:gap-5">
            {heroVisualCategories.map((item) => {
              const meta = categories.find((c) => c.code === item.code)
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setSelected(item.code)
                    scrollToDashboard()
                  }}
                  className="flex flex-col items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  <span className="shrink-0 [&>svg]:text-current" style={{ color: meta?.color ?? 'var(--color-accent)' }} aria-hidden>
                    {item.icon}
                  </span>
                  <span className="text-base font-semibold md:text-lg">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 공지사항 ── */}
      {noticePosts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 shrink-0 text-red-500" strokeWidth={2} aria-hidden />
            <h2
              className="text-xl font-bold tracking-tight md:text-2xl"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
            >
              공지사항
            </h2>
          </div>

          <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            {noticePosts.map((post) => {
              const handleClick = () => navigate(`/post/${post.id}`)
              const badge = getNoticeBadge(post)
              return (
                <div
                  key={post.id}
                  role="button"
                  tabIndex={0}
                  onClick={handleClick}
                  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
                  className="notice-board-row flex cursor-pointer items-center justify-between gap-4 border-b border-white/5 px-5 py-4 transition-colors last:border-b-0"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {badge === 'NEW' && (
                      <span className="shrink-0 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-500">
                        NEW
                      </span>
                    )}
                    {badge === 'HOT' && (
                      <span className="shrink-0 rounded-full bg-orange-400/15 px-2.5 py-0.5 text-xs font-bold text-orange-400">
                        HOT
                      </span>
                    )}
                    <span className="truncate text-lg font-semibold text-[var(--color-text-primary)] md:text-xl">{post.title}</span>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeletePostId(post.id)
                      }}
                      className="rounded p-1.5 text-red-500 opacity-70 transition-opacity hover:opacity-100"
                      title="삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4 shrink-0" aria-hidden />
                        조회 {post.view_count ?? 0}
                      </span>
                      <span className="tabular-nums">{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <StatsSection stats={knowledgeStats} loading={statsLoading} />

      {/* ── 콘텐츠 대시보드 ── */}
      <section
        id="content-dashboard"
        className="dashboard-section scroll-mt-28 rounded-2xl p-5"
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
                className="text-lg font-bold tracking-tight md:text-xl"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
              >
                콘텐츠 대시보드
              </h2>
              <p className="text-sm md:text-base" style={{ color: 'var(--color-text-muted)' }}>
                AI 활용·강의·자유게시판·연구자료
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3" role="tablist" aria-label="콘텐츠 카테고리">
          {/* 1행: 전체 · AI 활용 · 강의신청 · 자유게시판 */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            {categories.slice(0, 4).map((cat) => {
              const active = selected === cat.code
              const count = tabCounts !== null ? tabCounts[cat.code] : null
              return (
                <button
                  key={cat.code}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={
                    count === null ? cat.label : `${cat.label} ${count}건`
                  }
                  onClick={() => setSelected(cat.code)}
                  className={`flex w-full min-h-[3rem] items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition sm:min-h-0 sm:rounded-full sm:px-4 sm:py-3 sm:text-base md:px-5 [&_svg]:h-5 [&_svg]:w-5 ${
                    active
                      ? 'border-red-600 bg-red-600 text-white shadow-[0_4px_20px_rgba(220,38,38,0.25)]'
                      : 'border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-border)] hover:text-[var(--color-text-secondary)]'
                  }`}
                >
                  <span
                    className="inline-flex shrink-0 [&>svg]:text-current"
                    style={active ? undefined : { color: cat.color }}
                  >
                    {cat.icon}
                  </span>
                  <span className="inline-flex min-w-0 flex-wrap items-center justify-center gap-x-1 gap-y-0.5 text-center">
                    <span className="whitespace-nowrap">{cat.label}</span>
                    <span
                      className={`tab-count min-w-[1.5rem] rounded-full px-[0.4rem] py-[0.1rem] text-center text-xs font-semibold tabular-nums ${
                        active
                          ? 'bg-white/25 text-white ring-1 ring-white/35'
                          : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      {count === null ? '·' : count}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
          {/* 2행: 연구자료 · 추천도서 · 필독 유튜브 */}
          <div className="grid grid-cols-2 gap-2.5 sm:mx-auto sm:grid-cols-3 sm:gap-3 sm:max-w-4xl sm:w-full">
            {categories.slice(4).map((cat, idx) => {
              const active = selected === cat.code
              const count = tabCounts !== null ? tabCounts[cat.code] : null
              const row2Third = idx === 2
              return (
                <button
                  key={cat.code}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={
                    count === null ? cat.label : `${cat.label} ${count}건`
                  }
                  onClick={() => setSelected(cat.code)}
                  className={`flex min-h-[3rem] items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition sm:min-h-0 sm:w-full sm:rounded-full sm:px-4 sm:py-3 sm:text-base md:px-5 [&_svg]:h-5 [&_svg]:w-5 ${
                    row2Third ? 'col-span-2 w-full max-w-xs justify-self-center sm:col-span-1 sm:max-w-none sm:justify-self-stretch' : 'w-full'
                  } ${
                    active
                      ? 'border-red-600 bg-red-600 text-white shadow-[0_4px_20px_rgba(220,38,38,0.25)]'
                      : 'border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-border)] hover:text-[var(--color-text-secondary)]'
                  }`}
                >
                  <span
                    className="inline-flex shrink-0 [&>svg]:text-current"
                    style={active ? undefined : { color: cat.color }}
                  >
                    {cat.icon}
                  </span>
                  <span className="inline-flex min-w-0 flex-wrap items-center justify-center gap-x-1 gap-y-0.5 text-center">
                    <span className="whitespace-nowrap">{cat.label}</span>
                    <span
                      className={`tab-count min-w-[1.5rem] rounded-full px-[0.4rem] py-[0.1rem] text-center text-xs font-semibold tabular-nums ${
                        active
                          ? 'bg-white/25 text-white ring-1 ring-white/35'
                          : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      {count === null ? '·' : count}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Post Cards ── */}
      <section>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)]"
              >
                <div className="aspect-video bg-[var(--color-surface-3)]" />
                <div className="space-y-3 p-4">
                  <div className="h-5 w-14 rounded-full bg-[var(--color-surface-3)]" />
                  <div className="h-4 w-full rounded bg-[var(--color-surface-3)]" />
                  <div className="h-3 w-full rounded bg-[var(--color-surface-3)]" />
                  <div className="h-3 w-2/3 rounded bg-[var(--color-surface-3)]" />
                </div>
              </div>
            ))
          ) : posts.length === 0 ? (
            <div
              className="col-span-full rounded-xl border border-dashed border-[var(--color-border-hover)] bg-[var(--color-surface)] p-10 text-center"
            >
              <Flame className="mx-auto mb-3 h-10 w-10 text-[var(--color-text-muted)]" />
              {new URLSearchParams(location.search).get('q')?.trim() ? (
                <>
                  <p className="text-base font-medium text-[var(--color-text-secondary)]">검색 결과가 없습니다.</p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">다른 검색어나 카테고리를 선택해 보세요.</p>
                </>
              ) : (
                <>
                  <p className="text-base font-medium text-[var(--color-text-secondary)]">등록된 지식 카드가 없습니다.</p>
                  <Link
                    to="/write"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-accent-light)]"
                  >
                    첫 지식을 기록해 보세요
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </>
              )}
            </div>
          ) : (
            posts.map((post, idx) => {
              const cat = categories.find((c) => c.code === post.category)
              const ui = getCategoryCardUi(post.category)
              const thumbSrc = post.thumbnail_url ?? post.image_urls?.[0]
              const handleClick = () => navigate(`/post/${post.id}`)
              return (
                <div
                  key={post.id}
                  role="button"
                  tabIndex={0}
                  onClick={handleClick}
                  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
                  className="post-card-enter flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] transition-all hover:-translate-y-1 hover:shadow-lg"
                  style={{ animationDelay: `${Math.min(idx, 12) * 45}ms` }}
                >
                  <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-black/20">
                    {thumbSrc ? (
                      <img src={thumbSrc} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div
                        className={`flex h-full w-full items-center justify-center ${ui.thumbBg}`}
                      >
                        {ui.icon}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ui.badge}`}
                      >
                        {cat?.label ?? post.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/post/${post.id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-0.5 rounded-md border border-red-600/40 bg-red-600 px-1.5 py-0.5 text-[9px] font-medium text-white hover:bg-red-500"
                        >
                          <Pencil className="h-2.5 w-2.5" />
                          수정
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeletePostId(post.id)
                          }}
                          className="flex items-center gap-0.5 rounded-md border border-red-700 bg-red-700 px-1.5 py-0.5 text-[9px] font-medium text-white hover:bg-red-600"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                          삭제
                        </button>
                      </div>
                    </div>

                    <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-[var(--color-text-primary)] md:text-xl md:leading-snug">
                      {post.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-secondary)] md:text-base">
                      <LinkifyText>{post.summary}</LinkifyText>
                    </p>

                    <div className="post-card-footer mt-auto flex items-center justify-between border-t border-white/5 pt-3 text-sm text-[var(--color-text-muted)]">
                      <span className="flex min-w-0 items-center gap-1 truncate">
                        <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{post.author_display_name || '익명 기여'}</span>
                        <span className="shrink-0">· 조회 {post.view_count ?? 0}</span>
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {new Date(post.created_at).toLocaleDateString('ko-KR')}
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
            void fetchKnowledgeStats().then(setKnowledgeStats)
            void updateTabCounts()
          }}
        />
      )}
    </div>
  )
}
