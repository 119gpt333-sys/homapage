/** FOUC 방지: React 마운트 전에 html 클래스 동기화 */
try {
  const t = localStorage.getItem('theme')
  if (t === 'dark') document.documentElement.classList.add('dark')
  else if (t === 'light') document.documentElement.classList.remove('dark')
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark')
  }
} catch {
  /* ignore */
}
