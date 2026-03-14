import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { postId, password } = req.body as { postId?: string; password?: string }
  if (!postId || !password) return res.status(400).json({ error: 'postId, password 필요' })

  const adminPassword = process.env.ADMIN_PASSWORD
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!adminPassword || !serviceKey) return res.status(500).json({ error: '서버 설정 오류' })
  if (password !== adminPassword) return res.status(403).json({ error: '비밀번호 오류' })

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  if (!supabaseUrl) return res.status(500).json({ error: 'VITE_SUPABASE_URL 미설정' })

  const supabase = createClient(supabaseUrl, serviceKey)

  const { error } = await supabase.from('knowledge_posts').delete().eq('id', postId)
  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ success: true })
}
