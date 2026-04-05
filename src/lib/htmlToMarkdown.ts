import TurndownService from 'turndown'

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function extractColorDeclaration(style: string): string | null {
  const decl = style
    .split(';')
    .map((d) => d.trim())
    .find((d) => /^color\s*:/i.test(d))
  if (!decl) return null
  if (/\burl\s*\(/i.test(decl) || /expression/i.test(decl) || /@import/i.test(decl)) return null
  return decl
}

const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
})

turndownService.addRule('coloredSpan', {
  filter(node) {
    if (node.nodeName !== 'SPAN') return false
    const style = (node as HTMLElement).getAttribute('style')
    if (!style?.trim()) return false
    return extractColorDeclaration(style) !== null
  },
  replacement(content, node) {
    const el = node as HTMLElement
    const style = el.getAttribute('style') ?? ''
    const colorDecl = extractColorDeclaration(style)
    if (!colorDecl) return content
    return `<span style="${escapeHtmlAttr(colorDecl)}">${content}</span>`
  },
})

export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html).trim()
}
