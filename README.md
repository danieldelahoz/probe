# Probe

A REST API client I built because I got tired of fighting heavyweight tools to do simple things.

[![Live demo](https://img.shields.io/badge/demo-probe.danield.dev-2563eb?style=flat-square)](https://probe.danield.dev)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

## What it is

A browser-based REST client. You pick a method, type a URL, hit Send, see the response. That's the whole pitch.

It runs entirely in your browser — no account, no backend, no telemetry. Everything you do stays on your machine.

## Why I built it

I spent five years as a Technical Support Engineer working with enterprise IAM stuff — Azure AD, Entra ID, custom SSO integrations, REST APIs sitting in front of Fortune 500 customer data. A lot of that work happened inside tools that had grown into something I didn't need: workspaces, teams, billing, sign-in walls, AI features I didn't ask for.

I wanted something small that did the part I actually used and got out of the way. So I built it.

The OAuth 2.0 client credentials flow is the part I'm most proud of. It's the auth pattern most enterprise APIs use, and most lightweight clients either skip it or implement it badly. Probe handles token caching, refresh timing, and persistence the way you'd want it to if you were debugging at 2am.

## What it does

**Requests:** GET / POST / PUT / PATCH / DELETE, with a URL bar that supports `{{variable}}` interpolation from your active environment.

**Params and headers:** key/value rows you can toggle on and off. Counts show in the tab labels so you know what's active without clicking through.

**Body:** JSON editor powered by Monaco (the VS Code editor) with syntax highlighting and validation, or plain text.

**Auth:** five presets — none, Bearer token, Basic, API key (header or query), and OAuth 2.0 client credentials. Tokens cache, expiry tracks visibly, refresh fires automatically when needed, and everything persists across reloads.

**Environments:** named bundles of variables. Switch from a dropdown. Variables resolve everywhere — URL, headers, body, auth config. The URL bar shows a live preview of what your request will actually fire.

**History:** last 50 requests, click to repopulate the panel and re-run. Tagged with the environment that was active at send time.

**Keyboard shortcuts:** `⌘+Enter` sends. `⌘+K` focuses the URL bar. `⌘+/` opens the environments editor.

## Tech stack

| Layer       | Choice                               |
| ----------- | ------------------------------------ |
| Build       | Vite                                 |
| UI          | React 19                             |
| Styling     | Tailwind 4 + shadcn/ui (Lyra preset) |
| State       | Zustand                              |
| Editor      | Monaco                               |
| Persistence | localStorage                         |
| Hosting     | Vercel                               |
| DNS         | Cloudflare                           |

## A few decisions worth explaining

**No backend.** Every request goes straight from your browser to the API. That means no proxy server, no accounts, no privacy concerns, and zero hosting cost. The trade-off is that auth flows requiring server-side callbacks (like OAuth authorization code without PKCE) aren't supported. For a tool I built to debug APIs, the trade was worth it.

**Zustand over Redux or Context.** Three small stores. Redux would be overkill and Context would cause re-render storms in a request editor that updates state on every keystroke. Zustand fits the scale.

**Monaco over a plain textarea.** Bundle is bigger, but JSON editing is the most common thing you do in this app, and the syntax highlighting and validation change how the tool feels.

**localStorage over IndexedDB.** History caps at 50, environments at maybe a dozen. Total storage stays under 1MB. Synchronous is fine here.

**Detect unresolved variables before fetching.** If you have `{{baseUrl}}/get` in the URL bar with no env active, the browser will resolve that as a relative URL against the page origin and return your own app's HTML. Probe checks for unresolved `{{...}}` patterns after interpolation and surfaces a clear error before the fetch fires, so the failure isn't silent.

## A note on CORS

Browser-based REST clients hit CORS — the security model that prevents websites from making arbitrary cross-origin requests. If an API doesn't include your origin in its `Access-Control-Allow-Origin` header, the browser blocks the response.

When this happens, Probe shows a clear error with the actual cause instead of just "Failed to fetch." The workarounds are use a CORS-friendly API, run a local proxy, or use a browser extension for ad-hoc debugging.

## License

MIT. The code is here for reference. The live tool is at [probe.danield.dev](https://probe.danield.dev).

## About

Built by Daniel. I'm a Technical Support Engineer focused on identity, APIs, and tools that make support work less painful. If you're hiring for TSE, CSE, or related roles and Probe caught your attention, I'd love to talk.
