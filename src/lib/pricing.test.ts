import { describe, expect, it } from 'vitest'
import { calculateQuote, cancellationRefund, hostNet } from './pricing'
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
  blockedDates: [],
  status: 'published',
  createdAt: '2026-01-01T00:00:00.000Z',
  license: 'FR-TEST-001',
}

function booking(total: number): Booking {
  return {
    id: 'bk_test',
    code: 'WR-TEST',
    listingId: listing.id,
    guestId: 'u_guest',
    hostId: listing.hostId,
    checkIn: '2026-12-01',
    checkOut: '2026-12-05',
    guests: 2,
    quote: {
      nights: 4,
      nightly: 100,
      subtotal: 400,
      discount: 0,
      cleaning: 50,
      service: 54,
      taxes: 45,
      total,
      currency: 'USD',
      fxRate: 1,
      discountLabel: '',
    },
    paymentMethod: 'card',
    status: 'confirmed',
    createdAt: '2026-10-01T00:00:00.000Z',
  }
}

describe('calculateQuote', () => {
  it('adds cleaning, service fee and taxes', () => {
    const quote = calculateQuote(listing, '2026-12-01', '2026-12-05', 'USD')
    expect(quote.nights).toBe(4)
    expect(quote.subtotal).toBe(400)
    expect(quote.cleaning).toBe(50)
    expect(quote.service).toBe(54)
    expect(quote.taxes).toBe(45)
    expect(quote.total).toBe(549)
  })

  it('applies 10% off for seven nights and 20% off for 28 nights', () => {
    const week = calculateQuote(listing, '2026-12-01', '2026-12-08', 'USD')
    expect(week.discount).toBe(70)
    expect(week.discountLabel).toBe('10%')
    expect(week.total).toBe(829.6)

    const month = calculateQuote(listing, '2026-12-01', '2026-12-29', 'USD')
    expect(month.discount).toBe(560)
    expect(month.discountLabel).toBe('20%')
  })

  it('keeps quote amounts in USD while recording the display currency', () => {
    const quote = calculateQuote(listing, '2026-12-01', '2026-12-05', 'EUR')
    expect(quote.currency).toBe('EUR')
    expect(quote.fxRate).toBe(0.92)
    expect(quote.total).toBe(549)
  })
})

describe('hostNet', () => {
  it('deducts the 3% host commission from the accommodation subtotal', () => {
    expect(hostNet(booking(549))).toBe(438)
  })
})

describe('cancellationRefund', () => {
  const now = new Date('2026-11-01T12:00:00.000Z')

  it('refunds flexible bookings cancelled at least 48 hours ahead', () => {
    const result = cancellationRefund(booking(1000), 'flexible', now)
    expect(result.percent).toBe(100)
    expect(result.amount).toBe(1000)
    expect(result.reason).toBe('full')
  })

  it('does not refund cancelled bookings', () => {
    const cancelled = { ...booking(1000), status: 'cancelled' as const }
    expect(cancellationRefund(cancelled, 'flexible', now).percent).toBe(0)
  })
})
