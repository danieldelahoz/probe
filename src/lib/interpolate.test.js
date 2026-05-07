import { describe, it, expect } from 'vitest'
import { interpolate } from './interpolate'

describe('interpolate', () => {
  it('replaces a single variable', () => {
    expect(interpolate('hello {{name}}', { name: 'world' })).toBe('hello world')
  })

  it('replaces multiple variables', () => {
    expect(
      interpolate('{{greeting}} {{name}}', { greeting: 'hi', name: 'dan' })
    ).toBe('hi dan')
  })

  it('leaves unknown variables as-is', () => {
    expect(interpolate('hello {{missing}}', {})).toBe('hello {{missing}}')
  })

  it('trims whitespace inside variable braces', () => {
    expect(interpolate('hello {{ name }}', { name: 'world' })).toBe('hello world')
  })

  it('returns the input unchanged when there are no variables', () => {
    expect(interpolate('plain text', { foo: 'bar' })).toBe('plain text')
  })

  it('returns the input unchanged when vars is empty', () => {
    expect(interpolate('hello {{name}}', {})).toBe('hello {{name}}')
  })

  it('handles non-string inputs by returning them unchanged', () => {
    expect(interpolate(null, { foo: 'bar' })).toBe(null)
    expect(interpolate(undefined, { foo: 'bar' })).toBe(undefined)
    expect(interpolate(42, { foo: 'bar' })).toBe(42)
  })

  it('does not match nested braces', () => {
    expect(interpolate('{{outer {{inner}}}}', { inner: 'X' })).toBe('{{outer X}}')
  })

  it('handles empty string template', () => {
    expect(interpolate('', { foo: 'bar' })).toBe('')
  })

  it('handles values that are not strings', () => {
    expect(interpolate('count: {{n}}', { n: 42 })).toBe('count: 42')
  })
})