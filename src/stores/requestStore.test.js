import { describe, it, expect } from 'vitest'
import { classifyFetchError } from './requestStore'

describe('classifyFetchError', () => {
  describe('timeout errors', () => {
    it('classifies AbortError as timeout', () => {
      const err = new Error('aborted')
      err.name = 'AbortError'
      const result = classifyFetchError(err, 30000)
      expect(result.type).toBe('timeout')
    })

    it('includes duration on timeout', () => {
      const err = new Error('aborted')
      err.name = 'AbortError'
      const result = classifyFetchError(err, 30000)
      expect(result.durationMs).toBe(30000)
    })

    it('mentions the timeout duration in the message', () => {
      const err = new Error('aborted')
      err.name = 'AbortError'
      const result = classifyFetchError(err, 30000)
      expect(result.message).toContain('30 seconds')
    })

    it('includes a hint on timeout', () => {
      const err = new Error('aborted')
      err.name = 'AbortError'
      const result = classifyFetchError(err, 30000)
      expect(result.hint).toBeTruthy()
    })
  })

  describe('CORS errors', () => {
    it('classifies Chrome-style "Failed to fetch" as cors', () => {
      const err = new TypeError('Failed to fetch')
      const result = classifyFetchError(err, 100)
      expect(result.type).toBe('cors')
    })

    it('classifies Firefox-style "NetworkError" as cors', () => {
      const err = new TypeError('NetworkError when attempting to fetch resource.')
      const result = classifyFetchError(err, 100)
      expect(result.type).toBe('cors')
    })

    it('classifies Safari-style "Load failed" as cors', () => {
      const err = new TypeError('Load failed')
      const result = classifyFetchError(err, 100)
      expect(result.type).toBe('cors')
    })

    it('classifies messages containing "CORS" as cors', () => {
      const err = new TypeError('Blocked by CORS policy')
      const result = classifyFetchError(err, 100)
      expect(result.type).toBe('cors')
    })

    it('matches CORS detection case-insensitively', () => {
      const err = new TypeError('FAILED TO FETCH')
      const result = classifyFetchError(err, 100)
      expect(result.type).toBe('cors')
    })

    it('includes a CORS-specific hint', () => {
      const err = new TypeError('Failed to fetch')
      const result = classifyFetchError(err, 100)
      expect(result.hint.toLowerCase()).toContain('cors')
    })
  })

  describe('network errors', () => {
    it('classifies a generic Error as network', () => {
      const err = new Error('something broke')
      const result = classifyFetchError(err, 100)
      expect(result.type).toBe('network')
    })

    it('does not classify TypeError without recognized message as cors', () => {
      const err = new TypeError('Some other type error')
      const result = classifyFetchError(err, 100)
      expect(result.type).toBe('network')
    })

    it('falls back to "Network error" message when error has no message', () => {
      const err = new Error()
      err.message = ''
      const result = classifyFetchError(err, 100)
      expect(result.message).toBe('Network error')
    })

    it('preserves the original error message when present', () => {
      const err = new Error('Connection refused')
      const result = classifyFetchError(err, 100)
      expect(result.message).toBe('Connection refused')
    })
  })

  describe('result structure', () => {
    it('always returns an object with type, message, hint, and durationMs', () => {
      const err = new Error('whatever')
      const result = classifyFetchError(err, 250)
      expect(result).toHaveProperty('type')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('hint')
      expect(result).toHaveProperty('durationMs')
      expect(result.durationMs).toBe(250)
    })
  })
})