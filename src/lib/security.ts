export interface PasswordAssessment {
  score: 0 | 1 | 2 | 3 | 4
  labelKey: 'auth.passwordWeak' | 'auth.passwordMedium' | 'auth.passwordStrong'
  checks: {
    length: boolean
    lower: boolean
    upper: boolean
    digit: boolean
    symbol: boolean
  }
}

export function assessPassword(password: string): PasswordAssessment {
  const checks = {
    length: password.length >= 10,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    digit: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }
  const passed = Object.values(checks).filter(Boolean).length
  let score: PasswordAssessment['score'] = 0
  if (password.length >= 8) score = 1
  if (passed >= 3) score = 2
  if (passed === 4) score = 3
  if (passed === 5 && password.length >= 12) score = 4
  const labelKey =
    score <= 1 ? 'auth.passwordWeak' : score <= 3 ? 'auth.passwordMedium' : 'auth.passwordStrong'
  return { score, labelKey, checks }
}

export function isStrongPassword(password: string): boolean {
  return assessPassword(password).score >= 3
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim())
}

export function luhnValid(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) return false
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i])
    if (double) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    double = !double
  }
  return sum % 10 === 0
}

export function detectCardBrand(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '')
  if (/^4/.test(digits)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard'
  if (/^3[47]/.test(digits)) return 'Amex'
  if (/^6(?:011|5)/.test(digits)) return 'Discover'
  if (/^62/.test(digits)) return 'UnionPay'
  return 'Card'
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 19)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function expiryValid(value: string): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(value)
  if (!match) return false
  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  if (month < 1 || month > 12) return false
  const now = new Date()
  const expiry = new Date(year, month, 1)
  return expiry > now
}

export function cvvValid(value: string): boolean {
  return /^\d{3,4}$/.test(value)
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split('@')
  if (!domain) return email
  const visible = name.slice(0, 2)
  return `${visible}${'•'.repeat(Math.max(1, name.length - 2))}@${domain}`
}

export function cleanText(value: string, maxLength = 2000): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, maxLength)
}

export function deviceLabel(): string {
  const ua = navigator.userAgent
  if (/iPhone|iPad/i.test(ua)) return 'Safari · iOS'
  if (/Android/i.test(ua)) return 'Chrome · Android'
  if (/Macintosh/i.test(ua)) return 'Safari · macOS'
  if (/Windows/i.test(ua)) return 'Navigateur · Windows'
  return 'Navigateur web'
}

export interface RateLimitState {
  attempts: number
  firstAt: number
  lockedUntil: number
}

export const RATE_LIMIT_MAX = 5
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
export const RATE_LIMIT_LOCK_MS = 10 * 60 * 1000

export function rateLimitStatus(
  state: RateLimitState | undefined,
  now = Date.now(),
): { allowed: boolean; remaining: number; retryMinutes: number } {
  if (!state) return { allowed: true, remaining: RATE_LIMIT_MAX, retryMinutes: 0 }
  if (state.lockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      retryMinutes: Math.max(1, Math.ceil((state.lockedUntil - now) / 60000)),
    }
  }
  if (now - state.firstAt > RATE_LIMIT_WINDOW_MS) {
    return { allowed: true, remaining: RATE_LIMIT_MAX, retryMinutes: 0 }
  }
  return {
    allowed: state.attempts < RATE_LIMIT_MAX,
    remaining: Math.max(0, RATE_LIMIT_MAX - state.attempts),
    retryMinutes: 0,
  }
}

export function registerFailure(
  state: RateLimitState | undefined,
  now = Date.now(),
): RateLimitState {
  const fresh = !state || now - state.firstAt > RATE_LIMIT_WINDOW_MS
  const base: RateLimitState = fresh
    ? { attempts: 0, firstAt: now, lockedUntil: 0 }
    : { ...state }
  base.attempts += 1
  if (base.attempts >= RATE_LIMIT_MAX) {
    base.lockedUntil = now + RATE_LIMIT_LOCK_MS
  }
  return base
}
