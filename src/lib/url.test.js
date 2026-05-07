import { describe, it, expect } from 'vitest'
import { buildUrlWithParams } from './url'

describe('buildUrlWithParams', () => {
  const baseUrl = 'https://api.example.com/users'

  it('returns the URL unchanged when no params and no auth', () => {
    expect(buildUrlWithParams(baseUrl, [], null)).toBe(baseUrl)
  })

  it('returns the URL unchanged when params are all disabled', () => {
    const params = [
      { key: 'foo', value: 'bar', enabled: false },
      { key: 'baz', value: 'qux', enabled: false },
    ]
    expect(buildUrlWithParams(baseUrl, params, null)).toBe(baseUrl)
  })

  it('returns the URL unchanged when params have empty keys', () => {
    const params = [
      { key: '', value: 'bar', enabled: true },
      { key: '   ', value: 'qux', enabled: true },
    ]
    expect(buildUrlWithParams(baseUrl, params, null)).toBe(baseUrl)
  })

  it('appends a single enabled param', () => {
    const params = [{ key: 'page', value: '2', enabled: true }]
    expect(buildUrlWithParams(baseUrl, params, null)).toBe(
      'https://api.example.com/users?page=2'
    )
  })

  it('appends multiple enabled params', () => {
    const params = [
      { key: 'page', value: '2', enabled: true },
      { key: 'limit', value: '50', enabled: true },
    ]
    expect(buildUrlWithParams(baseUrl, params, null)).toBe(
      'https://api.example.com/users?page=2&limit=50'
    )
  })

  it('skips disabled params but keeps enabled ones', () => {
    const params = [
      { key: 'page', value: '2', enabled: true },
      { key: 'private', value: 'yes', enabled: false },
      { key: 'limit', value: '50', enabled: true },
    ]
    expect(buildUrlWithParams(baseUrl, params, null)).toBe(
      'https://api.example.com/users?page=2&limit=50'
    )
  })

  it('preserves existing query params on the URL', () => {
    const url = 'https://api.example.com/users?existing=true'
    const params = [{ key: 'page', value: '2', enabled: true }]
    expect(buildUrlWithParams(url, params, null)).toBe(
      'https://api.example.com/users?existing=true&page=2'
    )
  })

  it('URL-encodes special characters in values', () => {
    const params = [{ key: 'q', value: 'hello world', enabled: true }]
    expect(buildUrlWithParams(baseUrl, params, null)).toBe(
      'https://api.example.com/users?q=hello+world'
    )
  })

  it('returns the URL unchanged when given a malformed URL', () => {
    const malformed = 'not-a-real-url'
    const params = [{ key: 'page', value: '2', enabled: true }]
    expect(buildUrlWithParams(malformed, params, null)).toBe(malformed)
  })

  it('appends API key as query param when auth is configured for query', () => {
    const auth = {
      type: 'apiKey',
      apiKey: { key: 'api_key', value: 'secret123', location: 'query' },
    }
    expect(buildUrlWithParams(baseUrl, [], auth)).toBe(
      'https://api.example.com/users?api_key=secret123'
    )
  })

  it('does not append API key when auth location is header', () => {
    const auth = {
      type: 'apiKey',
      apiKey: { key: 'api_key', value: 'secret123', location: 'header' },
    }
    expect(buildUrlWithParams(baseUrl, [], auth)).toBe(baseUrl)
  })

  it('does not append API key when auth type is not apiKey', () => {
    const auth = {
      type: 'bearer',
      apiKey: { key: 'api_key', value: 'secret123', location: 'query' },
    }
    expect(buildUrlWithParams(baseUrl, [], auth)).toBe(baseUrl)
  })

  it('combines params and API-key-as-query', () => {
    const auth = {
      type: 'apiKey',
      apiKey: { key: 'api_key', value: 'secret123', location: 'query' },
    }
    const params = [{ key: 'page', value: '2', enabled: true }]
    expect(buildUrlWithParams(baseUrl, params, auth)).toBe(
      'https://api.example.com/users?page=2&api_key=secret123'
    )
  })

  it('does not append API key with empty key field', () => {
    const auth = {
      type: 'apiKey',
      apiKey: { key: '', value: 'secret123', location: 'query' },
    }
    expect(buildUrlWithParams(baseUrl, [], auth)).toBe(baseUrl)
  })
})