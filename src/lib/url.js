// builds a URL with query params appended. takes the original URL, an array of
// param rows, and the auth config (so api keys configured as query params
// can be added too). returns the original URL unchanged if it can't be parsed.
export function buildUrlWithParams(url, params, auth) {
  const enabledParams = params.filter((p) => p.enabled && p.key.trim())
  const apiKeyAsQuery =
    auth?.type === 'apiKey' &&
    auth.apiKey.location === 'query' &&
    auth.apiKey.key
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