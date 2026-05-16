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

export function Badge({ category, className, children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
        'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
