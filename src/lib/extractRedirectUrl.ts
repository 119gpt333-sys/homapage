/**
 * 마크다운 본문에서 첫 번째 [텍스트](URL) 링크의 URL 추출
 * 다이렉트 링크(목록 클릭 시 바로 이동)용
 */
export function extractRedirectUrl(contentMarkdown: string | null | undefined): string | null {
  if (!contentMarkdown?.trim()) return null
  const match = contentMarkdown.match(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/)
  return match?.[2] ?? null
}
