/**
 * 이미지를 maxBytes 이하가 되도록 JPEG로 다운샘플·재인코딩합니다.
 * 이미 충분히 작고 JPEG면 원본 그대로 반환.
 */
export async function compressImageToMaxBytes(
  file: File,
  opts: { maxBytes?: number; maxDimension?: number } = {},
): Promise<File> {
  const maxBytes = opts.maxBytes ?? 3 * 1024 * 1024
  const maxDimension = opts.maxDimension ?? 1920

  if (!file.type.startsWith('image/')) return file
  if (file.size <= maxBytes && file.type === 'image/jpeg') return file

  const bitmap = await createImageBitmap(file)
  try {
    let width = bitmap.width
    let height = bitmap.height
    const longest = Math.max(width, height)
    if (longest > maxDimension) {
      const scale = maxDimension / longest
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas 2d context 생성 실패')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, width, height)

    let blob: Blob | null = null
    for (const q of [0.85, 0.75, 0.65, 0.55, 0.45]) {
      blob = await canvasToBlob(canvas, 'image/jpeg', q)
      if (blob && blob.size <= maxBytes) break
    }

    while (blob && blob.size > maxBytes && Math.max(canvas.width, canvas.height) > 800) {
      const w = Math.round(canvas.width * 0.8)
      const h = Math.round(canvas.height * 0.8)
      const next = document.createElement('canvas')
      next.width = w
      next.height = h
      const nctx = next.getContext('2d')
      if (!nctx) break
      nctx.imageSmoothingEnabled = true
      nctx.imageSmoothingQuality = 'high'
      nctx.drawImage(canvas, 0, 0, w, h)
      canvas.width = w
      canvas.height = h
      ctx.drawImage(next, 0, 0)
      blob = await canvasToBlob(canvas, 'image/jpeg', 0.7)
    }

    if (!blob) throw new Error('이미지 인코딩 실패')

    const baseName = file.name.replace(/\.\w+$/, '') || 'image'
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  } finally {
    bitmap.close?.()
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality))
}

/**
 * 이미지를 원본 대비 약 1/10 용량으로 압축합니다.
 * Canvas API로 리사이즈 + JPEG quality 조절을 병행합니다.
 */
export function compressImage(file: File, targetRatio = 0.1): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const scale = Math.min(1, Math.sqrt(targetRatio * 3))
      const width = Math.round(img.width * scale)
      const height = Math.round(img.height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas context 생성 실패')); return }

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('이미지 압축 실패')); return }
          const compressed = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
            type: 'image/jpeg',
          })
          resolve(compressed)
        },
        'image/jpeg',
        0.6,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('이미지 로드 실패'))
    }

    img.src = url
  })
}
