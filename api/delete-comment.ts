import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  runDeleteComment,
  isDeleteCommentFailure,
  type DeleteCommentBody,
} from './delete-comment-core'

function readDeleteCommentBody(req: VercelRequest): DeleteCommentBody | 'parse-error' {
  const raw = req.body
  if (raw == null || raw === '') return {}
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as DeleteCommentBody
    } catch {
      return 'parse-error'
    }
  }
  if (typeof raw === 'object') return raw as DeleteCommentBody
  return {}
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const body = readDeleteCommentBody(req)
    if (body === 'parse-error') {
      return res.status(400).json({ error: 'JSON 파싱 오류' })
    }

    const adminPassword = process.env.ADMIN_PASSWORD
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!adminPassword || !serviceKey) return res.status(500).json({ error: '서버 설정 오류' })

    const supabaseUrl =
      process.env.VITE_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim()
    if (!supabaseUrl) {
      return res
        .status(500)
        .json({ error: 'Supabase URL 미설정 (VITE_SUPABASE_URL 또는 SUPABASE_URL)' })
    }

    const result = await runDeleteComment(body, {
      adminPassword,
      serviceRoleKey: serviceKey,
      supabaseUrl,
    })

    if (isDeleteCommentFailure(result)) {
      return res.status(result.status).json({ error: result.error })
    }
    return res.status(200).json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류'
    return res.status(500).json({ error: message })
  }
}
