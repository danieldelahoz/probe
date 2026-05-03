import { useRequestStore } from '@/stores/requestStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group'

const AUTH_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'apiKey', label: 'API Key' },
  { value: 'oauth2', label: 'OAuth 2.0' },
]

export default function AuthEditor() {
  const auth = useRequestStore((s) => s.auth)
  const setAuthType = useRequestStore((s) => s.setAuthType)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Label className="w-24">Type</Label>
        <Select value={auth.type} onValueChange={setAuthType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AUTH_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {auth.type === 'none' && <NoneEditor />}
      {auth.type === 'bearer' && <BearerEditor />}
      {auth.type === 'basic' && <BasicEditor />}
      {auth.type === 'apiKey' && <ApiKeyEditor />}
      {auth.type === 'oauth2' && <OAuth2Editor />}
    </div>
  )
}

function NoneEditor() {
  return (
    <div className="text-sm text-muted-foreground italic py-4 px-3 bg-muted/30 rounded">
      No authentication will be sent with this request.
    </div>
  )
}

function BearerEditor() {
  const token = useRequestStore((s) => s.auth.bearer.token)
  const setAuthConfig = useRequestStore((s) => s.setAuthConfig)
  return (
    <Field label="Token">
      <Input
        type="password"
        value={token}
        onChange={(e) => setAuthConfig('bearer', { token: e.target.value })}
        placeholder="eyJhbGciOiJIUzI1NiIsInR..."
        className="font-mono text-sm"
      />
    </Field>
  )
}

function BasicEditor() {
  const username = useRequestStore((s) => s.auth.basic.username)
  const password = useRequestStore((s) => s.auth.basic.password)
  const setAuthConfig = useRequestStore((s) => s.setAuthConfig)
  return (
    <>
      <Field label="Username">
        <Input
          value={username}
          onChange={(e) => setAuthConfig('basic', { username: e.target.value })}
          className="font-mono text-sm"
        />
      </Field>
      <Field label="Password">
        <Input
          type="password"
          value={password}
          onChange={(e) => setAuthConfig('basic', { password: e.target.value })}
          className="font-mono text-sm"
        />
      </Field>
    </>
  )
}

function ApiKeyEditor() {
  const { key, value, location } = useRequestStore((s) => s.auth.apiKey)
  const setAuthConfig = useRequestStore((s) => s.setAuthConfig)
  return (
    <>
      <Field label="Key">
        <Input
          value={key}
          onChange={(e) => setAuthConfig('apiKey', { key: e.target.value })}
          placeholder="X-API-Key"
          className="font-mono text-sm"
        />
      </Field>
      <Field label="Value">
        <Input
          type="password"
          value={value}
          onChange={(e) => setAuthConfig('apiKey', { value: e.target.value })}
          className="font-mono text-sm"
        />
      </Field>
      <Field label="Add to">
        <RadioGroup
          value={location}
          onValueChange={(v) => setAuthConfig('apiKey', { location: v })}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="header" id="apikey-header" />
            <Label htmlFor="apikey-header" className="cursor-pointer text-sm">Header</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="query" id="apikey-query" />
            <Label htmlFor="apikey-query" className="cursor-pointer text-sm">Query Param</Label>
          </div>
        </RadioGroup>
      </Field>
    </>
  )
}

function OAuth2Editor() {
  const oauth2 = useRequestStore((s) => s.auth.oauth2)
  const setAuthConfig = useRequestStore((s) => s.setAuthConfig)
  const set = (patch) => setAuthConfig('oauth2', patch)

  return (
    <>
      <Field label="Token URL">
        <Input
          value={oauth2.tokenUrl}
          onChange={(e) => set({ tokenUrl: e.target.value })}
          placeholder="https://accounts.example.com/oauth/token"
          className="font-mono text-sm"
        />
      </Field>
      <Field label="Client ID">
        <Input
          value={oauth2.clientId}
          onChange={(e) => set({ clientId: e.target.value })}
          className="font-mono text-sm"
        />
      </Field>
      <Field label="Client Secret">
        <Input
          type="password"
          value={oauth2.clientSecret}
          onChange={(e) => set({ clientSecret: e.target.value })}
          className="font-mono text-sm"
        />
      </Field>
      <Field label="Scope">
        <Input
          value={oauth2.scope}
          onChange={(e) => set({ scope: e.target.value })}
          placeholder="(optional, space-separated)"
          className="font-mono text-sm"
        />
      </Field>
      <TokenStatus oauth2={oauth2} onClear={() => set({ cachedToken: null, expiresAt: null })} />
    </>
  )
}

function TokenStatus({ oauth2, onClear }) {
  if (!oauth2.cachedToken) {
    return (
      <div className="text-xs text-muted-foreground italic px-3 py-2 bg-muted/30 rounded">
        No token cached. One will be fetched on send.
      </div>
    )
  }

  const now = Date.now()
  const expiresInMs = oauth2.expiresAt ? new Date(oauth2.expiresAt).getTime() - now : 0
  const isExpired = expiresInMs <= 0
  const isExpiring = expiresInMs > 0 && expiresInMs <= 60_000

  let label = ''
  if (isExpired) {
    label = 'Token expired, will refresh on send'
  } else {
    const minutes = Math.floor(expiresInMs / 60_000)
    const seconds = Math.floor((expiresInMs % 60_000) / 1000)
    label = `Token cached, expires in ${minutes}m ${seconds}s`
  }

  const colorClass = isExpired
    ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
    : isExpiring
      ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
      : 'text-green-700 dark:text-green-400 bg-green-500/10'

  return (
    <div className={`flex items-center justify-between text-xs px-3 py-2 rounded ${colorClass}`}>
      <span>{label}</span>
      <button
        onClick={onClear}
        className="text-xs underline hover:no-underline"
      >
        Clear
      </button>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="flex items-start gap-3">
      <Label className="w-24 pt-2 text-sm">{label}</Label>
      <div className="flex-1">{children}</div>
    </div>
  )
}