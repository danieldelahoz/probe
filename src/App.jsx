import Sidebar from '@/components/Sidebar'
import RequestPanel from '@/components/RequestPanel'
import ResponsePanel from '@/components/ResponsePanel'

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b px-4 py-2 flex items-center justify-between">
        <span className="font-semibold">Probe</span>
        <span className="text-xs text-muted-foreground border px-2 py-0.5 rounded">
          env: none
        </span>
      </header>
      <main className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1">
          <RequestPanel />
          <ResponsePanel />
        </div>
      </main>
    </div>
  )
}

export default App