import { describe, it, expect } from 'vitest'
import { mergeHeaders, hasHeader } from './headers'

describe('mergeHeaders', () => {
  it('returns empty object when both inputs are empty', () => {
    expect(mergeHeaders({}, {})).toEqual({})
  })

  it('returns auth headers when user headers are empty', () => {
    const auth = { Authorization: 'Bearer abc' }
    expect(mergeHeaders(auth, {})).toEqual({ Authorization: 'Bearer abc' })
  })

  it('returns user headers when auth headers are empty', () => {
    const user = { 'X-Custom': 'value' }
    expect(mergeHeaders({}, user)).toEqual({ 'X-Custom': 'value' })
  })

  it('combines headers when keys do not collide', () => {
    const auth = { Authorization: 'Bearer abc' }
    const user = { 'X-Custom': 'value' }
    expect(mergeHeaders(auth, user)).toEqual({
      Authorization: 'Bearer abc',
      'X-Custom': 'value',
    })
  })

  it('user header wins on exact key match', () => {
    const auth = { Authorization: 'Bearer auth' }
    const user = { Authorization: 'Bearer user' }
    expect(mergeHeaders(auth, user)).toEqual({ Authorization: 'Bearer user' })
  })

  it('user header wins on case-insensitive key match', () => {
    const auth = { Authorization: 'Bearer auth' }
    const user = { authorization: 'Bearer user' }
    const result = mergeHeaders(auth, user)
    expect(result).toEqual({ authorization: 'Bearer user' })
    expect(Object.keys(result)).toHaveLength(1)
  })

  it('preserves user casing when overriding auth', () => {
    const auth = { 'Content-Type': 'application/json' }
    const user = { 'content-type': 'text/plain' }
    const result = mergeHeaders(auth, user)
    expect(result).toEqual({ 'content-type': 'text/plain' })
  })

  it('handles multiple collisions independently', () => {
    const auth = {
      Authorization: 'Bearer auth',
      'Content-Type': 'application/json',
    }
    const user = {
      authorization: 'Bearer user',
      Accept: 'application/xml',
    }
    expect(mergeHeaders(auth, user)).toEqual({
      authorization: 'Bearer user',
      'Content-Type': 'application/json',
      Accept: 'application/xml',
    })
  })

  it('does not mutate the input objects', () => {
    const auth = { Authorization: 'Bearer auth' }
    const user = { authorization: 'Bearer user' }
    const authCopy = { ...auth }
    const userCopy = { ...user }
    mergeHeaders(auth, user)
    expect(auth).toEqual(authCopy)
    expect(user).toEqual(userCopy)
  })
})

describe('hasHeader', () => {
  it('returns true when header is present (exact case)', () => {
    expect(hasHeader({ 'Content-Type': 'application/json' }, 'Content-Type')).toBe(true)
  })

  it('returns true when header is present (different case)', () => {
    expect(hasHeader({ 'content-type': 'application/json' }, 'Content-Type')).toBe(true)
  })

  it('returns false when header is absent', () => {
    expect(hasHeader({ Authorization: 'Bearer abc' }, 'Content-Type')).toBe(false)
  })

  it('returns false on empty headers', () => {
    expect(hasHeader({}, 'Content-Type')).toBe(false)
  })

  it('matches header name case-insensitively', () => {
    expect(hasHeader({ 'CONTENT-TYPE': 'x' }, 'content-type')).toBe(true)
    expect(hasHeader({ 'CONTENT-TYPE': 'x' }, 'CONTENT-TYPE')).toBe(true)
    expect(hasHeader({ 'CONTENT-TYPE': 'x' }, 'Content-Type')).toBe(true)
  })
})