import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type CategoryCode =
  | 'AI_UTIL'
  | 'FIELD'
  | 'EQUIPMENT'
  | 'PREVENTION'
  | 'LECTURE'
  | 'NOTICE'
  | 'BOARD'
  | 'RESEARCH'

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  category: CategoryCode
}

const categoryColors: Record<CategoryCode, string> = {
  AI_UTIL: 'from-cyan-500/80 to-teal-500/80',
  FIELD: 'from-red-500/80 to-orange-500/80',
  EQUIPMENT: 'from-sky-500/80 to-cyan-400/80',
  PREVENTION: 'from-emerald-500/80 to-lime-400/80',
  LECTURE: 'from-violet-500/80 to-indigo-500/80',
  NOTICE: 'from-amber-500/80 to-red-500/80',
  BOARD: 'from-slate-500/80 to-slate-300/80',
  RESEARCH: 'from-fuchsia-500/80 to-rose-500/80',
}

export function Badge({ category, className, children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-white/90',
        'bg-gradient-to-r',
        categoryColors[category],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

