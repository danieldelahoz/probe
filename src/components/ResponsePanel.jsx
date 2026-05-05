import { useState, useRef, useEffect } from 'react'
import { useRequestStore } from '@/stores/requestStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MagnifyingGlass, X } from '@phosphor-icons/react'

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

  const [search, setSearch] = useState('')
  const searchInputRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        const target = e.target
        if (target?.closest && target.closest('[data-response-panel]')) {
          e.preventDefault()
          searchInputRef.current?.focus()
          searchInputRef.current?.select()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const matchCount = search ? countMatches(displayBody, search) : 0
  const highlightedBody = search ? highlightMatches(displayBody, search) : null

  return (
    <section
      className="flex-1 p-4 flex flex-col min-h-0"
      data-response-panel
    >
      <div className="flex gap-4 mb-3 text-sm items-center">
        <span className={`px-2 py-0.5 rounded font-medium ${statusKind.classes}`}>
          {response.status} {response.statusText}
        </span>
        <span className="text-muted-foreground">{response.durationMs} ms</span>
        <span className="text-muted-foreground">{formatBytes(response.sizeBytes)}</span>

        <div className="ml-auto flex items-center gap-2 max-w-md flex-1">
          <div className="relative flex-1">
            <MagnifyingGlass
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search response…"
              className="pl-8 pr-8 h-8 text-xs font-mono"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
          {search && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {matchCount} {matchCount === 1 ? 'match' : 'matches'}
            </span>
          )}
        </div>
      </div>

      <pre className="bg-muted/30 rounded p-4 text-xs overflow-auto probe-scrollbar flex-1 whitespace-pre-wrap break-words">
        {highlightedBody || displayBody}
      </pre>
    </section>
  )
}

function countMatches(text, query) {
  if (!query) return 0
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  let count = 0
  let pos = 0
  while ((pos = lowerText.indexOf(lowerQuery, pos)) !== -1) {
    count++
    pos += lowerQuery.length
  }
  return count
}

function highlightMatches(text, query) {
  if (!query) return text
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const result = []
  let lastIndex = 0
  let pos = 0

  while ((pos = lowerText.indexOf(lowerQuery, lastIndex)) !== -1) {
    if (pos > lastIndex) {
      result.push(text.slice(lastIndex, pos))
    }
    result.push(
      <mark
        key={pos}
        className="bg-amber-200 dark:bg-amber-700/50 text-foreground rounded-sm px-0.5"
      >
        {text.slice(pos, pos + query.length)}
      </mark>
    )
    lastIndex = pos + query.length
  }

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex))
  }

  return result
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