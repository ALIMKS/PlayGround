import { CURRENCIES } from './catalog'
import { nightsBetween, parseDate } from './availability'
import type { Booking, CancellationPolicy, Currency, Listing, Quote } from './types'

export const SERVICE_RATE = 0.12
export const HOST_FEE_RATE = 0.03

export function calculateQuote(
  listing: Listing,
  checkIn: string,
  checkOut: string,
  currency: Currency,
): Quote {
  const nights = nightsBetween(checkIn, checkOut)
  const fxRate = CURRENCIES[currency].rate
  const nightlyBase = listing.price
  const subtotalBase = nightlyBase * nights
  const discountRate = nights >= 28 ? 0.2 : nights >= 7 ? 0.1 : 0
  const discountBase = subtotalBase * discountRate
  const cleaningBase = listing.cleaningFee
  const taxableBase = subtotalBase - discountBase + cleaningBase
  const serviceBase = taxableBase * SERVICE_RATE
  const taxesBase = taxableBase * listing.taxRate
  const totalBase = taxableBase + serviceBase + taxesBase

  return {
    nights,
    nightly: round(nightlyBase * fxRate),
    subtotal: round(subtotalBase * fxRate),
    discount: round(discountBase * fxRate),
    cleaning: round(cleaningBase * fxRate),
    service: round(serviceBase * fxRate),
    taxes: round(taxesBase * fxRate),
    total: round(totalBase * fxRate),
    currency,
    fxRate,
    discountLabel: discountRate ? `${Math.round(discountRate * 100)}%` : '',
  }
}

export function round(value: number): number {
  return Math.round(value * 100) / 100
}

export interface RefundResult {
  percent: number
  amount: number
  reason: 'full' | 'partial' | 'none'
}

export function cancellationRefund(
  booking: Booking,
  policy: CancellationPolicy,
  now = new Date(),
): RefundResult {
  if (booking.status !== 'confirmed') return { percent: 0, amount: 0, reason: 'none' }
  const checkIn = parseDate(booking.checkIn)
  const hoursUntil = (checkIn.getTime() - now.getTime()) / 3_600_000
  const daysUntil = hoursUntil / 24
  let percent = 0
  if (policy === 'flexible') percent = hoursUntil >= 48 ? 100 : 0
  if (policy === 'moderate') percent = daysUntil >= 5 ? 100 : 50
  if (policy === 'strict') percent = daysUntil >= 7 ? 50 : 0
  return {
    percent,
    amount: round((booking.quote.total * percent) / 100),
    reason: percent === 100 ? 'full' : percent > 0 ? 'partial' : 'none',
  }
}

export function hostNet(booking: Booking): number {
  const gross = booking.quote.subtotal - booking.quote.discount + booking.quote.cleaning
  const fee = (booking.quote.subtotal - booking.quote.discount) * HOST_FEE_RATE
  return round(gross - fee)
}

export function bookingTotalUsd(booking: Booking): number {
  return booking.quote.fxRate ? booking.quote.total / booking.quote.fxRate : booking.quote.total
}

export function refundDeadline(booking: Booking, policy: CancellationPolicy): string {
  const checkIn = parseDate(booking.checkIn)
  const days = policy === 'flexible' ? 2 : policy === 'moderate' ? 5 : 7
  checkIn.setDate(checkIn.getDate() - days)
  return checkIn.toISOString().slice(0, 10)
}
