# Probe

A REST API client built by someone who's spent five years debugging enterprise SSO at 2am.

[![Live demo](https://img.shields.io/badge/demo-probe.danield.dev-2563eb?style=flat-square)](https://probe.danield.dev)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Built with React](https://img.shields.io/badge/built%20with-React-61dafb?style=flat-square)](https://react.dev)

> [CONFIRM: replace the demo URL above with your actual deploy URL]

![Probe screenshot](docs/hero.png)

> [CONFIRM: drop a hero screenshot or short GIF at `docs/hero.png` — the request flow with a 200 response is ideal]

## What it is

Probe is a focused, browser-based REST client for testing APIs. It's not trying to be Postman. It's trying to be the tool you reach for when you need to debug an OAuth flow, sanity-check a webhook payload, or verify that the staging environment is actually returning what you think it's returning.

It runs entirely in your browser. No account, no sync, no telemetry. Your requests don't leave your machine except to hit the API you're testing.

## Why I built it

I spent five years as a Technical Support Engineer working with enterprise IAM and identity systems — Azure AD, Entra ID, custom SSO integrations, REST APIs in front of Fortune 500 customer data. Most of that work happened inside heavyweight tools that had drifted toward feature bloat: workspaces, teams, billing, AI features, sync conflicts, sign-in walls.

I wanted something that did the 20% of the job I actually needed, did it well, and got out of the way. So I built it.

The OAuth 2.0 client credentials flow is the feature I'm proudest of — it's the auth pattern most enterprise APIs use, and most lightweight clients either skip it or implement it in a way that fights the user. Probe caches tokens, refreshes them transparently, and shows you when the next refresh will fire.

## Features

### Core request flow
- Method selector (GET, POST, PUT, PATCH, DELETE)
- URL bar with environment variable interpolation (`{{baseUrl}}/users/{{userId}}`)
- Query param builder with toggle-on/off rows
- Headers builder with autocomplete for common headers
- Request body editor with JSON syntax highlighting (Monaco)
- Response panel with pretty-printed JSON, raw view, and headers tab
- Status code, latency, and response size displayed for every request

### Auth presets
- None
- Bearer token
- Basic auth
- API key (in header or query param)
- OAuth 2.0 client credentials flow with token caching and auto-refresh

### Environments
- Define multiple environments (Local, Staging, Production)
- Each environment is a key/value variable store
- Variables interpolate into URL, headers, and body
- Switch environments from a single dropdown

### History
- Last 50 requests stored locally
- Click to re-run any past request
- Status code and timing preserved

### Keyboard shortcuts
- `⌘/Ctrl + Enter` — send request
- `⌘/Ctrl + K` — focus URL bar
- `⌘/Ctrl + /` — toggle environment dropdown

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Build | Vite | Fast dev loop, zero config, modern defaults |
| UI | React 18 | Industry standard, ecosystem fit |
| Styling | Tailwind + shadcn/ui | Production polish without owning a design system |
| State | Zustand | Lighter than Redux, simpler than Context for this scale |
| Editor | Monaco | The VS Code editor — JSON validation and folding for free |
| Persistence | localStorage | No backend needed, no sync conflicts to manage |
| Hosting | Vercel | Static deploy, instant preview branches |

## Architecture decisions

A few choices worth explaining, because the *why* matters more than the *what*.

### Why no backend?

Probe is 100% client-side. Every request goes directly from your browser to the API you're testing. There's no proxy server, no account system, no database.

This is a deliberate trade-off:

- **You give up:** team sync, cloud collections, auth flows that need a server-side callback (like OAuth 2.0 authorization code flow without PKCE)
- **You get:** trivial deployment, no privacy concerns, no auth required to use the tool, no hosting bill

For a portfolio project this is the right call. For a production tool with enterprise customers, the calculus changes — you'd add a thin proxy for the auth flows that need one.

### Why Zustand over Redux or Context?

Three stores: current request, history, environments. Each is a few hundred bytes of state with simple update patterns. Redux is overkill for this surface area; React Context causes re-render storms when state updates frequently (which it does in a request editor). Zustand sits in the middle — selector-based subscriptions, ~1KB, no provider tree.

### Why Monaco for the body editor?

I considered CodeMirror (smaller bundle) and a plain textarea (smallest bundle). Monaco won because JSON editing is the single most common task in this app, and Monaco's JSON intellisense, error squiggles, and folding genuinely change how the tool feels. Bundle cost is ~200KB gzipped — worth it.

### Why localStorage instead of IndexedDB?

History caps at 50 entries and environments at maybe a dozen. Total storage is well under 1MB. localStorage is synchronous, simpler, and fast enough at this scale. If history grows or I add request collections, IndexedDB is the next stop.

## A note on CORS

Browser-based REST clients hit a wall called CORS — the security model that prevents websites from making arbitrary requests to other origins. If an API doesn't include your origin in its `Access-Control-Allow-Origin` header, your browser blocks the response.

Probe surfaces a clear error when this happens, with three suggested workarounds:

1. **Use a CORS-friendly API** — most public APIs (GitHub, Stripe webhooks endpoint, JSONPlaceholder) work out of the box
2. **Run a local proxy** — `lcl.host` or a one-line `corsproxy` works for development
3. **Use a browser extension** — for ad-hoc debugging only, never in production

Calling this out explicitly in the UI is itself a feature. Most lightweight clients just say "Failed to fetch" and leave you guessing.

## Roadmap

These are deliberately not in v1. They're listed here to show where the project goes — and to discipline scope so v1 actually ships.

- **Saved collections** with folder structure
- **Pre-request scripts** — run JS before send (set headers from a token call, etc.)
- **Response assertions** — `status === 200`, `body.id exists`, lightweight test runner
- **cURL import/export** — paste a cURL command, get a populated request
- **HAR file import** — load a request from browser devtools
- **Diff two responses** — for regression testing
- **OAuth 2.0 authorization code flow** (requires a thin backend for the callback)
- **WebSocket support**
- **gRPC support** via `grpc-web`

## Running locally

```bash
git clone https://github.com/[CONFIRM-username]/probe.git
cd probe
npm install
npm run dev
```

Open `http://localhost:5173`.

## Building for production

```bash
npm run build
npm run preview
```

The `dist/` folder is a static site. Deploy it to Vercel, Netlify, GitHub Pages, or any static host.

## Project structure

```
probe/
├── src/
│   ├── components/
│   │   ├── RequestPanel/      # method, URL, params, headers, body, auth
│   │   ├── ResponsePanel/     # status, body, headers, timing
│   │   ├── Sidebar/           # history, environments
│   │   └── ui/                # shadcn primitives
│   ├── stores/
│   │   ├── requestStore.js    # current request state
│   │   ├── historyStore.js    # persisted history
│   │   └── envStore.js        # environments + variables
│   ├── lib/
│   │   ├── http.js            # fetch wrapper, timing, error handling
│   │   ├── auth.js            # auth header builders, OAuth flow
│   │   ├── interpolate.js     # resolve {{vars}}
│   │   └── format.js          # JSON pretty-print, size formatting
│   └── App.jsx
└── README.md
```

## License

MIT. Use it, fork it, ship your own version.

## About

Built by Daniel D. — Technical Support Engineer pivoting to software engineering.

- Portfolio: [danield.dev](https://danield.dev)
- LinkedIn: [CONFIRM-linkedin-url]
- Email: [CONFIRM-public-email]

If you're hiring for TSE, CSE, or junior SWE roles and Probe resonated with you, I'd love to talk.
