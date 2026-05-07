import { useRequestStore } from '@/stores/requestStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowsClockwise, Copy } from '@phosphor-icons/react'
import { useState } from 'react'

export default function HistoryDetail({ entry, open, onOpenChange }) {
  const loadFromHistory = useRequestStore((s) => s.loadFromHistory)

  if (!entry) return null

  const handleRerun = () => {
    loadFromHistory(entry.snapshot)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl w-[90vw] h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-3 text-base">
            <span className={`font-medium ${methodColor(entry.method)}`}>
              {entry.method}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusKindClasses(entry.status)}`}>
              {entry.status ?? 'failed'}
            </span>
            <span className="text-xs text-muted-foreground font-normal">
              {entry.durationMs}ms
            </span>
            {entry.envName && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-normal">
                {entry.envName}
              </span>
            )}
            {entry.count > 1 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-normal">
                ×{entry.count}
              </span>
            )}
            <span className="text-xs text-muted-foreground font-normal ml-auto">
              {formatTimestamp(entry.timestamp)}
            </span>
          </DialogTitle>
          <p className="font-mono text-xs text-muted-foreground truncate pt-1">
            {entry.url}
          </p>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden px-6 py-4">
          <Tabs defaultValue="response" className="h-full flex flex-col">
            <TabsList className="bg-transparent p-0 h-auto justify-start gap-6 border-b rounded-none w-full shrink-0">
              <TabsTrigger
                value="response"
                className="bg-transparent border-0 rounded-none px-0 pb-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground text-muted-foreground data-[state=active]:text-foreground"
              >
                Response
              </TabsTrigger>
              <TabsTrigger
                value="request"
                className="bg-transparent border-0 rounded-none px-0 pb-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground text-muted-foreground data-[state=active]:text-foreground"
              >
                Request
              </TabsTrigger>
            </TabsList>

            <TabsContent value="response" className="flex-1 min-h-0 mt-4">
              <ResponseView entry={entry} />
            </TabsContent>

            <TabsContent value="request" className="flex-1 min-h-0 mt-4">
              <RequestView entry={entry} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t px-6 py-4 flex justify-end gap-2 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRerun} className="gap-2">
            <ArrowsClockwise size={14} />
            Use this request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ResponseView({ entry }) {
  if (entry.errorSnapshot) {
    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded p-4 text-sm h-full overflow-auto probe-scrollbar">
        <p className="font-medium mb-2">{entry.errorSnapshot.message}</p>
        <p className="text-muted-foreground">{entry.errorSnapshot.hint}</p>
      </div>
    )
  }

  if (!entry.responseSnapshot) {
    return (
      <p className="text-sm text-muted-foreground italic">No response data stored for this entry.</p>
    )
  }

  const { responseSnapshot: r } = entry
  const isJson = r.contentType?.includes('json')
  const displayBody = isJson ? prettyJson(r.body) : r.body

  return (
    <Tabs defaultValue="body" className="h-full flex flex-col">
      <TabsList className="bg-transparent p-0 h-auto justify-start gap-6 border-b rounded-none w-full shrink-0">
        <TabsTrigger
          value="body"
          className="bg-transparent border-0 rounded-none px-0 pb-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground text-muted-foreground data-[state=active]:text-foreground"
        >
          Body
        </TabsTrigger>
        <TabsTrigger
          value="headers"
          className="bg-transparent border-0 rounded-none px-0 pb-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground text-muted-foreground data-[state=active]:text-foreground"
        >
          Headers ({Object.keys(r.headers || {}).length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="body" className="flex-1 min-h-0 mt-4">
        <div className="h-full flex flex-col">
          {r.bodyTruncated && (
            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 px-3 py-2 rounded mb-2 shrink-0">
              Response body was truncated to 100KB for history storage. Re-run to see the full response.
            </p>
          )}
          <CopyablePre text={displayBody} />
        </div>
      </TabsContent>
      <TabsContent value="headers" className="flex-1 min-h-0 mt-4">
        <HeadersTable headers={r.headers || {}} />
      </TabsContent>
    </Tabs>
  )
}

function RequestView({ entry }) {
  const { snapshot } = entry
  const enabledParams = (snapshot.params || []).filter((p) => p.enabled && p.key.trim())
  const enabledHeaders = (snapshot.headers || []).filter((h) => h.enabled && h.key.trim())
  const hasBody = snapshot.body?.type !== 'none' && snapshot.body?.content?.trim()
  const authType = snapshot.auth?.type || 'none'

  return (
    <div className="space-y-4 h-full overflow-auto probe-scrollbar pr-2">
      <Section title="URL (template)">
        <pre className="font-mono text-xs bg-muted/50 p-3 rounded whitespace-pre-wrap break-all">
          {snapshot.url || '(empty)'}
        </pre>
      </Section>

      {enabledParams.length > 0 && (
        <Section title={`Query parameters (${enabledParams.length})`}>
          <KeyValueTable rows={enabledParams.map((p) => [p.key, p.value])} />
        </Section>
      )}

      {enabledHeaders.length > 0 && (
        <Section title={`Headers (${enabledHeaders.length})`}>
          <KeyValueTable rows={enabledHeaders.map((h) => [h.key, h.value])} />
        </Section>
      )}

      {hasBody && (
        <Section title={`Body (${snapshot.body.type})`}>
          <pre className="font-mono text-xs bg-muted/50 p-3 rounded whitespace-pre-wrap break-words max-h-64 overflow-auto probe-scrollbar">
            {snapshot.body.content}
          </pre>
        </Section>
      )}

      <Section title={`Auth (${authType})`}>
        <AuthSummary auth={snapshot.auth} />
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{title}</p>
      {children}
    </div>
  )
}

function KeyValueTable({ rows }) {
  return (
    <div className="border rounded overflow-hidden">
      <table className="w-full text-xs font-mono">
        <tbody>
          {rows.map(([k, v], i) => (
            <tr key={i} className="border-b last:border-b-0">
              <td className="px-3 py-2 text-muted-foreground w-1/3 align-top">{k}</td>
              <td className="px-3 py-2 break-all align-top">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HeadersTable({ headers }) {
  const entries = Object.entries(headers)
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No headers.</p>
  }
  return (
    <div className="h-full overflow-auto probe-scrollbar">
      <KeyValueTable rows={entries} />
    </div>
  )
}

function AuthSummary({ auth }) {
  if (!auth || auth.type === 'none') {
    return <p className="text-xs text-muted-foreground italic">No authentication.</p>
  }

  if (auth.type === 'bearer') {
    return <p className="text-xs font-mono text-muted-foreground">Bearer token: {maskValue(auth.bearer?.token)}</p>
  }

  if (auth.type === 'basic') {
    return (
      <p className="text-xs font-mono text-muted-foreground">
        Basic: {auth.basic?.username || '(no user)'} / {maskValue(auth.basic?.password)}
      </p>
    )
  }

  if (auth.type === 'apiKey') {
    return (
      <p className="text-xs font-mono text-muted-foreground">
        {auth.apiKey?.key} ({auth.apiKey?.location}): {maskValue(auth.apiKey?.value)}
      </p>
    )
  }

  if (auth.type === 'oauth2') {
    return (
      <div className="text-xs font-mono text-muted-foreground space-y-1">
        <p>Token URL: {auth.oauth2?.tokenUrl}</p>
        <p>Client ID: {auth.oauth2?.clientId}</p>
        <p>Client secret: {maskValue(auth.oauth2?.clientSecret)}</p>
        {auth.oauth2?.scope && <p>Scope: {auth.oauth2.scope}</p>}
      </div>
    )
  }

  return null
}

function CopyablePre({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // not worth surfacing
    }
  }

  return (
    <div className="relative h-full">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 text-xs px-2 py-1 bg-background border rounded text-muted-foreground hover:text-foreground"
        title="Copy"
      >
        {copied ? 'Copied' : <Copy size={12} />}
      </button>
      <pre className="bg-muted/30 rounded p-4 text-xs h-full overflow-auto probe-scrollbar whitespace-pre-wrap break-words">
        {text}
      </pre>
    </div>
  )
}

function maskValue(v) {
  if (!v) return '(empty)'
  if (v.length <= 4) return '•'.repeat(v.length)
  return v.slice(0, 2) + '•'.repeat(Math.min(v.length - 4, 8)) + v.slice(-2)
}

const METHOD_COLORS = {
  GET: 'text-green-700 dark:text-green-400',
  POST: 'text-blue-700 dark:text-blue-400',
  PUT: 'text-amber-700 dark:text-amber-400',
  PATCH: 'text-amber-700 dark:text-amber-400',
  DELETE: 'text-red-700 dark:text-red-400',
}

function methodColor(method) {
  return METHOD_COLORS[method] || 'text-foreground'
}

function statusKindClasses(status) {
  if (status == null) return 'bg-destructive/10 text-destructive'
  if (status >= 200 && status < 300) return 'bg-green-500/10 text-green-700 dark:text-green-400'
  if (status >= 300 && status < 400) return 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
  if (status >= 400 && status < 500) return 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
  if (status >= 500) return 'bg-destructive/10 text-destructive'
  return 'bg-muted text-muted-foreground'
}

function prettyJson(text) {
  try { return JSON.stringify(JSON.parse(text), null, 2) }
  catch { return text }
}

function formatTimestamp(iso) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}