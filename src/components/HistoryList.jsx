import { useHistoryStore } from '@/stores/historyStore'
import { useRequestStore } from '@/stores/requestStore'
import { Button } from '@/components/ui/button'

export default function HistoryList() {
  const entries = useHistoryStore((s) => s.entries)
  const clearAll = useHistoryStore((s) => s.clearAll)
  const loadFromHistory = useRequestStore((s) => s.loadFromHistory)

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">No requests yet</p>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-6 text-xs"
        >
          Clear
        </Button>
      </div>
      {entries.map((entry) => (
        <button
          key={entry.id}
          onClick={() => loadFromHistory(entry.snapshot)}
          className="w-full text-left p-2 rounded hover:bg-muted/50 transition-colors group"
        >
          <div className="flex items-center gap-2 text-xs">
            <span className={`font-medium ${methodColor(entry.method)}`}>
              {entry.method}
            </span>
            <span className={`font-medium ${statusColor(entry.status)}`}>
              {entry.status ?? '—'}
            </span>
            {entry.envName && (
              <span className="text-muted-foreground text-[10px] px-1.5 py-0.5 bg-muted rounded">
                {entry.envName}
              </span>
            )}
            <span className="text-muted-foreground ml-auto">{entry.durationMs}ms</span>
          </div>
          <div className="text-xs text-muted-foreground truncate mt-0.5 font-mono">
            {shortenUrl(entry.url)}
          </div>
        </button>
      ))}
    </div>
  )
}

function shortenUrl(url) {
  try {
    const u = new URL(url)
    return u.pathname + u.search
  } catch {
    return url
  }
}

function methodColor(method) {
  switch (method) {
    case 'GET': return 'text-green-700 dark:text-green-400'
    case 'POST': return 'text-blue-700 dark:text-blue-400'
    case 'PUT': return 'text-amber-700 dark:text-amber-400'
    case 'PATCH': return 'text-amber-700 dark:text-amber-400'
    case 'DELETE': return 'text-red-700 dark:text-red-400'
    default: return 'text-foreground'
  }
}

function statusColor(status) {
  if (status == null) return 'text-muted-foreground'
  if (status >= 200 && status < 300) return 'text-green-700 dark:text-green-400'
  if (status >= 300 && status < 400) return 'text-blue-700 dark:text-blue-400'
  if (status >= 400 && status < 500) return 'text-amber-700 dark:text-amber-400'
  if (status >= 500) return 'text-red-700 dark:text-red-400'
  return 'text-muted-foreground'
}