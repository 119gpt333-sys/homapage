import { useCallback, useEffect, useState } from 'react'
import {
  Eye,
  PenLine,
  ArrowRight,
  Pin,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import type { KnowledgePost, CategoryCode } from '../types/knowledge'
import { fetchPostsByCategory, fetchKnowledgeStats, type KnowledgeStats } from '../lib/supabaseClient'
import { LinkifyText } from '../lib/linkifyText'
import { DeleteConfirmModal } from '../components/DeleteConfirmModal'

const categories: {
  code: CategoryCode | 'ALL'
  label: string
}[] = [
  { code: 'ALL', label: '전체' },
  { code: 'AI_UTIL', label: 'AI 활용' },
  { code: 'LECTURE', label: '강의신청' },
  { code: 'BOARD', label: '자유게시판' },
  { code: 'RESEARCH', label: '연구자료' },
  { code: 'BOOK', label: '추천도서' },
  { code: 'YOUTUBE', label: '필독 유튜브' },
]

function getCategoryLabel(code: CategoryCode): string {
  return categories.find((c) => c.code === code)?.label ?? code
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

  const updateStats = useCallback(async () => {
    const st = await fetchKnowledgeStats()
    setKnowledgeStats(st)
  }, [])

  useEffect(() => {
    void updateStats()
  }, [location.search, updateStats])

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

  return (
    <div className="space-y-8">
      {/* -- Intro -- */}
      <section className="pt-2">
        <h1
          className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          서울소방 GPT 지식 아카이브
        </h1>
        <p className="mt-2 text-base text-zinc-500 dark:text-zinc-400">
          AI 활용 · 강의 · 연구자료 · 추천도서 — 현장에서 필요한 지식을 한곳에서
        </p>
        <div className="mt-3 flex items-center gap-4">
          {knowledgeStats && (
            <p className="text-sm tabular-nums text-zinc-400 dark:text-zinc-500">
              {knowledgeStats.totalPosts} Posts · {knowledgeStats.categoryCount} Topics · {knowledgeStats.totalViews} Views
            </p>
          )}
          <Link
            to="/write"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <PenLine className="h-3.5 w-3.5" />
            글쓰기
          </Link>
        </div>
      </section>

      {/* -- Category Tabs -- */}
      <section>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="카테고리">
          {categories.map((cat) => {
            const active = selected === cat.code
            return (
              <button
                key={cat.code}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelected(cat.code)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* -- Pinned Notices -- */}
      {noticePosts.length > 0 && (
        <section>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {noticePosts.map((post) => (
              <Link
                key={post.id}
                to={`/post/${post.id}`}
                className="group flex items-center gap-3 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <Pin className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {post.title}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                  {new Date(post.created_at).toLocaleDateString('ko-KR')}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* -- Post List -- */}
      <section>
        {loading ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse py-5">
                <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="mt-2 h-5 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="mt-2 h-4 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="mt-2 h-3 w-1/3 rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
            {new URLSearchParams(location.search).get('q')?.trim() ? (
              <>
                <p className="text-base font-medium text-zinc-600 dark:text-zinc-400">검색 결과가 없습니다.</p>
                <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">다른 검색어나 카테고리를 선택해 보세요.</p>
              </>
            ) : (
              <>
                <p className="text-base font-medium text-zinc-600 dark:text-zinc-400">등록된 글이 없습니다.</p>
                <Link
                  to="/write"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-zinc-900 dark:text-white"
                >
                  첫 글을 작성해 보세요
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {posts.map((post, idx) => (
              <article
                key={post.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/post/${post.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/post/${post.id}`)}
                className="post-card-enter group cursor-pointer px-1 py-5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                style={{ animationDelay: `${Math.min(idx, 12) * 40}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {getCategoryLabel(post.category)}
                  </span>
                  <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {post.title}
                  </h3>
                  {/* Edit/Delete — visible on hover */}
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Link
                      to={`/post/${post.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                      title="수정"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDeletePostId(post.id) }}
                      className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                      title="삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {post.summary?.trim() && (
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                    <LinkifyText>{post.summary}</LinkifyText>
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                  <span>{post.author_display_name || '익명'}</span>
                  <span>·</span>
                  <span className="tabular-nums">{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-0.5">
                    <Eye className="h-3 w-3" />
                    {post.view_count ?? 0}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
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
            void updateStats()
          }}
        />
      )}
    </div>
  )
}
