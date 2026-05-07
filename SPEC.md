# Probe Build Spec

This is the spec I wrote before I started building. The shipped version mostly matches it. A few things changed along the way, and those are noted at the bottom.

## Scope

V1 ships with:

- Five HTTP methods (GET, POST, PUT, PATCH, DELETE)
- URL bar with environment variable interpolation
- Query params and headers builders
- JSON body editor (Monaco) and plain text body
- Five auth presets including OAuth 2.0 client credentials with token caching
- Environments with variable resolution across all request fields
- Request history (last 50, click to re-run)
- Keyboard shortcuts

V1 does not ship:

- Saved collections
- Pre-request scripts
- Response assertions
- cURL import / export
- Multi-tab requests
- Cloud sync or accounts

## State architecture

Three Zustand stores, each with a single responsibility.

### requestStore: the active request

```js
{
  method: 'GET',
  url: '',
  params: [
    // { id, key, value, enabled }
  ],
  headers: [
    // { id, key, value, enabled }
  ],
  body: {
    type: 'none',          // 'none' | 'json' | 'text'
    content: '',
  },
  auth: {
    type: 'none',          // 'none' | 'bearer' | 'basic' | 'apiKey' | 'oauth2'
    bearer: { token },
    basic: { username, password },
    apiKey: { key, value, location: 'header' | 'query' },
    oauth2: {
      tokenUrl, clientId, clientSecret, scope,
      cachedToken, expiresAt
    },
  },
  response: null,
  isLoading: false,
  error: null,
}
```

All five auth configs are held at once, not just the active one. Switching between auth types preserves whatever was filled in.

### historyStore: request history

Persisted to localStorage under `probe.history`. Capped at 50 entries, newest first.

```js
{
  entries: [
    {
      id,
      timestamp,
      method,
      url, // resolved, not template
      status, // null on network/CORS errors
      durationMs,
      envName, // active env name at send time, or null
      snapshot: { method, url, params, headers, body, auth },
    },
  ];
}
```

The full request snapshot is stored so an entry can repopulate the panel exactly.

### envStore: environments

Persisted to localStorage under `probe.environments`. Active environment ID also persisted.

```js
{
  environments: [
    {
      id,
      name,
      variables: [
        // { id, key, value }
      ]
    }
  ],
  activeId: id | null,
}
```

## Variable interpolation

A single function in `lib/interpolate.js` takes a template string and a vars object and returns the resolved string.

- `{{baseUrl}}/users` with `vars.baseUrl = 'https://api.example.com'` resolves to `https://api.example.com/users`
- Unknown variables stay literal. `{{missing}}` renders unchanged.
- Resolves in URL, header values, param values, body content, and auth config values
- Does not resolve in header keys or param keys (keys should be literal)
- After interpolation, the URL is checked for any remaining `{{...}}` patterns. If found, the request is rejected with an `unresolvedVariable` error before the fetch fires. This catches the case where the browser would otherwise resolve a templated URL as a relative URL against the page origin.

## Auth flows

**Bearer**: adds header `Authorization: Bearer {token}`.

**Basic**: adds header `Authorization: Basic {base64(username:password)}`.

**API Key**

- `location === 'header'`: adds header `{key}: {value}`
- `location === 'query'`: appends `{key}={value}` to the URL's query string

**OAuth 2.0 client credentials** is the centerpiece feature.

1. On Send, check `cachedToken` and `expiresAt`
2. If a token exists with more than 60 seconds left, reuse it
3. Otherwise, POST to `tokenUrl` with `application/x-www-form-urlencoded` body containing `grant_type=client_credentials`, `client_id`, `client_secret`, and (optionally) `scope`
4. Cache the returned `access_token` and compute `expiresAt = now + expires_in seconds`
5. Add header `Authorization: Bearer {access_token}` to the actual request

The cached token is persisted in localStorage under `probe.oauth2-tokens` keyed by `{tokenUrl}::{clientId}` so it survives page reloads. Credentials (clientSecret) are intentionally not persisted.

## Response shape

```js
{
  status,
  statusText,
  headers,
  body,                    // raw text always; pretty-printed on display
  contentType,
  durationMs,
  sizeBytes,
}
```

Errors populate the `error` field instead:

```js
{
  type: 'cors' | 'network' | 'invalidUrl' | 'unresolvedVariable' | 'auth',
  message,
  hint,
  durationMs,
}
```

CORS detection is a string match on the fetch error message. `Failed to fetch` with a valid URL is almost always CORS in browsers. Imperfect, but it's the standard approach.

## Component tree

```
<App>
├── <Sidebar>
│   ├── env switcher (Select)
│   ├── env editor trigger (gear icon)
│   ├── <HistoryList>
│   └── <EnvironmentEditor>          (modal)
├── <RequestPanel>
│   ├── <UrlBar>                     (method + URL + Send + interpolation preview)
│   └── Tabs: Params | Headers | Body | Auth
│       ├── <KeyValueEditor>         (params)
│       ├── <KeyValueEditor>         (headers)
│       ├── <BodyEditor>             (Monaco for JSON, textarea for text)
│       └── <AuthEditor>             (type selector + dynamic config)
└── <ResponsePanel>                  (status + timing + body)
```

`KeyValueEditor` is shared between params and headers. Same UI, different store actions injected via props.

## Folder structure

```
probe/
├── src/
│   ├── components/
│   │   ├── ui/                  # shadcn primitives
│   │   ├── AuthEditor.jsx
│   │   ├── BodyEditor.jsx
│   │   ├── EnvironmentEditor.jsx
│   │   ├── HistoryList.jsx
│   │   ├── KeyValueEditor.jsx
│   │   ├── RequestPanel.jsx
│   │   ├── ResponsePanel.jsx
│   │   ├── Sidebar.jsx
│   │   └── UrlBar.jsx
│   ├── stores/
│   │   ├── envStore.js
│   │   ├── historyStore.js
│   │   └── requestStore.js
│   ├── lib/
│   │   ├── interpolate.js
│   │   ├── storage.js
│   │   └── utils.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── README.md
├── SPEC.md
└── LICENSE
```

## Key dependencies

- `react`, `react-dom`: React 19
- `zustand`: state management
- `@monaco-editor/react`: JSON body editor
- `nanoid`: IDs for rows and entries
- `radix-ui` (unified package): primitive components under shadcn
- `tailwindcss` v4: styling
- `@phosphor-icons/react`: icons

## Things that changed during the build

- Tailwind v3 was the original plan. The new shadcn CLI generates Tailwind v4 code (oklch colors, `@theme inline`, `@import "tailwindcss"`). Migrated to v4 mid-build.
- The radio component shadcn generated used `data-checked:` Tailwind variants, but `radix-ui` (the unified package) emits `data-state="checked"`. Patched the file to use `data-[state=checked]:` instead.
- Originally planned to add a tooltip explaining the disabled X button on the last key/value row. Replaced with a clear-on-last-row behavior, which is better UX than a tooltip explaining a constraint.
- Added unresolved-variable detection late in the build after watching the browser silently resolve `{{baseUrl}}/get` as a relative URL against `localhost:5173`. Surfacing it as an explicit error was the right fix.
- History entries gained an `envName` field after shipping the first version. Without it, you couldn't tell which environment a past request was sent against.
