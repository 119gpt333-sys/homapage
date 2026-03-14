import { getEmbedInfo, type EmbedInfo } from '../lib/linkEmbed'

interface LinkEmbedProps {
  url: string
  title?: string
  className?: string
}

export function LinkEmbed({ url, title, className = '' }: LinkEmbedProps) {
  const info = getEmbedInfo(url)
  if (!info) return null

  return (
    <div
      className={`overflow-hidden rounded-2xl ${className}`}
      style={{
        border: '1px solid var(--color-border)',
        background: 'var(--color-card)',
        aspectRatio: '16/9',
        minHeight: 315,
      }}
    >
      <iframe
        src={info.embedUrl}
        title={title ?? '링크 임베드'}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        sandbox={info.type === 'iframe' ? 'allow-scripts allow-popups allow-forms' : undefined}
      />
    </div>
  )
}

interface LinkEmbedsProps {
  urls: string[]
  className?: string
}

export function LinkEmbeds({ urls, className = '' }: LinkEmbedsProps) {
  const embeds = urls
    .map((url) => getEmbedInfo(url))
    .filter((info): info is EmbedInfo => info !== null)

  if (embeds.length === 0) return null

  return (
    <div className={`space-y-4 ${className}`}>
      {embeds.map((info, i) => (
        <LinkEmbed key={`${info.url}-${i}`} url={info.url} title={`임베드 ${i + 1}`} />
      ))}
    </div>
  )
}
