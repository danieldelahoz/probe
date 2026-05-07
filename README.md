# Probe

A browser-based REST client.

[![Live demo](https://img.shields.io/badge/demo-probe.danield.dev-2563eb?style=flat-square)](https://probe.danield.dev)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](https://github.com/danieldelahoz/probe/blob/main/LICENSE)

## What it does

Pick a method, type a URL, hit Send, see the response.

Five auth modes including OAuth 2.0 client credentials with token caching. Environments with `{{variable}}` interpolation. Request history with full inspection. Dark mode. Copy any request as curl.

Runs entirely in your browser. No account, no backend, no telemetry. Your data stays on your machine.

## Why I built it

Spent five years as a TSE working with enterprise IAM, SSO, and REST APIs. Got tired of fighting tools that wanted me to log in, sync to a workspace, or upgrade to a team plan to test three endpoints.

So I built one that just works.

## A note on secrets

Probe stores environment variables, request history, and auth credentials in your browser's localStorage. This is fine for personal API testing. The data never leaves your browser, never touches a server, and never gets sent anywhere except the API endpoints you're hitting.

It is **not** appropriate for storing production credentials or testing APIs you don't own. If you wouldn't paste it into a public Notion doc, don't store it in Probe.

This is intentional. Adding encryption-at-rest in localStorage would provide false security, since the encryption key would have to live in localStorage too. Anyone with access to your browser session has access to either form.

For a tool intended for personal API exploration, plaintext storage with clear documentation is the honest tradeoff. For team use or production credentials, use a tool with proper secret management.

## Tech

Vite, React 19, Tailwind 4, shadcn/ui (Lyra preset), Zustand, Monaco. Vitest for testing, GitHub Actions for CI. Hosted on Cloudflare Pages.

See [SPEC.md](./SPEC.md) for design notes.

## Running locally

```bash
git clone git@github.com:danieldelahoz/probe.git
cd probe
npm install
npm run dev
```

Visit `http://localhost:5173`.

## License

MIT. Code is here for reference. Live tool is at [probe.danield.dev](https://probe.danield.dev).
