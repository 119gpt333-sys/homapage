export type CategoryCode =
  | 'AI_UTIL'
  | 'FIELD'
  | 'EQUIPMENT'
  | 'PREVENTION'
  | 'LECTURE'
  | 'NOTICE'
  | 'BOARD'
  | 'RESEARCH'
  | 'BOOK'
  | 'YOUTUBE'

export interface KnowledgePost {
  id: string
  title: string
  category: CategoryCode
  summary: string
  content_markdown: string
  thumbnail_url: string | null
  image_urls: string[] | null
  created_at: string
  updated_at: string
  author_display_name: string | null
  view_count: number
}

/** 게시글 댓글 */
export interface PostComment {
  id: string
  post_id: string
  body: string
  author_display_name: string | null
  created_at: string
}

