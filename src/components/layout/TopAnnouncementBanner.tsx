import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type TransitionEvent,
} from 'react'
import { X } from 'lucide-react'

/** 디자인·문구 바꿀 때마다 접미사 올리면, 예전에 닫은 사용자도 새 배너를 다시 볼 수 있음 */
const TOP_BANNER_SESSION_KEY = 'seoul-fire-gpt-community-banner-dismissed-v2'

const NOTION_COMMUNITY_URL =
  'https://www.notion.so/ryan-chat/gpt-20bd780256ab80729036c755aabd0f6b?p=e0f26096a77f47978e1d2f6a47add277&pm=s'

/** 상단 여백(pt-2) + 플로팅 pill + 하단 여백(pb-1) — PageShell·헤더 오프셋과 맞출 것 */
const TOP_ANNOUNCEMENT_BANNER_RESERVE_PX = 38

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(TOP_BANNER_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

type Phase = 'gone' | 'shown' | 'leaving'

interface TopAnnouncementBannerProps {
  /** Supabase 경고 배너 높이만큼 아래에서 시작 */
  offsetTopPx: number
  /** 표시 중일 때 본문·헤더에 더할 높이 (0 또는 예약 px) */
  onReserveHeightChange: (heightPx: number) => void
}

export function TopAnnouncementBanner({ offsetTopPx, onReserveHeightChange }: TopAnnouncementBannerProps) {
  const [phase, setPhase] = useState<Phase>(() =>
    typeof window !== 'undefined' && readDismissed() ? 'gone' : 'shown',
  )
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  const reportReserve = useCallback(
    (px: number) => {
      onReserveHeightChange(px)
    },
    [onReserveHeightChange],
  )

  useLayoutEffect(() => {
    if (phase === 'gone') reportReserve(0)
    else reportReserve(TOP_ANNOUNCEMENT_BANNER_RESERVE_PX)
  }, [phase, reportReserve])

  const handleClose = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (phase === 'leaving' || phase === 'gone') return
    setPhase('leaving')
  }

  const handleTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== 'transform') return
    if (phaseRef.current !== 'leaving') return
    try {
      sessionStorage.setItem(TOP_BANNER_SESSION_KEY, '1')
    } catch {
      /* ignore */
    }
    reportReserve(0)
    setPhase('gone')
  }

  if (phase === 'gone') return null

  const offscreen = phase === 'leaving'

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[1000] flex justify-center px-3 pt-2 pb-1"
      style={{ top: offsetTopPx }}
    >
      <div
        className="pointer-events-auto w-full max-w-md transition-transform duration-[400ms] ease-out sm:max-w-xl sm:w-auto"
        style={{
          transform: offscreen ? 'translateY(calc(-100% - 12px))' : 'translateY(0)',
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        <div
          className="relative flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 py-1 pl-2.5 pr-7 text-zinc-700 sm:gap-2 sm:py-1.5 sm:pl-3 sm:pr-8 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          style={{
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >
          <a
            href={NOTION_COMMUNITY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-0 min-w-0 flex-1 items-center justify-center gap-1.5 text-center text-[11px] font-medium leading-tight text-zinc-700 no-underline transition-opacity hover:opacity-80 dark:text-zinc-300 sm:gap-2 sm:text-xs md:text-[13px]"
          >
            <span className="shrink-0 text-sm leading-none sm:text-base" aria-hidden>
              🚒
            </span>
            <span className="hidden min-w-0 sm:inline">
              <span className="hidden md:inline">서울소방GPT 커뮤니티(노션)가 오픈되었습니다 </span>
              <span className="md:hidden">커뮤니티(노션) 오픈 · </span>
              <span className="whitespace-nowrap">자세히 보기 →</span>
            </span>
            <span className="max-w-[11rem] truncate sm:hidden">커뮤니티(노션) 오픈 · 보기 →</span>
          </a>
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700 sm:right-1.5 sm:h-7 sm:w-7"
            aria-label="공지 배너 닫기"
          >
            <X className="h-3 w-3" strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
