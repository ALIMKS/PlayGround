export type Lang = 'fr' | 'en'
export type Currency =
  | 'USD' | 'EUR' | 'GBP' | 'MAD' | 'XOF' | 'XAF'
  | 'CAD' | 'AED' | 'JPY' | 'BRL' | 'INR' | 'ZAR'

export type Role = 'guest' | 'host' | 'admin'
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected'

export interface LoginEvent {
  at: string
  device: string
  city: string
  ok: boolean
}

export interface SavedCard {
  id: string
  brand: string
  last4: string
  expiry: string
  holder: string
}

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  passwordSalt: string
  role: Role
  createdAt: string
  country: string
  bio: string
  languages: string[]
  avatarHue: number
  emailVerified: boolean
  phone: string
  phoneVerified: boolean
  idStatus: VerificationStatus
  idDocName: string
  twoFactor: boolean
  twoFactorCode?: string
  twoFactorExpires?: number
  emailCode?: string
  emailCodeExpires?: number
  phoneCode?: string
  phoneCodeExpires?: number
  cards: SavedCard[]
  trustScore: number
  wishlist: string[]
  loginHistory: LoginEvent[]
  payoutMethod: string
  hostSince?: string
  superhost?: boolean
  suspended?: boolean
}

export type ListingCategory =
  | 'all' | 'beach' | 'city' | 'mountain' | 'design' | 'countryside' | 'tropical' | 'desert'

export type ListingType = 'apartment' | 'house' | 'villa' | 'loft' | 'cabin' | 'riad' | 'treehouse' | 'boat'

export type CancellationPolicy = 'flexible' | 'moderate' | 'strict'

export interface Listing {
  id: string
  hostId: string
  title: string
  subtitle: string
  description: string
  type: ListingType
  category: Exclude<ListingCategory, 'all'>
  city: string
  country: string
  countryCode: string
  lat: number
  lng: number
  images: string[]
  price: number
  cleaningFee: number
  taxRate: number
  maxGuests: number
  bedrooms: number
  beds: number
  baths: number
  amenities: string[]
  rating: number
  reviewCount: number
  instantBook: boolean
  superhost: boolean
  featured: boolean
  cancellationPolicy: CancellationPolicy
  minNights: number
  blockedDates: string[]
  status: 'published' | 'pending' | 'paused'
  createdAt: string
  license: string
  currencyHint: Currency
}

export interface Quote {
  nights: number
  nightly: number
  subtotal: number
  discount: number
  cleaning: number
  service: number
  taxes: number
  total: number
  currency: Currency
  fxRate: number
  discountLabel: string
}

export interface Booking {
  id: string
  code: string
  listingId: string
  guestId: string
  hostId: string
  checkIn: string
  checkOut: string
  guests: number
  quote: Quote
  paymentMethod: PaymentMethod
  status: 'confirmed' | 'cancelled' | 'completed'
  createdAt: string
  cancelledAt?: string
  refund?: number
  reviewLeft?: boolean
}

export type PaymentMethod = 'card' | 'paypal' | 'applepay' | 'googlepay' | 'sepa' | 'pix' | 'mpesa' | 'upi'

export interface Review {
  id: string
  listingId: string
  bookingId?: string
  authorId: string
  authorName: string
  rating: number
  text: string
  createdAt: string
  lang: Lang
}

export interface VerificationRequest {
  id: string
  userId: string
  userName: string
  kind: 'identity' | 'listing' | 'payout'
  docName: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  riskScore: number
  note: string
}

export interface AuditEntry {
  id: string
  at: string
  userId: string
  action: string
  detail: string
}

export interface Message {
  id: string
  bookingId: string
  fromId: string
  toId: string
  text: string
  at: string
}

export interface Session {
  userId: string
  token: string
  expiresAt: number
  device: string
}

export interface Settings {
  lang: Lang
  currency: Currency
}

export interface AppData {
  version: number
  users: User[]
  listings: Listing[]
  bookings: Booking[]
  reviews: Review[]
  verifications: VerificationRequest[]
  audit: AuditEntry[]
  messages: Message[]
  session: Session | null
  settings: Settings
  seededAt: string
  newsletter: string[]
}

export interface SearchQuery {
  destination: string
  checkIn: string
  checkOut: string
  guests: number
  category: ListingCategory
  maxPrice: number
  type: ListingType | 'all'
  instantOnly: boolean
  amenities: string[]
  sort: 'recommended' | 'price-asc' | 'price-desc' | 'rating'
}
