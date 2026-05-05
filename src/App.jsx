import { useEffect } from 'react'
import { useRequestStore } from '@/stores/requestStore'
import { useEnvStore } from '@/stores/envStore'
import { useThemeStore } from '@/stores/themeStore'
import Sidebar from '@/components/Sidebar'
import RequestPanel from '@/components/RequestPanel'
import ResponsePanel from '@/components/ResponsePanel'
import { Button } from '@/components/ui/button'
import { Sun, Moon } from '@phosphor-icons/react'

function App() {
  const send = useRequestStore((s) => s.send)

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        send()
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const urlInput = document.querySelector('[data-url-input]')
        if (urlInput) urlInput.focus()
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('probe:open-env-editor'))
        return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [send])

  return (
    <>
      <DesktopOnly />
      <div className="h-screen flex flex-col bg-background text-foreground">
        <header className="border-b px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-semibold">Probe</span>
            <span className="text-xs text-muted-foreground">
              Created by <a href="https://danield.dev" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">danield.dev</a>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ActiveEnvBadge />
          </div>
        </header>
        <main className="flex flex-1 min-h-0">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <RequestPanel />
            <ResponsePanel />
          </div>
        </main>
      </div>
    </>
  )
}

function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const isDark = theme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-7 w-7"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
    </Button>
  )
}

function ActiveEnvBadge() {
  const environments = useEnvStore((s) => s.environments)
  const activeId = useEnvStore((s) => s.activeId)
  const active = environments.find((e) => e.id === activeId)
  return (
    <span className="text-xs text-muted-foreground border px-2 py-0.5 rounded">
      env: {active ? active.name : 'none'}
    </span>
  )
}

function DesktopOnly() {
  return (
    <div className="md:hidden fixed inset-0 z-50 bg-background flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-sm">
        <div className="text-2xl font-semibold">Probe</div>
        <p className="text-muted-foreground text-sm">
          Probe is a developer tool built for desktop. Open it on a laptop or larger screen for the full experience.
        </p>
        <p className="text-xs text-muted-foreground">
          probe.danield.dev
        </p>
      </div>
    </div>
  )
}

export default App