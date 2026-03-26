/** FOUC 방지: React 마운트 전에 html 클래스 동기화 */
try {
  const t = localStorage.getItem('theme')
  if (t === 'light') document.documentElement.classList.add('light')
  else if (t === 'dark') document.documentElement.classList.remove('light')
  else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    document.documentElement.classList.add('light')
  }
} catch {
  /* ignore */
}
