# Probe

A browser-based REST client.

[![Live demo](https://img.shields.io/badge/demo-probe.danield.dev-2563eb?style=flat-square)](https://probe.danield.dev)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

## What it does

Pick a method, type a URL, hit Send, see the response.

Five auth modes including OAuth 2.0 client credentials with token caching. Environments with `{{variable}}` interpolation. Request history with full inspection. Dark mode. Copy any request as curl.

Runs entirely in your browser. No account, no backend, no telemetry.

## Why I built it

Spent five years as a TSE working with enterprise IAM, SSO, and REST APIs. Got tired of fighting tools that wanted me to log in, sync to a workspace, or upgrade to a team plan to test three endpoints.

So I built one that just works.

## Tech

Vite, React 19, Tailwind 4, shadcn/ui (Lyra preset), Zustand, Monaco. Hosted on Cloudflare Pages.

## License

MIT. Code is here for reference. Live tool is at [probe.danield.dev](https://probe.danield.dev).
