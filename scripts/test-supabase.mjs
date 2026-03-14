import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.log('❌ 환경 변수 없음: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)
const { data, error } = await supabase.from('knowledge_posts').select('id').limit(1)

if (error) {
  console.log('❌ Supabase 연결 실패:', error.message)
  process.exit(1)
}

console.log('✅ Supabase 연동 성공')
console.log('   테이블: knowledge_posts')
console.log('   샘플 데이터:', data?.length ? data : '(비어 있음)')
