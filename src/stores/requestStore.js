import { create } from 'zustand'

export const useRequestStore = create((set, get) => ({
  method: 'GET',
  url: 'https://jsonplaceholder.typicode.com/users/1',
  response: null,
  error: null,
  isLoading: false,

  setMethod: (method) => set({ method }),
  setUrl: (url) => set({ url }),

  send: async () => {
    const { method, url } = get()
    if (!url.trim()) {
      set({ error: { type: 'invalidUrl', message: 'URL is required', hint: 'Enter a URL to send a request' } })
      return
    }

    set({ isLoading: true, response: null, error: null })

    const t0 = performance.now()
    try {
      const res = await fetch(url, { method })
      const text = await res.text()
      const durationMs = Math.round(performance.now() - t0)
      const sizeBytes = new Blob([text]).size

      const headers = {}
      res.headers.forEach((value, key) => { headers[key] = value })

      set({
        response: {
          status: res.status,
          statusText: res.statusText,
          headers,
          body: text,
          contentType: headers['content-type'] || '',
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