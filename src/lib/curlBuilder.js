import { interpolate } from '@/lib/interpolate'
import { mergeHeaders, hasHeader } from '@/lib/headers'

/**
 * Generate a curl command from a request configuration.
 * Mirrors the same interpolation, header building, and auth logic used in the live send.
 */
export function buildCurl({ method, url, params, headers, body, auth, vars = {} }) {
  if (!url.trim()) return ''

  const interpolatedUrl = interpolate(url, vars)
  const interpolatedHeaders = headers.map((h) => ({
    ...h,
    value: interpolate(h.value, vars),
  }))
  const interpolatedParams = params.map((p) => ({
    ...p,
    value: interpolate(p.value, vars),
  }))
  const interpolatedBody = {
    ...body,
    content: interpolate(body.content, vars),
  }
  const interpolatedAuth = interpolateAuth(auth, vars)

  const finalUrl = buildUrlWithParams(interpolatedUrl, interpolatedParams, interpolatedAuth)

  const userHeaders = buildUserHeaders(interpolatedHeaders)
  const authHeaders = buildAuthHeaders(interpolatedAuth)
  const finalHeaders = mergeHeaders(authHeaders, userHeaders)

  const lines = [`curl ${shellQuote(finalUrl)}`]

  if (method !== 'GET') {
    lines.push(`  -X ${method}`)
  }

  for (const [key, value] of Object.entries(finalHeaders)) {
    lines.push(`  -H ${shellQuote(`${key}: ${value}`)}`)
  }

  const bodyContent = buildBody(interpolatedBody, finalHeaders)
  if (bodyContent !== null) {
    lines.push(`  --data-raw ${shellQuote(bodyContent)}`)
  }

  return lines.join(' \\\n')
}

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

function buildUserHeaders(headers) {
  const result = {}
  headers
    .filter((h) => h.enabled && h.key.trim())
    .forEach((h) => { result[h.key] = h.value })
  return result
}

function buildAuthHeaders(auth) {
  const result = {}
  if (!auth) return result

  if (auth.type === 'bearer' && auth.bearer.token) {
    result['Authorization'] = `Bearer ${auth.bearer.token}`
  } else if (auth.type === 'basic' && (auth.basic.username || auth.basic.password)) {
    const encoded = btoa(`${auth.basic.username}:${auth.basic.password}`)
    result['Authorization'] = `Basic ${encoded}`
  } else if (auth.type === 'apiKey' && auth.apiKey.location === 'header' && auth.apiKey.key) {
    result[auth.apiKey.key] = auth.apiKey.value
  } else if (auth.type === 'oauth2' && auth.oauth2.cachedToken) {
    result['Authorization'] = `Bearer ${auth.oauth2.cachedToken}`
  }

  return result
}

function buildBody(body, headers) {
  if (body.type === 'none' || !body.content.trim()) return null

  if (body.type === 'json') {
  if (!hasHeader(headers, 'content-type')) {
    headers['Content-Type'] = 'application/json'
  }
    return body.content
  }

  if (body.type === 'text') {
    return body.content
  }

  return null
}

function interpolateAuth(auth, vars) {
  return {
    ...auth,
    bearer: { token: interpolate(auth.bearer.token, vars) },
    basic: {
      username: interpolate(auth.basic.username, vars),
      password: interpolate(auth.basic.password, vars),
    },
    apiKey: {
      ...auth.apiKey,
      key: interpolate(auth.apiKey.key, vars),
      value: interpolate(auth.apiKey.value, vars),
    },
    oauth2: {
      ...auth.oauth2,
    },
  }
}

/**
 * Shell-quote a string with single quotes, escaping any single quotes inside.
 * The standard POSIX way: 'foo' followed by escaped quote followed by 'bar'.
 * Example: I'm → 'I'\''m'
 */
function shellQuote(str) {
  if (str === '' || str == null) return "''"
  return `'${str.replace(/'/g, `'\\''`)}'`
}