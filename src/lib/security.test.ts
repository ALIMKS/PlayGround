import { describe, expect, it } from 'vitest'
import {
  assessPassword,
  detectCardBrand,
  expiryValid,
  formatCardNumber,
  isValidEmail,
  luhnValid,
  maskEmail,
  RATE_LIMIT_MAX,
  rateLimitStatus,
  registerFailure,
} from './security'

describe('password assessment', () => {
  it('scores strong passwords and rejects weak ones', () => {
    expect(assessPassword('Wanderra!2026').score).toBe(4)
    expect(assessPassword('password').score).toBeLessThan(3)
  })
})

describe('payment validation', () => {
  it('validates card numbers with Luhn', () => {
    expect(luhnValid('4242 4242 4242 4242')).toBe(true)
    expect(luhnValid('4242 4242 4242 4241')).toBe(false)
  })

  it('detects brands, formats numbers and checks expiry', () => {
    expect(detectCardBrand('4242424242424242')).toBe('Visa')
    expect(detectCardBrand('5555555555554444')).toBe('Mastercard')
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242')
    expect(expiryValid('12/99')).toBe(true)
    expect(expiryValid('13/99')).toBe(false)
  })
})

describe('contact helpers', () => {
  it('validates and masks email addresses', () => {
    expect(isValidEmail('guest@wanderra.app')).toBe(true)
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(maskEmail('guest@wanderra.app')).toBe('gu•••@wanderra.app')
  })
})

describe('rate limiting', () => {
  it('locks after the maximum number of failed attempts', () => {
    const now = 1_000_000
    let state = registerFailure(undefined, now)
    for (let i = 1; i < RATE_LIMIT_MAX; i += 1) state = registerFailure(state, now)
    const status = rateLimitStatus(state, now)
    expect(status.allowed).toBe(false)
    expect(status.retryMinutes).toBeGreaterThan(0)
  })

  it('allows attempts again after the window resets', () => {
    const now = 1_000_000
    const old = { attempts: RATE_LIMIT_MAX, firstAt: now - 16 * 60_000, lockedUntil: 0 }
    expect(rateLimitStatus(old, now).allowed).toBe(true)
  })
})
