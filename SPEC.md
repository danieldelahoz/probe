# Probe — Build Spec

This is the internal build spec. The README is the external promise; this is the implementation contract. If you're reading this and you're not building Probe, you're in the wrong file.

## Scope reminder

V1 ships:
- Method + URL + Send
- Query params, headers, body editor
- Five auth presets including OAuth 2.0 client credentials
- Environments with variable interpolation
- History (50 entries)
- Keyboard shortcuts

V1 does *not* ship:
- Saved collections
- Pre-request scripts
- Test assertions
- cURL import
- Multi-tab requests
- Cloud sync

If you find yourself reaching for one of these mid-build, write it down in the README's roadmap and keep moving.

## State architecture

Three Zustand stores. Each has a single responsibility.

### `requestStore` — the active request

Holds the currently-edited request. Resets when the user clicks "New" or selects from history.

```js
{
  method: 'GET',
  url: '',
  params: [
    // { id: nanoid, key: '', value: '', enabled: true }
  ],
  headers: [
    // { id: nanoid, key: '', value: '', enabled: true }
  ],
  body: {
    type: 'none',          // 'none' | 'json' | 'text' | 'form'
    content: '',
  },
  auth: {
    type: 'none',          // 'none' | 'bearer' | 'basic' | 'apiKey' | 'oauth2'
    config: {},            // shape depends on type — see Auth section
  },
  // computed during send, displayed in response panel
  response: null,          // null | ResponseShape (see below)
  isLoading: false,
  error: null,
}
```

Actions:
- `setMethod(method)`
- `setUrl(url)`
- `addParam()` / `updateParam(id, patch)` / `removeParam(id)` / `toggleParam(id)`
- `addHeader()` / `updateHeader(id, patch)` / `removeHeader(id)` / `toggleHeader(id)`
- `setBody(body)`
- `setAuth(auth)`
- `send()` — orchestrates the request, updates response/loading/error
- `loadFromHistory(historyEntry)` — populates the store from a history entry
- `reset()` — back to defaults

### `historyStore` — persisted request history

Persisted to localStorage under key `probe.history`. Capped at 50 entries (newest first, oldest evicted).

```js
{
  entries: [
    {
      id: nanoid,
      timestamp: ISO 8601 string,
      method: 'GET',
      url: 'https://...',         // resolved URL, not template
      status: 200,                 // null if request failed
      durationMs: 142,
      // full request snapshot for re-running
      snapshot: { method, url, params, headers, body, auth }
    }
  ]
}
```

Actions:
- `addEntry(entry)`
- `removeEntry(id)`
- `clearAll()`

### `envStore` — environments and variables

Persisted to localStorage under key `probe.environments`. Active environment ID also persisted.

```js
{
  environments: [
    {
      id: nanoid,
      name: 'Local',
      variables: [
        // { id: nanoid, key: 'baseUrl', value: 'http://localhost:3000' }
      ]
    }
  ],
  activeId: nanoid | null,
}
```

Actions:
- `addEnvironment(name)`
- `updateEnvironment(id, patch)`
- `removeEnvironment(id)`
- `setActive(id)`
- `addVariable(envId)` / `updateVariable(envId, varId, patch)` / `removeVariable(envId, varId)`

Selectors:
- `getActiveEnvironment()` — returns the active env object or null
- `getResolvedVars()` — returns flat `{ key: value }` map for interpolation

## Variable interpolation

Implemented in `lib/interpolate.js`. Single function:

```js
interpolate(template: string, vars: Record<string, string>): string
```

Behavior:
- `{{baseUrl}}/users` with `vars.baseUrl = 'https://api.example.com'` → `https://api.example.com/users`
- Unknown variables stay as-is and are highlighted in the UI: `{{missing}}` renders unchanged but with a warning indicator
- Variables resolve in: URL, header values, body content, auth config values
- Variables do NOT resolve in: header keys, param keys (intentional — keys should be literal)

Edge cases:
- Empty `vars` object → returns template unchanged
- Multiple vars in one string → all replaced
- Nested `{{` `}}` → only outermost matched (no recursion)
- Same var referenced twice → both replaced

## Auth configurations

Each auth type has its own `config` shape inside `requestStore.auth.config`.

### `none`
```js
config: {}
```

### `bearer`
```js
config: { token: string }
```
Adds header: `Authorization: Bearer {token}`

### `basic`
```js
config: { username: string, password: string }
```
Adds header: `Authorization: Basic {base64(username:password)}`

### `apiKey`
```js
config: {
  key: string,
  value: string,
  location: 'header' | 'query'
}
```
If `location === 'header'`: adds header `{key}: {value}`
If `location === 'query'`: appends `?{key}={value}` to URL

### `oauth2` — client credentials flow

This is the differentiator. Worth getting right.

```js
config: {
  tokenUrl: string,
  clientId: string,
  clientSecret: string,
  scope: string | null,         // optional
  // managed by the auth flow, not user-edited:
  cachedToken: string | null,
  expiresAt: ISO 8601 | null,
}
```

Flow:
1. User clicks Send
2. Before sending the actual request, check `cachedToken` and `expiresAt`
3. If token is missing or expires within 60 seconds: fetch a new one
4. Token request: `POST {tokenUrl}` with body `grant_type=client_credentials&client_id={...}&client_secret={...}&scope={...}` (form-urlencoded, scope omitted if null)
5. Response shape: `{ access_token, expires_in, token_type }`
6. Cache `cachedToken = access_token`, `expiresAt = now + expires_in seconds`
7. Add header to actual request: `Authorization: Bearer {cachedToken}`

UI must show:
- "Token cached, expires in 47m" when valid
- "Fetching token..." during refresh
- Token request errors prominently (clientId/secret wrong = most common)

The cached token persists in localStorage under `probe.oauth.{tokenUrl}.{clientId}` so it survives reloads.

## Response shape

What `requestStore.response` holds after a successful or failed-with-response request:

```js
{
  status: number,              // 200, 404, etc.
  statusText: string,          // "OK", "Not Found"
  headers: Record<string, string>,
  body: string,                // raw text always; pretty-printed on display
  contentType: string,         // 'application/json' | 'text/html' | etc.
  durationMs: number,
  sizeBytes: number,
}
```

Network failures (CORS, DNS, offline) populate `error` instead of `response`:

```js
error: {
  type: 'cors' | 'network' | 'invalidUrl' | 'unknown',
  message: string,
  hint: string,                // human-readable next step
}
```

CORS detection: `TypeError: Failed to fetch` with a valid URL is almost always CORS in browsers. Hint: see README's CORS section.

## Component contracts

```
<App>
├── <Sidebar>
│   ├── <EnvironmentSwitcher />     // dropdown, top of sidebar
│   ├── <HistoryList />             // scrollable, click to re-run
│   └── <EnvironmentEditor />       // modal, triggered from switcher
├── <RequestPanel>
│   ├── <UrlBar />                  // method + URL + Send
│   ├── <RequestTabs>               // Params | Headers | Body | Auth
│   │   ├── <ParamsEditor />
│   │   ├── <HeadersEditor />
│   │   ├── <BodyEditor />          // wraps Monaco
│   │   └── <AuthEditor />          // type selector + dynamic config
└── <ResponsePanel>
    ├── <ResponseStatus />          // status pill + timing + size
    └── <ResponseTabs>              // Body | Headers | Raw
```

Component responsibilities:

- **`<UrlBar>`** — controlled by `requestStore`. Enter key triggers `send()`. Cmd+Enter from anywhere also triggers.
- **`<ParamsEditor>` / `<HeadersEditor>`** — same component pattern, different store slice. Empty row at the bottom that auto-promotes to a real row when the user types.
- **`<BodyEditor>`** — Monaco for JSON, plain textarea for text/form. Type selector (None/JSON/Text/Form) at the top.
- **`<AuthEditor>`** — type dropdown, then dynamically renders the config form for the selected type.
- **`<HistoryList>`** — virtualized only if perf becomes an issue (50 entries shouldn't need it).
- **`<EnvironmentEditor>`** — modal. Tabs across environments, key/value editor below. Active environment highlighted.

## Acceptance criteria by phase

A phase is "done" when every criterion is checked.

### Phase 1 — Walking skeleton

- [ ] User sees URL bar, method dropdown, Send button
- [ ] Default URL is `https://jsonplaceholder.typicode.com/users/1`
- [ ] Clicking Send issues a `fetch()` and displays the response
- [ ] Response status, duration, and size are shown
- [ ] JSON responses are pretty-printed
- [ ] Network/CORS errors display a useful message, not just "failed to fetch"
- [ ] `Cmd+Enter` and `Enter` (in URL bar) trigger send
- [ ] App runs locally via `npm run dev`
- [ ] First commit pushed to GitHub
- [ ] First Vercel deploy succeeds at `probe-*.vercel.app`

### Phase 2 — Make it usable

- [ ] Params editor: add/remove/toggle rows, reflects in the actual URL on send
- [ ] Headers editor: same as params, but written to the request
- [ ] Body editor: Monaco mounted, JSON syntax highlighting works
- [ ] Body editor: type selector switches between None/JSON/Text/Form
- [ ] Body editor: JSON validation errors visible in editor margin
- [ ] Response panel: tabs for Body / Headers / Raw
- [ ] Response panel: Copy button on each tab works
- [ ] Empty states for params/headers ("Click + to add a param")
- [ ] All edits persist within session (in store, not localStorage yet)

### Phase 3 — Make it differentiate

- [ ] Auth dropdown: None, Bearer, Basic, API Key, OAuth 2.0
- [ ] Bearer: token input, header added correctly on send
- [ ] Basic: username/password inputs, base64-encoded correctly
- [ ] API Key: key/value/location, sent in correct location
- [ ] OAuth2: tokenUrl/clientId/clientSecret/scope inputs
- [ ] OAuth2: token fetched on first send, cached, reused
- [ ] OAuth2: token refreshed when within 60s of expiry
- [ ] OAuth2: cached state visible in UI ("expires in 47m")
- [ ] OAuth2: token persists across page reload
- [ ] Environments: create/rename/delete, switch from dropdown
- [ ] Environments: variables editor (key/value, add/remove)
- [ ] `{{varName}}` interpolates in URL, headers, body, auth config
- [ ] Unknown variables visually flagged but request still attempts
- [ ] History: every send creates a history entry
- [ ] History: click an entry to repopulate the request panel
- [ ] History: capped at 50 entries, oldest evicted
- [ ] History: persists across page reload

### Phase 4 — Polish

- [ ] Empty states everywhere (no history, no environments, no response)
- [ ] Keyboard shortcuts: `Cmd+Enter` send, `Cmd+K` focus URL, `Cmd+/` env switcher
- [ ] Shortcut hints visible somewhere (footer or `?` modal)
- [ ] Error states for failed token requests (OAuth2)
- [ ] Loading states on every async action
- [ ] Mobile/narrow viewport: layout doesn't break (graceful, not necessarily great)
- [ ] Dark mode works (if Tailwind config supports it — bonus)
- [ ] README has hero screenshot
- [ ] README's `[CONFIRM]` markers all replaced
- [ ] Custom domain `probe.danield.dev` is live with HTTPS
- [ ] Lighthouse score >90 on Performance, Accessibility, Best Practices

## Folder structure

```
probe/
├── src/
│   ├── components/
│   │   ├── RequestPanel/
│   │   │   ├── index.jsx
│   │   │   ├── UrlBar.jsx
│   │   │   ├── RequestTabs.jsx
│   │   │   ├── ParamsEditor.jsx
│   │   │   ├── HeadersEditor.jsx
│   │   │   ├── BodyEditor.jsx
│   │   │   └── AuthEditor.jsx
│   │   ├── ResponsePanel/
│   │   │   ├── index.jsx
│   │   │   ├── ResponseStatus.jsx
│   │   │   └── ResponseTabs.jsx
│   │   ├── Sidebar/
│   │   │   ├── index.jsx
│   │   │   ├── EnvironmentSwitcher.jsx
│   │   │   ├── EnvironmentEditor.jsx
│   │   │   └── HistoryList.jsx
│   │   └── ui/                 # shadcn components
│   ├── stores/
│   │   ├── requestStore.js
│   │   ├── historyStore.js
│   │   └── envStore.js
│   ├── lib/
│   │   ├── http.js             # fetch wrapper with timing
│   │   ├── auth.js             # auth header builders, OAuth flow
│   │   ├── interpolate.js      # {{var}} resolution
│   │   ├── format.js           # JSON pretty, byte formatting
│   │   └── storage.js          # localStorage helpers (typed)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── docs/
│   └── hero.png
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── README.md
├── SPEC.md                     # this file
└── LICENSE
```

## Key dependencies

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zustand": "^4.5.0",
    "@monaco-editor/react": "^4.6.0",
    "nanoid": "^5.0.0",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

shadcn/ui components added per-component via CLI as needed. No bulk install.

## Things to defer until after V1

If you catch yourself wanting to do these mid-build, stop. Note them and move on.

- Request collections / saved requests
- Multiple open requests as tabs
- Pre-request scripts
- Response assertions
- cURL import
- Beautiful animations
- Onboarding tour
- Settings page (theme, font size, etc.)
- Telemetry / analytics
- Account / sync

## Definition of "shipped"

Probe v1 is shipped when:

1. All Phase 1-4 acceptance criteria are checked
2. The deployed site at `probe.danield.dev` works end-to-end for an OAuth2 flow against a real public API (Spotify's Web API works well for testing — public clientId+secret flow)
3. The README's `[CONFIRM]` markers are replaced
4. The repo is public on GitHub with a non-trivial commit history (small, frequent commits beat one giant commit)
5. You've done one cold open of the deployed site to make sure it works for someone who hasn't seen it before

That last point is the one people skip and shouldn't.
