import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  runDeleteComment,
  isDeleteCommentFailure,
  type DeleteCommentBody,
} from './delete-comment-core.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const adminPassword = process.env.ADMIN_PASSWORD
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!adminPassword || !serviceKey) return res.status(500).json({ error: '서버 설정 오류' })

  const supabaseUrl =
    process.env.VITE_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim()
  if (!supabaseUrl) {
    return res.status(500).json({ error: 'Supabase URL 미설정 (VITE_SUPABASE_URL 또는 SUPABASE_URL)' })
  }

  const result = await runDeleteComment(req.body as DeleteCommentBody, {
    adminPassword,
    serviceRoleKey: serviceKey,
    supabaseUrl,
  })

  if (isDeleteCommentFailure(result)) {
    return res.status(result.status).json({ error: result.error })
  }
  return res.status(200).json({ success: true })
}
