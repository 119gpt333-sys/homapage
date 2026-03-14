/**
 * 마크다운에서 링크 URL 추출 및 임베드용 변환
 */
export function extractUrlsFromMarkdown(contentMarkdown: string | null | undefined): string[] {
  if (!contentMarkdown?.trim()) return []
  const urls: string[] = []
  // [text](url) 형식 (이미지 ![alt](url) 제외 - 상세 페이지에서 중복 표시 방지)
  const markdownLinks = contentMarkdown.matchAll(/(?<!!)\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g)
  for (const m of markdownLinks) urls.push(m[2])
  // 플레인 URL (lookbehind 미사용 - 구형 브라우저 호환)
  const plainUrls = contentMarkdown.match(/(https?:\/\/[^\s<>[\]()]+)/g)
  if (plainUrls) urls.push(...plainUrls)
  return [...new Set(urls)]
}

export type EmbedType = 'youtube' | 'vimeo' | 'iframe'

export interface EmbedInfo {
  url: string
  embedUrl: string
  type: EmbedType
}

export function getEmbedInfo(url: string): EmbedInfo | null {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()

    // YouTube: youtube.com/watch?v=ID, youtu.be/ID
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      let vid = u.searchParams.get('v')
      if (!vid && host.includes('youtu.be')) vid = u.pathname.slice(1).split('/')[0]
      if (vid) {
        return {
          url,
          embedUrl: `https://www.youtube.com/embed/${vid}`,
          type: 'youtube',
        }
      }
    }

    // Vimeo: vimeo.com/ID
    if (host.includes('vimeo.com')) {
      const m = u.pathname.match(/\/(\d+)/)
      if (m) {
        return {
          url,
          embedUrl: `https://player.vimeo.com/video/${m[1]}`,
          type: 'vimeo',
        }
      }
    }

    // 일반 URL: iframe (일부 사이트는 X-Frame-Options로 차단될 수 있음)
    return { url, embedUrl: url, type: 'iframe' }
  } catch {
    return null
  }
}
