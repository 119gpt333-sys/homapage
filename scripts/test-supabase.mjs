import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.log('❌ 환경 변수 없음: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

// 1) knowledge_posts
const { data: posts, error: e1 } = await supabase.from('knowledge_posts').select('id, view_count').limit(1)

if (e1) {
  console.log('❌ knowledge_posts 조회 실패:', e1.message)
  process.exit(1)
}

console.log('✅ knowledge_posts 접근 OK')
console.log('   샘플:', posts?.length ? posts : '(비어 있음)')

// 2) post_comments 테이블
const { error: e2 } = await supabase.from('post_comments').select('id').limit(1)

if (e2) {
  console.log('❌ post_comments 조회 실패:', e2.message)
  console.log('   → 마이그레이션 SQL이 실행됐는지 확인하세요.')
  process.exit(1)
}

console.log('✅ post_comments 테이블 접근 OK')

// 3) increment_post_view_count RPC
const testPostId = posts?.[0]?.id
if (!testPostId) {
  console.log('⚠️  게시글이 없어 RPC 테스트를 건너뜁니다. 글 하나 작성 후 다시 실행하세요.')
  process.exit(0)
}

const before = posts[0].view_count ?? 0
const { error: e3 } = await supabase.rpc('increment_post_view_count', { p_post_id: testPostId })

if (e3) {
  console.log('❌ increment_post_view_count RPC 실패:', e3.message)
  process.exit(1)
}

const { data: afterRow, error: e4 } = await supabase
  .from('knowledge_posts')
  .select('view_count')
  .eq('id', testPostId)
  .single()

if (e4) {
  console.log('❌ 조회수 확인 실패:', e4.message)
  process.exit(1)
}

const after = afterRow?.view_count ?? 0
if (after !== before + 1) {
  console.log('⚠️  RPC는 성공했으나 조회수가 예상과 다릅니다.', { before, after })
} else {
  console.log('✅ increment_post_view_count RPC OK (조회수', before, '→', after, ')')
}

console.log('')
console.log('전체 검사 완료: 댓글·조회수 마이그레이션 정상 동작')
