import { forwardRef, useImperativeHandle, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle, Color } from '@tiptap/extension-text-style'
import { marked } from 'marked'
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  CornerDownLeft,
  ImagePlus,
  Loader2,
  Palette,
} from 'lucide-react'
import { htmlToMarkdown } from '../lib/htmlToMarkdown'

marked.setOptions({ breaks: true, gfm: true })

const TEXT_COLOR_PRESETS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f8fafc',
  '#64748b',
]

const toolbarBtn =
  'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-opacity hover:opacity-90 disabled:opacity-40'

export type RichBodyEditorRef = {
  getMarkdown: () => string
  insertImage: (url: string) => void
}

type RichBodyEditorProps = {
  /** 최초 표시용 마크다운 (부모에서 key로 리마운트할 때마다 다시 적용) */
  markdown: string
  placeholder?: string
  inlineImageUploading?: boolean
  onPickInlineImage?: () => void
}

export const RichBodyEditor = forwardRef<RichBodyEditorRef, RichBodyEditorProps>(
  function RichBodyEditor(
    { markdown, placeholder, inlineImageUploading, onPickInlineImage },
    ref,
  ) {
    const initialContent = useMemo(() => {
      const h = marked.parse(markdown || '', { async: false }) as string
      return h.trim() ? h : '<p></p>'
    }, [markdown])

    const editor = useEditor(
      {
        immediatelyRender: false,
        extensions: [
          StarterKit.configure({
            heading: { levels: [1, 2, 3] },
          }),
          Image.configure({
            HTMLAttributes: { class: 'rich-body-img' },
          }),
          Link.configure({
            openOnClick: false,
            autolink: true,
            HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
          }),
          TextStyle,
          Color.configure({ types: ['textStyle'] }),
          Placeholder.configure({
            placeholder: placeholder ?? '본문을 입력하세요. 서식은 바로 화면에 반영됩니다.',
          }),
        ],
        content: initialContent,
        editorProps: {
          attributes: {
            class: 'rich-body-editor',
          },
        },
      },
      [initialContent],
    )

    useImperativeHandle(
      ref,
      () => ({
        getMarkdown: () => {
          if (!editor) return ''
          return htmlToMarkdown(editor.getHTML())
        },
        insertImage: (url: string) => {
          editor?.chain().focus().setImage({ src: url }).run()
        },
      }),
      [editor],
    )

    if (!editor) {
      return (
        <div
          className="min-h-[300px] animate-pulse rounded-xl"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        />
      )
    }

    return (
      <div className="flex flex-col gap-2">
        <div
          className="flex flex-wrap items-center gap-1.5 rounded-xl p-2"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)' }}
        >
          <span
            className="w-full text-[10px] font-semibold uppercase tracking-wide sm:mr-1 sm:w-auto"
            style={{ color: 'var(--color-text-muted)' }}
          >
            본문 서식
          </span>
          <button
            type="button"
            className={toolbarBtn}
            style={{ color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="h-3 w-3" />
            큰 제목
          </button>
          <button
            type="button"
            className={toolbarBtn}
            style={{ color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-3 w-3" />
            중 제목
          </button>
          <button
            type="button"
            className={toolbarBtn}
            style={{ color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="h-3 w-3" />
            작은 제목
          </button>
          <button
            type="button"
            className={toolbarBtn}
            style={{ color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-3 w-3" />
            굵게
          </button>
          <span
            className="inline-flex flex-wrap items-center gap-1"
            title="글자 색"
          >
            <Palette
              className="h-3 w-3 shrink-0"
              style={{ color: 'var(--color-text-muted)' }}
              aria-hidden
            />
            {TEXT_COLOR_PRESETS.map((hex) => (
              <button
                key={hex}
                type="button"
                title={hex}
                className="h-5 w-5 shrink-0 rounded border transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: hex,
                  borderColor: 'var(--color-border)',
                }}
                onClick={() => editor.chain().focus().setColor(hex).run()}
              />
            ))}
            <button
              type="button"
              className={`${toolbarBtn} !px-1.5`}
              style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
              title="색 제거"
              onClick={() => editor.chain().focus().unsetColor().run()}
            >
              기본
            </button>
          </span>
          <button
            type="button"
            className={toolbarBtn}
            style={{ color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            onClick={() => editor.chain().focus().setHardBreak().run()}
          >
            <CornerDownLeft className="h-3 w-3" />
            줄 바꿈
          </button>
          <button
            type="button"
            className={toolbarBtn}
            disabled={inlineImageUploading}
            style={{ color: 'var(--color-accent-light)', border: '1px solid rgba(220,38,38,0.35)' }}
            onClick={onPickInlineImage}
          >
            {inlineImageUploading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ImagePlus className="h-3 w-3" />
            )}
            본문에 사진
          </button>
        </div>
        <EditorContent editor={editor} />
      </div>
    )
  },
)
