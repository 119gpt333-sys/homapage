import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Menu, X, Moon, Sun, Search, PenLine } from 'lucide-react'

type ThemeMode = 'dark' | 'light'

function readStoredTheme(): ThemeMode {
  try {
    const v = localStorage.getItem('theme')
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle('dark', mode === 'dark')
  document.documentElement.classList.remove(mode === 'dark' ? 'light' : 'dark')
  try {
    localStorage.setItem('theme', mode)
  } catch {
    /* ignore */
  }
}

interface HeaderProps {
  topOffsetPx?: number
}

export function Header({ topOffsetPx = 0 }: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(() =>
    location.pathname === '/' ? (searchParams.get('q') ?? '') : '',
  )
  const [theme, setTheme] = useState<ThemeMode>(() => readStoredTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (location.pathname === '/') {
      setSearchInput(searchParams.get('q') ?? '')
    }
  }, [location.pathname, searchParams])

  const isDark = theme === 'dark'

  return (
    <header
      className="fixed inset-x-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80"
      style={{
        top: topOffsetPx,
        transition: 'top 0.4s ease-out',
      }}
    >
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <span
              className="text-base font-bold tracking-tight text-zinc-900 dark:text-white"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              서울소방 GPT
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="주요 메뉴">
            {/* Search toggle */}
            {searchOpen ? (
              <form
                role="search"
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  const q = searchInput.trim()
                  navigate(q ? `/?q=${encodeURIComponent(q)}` : '/')
                  setSearchOpen(false)
                }}
              >
                <div className="relative">
                  <input
                    type="search"
                    name="q"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="검색..."
                    autoFocus
                    autoComplete="off"
                    className="h-9 w-56 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false)
                    if (!searchInput.trim() && location.pathname === '/') navigate('/')
                  }}
                  className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                aria-label="검색"
              >
                <Search className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
              to="/write"
              className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3.5 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <PenLine className="h-3.5 w-3.5" />
              글쓰기
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-lg p-2 text-zinc-700 md:hidden dark:text-zinc-300"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-zinc-200 bg-white/95 backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
          <nav className="mx-auto flex max-w-[1200px] flex-col gap-1 px-6 py-4" aria-label="모바일 메뉴">
            {/* Mobile search */}
            <form
              role="search"
              className="mb-2"
              onSubmit={(e) => {
                e.preventDefault()
                const q = searchInput.trim()
                navigate(q ? `/?q=${encodeURIComponent(q)}` : '/')
                setMobileOpen(false)
              }}
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <input
                  type="search"
                  name="q"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="검색..."
                  autoComplete="off"
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500"
                />
              </div>
            </form>

            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              홈
            </Link>
            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? '라이트 모드' : '다크 모드'}
            </button>
            <Link
              to="/write"
              onClick={() => setMobileOpen(false)}
              className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2.5 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <PenLine className="h-3.5 w-3.5" />
              글쓰기
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
