import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import type { Options as SanitizeSchema } from 'rehype-sanitize'

const markdownSanitizeSchema: SanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [
      [
        'style',
        /^color:\s*(?!.*url\s*\()(?!.*expression)(?!.*@import)[^;]{1,200}$/i,
      ],
    ],
  },
}

interface MarkdownContentProps {
  markdown: string
  /** 상단 갤러리에 이미 표시된 URL은 본문에서 숨김 (게시글 상세용) */
  omitImageSrcs?: string[] | null
  className?: string
}

export function MarkdownContent({ markdown, omitImageSrcs, className }: MarkdownContentProps) {
  const omitSet = omitImageSrcs?.length ? new Set(omitImageSrcs) : null

  return (
    <div className={className ?? 'prose-custom'}>
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
        components={{
          h1: ({ children, ...props }) => (
            <h1
              className="mb-3 mt-6 text-2xl font-bold first:mt-0"
              style={{ fontFamily: 'var(--font-heading)' }}
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2
              className="mb-2 mt-5 text-xl font-bold first:mt-0"
              style={{ fontFamily: 'var(--font-heading)' }}
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              className="mb-2 mt-4 text-lg font-semibold first:mt-0"
              style={{ fontFamily: 'var(--font-heading)' }}
              {...props}
            >
              {children}
            </h3>
          ),
          p: ({ children, ...props }) => (
            <p className="mb-3 text-sm leading-relaxed last:mb-0" style={{ color: 'rgba(255,255,255,0.88)' }} {...props}>
              {children}
            </p>
          ),
          strong: ({ children, ...props }) => (
            <strong className="font-semibold" style={{ color: 'var(--color-text-primary)' }} {...props}>
              {children}
            </strong>
          ),
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
              style={{ color: 'var(--color-accent-light)', textDecoration: 'underline' }}
            >
              {children}
            </a>
          ),
          img: ({ src, alt, ...props }) => {
            if (!src?.trim()) return null
            if (omitSet?.has(src)) return null
            return (
              <img
                src={src}
                alt={alt ?? ''}
                {...props}
                className="max-w-full h-auto object-contain"
                style={{ display: 'block' }}
              />
            )
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
