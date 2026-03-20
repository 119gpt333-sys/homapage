import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { KnowledgePost, PostComment } from '../types/knowledge'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// 배포 환경에서 환경 변수 누락 시 콘솔에 진단 출력
if (import.meta.env.PROD && typeof window !== 'undefined') {
  const hasUrl = !!SUPABASE_URL
  const hasKey = !!SUPABASE_ANON_KEY
  if (!hasUrl || !hasKey) {
    console.warn(
      '[Supabase] 환경 변수 누락:',
      { VITE_SUPABASE_URL: hasUrl ? '설정됨' : '없음', VITE_SUPABASE_ANON_KEY: hasKey ? '설정됨' : '없음' },
      '→ Vercel Settings → Environment Variables에서 추가 후 Redeploy'
    )
  }
}

const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
    : null

export function getSupabase(): SupabaseClient | null {
  return supabase
}

function isLocal(): boolean {
  return !supabase
}

/** Supabase 연동 상태 */
export function getSupabaseStatus(): { connected: boolean } {
  return { connected: !!supabase }
}

/** Supabase 실제 연결 테스트 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: '환경 변수가 설정되지 않았습니다.' }
  try {
    const { error } = await supabase.from('knowledge_posts').select('id').limit(1)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : '연결 실패' }
  }
}

// ─── localStorage fallback ───

const STORAGE_KEY = 'seoul-fire-gpt-posts'
const HIDDEN_SAMPLES_KEY = 'seoul-fire-gpt-hidden-samples'

const SAMPLE_POSTS: KnowledgePost[] = [
  {
    id: 'sample-notice-1',
    title: '4월 정기모임 안내',
    category: 'NOTICE',
    summary: '2025년 4월 정기모임 일정 및 참가 방법을 안내합니다.',
    content_markdown: '## 4월 정기모임\n\n일시: 2025년 4월 중\n장소: 서울소방재난본부\n\n참가 신청은 내부 공지문을 확인해 주세요.',
    thumbnail_url: null,
    image_urls: null,
    author_display_name: '서울소방',
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sample-ai-1',
    title: 'AI 활용 가이드 - 화재 현장 보고서 작성',
    category: 'AI_UTIL',
    summary: 'AI를 활용해 화재 현장 보고서를 빠르고 정확하게 작성하는 방법을 소개합니다.',
    content_markdown: '## AI 활용 개요\n\n현장에서 수집한 정보를 AI 도구에 입력하면 보고서 초안이 자동 생성됩니다.\n\n※ 최종 검토 후 제출하세요.',
    thumbnail_url: null,
    image_urls: null,
    author_display_name: null,
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sample-lecture-1',
    title: '소방안전교육 강의 신청 방법',
    category: 'LECTURE',
    summary: '주민 대상 소방안전교육 강의 신청 절차와 유의사항을 안내합니다.',
    content_markdown: '## 강의 신청\n\n1. 담당 부서로 문의\n2. 희망 일정 협의\n3. 신청서 제출',
    thumbnail_url: null,
    image_urls: null,
    author_display_name: null,
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

function getLocalPosts(): KnowledgePost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as KnowledgePost[]) : []
  } catch {
    return []
  }
}

function getHiddenSampleIds(): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_SAMPLES_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function addHiddenSampleId(id: string) {
  const ids = getHiddenSampleIds()
  if (!ids.includes(id)) {
    localStorage.setItem(HIDDEN_SAMPLES_KEY, JSON.stringify([...ids, id]))
  }
}

/** localStorage 비어 있을 때만 표시용 샘플 반환 (저장하지 않음 - 기존 데이터 덮어쓰기 방지) */
function getLocalPostsOrSamples(): KnowledgePost[] {
  const posts = getLocalPosts()
  if (posts.length > 0) return posts
  const hidden = getHiddenSampleIds()
  return SAMPLE_POSTS.filter((p) => !hidden.includes(p.id))
}

function saveLocalPosts(posts: KnowledgePost[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
}

const VIEW_COUNT_OVERRIDES_KEY = 'seoul-fire-gpt-view-counts'

function getViewCountOverrides(): Record<string, number> {
  try {
    const raw = localStorage.getItem(VIEW_COUNT_OVERRIDES_KEY)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch {
    return {}
  }
}

function saveViewCountOverrides(map: Record<string, number>) {
  localStorage.setItem(VIEW_COUNT_OVERRIDES_KEY, JSON.stringify(map))
}

/** 로컬(샘플) 게시글 표시용 조회수 */
export function getDisplayViewCountForPost(post: KnowledgePost): number {
  if (!isLocal()) return post.view_count ?? 0
  const userPosts = getLocalPosts()
  if (userPosts.some((p) => p.id === post.id)) return post.view_count ?? 0
  const o = getViewCountOverrides()[post.id]
  return o !== undefined ? o : (post.view_count ?? 0)
}

function mergeLocalViewCounts(posts: KnowledgePost[]): KnowledgePost[] {
  return posts.map((p) => ({
    ...p,
    view_count: getDisplayViewCountForPost(p),
  }))
}

// ─── Image upload ───

export async function uploadImage(file: File): Promise<string> {
  if (isLocal()) {
    return URL.createObjectURL(file)
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `posts/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase!.storage
    .from('post-images')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) {
    console.error('[Supabase] uploadImage error', error)
    const msg = error.message || '이미지 업로드 실패'
    throw new Error(
      msg.includes('Bucket') || msg.includes('bucket')
        ? `Storage 버킷 'post-images'를 Supabase 대시보드에서 생성해 주세요. (${msg})`
        : msg
    )
  }

  const { data: urlData } = supabase!.storage
    .from('post-images')
    .getPublicUrl(path)

  return urlData.publicUrl
}

// ─── Posts API ───

export async function fetchPostsByCategory(
  category?: string,
  options?: { excludeCategories?: string[] }
): Promise<KnowledgePost[]> {
  if (isLocal()) {
    const posts = getLocalPostsOrSamples()
    let filtered = category && category !== 'ALL'
      ? posts.filter((p) => p.category === category)
      : posts
    if (options?.excludeCategories?.length) {
      filtered = filtered.filter((p) => !options.excludeCategories!.includes(p.category))
    }
    const sorted = filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    return mergeLocalViewCounts(sorted)
  }

  let query = supabase!
    .from('knowledge_posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (category && category !== 'ALL') {
    query = query.eq('category', category)
  } else if (options?.excludeCategories?.length) {
    for (const c of options.excludeCategories) {
      query = query.neq('category', c)
    }
  }

  const { data, error } = await query
  if (error) {
    console.error('[Supabase] fetchPostsByCategory error', error)
    return []
  }
  return (data ?? []) as KnowledgePost[]
}

export async function fetchPostById(id: string): Promise<KnowledgePost | null> {
  if (isLocal()) {
    const p = getLocalPostsOrSamples().find((x) => x.id === id) ?? null
    if (!p) return null
    return { ...p, view_count: getDisplayViewCountForPost(p) }
  }

  const { data, error } = await supabase!
    .from('knowledge_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[Supabase] fetchPostById error', error)
    return null
  }
  return data as KnowledgePost
}

/** 게시글 조회수 +1 (페이지 진입 시 1회). 새 조회수 반환. */
export async function incrementPostViewCount(postId: string): Promise<number | null> {
  if (isLocal()) {
    const posts = getLocalPosts()
    const idx = posts.findIndex((p) => p.id === postId)
    if (idx !== -1) {
      const next = Math.max(0, posts[idx].view_count ?? 0) + 1
      posts[idx] = { ...posts[idx], view_count: next }
      saveLocalPosts(posts)
      return next
    }
    const samples = SAMPLE_POSTS
    const sample = samples.find((p) => p.id === postId)
    if (sample) {
      const overrides = getViewCountOverrides()
      const base = sample.view_count ?? 0
      const prev = overrides[postId] ?? base
      const next = prev + 1
      overrides[postId] = next
      saveViewCountOverrides(overrides)
      return next
    }
    return null
  }

  const { error: rpcError } = await supabase!.rpc('increment_post_view_count', { p_post_id: postId })
  if (rpcError) {
    console.error('[Supabase] incrementPostViewCount rpc', rpcError)
    return null
  }
  const { data, error } = await supabase!
    .from('knowledge_posts')
    .select('view_count')
    .eq('id', postId)
    .single()
  if (error) {
    console.error('[Supabase] incrementPostViewCount select', error)
    return null
  }
  return (data as { view_count: number | null })?.view_count ?? null
}

// ─── Comments ───

const COMMENTS_STORAGE_KEY = 'seoul-fire-gpt-comments'

function getLocalCommentsMap(): Record<string, PostComment[]> {
  try {
    const raw = localStorage.getItem(COMMENTS_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, PostComment[]>) : {}
  } catch {
    return {}
  }
}

function saveLocalCommentsMap(map: Record<string, PostComment[]>) {
  localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(map))
}

export async function fetchComments(postId: string): Promise<PostComment[]> {
  if (isLocal()) {
    const list = getLocalCommentsMap()[postId] ?? []
    return [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }

  const { data, error } = await supabase!
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[Supabase] fetchComments', error)
    return []
  }
  return (data ?? []) as PostComment[]
}

export async function createComment(
  postId: string,
  body: string,
  authorDisplayName?: string | null
): Promise<PostComment> {
  const trimmed = body.trim()
  if (!trimmed) throw new Error('댓글 내용을 입력해 주세요.')
  if (trimmed.length > 4000) throw new Error('댓글은 4,000자 이하로 작성해 주세요.')

  if (isLocal()) {
    const map = getLocalCommentsMap()
    const list = map[postId] ?? []
    const row: PostComment = {
      id: crypto.randomUUID(),
      post_id: postId,
      body: trimmed,
      author_display_name: authorDisplayName?.trim() || null,
      created_at: new Date().toISOString(),
    }
    map[postId] = [...list, row]
    saveLocalCommentsMap(map)
    return row
  }

  const { data, error } = await supabase!
    .from('post_comments')
    .insert({
      post_id: postId,
      body: trimmed,
      author_display_name: authorDisplayName?.trim() || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[Supabase] createComment', error)
    throw new Error(error.message || '댓글 등록에 실패했습니다.')
  }
  return data as PostComment
}

interface CreatePostPayload {
  title: string
  category: KnowledgePost['category']
  summary: string
  content_markdown: string
  thumbnail_url?: string | null
  image_urls?: string[] | null
  author_display_name?: string | null
}

export async function createPost(payload: CreatePostPayload): Promise<KnowledgePost> {
  if (isLocal()) {
    const now = new Date().toISOString()
    const newPost: KnowledgePost = {
      id: crypto.randomUUID(),
      title: payload.title,
      category: payload.category,
      summary: payload.summary,
      content_markdown: payload.content_markdown,
      thumbnail_url: payload.thumbnail_url ?? null,
      image_urls: payload.image_urls ?? null,
      author_display_name: payload.author_display_name ?? null,
      view_count: 0,
      created_at: now,
      updated_at: now,
    }
    const posts = getLocalPosts()
    posts.unshift(newPost)
    saveLocalPosts(posts)
    return newPost
  }

  const { data, error } = await supabase!
    .from('knowledge_posts')
    .insert({ ...payload })
    .select('*')
    .single()

  if (error) {
    console.error('[Supabase] createPost error', error)
    throw new Error(error.message || '게시글 등록에 실패했습니다.')
  }
  return data as KnowledgePost
}

interface UpdatePostPayload {
  title?: string
  category?: KnowledgePost['category']
  summary?: string
  content_markdown?: string
  thumbnail_url?: string | null
  image_urls?: string[] | null
  author_display_name?: string | null
}

export async function updatePost(id: string, payload: UpdatePostPayload): Promise<KnowledgePost | null> {
  if (isLocal()) {
    const posts = getLocalPosts()
    const idx = posts.findIndex((p) => p.id === id)
    if (idx === -1) return null

    const now = new Date().toISOString()
    const updated: KnowledgePost = {
      ...posts[idx],
      ...payload,
      updated_at: now,
    }
    posts[idx] = updated
    saveLocalPosts(posts)
    return updated
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (payload.title !== undefined) updateData.title = payload.title
  if (payload.category !== undefined) updateData.category = payload.category
  if (payload.summary !== undefined) updateData.summary = payload.summary
  if (payload.content_markdown !== undefined) updateData.content_markdown = payload.content_markdown
  if (payload.thumbnail_url !== undefined) updateData.thumbnail_url = payload.thumbnail_url
  if (payload.image_urls !== undefined) updateData.image_urls = payload.image_urls
  if (payload.author_display_name !== undefined) updateData.author_display_name = payload.author_display_name

  const { data, error } = await supabase!
    .from('knowledge_posts')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('[Supabase] updatePost error', error)
    throw error
  }
  return data as KnowledgePost
}

// ─── Delete (관리자 전용, API 경유) ───

export async function deletePost(id: string, password: string): Promise<{ ok: boolean; error?: string }> {
  if (isLocal()) {
    const posts = getLocalPosts()
    const isSample = SAMPLE_POSTS.some((p) => p.id === id)
    if (isSample) {
      addHiddenSampleId(id)
      return { ok: true }
    }
    const filtered = posts.filter((p) => p.id !== id)
    if (filtered.length === posts.length) return { ok: false, error: '해당 글을 찾을 수 없습니다.' }
    saveLocalPosts(filtered)
    return { ok: true }
  }

  try {
    const res = await fetch('/api/delete-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: id, password }),
    })
    const data = (await res.json()) as { error?: string }
    if (!res.ok) return { ok: false, error: data?.error ?? '삭제에 실패했습니다.' }
    return { ok: true }
  } catch (err) {
    console.error('[Supabase] deletePost error', err)
    return { ok: false, error: '네트워크 오류가 발생했습니다.' }
  }
}
