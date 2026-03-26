interface LogoProps {
  size?: number
  className?: string
  /** 기본 true (장식용 SVG) */
  ariaHidden?: boolean
}

export function Logo({ size = 36, className, ariaHidden = true }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden={ariaHidden ? true : undefined}
    >
      <circle cx="16" cy="16" r="16" fill="#dc2626" />
      <path
        d="M16 6c0 0-7 6-7 13a7 7 0 0 0 14 0c0-7-7-13-7-13z"
        fill="rgba(255,255,255,0.95)"
      />
      <path
        d="M16 14c0 0-3.5 3-3.5 6.5a3.5 3.5 0 0 0 7 0c0-3.5-3.5-6.5-3.5-6.5z"
        fill="#dc2626"
      />
    </svg>
  )
}
