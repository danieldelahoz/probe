import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">Probe</h1>
        <p className="text-muted-foreground">A REST client for people who debug APIs.</p>
        <Button>Get started</Button>
      </div>
    </div>
  )
}

export default App