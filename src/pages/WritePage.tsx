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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'var(--font-body)',
}

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
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-medium"
        style={{ color: 'var(--color-text-muted)' }}>
        <ArrowLeft className="h-3.5 w-3.5" />
        목록으로 돌아가기
      </Link>

      <header>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
          글 쓰기
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          AI 활용·강의·공지·자유게시판·연구자료 등 카테고리별로 기록하세요.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl p-6"
        style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>제목 *</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 고층 아파트 야간 화재 시 초기 대응 체크리스트" style={inputStyle} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>카테고리 *</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as CategoryCode)} style={inputStyle}>
              {categoryOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>요약문 *</span>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)}
            placeholder="핵심 내용 2~3문장으로 요약"
            rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            사진 첨부 (자동 1/10 압축)
          </span>

          <input ref={fileRef} type="file" accept="image/*" multiple
            onChange={(e) => handleFiles(e.target.files)} className="hidden" />

          <button type="button" onClick={() => fileRef.current?.click()} disabled={compressing}
            className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-colors"
            style={{
              border: '1px dashed var(--color-border-hover)',
              color: 'var(--color-text-secondary)',
              background: 'rgba(255,255,255,0.02)',
            }}>
            {compressing
              ? <><Loader2 className="h-4 w-4 animate-spin" />압축 중...</>
              : <><ImagePlus className="h-4 w-4" />클릭하여 사진 추가</>
            }
          </button>

          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {images.map((img) => (
                <div key={img.id} className="group relative overflow-hidden rounded-xl"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                  <img src={img.preview} alt="" className="w-full object-contain" style={{ maxHeight: 200 }} />
                  <button type="button" onClick={() => removeImage(img.id)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-white opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ background: 'rgba(0,0,0,0.7)' }}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="px-2 py-1.5 text-[10px] leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                    {formatSize(img.originalSize)} → {formatSize(img.compressedSize)}
                    <span className="ml-1" style={{ color: '#22c55e' }}>
                      ({Math.round((1 - img.compressedSize / img.originalSize) * 100)}% 감소)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>본문 *</span>
          <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            입력하는 그대로 화면에 반영됩니다. 저장 시 자동으로 마크다운으로 변환됩니다.
          </p>
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
            placeholder="본문을 입력하세요. 제목·굵게·줄 바꿈·사진은 위 도구로 넣을 수 있습니다."
            inlineImageUploading={inlineImageUploading}
            onPickInlineImage={() => inlineImageInputRef.current?.click()}
          />
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>작성자 표기 (선택)</span>
          <input value={author} onChange={(e) => setAuthor(e.target.value)}
            placeholder="예) ○○소방서 ○○센터 소방경 홍길동" style={inputStyle} />
        </label>

        <div className="rounded-xl p-4 text-xs leading-relaxed"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
          <p className="mb-1 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>작성 가이드</p>
          <ul className="space-y-0.5">
            <li>• 상단 사진은 글 맨 앞 갤러리용, 「본문에 사진」은 편집 화면에 바로 끼워 넣습니다</li>
            <li>• [링크이름](URL) 형식의 첫 링크는 목록 클릭 시 바로 이동됩니다</li>
            <li>• 개인정보 제거 후 서술, 공식 지침과 다른 내용은 반드시 명시</li>
          </ul>
        </div>

        {error && (
          <p className="text-xs font-medium" style={{ color: '#f87171' }}>{error}</p>
        )}

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="rounded-xl px-4 py-2.5 text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
            돌아가기
          </button>
          <button type="submit" disabled={loading || compressing}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: 'var(--color-accent)', boxShadow: '0 2px 16px rgba(220,38,38,0.3)' }}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {loading ? '업로드 중...' : '지식 카드 등록'}
          </button>
        </div>
      </form>
    </div>
  )
}
