import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-white/10 bg-card/60 p-5 shadow-glass backdrop-blur-xl',
        'transition-colors duration-200 hover:border-white/20',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

