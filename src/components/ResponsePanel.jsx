import { useRequestStore } from '@/stores/requestStore'

export default function ResponsePanel() {
  const response = useRequestStore((s) => s.response)
  const error = useRequestStore((s) => s.error)
  const isLoading = useRequestStore((s) => s.isLoading)

  if (isLoading) {
    return (
      <section className="flex-1 p-4 min-h-[200px]">
        <p className="text-sm text-muted-foreground italic">Sending request…</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="flex-1 p-4 min-h-[200px]">
        <div className="flex gap-4 mb-3 text-sm">
          <span className="px-2 py-0.5 bg-destructive/10 text-destructive rounded font-medium">
            {error.type}
          </span>
          {error.durationMs != null && (
            <span className="text-muted-foreground">{error.durationMs} ms</span>
          )}
        </div>
        <div className="bg-destructive/5 border border-destructive/20 rounded p-4 text-sm">
          <p className="font-medium mb-2">{error.message}</p>
          <p className="text-muted-foreground">{error.hint}</p>
        </div>
      </section>
    )
  }

  if (!response) {
    return (
      <section className="flex-1 p-4 min-h-[200px]">
        <div className="flex gap-4 mb-3 text-sm">
          <span className="text-muted-foreground">Status: —</span>
          <span className="text-muted-foreground">Time: — ms</span>
          <span className="text-muted-foreground">Size: — B</span>
        </div>
        <div className="bg-muted/30 rounded p-4 text-sm text-muted-foreground italic">
          Click Send to make your first request.
        </div>
      </section>
    )
  }

  return <ResponseDisplay response={response} />
}

function ResponseDisplay({ response }) {
  const isJson = response.contentType.includes('json')
  const displayBody = isJson ? prettyJson(response.body) : response.body
  const statusKind = getStatusKind(response.status)

  return (
    <section className="flex-1 p-4 flex flex-col min-h-0">
      <div className="flex gap-4 mb-3 text-sm items-center">
        <span className={`px-2 py-0.5 rounded font-medium ${statusKind.classes}`}>
          {response.status} {response.statusText}
        </span>
        <span className="text-muted-foreground">{response.durationMs} ms</span>
        <span className="text-muted-foreground">{formatBytes(response.sizeBytes)}</span>
      </div>
      <pre className="bg-muted/30 rounded p-4 text-xs overflow-auto flex-1 whitespace-pre-wrap break-words">
        {displayBody}
      </pre>
    </section>
  )
}

function getStatusKind(status) {
  if (status >= 200 && status < 300) return { classes: 'bg-green-500/10 text-green-700 dark:text-green-400' }
  if (status >= 300 && status < 400) return { classes: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' }
  if (status >= 400 && status < 500) return { classes: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' }
  if (status >= 500) return { classes: 'bg-destructive/10 text-destructive' }
  return { classes: 'bg-muted text-muted-foreground' }
}

function prettyJson(text) {
  try { return JSON.stringify(JSON.parse(text), null, 2) }
  catch { return text }
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}