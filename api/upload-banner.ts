import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb',
    },
  },
}

const BUCKET = 'site-banners'
const SETTING_KEY = 'hero_banner_url'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { password, fileBase64, fileName, contentType } = req.body as {
    password?: string
    fileBase64?: string
    fileName?: string
    contentType?: string
  }

  if (!password || !fileBase64 || !contentType) {
    return res.status(400).json({ error: 'password, fileBase64, contentType 필요' })
  }
  if (!contentType.startsWith('image/')) {
    return res.status(400).json({ error: '이미지 파일만 업로드할 수 있습니다.' })
  }

  const adminPassword = process.env.ADMIN_PASSWORD
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim()

  const missing: string[] = []
  if (!adminPassword) missing.push('ADMIN_PASSWORD')
  if (!serviceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL (또는 SUPABASE_URL)')
  if (missing.length > 0) {
    return res.status(500).json({
      error: `서버 환경변수 누락: ${missing.join(', ')} — Vercel Project Settings → Environment Variables 에 추가 후 Redeploy 하세요.`,
    })
  }
  if (password !== adminPassword) {
    return res.status(403).json({ error: '비밀번호가 올바르지 않습니다.' })
  }

  let buffer: Buffer
  try {
    buffer = Buffer.from(fileBase64, 'base64')
  } catch {
    return res.status(400).json({ error: '파일 디코딩 실패' })
  }
  if (buffer.byteLength === 0) return res.status(400).json({ error: '빈 파일' })
  if (buffer.byteLength > 5 * 1024 * 1024) {
    return res.status(413).json({ error: '파일 크기는 5MB 이하여야 합니다.' })
  }

  const safeName = (fileName ?? 'banner').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60)
  const ext = safeName.includes('.') ? safeName.split('.').pop() : 'jpg'
  const path = `hero/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const supabase = createClient(supabaseUrl!, serviceKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: false })
  if (upErr) {
    return res.status(500).json({ error: `업로드 실패: ${upErr.message}` })
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const publicUrl = urlData.publicUrl

  const { error: setErr } = await supabase
    .from('site_settings')
    .upsert(
      { key: SETTING_KEY, value: publicUrl, updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    )
  if (setErr) {
    return res.status(500).json({ error: `설정 저장 실패: ${setErr.message}` })
  }

  return res.status(200).json({ success: true, url: publicUrl })
}
