import type { ReactNode } from 'react'

const URL_REGEX = /(https?:\/\/[^\s<>[\]()]+)/g

interface LinkifyTextProps {
  children: string
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

export function LinkifyText({ children, className, onClick }: LinkifyTextProps): ReactNode {
  const parts = children.split(URL_REGEX)
  return (
    <span className={className} onClick={onClick}>
      {parts.map((part, i) =>
        part.match(URL_REGEX) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="underline break-all"
            style={{ color: 'var(--color-accent-light)' }}
          >
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </span>
  )
}
