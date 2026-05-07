import { useState } from 'react'
import { useRequestStore } from '@/stores/requestStore'
import { useEnvStore } from '@/stores/envStore'
import { interpolate } from '@/lib/interpolate'
import { buildCurl } from '@/lib/curlBuilder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Copy, Check } from '@phosphor-icons/react'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

export default function UrlBar() {
  const method = useRequestStore((s) => s.method)
  const url = useRequestStore((s) => s.url)
  const params = useRequestStore((s) => s.params)
  const headers = useRequestStore((s) => s.headers)
  const body = useRequestStore((s) => s.body)
  const auth = useRequestStore((s) => s.auth)
  const isLoading = useRequestStore((s) => s.isLoading)
  const setMethod = useRequestStore((s) => s.setMethod)
  const setUrl = useRequestStore((s) => s.setUrl)
  const send = useRequestStore((s) => s.send)
  const reset = useRequestStore((s) => s.reset)

  const environments = useEnvStore((s) => s.environments)
  const activeId = useEnvStore((s) => s.activeId)
  const activeEnv = environments.find((e) => e.id === activeId)

  const [copied, setCopied] = useState(false)

  const vars = {}
  if (activeEnv) {
    activeEnv.variables.forEach((v) => {
      if (v.key.trim()) vars[v.key] = v.value
    })
  }
  const interpolated = interpolate(url, vars)
  const showPreview = url.includes('{{') && interpolated !== url

  const canSend = url.trim().length > 0 && !isLoading
  const canCopyCurl = url.trim().length > 0

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') send()
  }

  const handleCopyCurl = async () => {
    const curl = buildCurl({ method, url, params, headers, body, auth, vars })
    if (!curl) return
    try {
      await navigator.clipboard.writeText(curl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard might fail in non-secure contexts; fail silently
    }
  }

    return (
    <div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={reset}
          title="New request (clear all fields)"
        >
          New
        </Button>

        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METHODS.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1 min-w-0">
          <Input
            type="text"
            data-url-input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://api.example.com/endpoint"
            className="font-mono w-full"
          />
          {showPreview && (
            <div className="text-xs text-muted-foreground mt-1.5 font-mono truncate">
              → {interpolated}
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleCopyCurl}
          disabled={!canCopyCurl}
          title="Copy as curl command"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </Button>

        <Button onClick={send} disabled={!canSend} className="min-w-[80px]">
          {isLoading ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </div>
    )
}