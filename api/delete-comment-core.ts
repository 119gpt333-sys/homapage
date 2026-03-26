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

  // select()/maybeSingle() 없이 삭제: PostgREST DELETE+representation 조합에서
  // 환경에 따라 500이 나는 경우를 피하고, 삭제 행 수는 Prefer: count=exact 로 확인합니다.
  const { error, count } = await supabase
    .from('post_comments')
    .delete({ count: 'exact' })
    .eq('id', commentId)
    .eq('post_id', postId)

  if (error) return { ok: false, status: 500, error: error.message }
  // count 가 null 이면(헤더 미포함 등) 삭제는 성공했을 수 있으므로 404는 count===0 일 때만 냅니다.
  if (count === 0) {
    return { ok: false, status: 404, error: '댓글을 찾을 수 없습니다.' }
  }

  return { ok: true }
}
