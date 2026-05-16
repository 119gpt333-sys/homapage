import { type FormEvent, useState, useRef, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { ArrowLeft, Send, ImagePlus, X, Loader2 } from 'lucide-react'
import type { CategoryCode } from '../types/knowledge'
import { fetchPostById, updatePost, uploadImage } from '../lib/supabaseClient'
import { compressImage } from '../lib/imageCompress'
import { RichBodyEditor, type RichBodyEditorRef } from '../components/RichBodyEditor'

const categoryOptions: { code: CategoryCode; label: string }[] = [
  { code: 'AI_UTIL', label: 'AI 활용' },
  { code: 'LECTURE', label: '강의신청' },
  { code: 'NOTICE', label: '공지사항' },
  { code: 'BOARD', label: '자유게시판' },
  { code: 'RESEARCH', label: '연구자료' },
  { code: 'FIELD', label: '현장활동' },
  { code: 'EQUIPMENT', label: '장비관리' },
  { code: 'PREVENTION', label: '예방정보' },
  { code: 'BOOK', label: '추천도서' },
  { code: 'YOUTUBE', label: '필독 유튜브' },
]

interface ImagePreview {
  id: string
  file?: File
  preview: string
  compressed: boolean
  originalSize: number
  compressedSize: number
  isExisting?: boolean
}

export function EditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const bodyEditorRef = useRef<RichBodyEditorRef>(null)
  const inlineImageInputRef = useRef<HTMLInputElement>(null)
  const [inlineImageUploading, setInlineImageUploading] = useState(false)
  const [bodyEditorKey, setBodyEditorKey] = useState(0)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<CategoryCode>('LECTURE')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [author, setAuthor] = useState('')
  const [images, setImages] = useState<ImagePreview[]>([])
  const [compressing, setCompressing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      setFetching(true)
      const post = await fetchPostById(id)
      if (cancelled) return
      if (!post) {
        setError('해당 게시글을 찾을 수 없습니다.')
        setFetching(false)
        return
      }
      setTitle(post.title)
      setCategory(post.category)
      setSummary(post.summary)
      setAuthor(post.author_display_name ?? '')

      const rawContent = post.content_markdown ?? ''
      const strippedContent = rawContent.replace(/^(\!\[[^\]]*\]\([^)]+\)\s*\n*)+/m, '').trim()
      setContent(strippedContent)

      const existingImages: ImagePreview[] = (post.image_urls ?? []).map((url, i) => ({
        id: `existing-${i}`,
        preview: url,
        compressed: true,
        originalSize: 0,
        compressedSize: 0,
        isExisting: true,
      }))
      setImages(existingImages)
      setBodyEditorKey((k) => k + 1)
      setFetching(false)
    })()
    return () => { cancelled = true }
  }, [id])

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
          isExisting: false,
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

  const removeImage = (imgId: string) => {
    setImages(prev => {
      const removed = prev.find(img => img.id === imgId)
      if (removed && !removed.isExisting) URL.revokeObjectURL(removed.preview)
      return prev.filter(img => img.id !== imgId)
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
    if (!id) return
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
        if (img.isExisting) {
          imageUrls.push(img.preview)
        } else if (img.file) {
          const url = await uploadImage(img.file)
          imageUrls.push(url)
        }
      }

      const imageMarkdown =
        imageUrls.length > 0
          ? imageUrls.map((url) => `![첨부사진](${url})`).join('\n\n') + '\n\n'
          : ''
      const contentMarkdown = imageMarkdown + bodyMd

      const updated = await updatePost(id, {
        title: title.trim(),
        category,
        summary: summary.trim(),
        content_markdown: contentMarkdown,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        thumbnail_url: imageUrls[0] ?? null,
        author_display_name: author.trim() || null,
      })
      if (updated) {
        navigate(`/post/${id}`)
      } else {
        setError('수정에 실패했습니다.')
      }
    } catch (err) {
      console.error('[EditPage] update error', err)
      setError('글을 수정하는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {[60, 200, 100, 300].map((h, i) => (
          <div key={i} className="animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" style={{ height: h }} />
        ))}
      </div>
    )
  }

  if (!id || error === '해당 게시글을 찾을 수 없습니다.') {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {error ?? '해당 게시글을 찾을 수 없습니다.'}
        </p>
        <Link to="/" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-zinc-900 dark:text-white">
          <ArrowLeft className="h-3 w-3" />
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to={`/post/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        글 보기로 돌아가기
      </Link>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
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
            사진 첨부 (기존 유지, 새 사진 자동 압축)
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
                  {img.isExisting ? (
                    <div className="px-2 py-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                      기존 사진
                    </div>
                  ) : (
                    <div className="px-2 py-1.5 text-[10px] leading-tight text-zinc-400 dark:text-zinc-500">
                      {formatSize(img.originalSize)} → {formatSize(img.compressedSize)}
                      <span className="ml-1 text-green-600 dark:text-green-400">
                        ({Math.round((1 - img.compressedSize / img.originalSize) * 100)}% 감소)
                      </span>
                    </div>
                  )}
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
            key={bodyEditorKey}
            ref={bodyEditorRef}
            markdown={content}
            placeholder="본문을 수정하세요..."
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

        {error && (
          <p className="text-sm font-medium text-red-500">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => navigate(`/post/${id}`)}
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
            {loading ? '저장 중...' : '수정 완료'}
          </button>
        </div>
      </form>
    </div>
  )
}
