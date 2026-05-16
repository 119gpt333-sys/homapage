import { type FormEvent, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, ImagePlus, X, Loader2 } from 'lucide-react'
import type { CategoryCode } from '../types/knowledge'
import { createPost, uploadImage } from '../lib/supabaseClient'
import { compressImage } from '../lib/imageCompress'
import { RichBodyEditor, type RichBodyEditorRef } from '../components/RichBodyEditor'

const categoryOptions: { code: CategoryCode; label: string }[] = [
  { code: 'AI_UTIL', label: 'AI 활용' },
  { code: 'LECTURE', label: '강의신청' },
  { code: 'NOTICE', label: '공지사항' },
  { code: 'BOARD', label: '자유게시판' },
  { code: 'RESEARCH', label: '연구자료' },
  { code: 'BOOK', label: '추천도서' },
  { code: 'YOUTUBE', label: '필독 유튜브' },
]

interface ImagePreview {
  id: string
  file: File
  preview: string
  compressed: boolean
  originalSize: number
  compressedSize: number
}

export function WritePage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const bodyEditorRef = useRef<RichBodyEditorRef>(null)
  const inlineImageInputRef = useRef<HTMLInputElement>(null)
  const [inlineImageUploading, setInlineImageUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<CategoryCode>('LECTURE')
  const [summary, setSummary] = useState('')
  const [author, setAuthor] = useState('')
  const [images, setImages] = useState<ImagePreview[]>([])
  const [compressing, setCompressing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setCompressing(true)
    setError(null)

    try {
      const newImages: ImagePreview[] = []
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        const originalSize = file.size
        const compressed = await compressImage(file)
        newImages.push({
          id: crypto.randomUUID(),
          file: compressed,
          preview: URL.createObjectURL(compressed),
          compressed: true,
          originalSize,
          compressedSize: compressed.size,
        })
      }
      setImages(prev => [...prev, ...newImages])
    } catch {
      setError('이미지 압축 중 오류가 발생했습니다.')
    } finally {
      setCompressing(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeImage = (id: string) => {
    setImages(prev => {
      const removed = prev.find(img => img.id === id)
      if (removed) URL.revokeObjectURL(removed.preview)
      return prev.filter(img => img.id !== id)
    })
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const handleInlineImagePick = async (files: FileList | null) => {
    if (!files?.length) return
    const file = files[0]
    if (!file.type.startsWith('image/')) return
    setError(null)
    setInlineImageUploading(true)
    try {
      const compressed = await compressImage(file)
      const url = await uploadImage(compressed)
      bodyEditorRef.current?.insertImage(url)
    } catch {
      setError('본문에 넣을 사진 업로드에 실패했습니다.')
    } finally {
      setInlineImageUploading(false)
      if (inlineImageInputRef.current) inlineImageInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const bodyMd = bodyEditorRef.current?.getMarkdown().trim() ?? ''
    if (!title.trim() || !summary.trim() || !bodyMd) {
      setError('제목, 요약, 본문은 필수입니다.')
      return
    }
    setLoading(true)
    try {
      const imageUrls: string[] = []
      for (const img of images) {
        try {
          const url = await uploadImage(img.file)
          imageUrls.push(url)
        } catch (uploadErr) {
          console.warn('[WritePage] 이미지 업로드 건너뜀:', uploadErr)
        }
      }

      const imageMarkdown =
        imageUrls.length > 0
          ? imageUrls.map((url) => `![첨부사진](${url})`).join('\n\n') + '\n\n'
          : ''
      const contentMarkdown = imageMarkdown + bodyMd

      const created = await createPost({
        title: title.trim(),
        category,
        summary: summary.trim(),
        content_markdown: contentMarkdown,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        thumbnail_url: imageUrls[0] ?? null,
        author_display_name: author.trim() || null,
      })
      navigate(`/post/${created.id}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '글을 저장하는 중 오류가 발생했습니다.'
      const hint = msg.includes('Bucket') || msg.includes('bucket')
        ? ' → supabase/SETUP.md 참고'
        : msg.includes('환경 변수') || msg.includes('RLS')
          ? ' → Vercel에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 설정 후 재배포'
          : ''
      setError(msg + hint)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        목록으로
      </Link>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title — large heading-style input */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          className="w-full border-0 bg-transparent text-2xl font-bold text-zinc-900 outline-none placeholder:text-zinc-300 sm:text-3xl dark:text-white dark:placeholder:text-zinc-600"
          style={{ fontFamily: 'var(--font-heading)' }}
        />

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => setCategory(opt.code)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                category === opt.code
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Summary */}
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="핵심 내용 2~3문장으로 요약"
          rows={3}
          className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
        />

        {/* Image upload */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            사진 첨부 (자동 압축)
          </span>

          <input ref={fileRef} type="file" accept="image/*" multiple
            onChange={(e) => handleFiles(e.target.files)} className="hidden" />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={compressing}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 py-3 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          >
            {compressing
              ? <><Loader2 className="h-4 w-4 animate-spin" />압축 중...</>
              : <><ImagePlus className="h-4 w-4" />클릭하여 사진 추가</>
            }
          </button>

          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {images.map((img) => (
                <div key={img.id} className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                  <img src={img.preview} alt="" className="w-full object-contain" style={{ maxHeight: 200 }} />
                  <button type="button" onClick={() => removeImage(img.id)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="px-2 py-1.5 text-[10px] leading-tight text-zinc-400 dark:text-zinc-500">
                    {formatSize(img.originalSize)} → {formatSize(img.compressedSize)}
                    <span className="ml-1 text-green-600 dark:text-green-400">
                      ({Math.round((1 - img.compressedSize / img.originalSize) * 100)}% 감소)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body editor */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">본문 *</span>
          <input
            ref={inlineImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleInlineImagePick(e.target.files)}
          />
          <RichBodyEditor
            ref={bodyEditorRef}
            markdown=""
            placeholder="본문을 입력하세요..."
            inlineImageUploading={inlineImageUploading}
            onPickInlineImage={() => inlineImageInputRef.current?.click()}
          />
        </div>

        {/* Author */}
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="작성자 (선택) — 예: ○○소방서 ○○센터 소방경 홍길동"
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
        />

        {/* Guide — collapsible */}
        <details className="rounded-lg border border-zinc-200 dark:border-zinc-700">
          <summary className="cursor-pointer px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            작성 가이드
          </summary>
          <div className="border-t border-zinc-100 px-4 py-3 text-xs leading-relaxed text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
            <ul className="space-y-0.5">
              <li>• 상단 사진은 글 맨 앞 갤러리용, 「본문에 사진」은 편집 화면에 바로 끼워 넣습니다</li>
              <li>• [링크이름](URL) 형식의 첫 링크는 목록 클릭 시 바로 이동됩니다</li>
              <li>• 개인정보 제거 후 서술, 공식 지침과 다른 내용은 반드시 명시</li>
            </ul>
          </div>
        </details>

        {error && (
          <p className="text-sm font-medium text-red-500">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading || compressing}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {loading ? '업로드 중...' : '등록'}
          </button>
        </div>
      </form>
    </div>
  )
}
