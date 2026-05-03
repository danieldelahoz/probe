import { useEffect } from 'react'
import { useRequestStore } from '@/stores/requestStore'
import Sidebar from '@/components/Sidebar'
import RequestPanel from '@/components/RequestPanel'
import ResponsePanel from '@/components/ResponsePanel'

function App() {
  const send = useRequestStore((s) => s.send)

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        send()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [send])

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <header className="border-b px-4 py-2 flex items-center justify-between shrink-0">
        <span className="font-semibold">Probe</span>
        <span className="text-xs text-muted-foreground border px-2 py-0.5 rounded">
          env: none
        </span>
      </header>
      <main className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <RequestPanel />
          <ResponsePanel />
        </div>
      </main>
    </div>
  )
}

export default App