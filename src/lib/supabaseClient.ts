import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { KnowledgePost, PostComment } from '../types/knowledge'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** 브라우저에서 설정 저장 후 UI 갱신용 */
export const SUPABASE_RUNTIME_CONFIG_EVENT = 'supabase-runtime-config-updated'

const RUNTIME_SB_URL_KEY = 'seoul-fire-gpt-runtime-supabase-url'
const RUNTIME_SB_ANON_KEY = 'seoul-fire-gpt-runtime-supabase-anon-key'

const supabaseFromEnv: SupabaseClient | null =
  SUPABASE_URL?.trim() && SUPABASE_ANON_KEY?.trim()
    ? createClient(SUPABASE_URL.trim(), SUPABASE_ANON_KEY.trim(), { auth: { persistSession: false } })
    : null

let runtimeClient: SupabaseClient | null = null
let runtimeClientSig = ''

function getRuntimeCredentials(): { url: string; key: string } | null {
  if (typeof window === 'undefined') return null
  const url = localStorage.getItem(RUNTIME_SB_URL_KEY)?.trim()
  const key = localStorage.getItem(RUNTIME_SB_ANON_KEY)?.trim()
  if (!url || !key) return null
  return { url, key }
}

function clearRuntimeClientCache() {
  runtimeClient = null
  runtimeClientSig = ''
}

function getOrCreateRuntimeClient(): SupabaseClient | null {
  const creds = getRuntimeCredentials()
  if (!creds) return null
  const sig = `${creds.url}\0${creds.key}`
  if (runtimeClient && runtimeClientSig === sig) return runtimeClient
  runtimeClient = createClient(creds.url, creds.key, { auth: { persistSession: false } })
  runtimeClientSig = sig
  return runtimeClient
}

/** 빌드 시 env 우선, 없으면 이 브라우저 localStorage 런타임 설정 */
function getActiveClient(): SupabaseClient | null {
  if (supabaseFromEnv) return supabaseFromEnv
  return getOrCreateRuntimeClient()
}

export function saveRuntimeSupabaseConfig(url: string, anonKey: string): void {
  const u = url.trim()
  const k = anonKey.trim()
  if (!u || !k) throw new Error('Project URL과 anon(publishable) 키를 모두 입력해 주세요.')
  localStorage.setItem(RUNTIME_SB_URL_KEY, u)
  localStorage.setItem(RUNTIME_SB_ANON_KEY, k)
  clearRuntimeClientCache()
  window.dispatchEvent(new CustomEvent(SUPABASE_RUNTIME_CONFIG_EVENT))
}

export function clearRuntimeSupabaseConfig(): void {
  localStorage.removeItem(RUNTIME_SB_URL_KEY)
  localStorage.removeItem(RUNTIME_SB_ANON_KEY)
  clearRuntimeClientCache()
  window.dispatchEvent(new CustomEvent(SUPABASE_RUNTIME_CONFIG_EVENT))
}

/** 설정 모달 초기값용 (브라우저 전용) */
export function getRuntimeSupabaseFormValues(): { url: string; anonKey: string } {
  if (typeof window === 'undefined') return { url: '', anonKey: '' }
  return {
    url: localStorage.getItem(RUNTIME_SB_URL_KEY) ?? '',
    anonKey: localStorage.getItem(RUNTIME_SB_ANON_KEY) ?? '',
  }
}

export function getSupabase(): SupabaseClient | null {
  return getActiveClient()
}

/**
 * 로컬 개발(`npm run dev`)에서만 .env 없을 때 localStorage·샘플 데이터 사용.
 * 프로덕션 빌드에서는 절대 사용하지 않음 — 배포 시 env 누락으로 "로컬처럼" 동작하는 문제 방지.
 */
function useDevStorageFallback(): boolean {
  return import.meta.env.DEV && !getActiveClient()
}

/** 프로덕션에서 Supabase 클라이언트 없음 (빌드 env·브라우저 저장 모두 없음) */
export function isDeploymentMissingSupabase(): boolean {
  if (!import.meta.env.PROD) return false
  if (typeof window === 'undefined') return !supabaseFromEnv
  return !getActiveClient()
}

/** Supabase 연동 상태 */
export function getSupabaseStatus(): { connected: boolean } {
  return { connected: !!getActiveClient() }
}

/** Supabase 실제 연결 테스트 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; error?: string }> {
  const sb = getActiveClient()
  if (!sb) return { ok: false, error: 'Supabase가 설정되지 않았습니다.' }
  try {
    const { error } = await sb.from('knowledge_posts').select('id').limit(1)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : '연결 실패' }
  }
}

if (import.meta.env.PROD && typeof window !== 'undefined' && !supabaseFromEnv && !getRuntimeCredentials()) {
  console.warn(
    '[Supabase] 빌드에 URL/anon 키 없음. 상단에서 브라우저에 저장하거나 Vercel 환경 변수를 설정하세요.',
  )
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
  if (!useDevStorageFallback()) return post.view_count ?? 0
  const userPosts = getLocalPosts()
  if (userPosts.some((p) => p.id === post.id)) return post.view_count ?? 0
  const o = getViewCountOverrides()[post.id]
  return o !== undefined ? o : (post.view_count ?? 0)
}

function mergeLocalViewCounts(posts: KnowledgePost[]): KnowledgePost[] {
  const commentsMap = getLocalCommentsMap()
  return posts.map((p) => ({
    ...p,
    view_count: getDisplayViewCountForPost(p),
    comment_count: commentsMap[p.id]?.length ?? 0,
  }))
}

/** PostgREST embedded count → flat comment_count */
function normalizePostCommentCount<T extends { post_comments?: { count: number }[] | null }>(
  row: T,
): Omit<T, 'post_comments'> & { comment_count: number } {
  const { post_comments, ...rest } = row
  const count = Array.isArray(post_comments) && post_comments[0]?.count
    ? post_comments[0].count
    : 0
  return { ...rest, comment_count: count }
}

// ─── Image upload ───

const ERR_NO_SUPABASE_CLIENT =
  'Supabase가 설정되지 않았습니다. 상단의 Supabase 연결에서 URL·anon 키를 저장하거나, Vercel 환경 변수를 설정하세요.'

export async function uploadImage(file: File): Promise<string> {
  if (useDevStorageFallback()) {
    return URL.createObjectURL(file)
  }

  const sb = getActiveClient()
  if (!sb) {
    throw new Error(ERR_NO_SUPABASE_CLIENT)
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `posts/${crypto.randomUUID()}.${ext}`

  const { error } = await sb.storage
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

  const { data: urlData } = sb.storage
    .from('post-images')
    .getPublicUrl(path)

  return urlData.publicUrl
}

// ─── Site banner (홈페이지 중앙 배너 이미지) ───

const BANNER_SETTING_KEY = 'hero_banner_url'
const LOCAL_BANNER_KEY = 'seoul-fire-gpt-banner-url'

export async function getBannerImageUrl(): Promise<string | null> {
  if (useDevStorageFallback()) {
    try {
      return localStorage.getItem(LOCAL_BANNER_KEY)
    } catch {
      return null
    }
  }
  const sb = getActiveClient()
  if (!sb) return null
  const { data, error } = await sb
    .from('site_settings')
    .select('value')
    .eq('key', BANNER_SETTING_KEY)
    .maybeSingle()
  if (error) {
    console.error('[Supabase] getBannerImageUrl', error)
    return null
  }
  return (data?.value as string | undefined) ?? null
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const idx = result.indexOf('base64,')
      resolve(idx >= 0 ? result.slice(idx + 'base64,'.length) : result)
    }
    reader.onerror = () => reject(new Error('파일 읽기 실패'))
    reader.readAsDataURL(file)
  })
}

export type UploadBannerResult =
  | { ok: true; url: string }
  | { ok: false; error: string; status?: number }

/**
 * 배너 이미지 업로드.
 * - dev (Supabase 미설정): localStorage + objectURL (비밀번호도 검증 안 함)
 * - 그 외: /api/upload-banner 서버 라우트로 위임 → 서버가 비번/service-role 검증
 */
export async function uploadBannerImage(file: File, password: string): Promise<UploadBannerResult> {
  if (useDevStorageFallback()) {
    const url = URL.createObjectURL(file)
    try {
      localStorage.setItem(LOCAL_BANNER_KEY, url)
    } catch {
      /* ignore */
    }
    return { ok: true, url }
  }

  let fileBase64: string
  try {
    fileBase64 = await fileToBase64(file)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : '파일 인코딩 실패' }
  }

  try {
    const res = await fetch('/api/upload-banner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password,
        fileName: file.name,
        contentType: file.type || 'image/jpeg',
        fileBase64,
      }),
    })
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
    if (!res.ok) {
      return { ok: false, status: res.status, error: data.error ?? '업로드 실패' }
    }
    if (!data.url) return { ok: false, error: '서버 응답에 URL이 없습니다.' }
    return { ok: true, url: data.url }
  } catch (err) {
    console.error('[Supabase] uploadBannerImage api', err)
    return {
      ok: false,
      error: '네트워크 오류가 발생했습니다. (로컬 dev 환경이라면 `vercel dev` 로 실행하거나 .env에 Supabase 미설정 상태에서 테스트하세요.)',
    }
  }
}

// ─── Posts API ───

/** PostgREST `ilike` 패턴용 — 와일드카드·OR 구분자 왜곡 방지 */
function sanitizeSearchQuery(raw: string): string {
  return raw
    .trim()
    .slice(0, 120)
    .replace(/[%_,"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function fetchPostsByCategory(
  category?: string,
  options?: { excludeCategories?: string[]; search?: string }
): Promise<KnowledgePost[]> {
  const searchToken = options?.search ? sanitizeSearchQuery(options.search) : ''

  if (useDevStorageFallback()) {
    const posts = getLocalPostsOrSamples()
    let filtered = category && category !== 'ALL'
      ? posts.filter((p) => p.category === category)
      : posts
    if (options?.excludeCategories?.length) {
      filtered = filtered.filter((p) => !options.excludeCategories!.includes(p.category))
    }
    if (searchToken) {
      const s = searchToken.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          p.summary.toLowerCase().includes(s) ||
          p.content_markdown.toLowerCase().includes(s),
      )
    }
    const sorted = filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    return mergeLocalViewCounts(sorted)
  }

  const sb = getActiveClient()
  if (!sb) {
    return []
  }

  let query = sb
    .from('knowledge_posts')
    .select('*, post_comments(count)')
    .order('created_at', { ascending: false })

  if (category && category !== 'ALL') {
    query = query.eq('category', category)
  } else if (options?.excludeCategories?.length) {
    for (const c of options.excludeCategories) {
      query = query.neq('category', c)
    }
  }

  if (searchToken) {
    const esc = searchToken.replace(/"/g, '""')
    const p = `"%${esc}%"`
    query = query.or(`title.ilike.${p},summary.ilike.${p},content_markdown.ilike.${p}`)
  }

  const { data, error } = await query
  if (error) {
    console.error('[Supabase] fetchPostsByCategory error', error)
    return []
  }
  type Row = KnowledgePost & { post_comments?: { count: number }[] | null }
  return ((data ?? []) as Row[]).map(normalizePostCommentCount) as KnowledgePost[]
}

/** 대시보드 탭 기준 콘텐츠 카테고리 수 (전체 제외) */
const DASHBOARD_CATEGORY_COUNT = 6

export type KnowledgeStats = {
  totalPosts: number
  categoryCount: number
  totalViews: number
  activeContributors: number
}

function emptyKnowledgeStats(): KnowledgeStats {
  return {
    totalPosts: 0,
    categoryCount: DASHBOARD_CATEGORY_COUNT,
    totalViews: 0,
    activeContributors: 0,
  }
}

function aggregateKnowledgeStats(
  rows: { view_count: number | null | undefined; author_display_name: string | null | undefined }[],
): KnowledgeStats {
  const totalViews = rows.reduce((s, r) => s + (r.view_count ?? 0), 0)
  const authors = new Set(
    rows
      .map((r) => r.author_display_name?.trim())
      .filter((n): n is string => Boolean(n)),
  )
  return {
    totalPosts: rows.length,
    categoryCount: DASHBOARD_CATEGORY_COUNT,
    totalViews,
    activeContributors: authors.size,
  }
}

/** 전체 게시글 수·조회수 합·기여자 수 (통계 배너용) */
export async function fetchKnowledgeStats(): Promise<KnowledgeStats> {
  if (useDevStorageFallback()) {
    const posts = mergeLocalViewCounts(getLocalPostsOrSamples())
    return aggregateKnowledgeStats(posts)
  }

  const sb = getActiveClient()
  if (!sb) return emptyKnowledgeStats()

  const { data, error } = await sb.from('knowledge_posts').select('view_count, author_display_name')
  if (error) {
    console.error('[Supabase] fetchKnowledgeStats', error)
    return emptyKnowledgeStats()
  }
  return aggregateKnowledgeStats(data ?? [])
}

export async function fetchPostById(id: string): Promise<KnowledgePost | null> {
  if (useDevStorageFallback()) {
    const p = getLocalPostsOrSamples().find((x) => x.id === id) ?? null
    if (!p) return null
    return {
      ...p,
      view_count: getDisplayViewCountForPost(p),
      comment_count: getLocalCommentsMap()[p.id]?.length ?? 0,
    }
  }

  const sb = getActiveClient()
  if (!sb) return null

  const { data, error } = await sb
    .from('knowledge_posts')
    .select('*, post_comments(count)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[Supabase] fetchPostById error', error)
    return null
  }
  type Row = KnowledgePost & { post_comments?: { count: number }[] | null }
  return normalizePostCommentCount(data as Row) as KnowledgePost
}

/** 게시글 조회수 +1 (페이지 진입 시 1회). 새 조회수 반환. */
export async function incrementPostViewCount(postId: string): Promise<number | null> {
  if (useDevStorageFallback()) {
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

  const sb = getActiveClient()
  if (!sb) return null

  const { error: rpcError } = await sb.rpc('increment_post_view_count', { p_post_id: postId })
  if (rpcError) {
    console.error('[Supabase] incrementPostViewCount rpc', rpcError)
    return null
  }
  const { data, error } = await sb
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
  if (useDevStorageFallback()) {
    const list = getLocalCommentsMap()[postId] ?? []
    return [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }

  const sb = getActiveClient()
  if (!sb) return []

  const { data, error } = await sb
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

  if (useDevStorageFallback()) {
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

  const sb = getActiveClient()
  if (!sb) {
    throw new Error(ERR_NO_SUPABASE_CLIENT)
  }

  const { data, error } = await sb
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

/** dev 환경에서 service role key 없이 anon client로 직접 댓글 삭제 */
async function deleteCommentDirect(
  postId: string,
  commentId: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const expected = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined
  if (!expected) return { ok: false, error: 'dev 환경: .env.local 에 VITE_ADMIN_PASSWORD 를 설정하세요.' }
  if (password !== expected) return { ok: false, error: '비밀번호가 올바르지 않습니다.' }
  const sb = getActiveClient()
  if (!sb) return { ok: false, error: 'Supabase 클라이언트가 없습니다.' }
  const { error, count } = await sb
    .from('post_comments')
    .delete({ count: 'exact' })
    .eq('id', commentId)
    .eq('post_id', postId)
  if (error) return { ok: false, error: error.message }
  if (count === 0) return { ok: false, error: '댓글을 찾을 수 없습니다.' }
  return { ok: true }
}

export async function deleteComment(
  postId: string,
  commentId: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  if (useDevStorageFallback()) {
    const expected = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined
    if (!expected) return { ok: false, error: 'dev 환경: .env.local 에 VITE_ADMIN_PASSWORD 를 설정하세요.' }
    if (password !== expected) return { ok: false, error: '비밀번호가 올바르지 않습니다.' }
    const map = getLocalCommentsMap()
    const list = map[postId] ?? []
    const filtered = list.filter((c) => c.id !== commentId)
    if (filtered.length === list.length) return { ok: false, error: '해당 댓글을 찾을 수 없습니다.' }
    map[postId] = filtered
    saveLocalCommentsMap(map)
    return { ok: true }
  }

  // 로컬 dev: /api/delete-comment 시도 → 실패 시 anon client로 직접 삭제 폴백
  try {
    const res = await fetch('/api/delete-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId, postId, password }),
    })
    const data = (await res.json()) as { error?: string }
    if (!res.ok) {
      // 서버 설정 오류(service role key 미설정 등)이고 dev 환경이면 직접 삭제 시도
      if (import.meta.env.DEV && res.status === 500) {
        return deleteCommentDirect(postId, commentId, password)
      }
      return { ok: false, error: data?.error ?? '삭제에 실패했습니다.' }
    }
    return { ok: true }
  } catch (err) {
    // 네트워크 오류(로컬 API 미존재 등)이고 dev 환경이면 직접 삭제 시도
    if (import.meta.env.DEV) {
      return deleteCommentDirect(postId, commentId, password)
    }
    console.error('[Supabase] deleteComment error', err)
    return { ok: false, error: '네트워크 오류가 발생했습니다.' }
  }
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
  if (useDevStorageFallback()) {
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

  const sb = getActiveClient()
  if (!sb) {
    throw new Error(ERR_NO_SUPABASE_CLIENT)
  }

  const { data, error } = await sb
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
  if (useDevStorageFallback()) {
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

  const sb = getActiveClient()
  if (!sb) {
    throw new Error(ERR_NO_SUPABASE_CLIENT)
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

  const { data, error } = await sb
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
  if (useDevStorageFallback()) {
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
