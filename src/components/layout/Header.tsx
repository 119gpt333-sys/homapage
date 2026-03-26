import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Menu, X, Moon, Sun, Search } from 'lucide-react'
import { Logo } from '../Logo'

type ThemeMode = 'dark' | 'light'

function readStoredTheme(): ThemeMode {
  try {
    const v = localStorage.getItem('theme')
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light'
  }
  return 'dark'
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle('light', mode === 'light')
  try {
    localStorage.setItem('theme', mode)
  } catch {
    /* ignore */
  }
}

interface HeaderProps {
  /** Supabase 알림 배너 등으로 헤더를 아래로 밀 때(px) */
  topOffsetPx?: number
}

export function Header({ topOffsetPx = 0 }: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(() =>
    location.pathname === '/' ? (searchParams.get('q') ?? '') : '',
  )
  const [scrolled, setScrolled] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>(() => readStoredTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (location.pathname === '/') {
      setSearchInput(searchParams.get('q') ?? '')
    }
  }, [location.pathname, searchParams])

  const isLight = theme === 'light'
  const homeActive = location.pathname === '/'

  const shellClass = isLight
    ? 'border-black/[0.08] bg-white/80'
    : 'border-white/5 bg-[#0c0c0e]/80'

  const borderScrollClass = scrolled
    ? isLight
      ? 'border-black/[0.14]'
      : 'border-white/[0.14]'
    : ''

  return (
    <header
      className={`fixed inset-x-0 z-50 border-b backdrop-blur-[20px] ${shellClass} ${borderScrollClass}`}
      style={{
        top: topOffsetPx,
        transition: 'top 0.4s ease-out, border-color 0.2s ease-out',
      }}
    >
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex h-14 items-center justify-between gap-4 md:h-16">
        <Link to="/" className="group flex min-w-0 items-center gap-3" onClick={() => setMobileOpen(false)}>
          <span className="inline-flex shrink-0 transition-transform group-hover:scale-[1.03]">
            <Logo
              size={36}
              className="drop-shadow-[0_4px_14px_rgba(220,38,38,0.45)]"
            />
          </span>
          <div className="min-w-0 text-left">
            <span
              className={`block truncate text-sm font-semibold tracking-wide ${isLight ? 'text-zinc-900' : 'text-white'}`}
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              서울소방 GPT
            </span>
            <span className={`block truncate text-[10px] font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              AI 지식 아카이브
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="주요 메뉴">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors ${
              homeActive
                ? isLight
                  ? 'text-zinc-900'
                  : 'text-white'
                : isLight
                  ? 'text-zinc-600 hover:text-zinc-900'
                  : 'text-zinc-400 hover:text-white'
            }`}
          >
            홈
          </Link>

          <button
            type="button"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              isLight ? 'bg-zinc-200/80 text-zinc-800 hover:bg-zinc-300' : 'bg-white/10 text-zinc-200 hover:bg-white/15'
            }`}
            aria-label={isLight ? '다크 모드로 전환' : '라이트 모드로 전환'}
          >
            {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => navigate('/write')}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500"
          >
            글쓰기
          </button>
        </nav>

        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className={`rounded-lg p-2 md:hidden ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        </div>

        <form
          role="search"
          aria-label="지식 아카이브 검색"
          className="flex gap-2 border-t py-3 md:py-2.5"
          style={{
            borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
          }}
          onSubmit={(e) => {
            e.preventDefault()
            const q = searchInput.trim()
            navigate(q ? `/?q=${encodeURIComponent(q)}` : '/')
            setMobileOpen(false)
          }}
        >
          <div className="relative min-w-0 flex-1">
            <Search
              className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                isLight ? 'text-zinc-400' : 'text-zinc-500'
              }`}
              aria-hidden
            />
            <input
              type="search"
              name="q"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="제목·요약·본문 검색…"
              autoComplete="off"
              className={`h-10 w-full rounded-xl border py-2 pl-9 pr-9 text-sm outline-none transition-[box-shadow,border-color] placeholder:opacity-60 focus:ring-2 focus:ring-red-500/35 ${
                isLight
                  ? 'border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400'
                  : 'border-white/10 bg-white/[0.06] text-zinc-100 placeholder:text-zinc-500'
              }`}
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('')
                  if (location.pathname === '/') navigate('/')
                }}
                className={`absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg transition-colors ${
                  isLight ? 'text-zinc-500 hover:bg-zinc-100' : 'text-zinc-400 hover:bg-white/10'
                }`}
                aria-label="검색어 지우기"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <button
            type="submit"
            className="h-10 shrink-0 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-500"
          >
            검색
          </button>
        </form>
      </div>

      {mobileOpen && (
        <div
          className={`border-t md:hidden ${isLight ? 'border-black/[0.08] bg-white/90' : 'border-white/10 bg-[#0c0c0e]/95'}`}
        >
          <nav className="mx-auto flex max-w-[1200px] flex-col gap-1 px-6 py-4" aria-label="모바일 메뉴">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                isLight ? 'text-zinc-800 hover:bg-zinc-100' : 'text-zinc-200 hover:bg-white/5'
              }`}
            >
              홈
            </Link>
            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
                isLight ? 'text-zinc-800 hover:bg-zinc-100' : 'text-zinc-200 hover:bg-white/5'
              }`}
            >
              {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {isLight ? '다크 모드' : '라이트 모드'}
            </button>
            <button
              type="button"
              onClick={() => {
                navigate('/write')
                setMobileOpen(false)
              }}
              className="mt-1 rounded-full bg-red-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-red-500"
            >
              글쓰기
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
