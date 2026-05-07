// merges two header objects, case-insensitively. user headers win
// over auth headers when keys collide (regardless of casing).
// e.g. user "authorization" wins over auth "Authorization".
export function mergeHeaders(authHeaders, userHeaders) {
  const result = {}
  const seenLower = new Map()

  for (const [key, value] of Object.entries(authHeaders)) {
    result[key] = value
    seenLower.set(key.toLowerCase(), key)
  }

  for (const [key, value] of Object.entries(userHeaders)) {
    const lower = key.toLowerCase()
    if (seenLower.has(lower)) {
      const existingKey = seenLower.get(lower)
      delete result[existingKey]
    }
    result[key] = value
    seenLower.set(lower, key)
  }

  return result
}

// case-insensitive check for whether a header is set
export function hasHeader(headers, name) {
  const lower = name.toLowerCase()
  return Object.keys(headers).some((k) => k.toLowerCase() === lower)
}