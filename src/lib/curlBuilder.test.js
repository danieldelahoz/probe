import { describe, it, expect } from 'vitest'
import { shellQuote } from './curlBuilder'

describe('shellQuote', () => {
  it('wraps a simple string in single quotes', () => {
    expect(shellQuote('hello')).toBe("'hello'")
  })

  it('returns empty quotes for an empty string', () => {
    expect(shellQuote('')).toBe("''")
  })

  it('returns empty quotes for null', () => {
    expect(shellQuote(null)).toBe("''")
  })

  it('returns empty quotes for undefined', () => {
    expect(shellQuote(undefined)).toBe("''")
  })

  it('escapes a single quote inside the string', () => {
    expect(shellQuote("I'm")).toBe("'I'\\''m'")
  })

  it('escapes multiple single quotes', () => {
    expect(shellQuote("don't can't")).toBe("'don'\\''t can'\\''t'")
  })

  it('does not escape double quotes', () => {
    expect(shellQuote('say "hi"')).toBe(`'say "hi"'`)
  })

  it('does not escape backslashes', () => {
    expect(shellQuote('a\\b')).toBe("'a\\b'")
  })

  it('handles strings with special shell characters safely', () => {
    expect(shellQuote('foo$bar`baz')).toBe("'foo$bar`baz'")
  })

  it('handles a string containing only a single quote', () => {
    expect(shellQuote("'")).toBe("''\\'''")
  })

  it('handles whitespace', () => {
    expect(shellQuote('hello world')).toBe("'hello world'")
  })

  it('handles strings with newlines', () => {
    expect(shellQuote('line1\nline2')).toBe("'line1\nline2'")
  })
})