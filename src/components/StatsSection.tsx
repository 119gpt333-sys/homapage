import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { KnowledgeStats } from '../lib/supabaseClient'

function useCountUp(target: number, enabled: boolean, durationMs = 1100) {
  const [value, setValue] = useState(0)

  useLayoutEffect(() => {
    if (!enabled || target < 0) {
      setValue(0)
      return
    }

    setValue(0)
    const start = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - (1 - t) ** 2.8
      setValue(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
      else setValue(target)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, enabled])

  return value
}

interface StatsSectionProps {
  stats: KnowledgeStats | null
  loading: boolean
}

export function StatsSection({ stats, loading }: StatsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true)
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const s = stats ?? {
    totalPosts: 0,
    categoryCount: 6,
    totalViews: 0,
    activeContributors: 0,
  }

  const run = inView && !loading

  const nContent = useCountUp(s.totalPosts, run)
  const nCategory = useCountUp(s.categoryCount, run)
  const nViews = useCountUp(s.totalViews, run)
  const nAuthors = useCountUp(s.activeContributors, run)

  const items = [
    { target: s.totalPosts, animated: nContent, label: '등록된 콘텐츠' },
    { target: s.categoryCount, animated: nCategory, label: '카테고리' },
    { target: s.totalViews, animated: nViews, label: '총 조회수' },
    { target: s.activeContributors, animated: nAuthors, label: '활성 기여자' },
  ] as const

  return (
    <section
      ref={sectionRef}
      className="border-t border-[var(--color-border)] pt-10"
      aria-label="아카이브 통계"
    >
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {items.map((item) => {
          const display =
            loading ? '—' : run ? item.animated.toLocaleString('ko-KR') : item.target.toLocaleString('ko-KR')
          return (
            <div
              key={item.label}
              className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 text-center"
            >
              <p className="text-3xl font-bold tabular-nums text-red-600 md:text-4xl">{display}</p>
              <p className="mt-2 text-sm font-medium text-[var(--color-text-secondary)]">{item.label}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
