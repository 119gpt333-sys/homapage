import { createClient } from '@supabase/supabase-js'

export type DeleteCommentBody = {
  commentId?: string
  postId?: string
  password?: string
}

export type DeleteCommentSecrets = {
  adminPassword: string
  serviceRoleKey: string
  supabaseUrl: string
}

export type DeleteCommentResult =
  | { ok: true }
  | { ok: false; status: number; error: string }

export function isDeleteCommentFailure(
  r: DeleteCommentResult,
): r is { ok: false; status: number; error: string } {
  return r.ok === false
}

export async function runDeleteComment(
  body: DeleteCommentBody,
  secrets: DeleteCommentSecrets,
): Promise<DeleteCommentResult> {
  const { commentId, postId, password } = body
  if (!commentId || !postId || !password) {
    return { ok: false, status: 400, error: 'commentId, postId, password 필요' }
  }
  if (password !== secrets.adminPassword) {
    return { ok: false, status: 403, error: '비밀번호 오류' }
  }

  const supabase = createClient(secrets.supabaseUrl, secrets.serviceRoleKey)

  const { data, error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', commentId)
    .eq('post_id', postId)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, status: 500, error: error.message }
  if (!data) return { ok: false, status: 404, error: '댓글을 찾을 수 없습니다.' }

  return { ok: true }
}
