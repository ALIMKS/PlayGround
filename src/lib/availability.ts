import type { Booking, Listing } from './types'

const DAY_MS = 86_400_000

export function parseDate(iso: string): Date {
  if (!iso) return new Date(Number.NaN)
  return new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
}

export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function addDays(iso: string, days: number): string {
  const date = parseDate(iso)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0
  const start = parseDate(checkIn)
  const end = parseDate(checkOut)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / DAY_MS))
}

export function nightsInRange(checkIn: string, checkOut: string): string[] {
  const nights: string[] = []
  const count = nightsBetween(checkIn, checkOut)
  for (let i = 0; i < count; i += 1) nights.push(addDays(checkIn, i))
  return nights
}

export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart < bEnd && aEnd > bStart
}

export function confirmedBookingsFor(listingId: string, bookings: Booking[]): Booking[] {
  return bookings.filter((b) => b.listingId === listingId && b.status === 'confirmed')
}

export function isRangeAvailable(
  listing: Listing,
  checkIn: string,
  checkOut: string,
  bookings: Booking[],
): boolean {
  if (!checkIn || !checkOut || checkIn >= checkOut) return false
  const blocked = new Set(listing.blockedDates)
  for (const night of nightsInRange(checkIn, checkOut)) {
    if (blocked.has(night)) return false
  }
  return !confirmedBookingsFor(listing.id, bookings).some((b) =>
    rangesOverlap(checkIn, checkOut, b.checkIn, b.checkOut),
  )
}

export interface StayValidation {
  ok: boolean
  errorKey?: string
  vars?: Record<string, string | number>
}

export function validateStay(
  listing: Listing,
  checkIn: string,
  checkOut: string,
  guests: number,
  bookings: Booking[],
): StayValidation {
  if (!checkIn || !checkOut) {
    return { ok: false, errorKey: 'booking.datesRequired' }
  }
  if (checkIn < todayISO()) {
    return { ok: false, errorKey: 'booking.datesRequired' }
  }
  const nights = nightsBetween(checkIn, checkOut)
  if (nights <= 0) return { ok: false, errorKey: 'booking.datesRequired' }
  if (nights < listing.minNights) {
    return { ok: false, errorKey: 'booking.minNightsError', vars: { n: listing.minNights } }
  }
  if (guests < 1) return { ok: false, errorKey: 'booking.datesRequired' }
  if (guests > listing.maxGuests) {
    return { ok: false, errorKey: 'booking.guestsOver', vars: { n: listing.maxGuests } }
  }
  if (!isRangeAvailable(listing, checkIn, checkOut, bookings)) {
    return { ok: false, errorKey: 'booking.bookingConflict' }
  }
  return { ok: true }
}

export function unavailableDates(listing: Listing, bookings: Booking[]): Set<string> {
  const dates = new Set<string>(listing.blockedDates)
  for (const booking of confirmedBookingsFor(listing.id, bookings)) {
    for (const night of nightsInRange(booking.checkIn, booking.checkOut)) dates.add(night)
  }
  return dates
}

export function occupancyRate(listing: Listing, bookings: Booking[], days = 30): number {
  const end = todayISO()
  const start = addDays(end, -days)
  let booked = 0
  for (const booking of confirmedBookingsFor(listing.id, bookings)) {
    for (const night of nightsInRange(booking.checkIn, booking.checkOut)) {
      if (night >= start && night < end) booked += 1
    }
  }
  return Math.min(100, Math.round((booked / days) * 100))
}
