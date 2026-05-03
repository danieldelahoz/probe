const VAR_PATTERN = /\{\{([^{}]+)\}\}/g

export function interpolate(template, vars) {
  if (typeof template !== 'string') return template
  return template.replace(VAR_PATTERN, (match, name) => {
    const key = name.trim()
    return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match
  })
}