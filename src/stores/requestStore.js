import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { loadJSON, saveJSON } from '@/lib/storage'

const PERSIST_KEY = 'oauth2-tokens'

const emptyRow = () => ({ id: nanoid(), key: '', value: '', enabled: true })

export const useRequestStore = create((set, get) => ({
  method: 'GET',
  url: 'https://jsonplaceholder.typicode.com/users/1',
  params: [emptyRow()],
  headers: [emptyRow()],
  body: { type: 'none', content: '' },
  auth: {
    type: 'none',
    bearer: { token: '' },
    basic: { username: '', password: '' },
    apiKey: { key: '', value: '', location: 'header' },
    oauth2: {
      tokenUrl: '',
      clientId: '',
      clientSecret: '',
      scope: '',
      cachedToken: null,
      expiresAt: null,
    },
  },
  response: null,
  error: null,
  isLoading: false,

  setMethod: (method) => set({ method }),
  setUrl: (url) => set({ url }),
  setBody: (body) => set({ body }),

  setAuthType: (type) => set((s) => {
    if (type === 'oauth2') {
      const { tokenUrl, clientId } = s.auth.oauth2
      const restored = restoreOAuth2(tokenUrl, clientId)
      return {
        auth: {
          ...s.auth,
          type,
          oauth2: { ...s.auth.oauth2, ...restored },
        },
      }
    }
    return { auth: { ...s.auth, type } }
  }),
  setAuthConfig: (type, patch) => set((s) => ({
    auth: { ...s.auth, [type]: { ...s.auth[type], ...patch } },
  })),

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
    const { method, url, params, headers, body, auth } = get()
    if (!url.trim()) {
      set({ error: { type: 'invalidUrl', message: 'URL is required', hint: 'Enter a URL to send a request' } })
      return
    }

    const finalUrl = buildUrlWithParams(url, params, auth)
    const finalHeaders = buildHeaders(headers)

    set({ isLoading: true, response: null, error: null })

    try {
      await applyAuth(auth, finalHeaders, (oauth2Update) => {
        set((s) => ({ auth: { ...s.auth, oauth2: { ...s.auth.oauth2, ...oauth2Update } } }))
      })
    } catch (err) {
      set({
        error: {
          type: 'auth',
          message: err.message,
          hint: 'Check your auth config — token URL, credentials, or scope.',
          durationMs: 0,
        },
        isLoading: false,
      })
      return
    }

    const fetchOptions = { method, headers: finalHeaders }
    const bodyContent = buildBody(body, finalHeaders)
    if (bodyContent !== null) {
      fetchOptions.body = bodyContent
    }

    const t0 = performance.now()
    try {
      const res = await fetch(finalUrl, fetchOptions)
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

useRequestStore.subscribe((state, prev) => {
  if (state.auth.oauth2 !== prev?.auth?.oauth2) {
    persistOAuth2State(state.auth.oauth2)
  }
})

function buildUrlWithParams(url, params, auth) {
  const enabledParams = params.filter((p) => p.enabled && p.key.trim())
  const apiKeyAsQuery = auth?.type === 'apiKey' && auth.apiKey.location === 'query' && auth.apiKey.key
    ? { key: auth.apiKey.key, value: auth.apiKey.value }
    : null

  if (enabledParams.length === 0 && !apiKeyAsQuery) return url

  try {
    const u = new URL(url)
    enabledParams.forEach((p) => u.searchParams.append(p.key, p.value))
    if (apiKeyAsQuery) u.searchParams.append(apiKeyAsQuery.key, apiKeyAsQuery.value)
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

function buildBody(body, headers) {
  if (body.type === 'none' || !body.content.trim()) return null

  if (body.type === 'json') {
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json'
    }
    return body.content
  }

  if (body.type === 'text') {
    return body.content
  }

  return null
}

async function applyAuth(auth, headers, updateOauth2State) {
  if (auth.type === 'none') return

  if (auth.type === 'bearer') {
    if (auth.bearer.token) {
      headers['Authorization'] = `Bearer ${auth.bearer.token}`
    }
    return
  }

  if (auth.type === 'basic') {
    const { username, password } = auth.basic
    if (username || password) {
      const encoded = btoa(`${username}:${password}`)
      headers['Authorization'] = `Basic ${encoded}`
    }
    return
  }

  if (auth.type === 'apiKey') {
    const { key, value, location } = auth.apiKey
    if (!key) return
    if (location === 'header') {
      headers[key] = value
    }
    return
  }

  if (auth.type === 'oauth2') {
    const token = await getOAuth2Token(auth.oauth2, updateOauth2State)
    headers['Authorization'] = `Bearer ${token}`
    return
  }
}

async function getOAuth2Token(config, updateState) {
  const { tokenUrl, clientId, clientSecret, scope, cachedToken, expiresAt } = config

  const now = Date.now()
  const expiresInMs = expiresAt ? new Date(expiresAt).getTime() - now : 0
  const isValid = cachedToken && expiresInMs > 60_000

  if (isValid) return cachedToken

  if (!tokenUrl || !clientId || !clientSecret) {
    throw new Error('OAuth2 requires tokenUrl, clientId, and clientSecret')
  }

  const params = new URLSearchParams()
  params.append('grant_type', 'client_credentials')
  params.append('client_id', clientId)
  params.append('client_secret', clientSecret)
  if (scope) params.append('scope', scope)

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token request failed: ${res.status} ${res.statusText} — ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  if (!data.access_token) {
    throw new Error('Token response missing access_token')
  }

  const newExpiresAt = new Date(now + (data.expires_in || 3600) * 1000).toISOString()

  updateState({
    cachedToken: data.access_token,
    expiresAt: newExpiresAt,
  })

  return data.access_token
}

function persistOAuth2State(oauth2) {
  if (!oauth2.cachedToken) return
  const key = `${oauth2.tokenUrl}::${oauth2.clientId}`
  const all = loadJSON(PERSIST_KEY, {})
  all[key] = { cachedToken: oauth2.cachedToken, expiresAt: oauth2.expiresAt }
  saveJSON(PERSIST_KEY, all)
}

function restoreOAuth2(tokenUrl, clientId) {
  if (!tokenUrl || !clientId) return { cachedToken: null, expiresAt: null }
  const all = loadJSON(PERSIST_KEY, {})
  return all[`${tokenUrl}::${clientId}`] || { cachedToken: null, expiresAt: null }
}