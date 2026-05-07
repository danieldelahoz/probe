const PREFIX = 'probe.'

export function loadJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    // Storage may be unavailable (private browsing, disabled) or
    // the value may be corrupt JSON. Either way, fall back gracefully.
    return fallback
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Storage may be full, disabled, or unavailable in private browsing.
    // Silent failure is intentional — we don't want a request to fail
    // because history couldn't persist.
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // Same as saveJSON — storage availability is best-effort.
  }
}