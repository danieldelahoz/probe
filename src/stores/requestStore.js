import { create } from 'zustand'
import { nanoid } from 'nanoid'

const emptyRow = () => ({ id: nanoid(), key: '', value: '', enabled: true })

export const useRequestStore = create((set, get) => ({
  method: 'GET',
  url: 'https://jsonplaceholder.typicode.com/users/1',
  params: [emptyRow()],
  headers: [emptyRow()],
  response: null,
  error: null,
  isLoading: false,

  setMethod: (method) => set({ method }),
  setUrl: (url) => set({ url }),

  addParam: () => set((s) => ({ params: [...s.params, emptyRow()] })),
  updateParam: (id, patch) => set((s) => ({
    params: s.params.map((p) => p.id === id ? { ...p, ...patch } : p),
  })),
  removeParam: (id) => set((s) => ({
    params: s.params.filter((p) => p.id !== id),
  })),

  addHeader: () => set((s) => ({ headers: [...s.headers, emptyRow()] })),
  updateHeader: (id, patch) => set((s) => ({
    headers: s.headers.map((h) => h.id === id ? { ...h, ...patch } : h),
  })),
  removeHeader: (id) => set((s) => ({
    headers: s.headers.filter((h) => h.id !== id),
  })),

  send: async () => {
    const { method, url, params, headers } = get()
    if (!url.trim()) {
      set({ error: { type: 'invalidUrl', message: 'URL is required', hint: 'Enter a URL to send a request' } })
      return
    }

    const finalUrl = buildUrlWithParams(url, params)
    const finalHeaders = buildHeaders(headers)

    set({ isLoading: true, response: null, error: null })

    const t0 = performance.now()
    try {
      const res = await fetch(finalUrl, { method, headers: finalHeaders })
      const text = await res.text()
      const durationMs = Math.round(performance.now() - t0)
      const sizeBytes = new Blob([text]).size

      const responseHeaders = {}
      res.headers.forEach((value, key) => { responseHeaders[key] = value })

      set({
        response: {
          status: res.status,
          statusText: res.statusText,
          headers: responseHeaders,
          body: text,
          contentType: responseHeaders['content-type'] || '',
          durationMs,
          sizeBytes,
        },
        isLoading: false,
      })
    } catch (err) {
      const durationMs = Math.round(performance.now() - t0)
      const isCors = err.message.includes('Failed to fetch') || err.message.includes('NetworkError')

      set({
        error: {
          type: isCors ? 'cors' : 'network',
          message: err.message,
          hint: isCors
            ? "Likely CORS — the API didn't allow this origin. See the README for workarounds."
            : 'Check the URL, your network connection, and the protocol (http/https).',
          durationMs,
        },
        isLoading: false,
      })
    }
  },
}))

function buildUrlWithParams(url, params) {
  const enabledParams = params.filter((p) => p.enabled && p.key.trim())
  if (enabledParams.length === 0) return url

  try {
    const u = new URL(url)
    enabledParams.forEach((p) => u.searchParams.append(p.key, p.value))
    return u.toString()
  } catch {
    return url
  }
}

function buildHeaders(headers) {
  const result = {}
  headers
    .filter((h) => h.enabled && h.key.trim())
    .forEach((h) => { result[h.key] = h.value })
  return result
}