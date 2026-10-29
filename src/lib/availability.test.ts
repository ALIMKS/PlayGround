import { describe, expect, it } from 'vitest'
import {
  isRangeAvailable,
  nightsBetween,
  rangesOverlap,
  validateStay,
} from './availability'
import type { Booking, Listing } from './types'

const listing: Listing = {
  id: 'l_test',
  hostId: 'u_host',
  title: 'Test stay',
  subtitle: 'Test',
  description: 'Test',
  type: 'apartment',
  category: 'city',
  city: 'Paris',
  country: 'France',
  countryCode: 'FR',
  lat: 0,
  lng: 0,
  images: [],
  price: 100,
  cleaningFee: 50,
  taxRate: 0.1,
  maxGuests: 4,
  bedrooms: 1,
  beds: 1,
  baths: 1,
  amenities: [],
  rating: 4.8,
  reviewCount: 10,
  instantBook: true,
  superhost: false,
  featured: false,
  cancellationPolicy: 'flexible',
  minNights: 2,
  currencyHint: 'USD',
  blockedDates: ['2026-12-10'],
  status: 'published',
  createdAt: '2026-01-01T00:00:00.000Z',
  license: 'FR-TEST-001',
}

const booking: Booking = {
  id: 'bk_test',
  code: 'WR-TEST',
  listingId: listing.id,
  guestId: 'u_guest',
  hostId: listing.hostId,
  checkIn: '2026-12-04',
  checkOut: '2026-12-07',
  guests: 2,
  quote: {
    nights: 3,
    nightly: 100,
    subtotal: 300,
    discount: 0,
    cleaning: 50,
    service: 42,
    taxes: 35,
    total: 427,
    currency: 'USD',
    fxRate: 1,
    discountLabel: '',
  },
  paymentMethod: 'card',
  status: 'confirmed',
  createdAt: '2026-10-01T00:00:00.000Z',
}

describe('date helpers', () => {
  it('counts nights between two dates', () => {
    expect(nightsBetween('2026-12-01', '2026-12-05')).toBe(4)
    expect(nightsBetween('2026-12-05', '2026-12-01')).toBe(0)
  })

  it('detects overlapping ranges', () => {
    expect(rangesOverlap('2026-12-01', '2026-12-05', '2026-12-04', '2026-12-07')).toBe(true)
    expect(rangesOverlap('2026-12-01', '2026-12-05', '2026-12-05', '2026-12-07')).toBe(false)
  })
})

describe('isRangeAvailable', () => {
  it('accepts free dates', () => {
    expect(isRangeAvailable(listing, '2026-12-01', '2026-12-03', [])).toBe(true)
  })

  it('rejects blocked dates and overlapping bookings', () => {
    expect(isRangeAvailable(listing, '2026-12-09', '2026-12-11', [])).toBe(false)
    expect(isRangeAvailable(listing, '2026-12-05', '2026-12-08', [booking])).toBe(false)
  })
})

describe('validateStay', () => {
  it('requires at least the minimum number of nights', () => {
    const result = validateStay(listing, '2026-12-01', '2026-12-02', 2, [])
    expect(result.ok).toBe(false)
    expect(result.errorKey).toBe('booking.minNightsError')
  })

  it('rejects too many guests', () => {
    const result = validateStay(listing, '2026-12-01', '2026-12-05', 5, [])
    expect(result.ok).toBe(false)
    expect(result.errorKey).toBe('booking.guestsOver')
  })

  it('accepts a valid stay', () => {
    expect(validateStay(listing, '2026-12-01', '2026-12-05', 2, [])).toEqual({ ok: true })
  })
})
