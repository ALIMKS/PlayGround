import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useToast } from '../components/Toast'
import { addDays, todayISO, validateStay } from './availability'
import { formatMoney } from './catalog'
import { hashPassword, randomCode, randomId, randomToken, verifyPassword } from './crypto'
import { makeT, type TKey } from './i18n'
import { calculateQuote, cancellationRefund } from './pricing'
import { buildSeed, DEMO_ACCOUNTS } from './seed'
import {
  cleanText,
  deviceLabel,
  isValidEmail,
  isStrongPassword,
  rateLimitStatus,
  registerFailure,
  type RateLimitState,
} from './security'
import type {
  AppData,
  Booking,
  Currency,
  Lang,
  Listing,
  ListingType,
  Message,
  PaymentMethod,
  Review,
  SavedCard,
  Settings,
  User,
  VerificationRequest,
} from './types'

const STORAGE_KEY = 'wanderra.v1'
const RATE_KEY = (email: string) => `wanderra.rl.${email.toLowerCase()}`
const SESSION_HOURS = 12

const defaultSettings: Settings = { lang: 'fr', currency: 'EUR' }

interface SignupInput {
  name: string
  email: string
  password: string
  country: string
  phone: string
  marketing: boolean
}

interface ListingDraft {
  title: string
  subtitle: string
  description: string
  type: ListingType
  category: Listing['category']
  city: string
  country: string
  countryCode: string
  price: number
  cleaningFee: number
  maxGuests: number
  bedrooms: number
  beds: number
  baths: number
  amenities: string[]
  images: string[]
  minNights: number
  cancellationPolicy: Listing['cancellationPolicy']
  instantBook: boolean
}

interface LoginResult {
  ok: boolean
  errorKey?: string
  vars?: Record<string, string | number>
  needs2fa?: boolean
  code?: string
  user?: User
}

interface SignupResult {
  ok: boolean
  errorKey?: string
  code?: string
  user?: User
}

interface BookingResult {
  ok: boolean
  errorKey?: string
  vars?: Record<string, string | number>
  booking?: Booking
}

export interface StoreValue {
  data: AppData
  ready: boolean
  user: User | null
  lang: Lang
  currency: Currency
  t: (key: TKey | string, vars?: Record<string, string | number>) => string
  fmt: (usd: number, opts?: { compact?: boolean }) => string
  sessionExpired: boolean
  login: (email: string, password: string, code?: string) => Promise<LoginResult>
  signup: (input: SignupInput) => Promise<SignupResult>
  logout: () => void
  becomeHost: () => void
  verifyEmail: (code: string) => boolean
  resendEmailCode: () => string
  sendPhoneCode: (phone: string) => string
  verifyPhone: (code: string) => boolean
  submitId: (docName: string) => void
  toggle2fa: () => void
  updateProfile: (patch: Partial<Pick<User, 'name' | 'bio' | 'country' | 'languages' | 'phone'>>) => void
  changePassword: (current: string, next: string) => Promise<boolean>
  addCard: (card: Omit<SavedCard, 'id'>) => void
  removeCard: (id: string) => void
  toggleWishlist: (listingId: string) => void
  createBooking: (input: {
    listingId: string
    checkIn: string
    checkOut: string
    guests: number
    paymentMethod: PaymentMethod
  }) => BookingResult
  cancelBooking: (bookingId: string) => void
  addReview: (bookingId: string, rating: number, text: string) => void
  sendMessage: (bookingId: string, text: string) => void
  createListing: (draft: ListingDraft) => { ok: boolean; listing?: Listing; errorKey?: string }
  setListingStatus: (listingId: string, status: Listing['status']) => void
  addPayoutMethod: (label: string) => void
  decideVerification: (requestId: string, approve: boolean, note?: string) => void
  setUserRole: (userId: string, role: User['role']) => void
  setUserSuspended: (userId: string, suspended: boolean) => void
  reportIssue: (text: string) => void
  subscribeNewsletter: (email: string) => void
  setLang: (lang: Lang) => void
  setCurrency: (currency: Currency) => void
  exportData: () => void
  deleteAccount: () => void
  resetDemo: () => void
  demoAccounts: typeof DEMO_ACCOUNTS
}

const StoreContext = createContext<StoreValue | null>(null)

let seedPromise: Promise<Awaited<ReturnType<typeof buildSeed>>> | null = null

function loadSeed() {
  if (!seedPromise) seedPromise = buildSeed()
  return seedPromise
}

function readData(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppData
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.users)) return null
    if (parsed.session && parsed.session.expiresAt < Date.now()) parsed.session = null
    return parsed
  } catch {
    return null
  }
}

function audit(userId: string, action: string, detail: string) {
  return { id: randomId('au'), at: new Date().toISOString(), userId, action, detail }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast()
  const [data, setData] = useState<AppData | null>(null)
  const [ready, setReady] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    const existing = readData()
    if (existing) {
      setData(existing)
      setReady(true)
      return () => {
        mounted.current = false
      }
    }
    loadSeed()
      .then((seed) => {
        if (!mounted.current) return
        const now = new Date().toISOString()
        setData({
          version: 1,
          users: seed.users,
          listings: seed.listings,
          bookings: seed.bookings,
          reviews: seed.reviews,
          verifications: seed.verifications,
          audit: seed.audit,
          messages: seed.messages,
          session: null,
          settings: defaultSettings,
          seededAt: now,
          newsletter: [],
        })
        setReady(true)
      })
      .catch(() => setReady(true))
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!data) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      showToast('toast.error', 'error')
    }
  }, [data, showToast])

  useEffect(() => {
    if (!data?.session) return
    const timer = window.setInterval(() => {
      if (data.session && data.session.expiresAt < Date.now()) {
        setData((current) => (current ? { ...current, session: null } : current))
        setSessionExpired(true)
        showToast('toast.sessionExpired', 'error')
      }
    }, 30_000)
    return () => window.clearInterval(timer)
  }, [data?.session, showToast])

  const lang = data?.settings.lang ?? 'fr'
  const currency = data?.settings.currency ?? 'EUR'
  const t = useMemo(() => makeT(lang), [lang])
  const fmt = useCallback(
    (usd: number, opts?: { compact?: boolean }) => formatMoney(usd, currency, lang, opts),
    [currency, lang],
  )

  const user = useMemo(() => {
    if (!data?.session) return null
    return data.users.find((u) => u.id === data.session?.userId) ?? null
  }, [data])

  const persist = useCallback((updater: (current: AppData) => AppData) => {
    setData((current) => (current ? updater(current) : current))
  }, [])

  const pushAudit = useCallback(
    (userId: string, action: string, detail: string) => {
      persist((current) => ({
        ...current,
        audit: [audit(userId, action, detail), ...current.audit].slice(0, 300),
      }))
    },
    [persist],
  )

  const login = useCallback(
    async (email: string, password: string, code?: string): Promise<LoginResult> => {
      if (!data) return { ok: false, errorKey: 'auth.loginError' }
      const normalized = email.trim().toLowerCase()
      const stored = localStorage.getItem(RATE_KEY(normalized))
      const rate: RateLimitState | undefined = stored ? JSON.parse(stored) : undefined
      const status = rateLimitStatus(rate)
      if (!status.allowed) {
        return { ok: false, errorKey: 'auth.rateLimited', vars: { n: status.retryMinutes } }
      }
      const candidate = data.users.find((u) => u.email.toLowerCase() === normalized)
      const valid = candidate
        ? await verifyPassword(password, candidate.passwordSalt, candidate.passwordHash)
        : false
      if (!candidate || !valid) {
        const next = registerFailure(rate)
        localStorage.setItem(RATE_KEY(normalized), JSON.stringify(next))
        return { ok: false, errorKey: 'auth.loginError' }
      }
      if (candidate.suspended) return { ok: false, errorKey: 'auth.loginError' }
      if (candidate.twoFactor) {
        if (!code) {
          const fresh = randomCode()
          persist((current) => ({
            ...current,
            users: current.users.map((u) =>
              u.id === candidate.id
                ? { ...u, twoFactorCode: fresh, twoFactorExpires: Date.now() + 5 * 60_000 }
                : u,
            ),
          }))
          return { ok: false, needs2fa: true, code: fresh }
        }
        if (
          candidate.twoFactorCode !== code ||
          !candidate.twoFactorExpires ||
          candidate.twoFactorExpires < Date.now()
        ) {
          return { ok: false, errorKey: 'auth.twoFactorInvalid' }
        }
      }
      localStorage.removeItem(RATE_KEY(normalized))
      const session = {
        userId: candidate.id,
        token: randomToken(),
        expiresAt: Date.now() + SESSION_HOURS * 3_600_000,
        device: typeof navigator === 'undefined' ? 'Web' : deviceLabel(),
      }
      persist((current) => ({
        ...current,
        session,
        users: current.users.map((u) =>
          u.id === candidate.id
            ? {
                ...u,
                twoFactorCode: undefined,
                twoFactorExpires: undefined,
                loginHistory: [
                  {
                    at: new Date().toISOString(),
                    device: session.device,
                    city: u.country,
                    ok: true,
                  },
                  ...u.loginHistory,
                ].slice(0, 12),
              }
            : u,
        ),
        audit: [audit(candidate.id, 'auth.login', 'Connexion réussie.'), ...current.audit],
      }))
      setSessionExpired(false)
      return { ok: true, user: candidate }
    },
    [data, persist],
  )

  const signup = useCallback(
    async (input: SignupInput): Promise<SignupResult> => {
      if (!data) return { ok: false, errorKey: 'common.error' }
      const email = input.email.trim().toLowerCase()
      if (!isValidEmail(email)) return { ok: false, errorKey: 'auth.invalidEmail' }
      if (data.users.some((u) => u.email.toLowerCase() === email)) {
        return { ok: false, errorKey: 'auth.emailExists' }
      }
      if (!isStrongPassword(input.password)) {
        return { ok: false, errorKey: 'auth.passwordPolicy' }
      }
      const { hash, salt } = await hashPassword(input.password)
      const code = randomCode()
      const newUser: User = {
        id: randomId('u'),
        name: cleanText(input.name, 80),
        email,
        passwordHash: hash,
        passwordSalt: salt,
        role: 'guest',
        createdAt: new Date().toISOString(),
        country: input.country,
        bio: '',
        languages: [lang],
        avatarHue: Math.floor(Math.random() * 360),
        emailVerified: false,
        phone: input.phone,
        phoneVerified: false,
        idStatus: 'none',
        idDocName: '',
        twoFactor: false,
        emailCode: code,
        emailCodeExpires: Date.now() + 15 * 60_000,
        trustScore: 30,
        wishlist: [],
        loginHistory: [
          { at: new Date().toISOString(), device: deviceLabel(), city: input.country, ok: true },
        ],
        payoutMethod: '',
        cards: [],
      }
      const session = {
        userId: newUser.id,
        token: randomToken(),
        expiresAt: Date.now() + SESSION_HOURS * 3_600_000,
        device: deviceLabel(),
      }
      persist((current) => ({
        ...current,
        users: [...current.users, newUser],
        session,
        newsletter:
          input.marketing && !current.newsletter.includes(email)
            ? [...current.newsletter, email]
            : current.newsletter,
        audit: [audit(newUser.id, 'auth.signup', 'Création de compte.'), ...current.audit],
      }))
      return { ok: true, code, user: newUser }
    },
    [data, lang, persist],
  )

  const becomeHost = useCallback(() => {
    if (!user) return
    if (user.role === 'host' || user.role === 'admin') return
    if (user.idStatus !== 'verified' || !user.phoneVerified) {
      showToast('host.verificationRequired', 'info')
      return
    }
    persist((current) => ({
      ...current,
      users: current.users.map((u) =>
        u.id === user.id
          ? { ...u, role: 'host', hostSince: new Date().toISOString(), trustScore: Math.min(100, u.trustScore + 10) }
          : u,
      ),
      audit: [audit(user.id, 'host.activated', 'Profil hôte activé.'), ...current.audit],
    }))
    showToast('toast.hostActivated', 'success')
  }, [user, persist, showToast])

  const logout = useCallback(() => {
    if (data?.session) pushAudit(data.session.userId, 'auth.logout', 'Déconnexion.')
    persist((current) => ({ ...current, session: null }))
    showToast('toast.loggedOut', 'info')
  }, [data?.session, persist, pushAudit, showToast])

  const verifyEmail = useCallback(
    (code: string) => {
      if (!user) return false
      if (user.emailVerified) return true
      if (
        user.emailCode !== code ||
        !user.emailCodeExpires ||
        user.emailCodeExpires < Date.now()
      ) {
        return false
      }
      persist((current) => ({
        ...current,
        users: current.users.map((u) =>
          u.id === user.id
            ? { ...u, emailVerified: true, emailCode: undefined, emailCodeExpires: undefined, trustScore: Math.min(100, u.trustScore + 15) }
            : u,
        ),
        audit: [audit(user.id, 'auth.email.verified', 'E-mail vérifié.'), ...current.audit],
      }))
      return true
    },
    [user, persist],
  )

  const resendEmailCode = useCallback(() => {
    if (!user) return ''
    const code = randomCode()
    persist((current) => ({
      ...current,
      users: current.users.map((u) =>
        u.id === user.id
          ? { ...u, emailCode: code, emailCodeExpires: Date.now() + 15 * 60_000 }
          : u,
      ),
    }))
    return code
  }, [user, persist])

  const sendPhoneCode = useCallback(
    (phone: string) => {
      if (!user) return ''
      const code = randomCode()
      persist((current) => ({
        ...current,
        users: current.users.map((u) =>
          u.id === user.id
            ? {
                ...u,
                phone: cleanText(phone, 30),
                phoneCode: code,
                phoneCodeExpires: Date.now() + 15 * 60_000,
              }
            : u,
        ),
      }))
      return code
    },
    [user, persist],
  )

  const verifyPhone = useCallback(
    (code: string) => {
      if (!user) return false
      if (user.phoneVerified) return true
      if (
        user.phoneCode !== code ||
        !user.phoneCodeExpires ||
        user.phoneCodeExpires < Date.now()
      ) {
        return false
      }
      persist((current) => ({
        ...current,
        users: current.users.map((u) =>
          u.id === user.id
            ? { ...u, phoneVerified: true, phoneCode: undefined, phoneCodeExpires: undefined, trustScore: Math.min(100, u.trustScore + 15) }
            : u,
        ),
        audit: [audit(user.id, 'auth.phone.verified', 'Téléphone vérifié.'), ...current.audit],
      }))
      return true
    },
    [user, persist],
  )

  const submitId = useCallback(
    (docName: string) => {
      if (!user) return
      const request: VerificationRequest = {
        id: randomId('vr'),
        userId: user.id,
        userName: user.name,
        kind: 'identity',
        docName: cleanText(docName, 120),
        status: 'pending',
        submittedAt: new Date().toISOString(),
        riskScore: Math.floor(Math.random() * 25) + 5,
        note: '',
      }
      persist((current) => ({
        ...current,
        users: current.users.map((u) =>
          u.id === user.id ? { ...u, idStatus: 'pending', idDocName: request.docName } : u,
        ),
        verifications: [request, ...current.verifications],
        audit: [audit(user.id, 'identity.submitted', 'Document d’identité soumis.'), ...current.audit],
      }))
      showToast('toast.verificationSubmitted', 'success')
    },
    [user, persist, showToast],
  )

  const toggle2fa = useCallback(() => {
    if (!user) return
    const next = !user.twoFactor
    persist((current) => ({
      ...current,
      users: current.users.map((u) => (u.id === user.id ? { ...u, twoFactor: next } : u)),
      audit: [
        audit(user.id, next ? 'security.2fa.enabled' : 'security.2fa.disabled', 'Paramètre 2FA modifié.'),
        ...current.audit,
      ],
    }))
  }, [user, persist])

  const updateProfile = useCallback(
    (patch: Partial<Pick<User, 'name' | 'bio' | 'country' | 'languages' | 'phone'>>) => {
      if (!user) return
      persist((current) => ({
        ...current,
        users: current.users.map((u) =>
          u.id === user.id
            ? {
                ...u,
                ...patch,
                ...(patch.phone !== undefined && patch.phone !== u.phone
                  ? { phoneVerified: false, phoneCode: undefined, phoneCodeExpires: undefined }
                  : {}),
              }
            : u,
        ),
        audit: [audit(user.id, 'profile.updated', 'Profil mis à jour.'), ...current.audit],
      }))
      showToast('account.profileSaved', 'success')
    },
    [user, persist, showToast],
  )

  const changePassword = useCallback(
    async (currentPassword: string, nextPassword: string) => {
      if (!user) return false
      const valid = await verifyPassword(currentPassword, user.passwordSalt, user.passwordHash)
      if (!valid || !isStrongPassword(nextPassword)) return false
      const { hash, salt } = await hashPassword(nextPassword)
      persist((current) => ({
        ...current,
        users: current.users.map((u) =>
          u.id === user.id ? { ...u, passwordHash: hash, passwordSalt: salt } : u,
        ),
        audit: [audit(user.id, 'security.password.changed', 'Mot de passe modifié.'), ...current.audit],
      }))
      return true
    },
    [user, persist],
  )

  const addCard = useCallback(
    (card: Omit<SavedCard, 'id'>) => {
      if (!user) return
      persist((current) => ({
        ...current,
        users: current.users.map((u) =>
          u.id === user.id
            ? { ...u, cards: [...u.cards, { ...card, id: randomId('card') }] }
            : u,
        ),
      }))
      showToast('toast.cardAdded', 'success')
    },
    [user, persist, showToast],
  )

  const removeCard = useCallback(
    (id: string) => {
      if (!user) return
      persist((current) => ({
        ...current,
        users: current.users.map((u) =>
          u.id === user.id ? { ...u, cards: u.cards.filter((c) => c.id !== id) } : u,
        ),
      }))
      showToast('toast.cardRemoved', 'info')
    },
    [user, persist, showToast],
  )

  const toggleWishlist = useCallback(
    (listingId: string) => {
      if (!user) return
      const has = user.wishlist.includes(listingId)
      persist((current) => ({
        ...current,
        users: current.users.map((u) =>
          u.id === user.id
            ? {
                ...u,
                wishlist: has
                  ? u.wishlist.filter((id) => id !== listingId)
                  : [...u.wishlist, listingId],
              }
            : u,
        ),
      }))
      showToast(has ? 'toast.removed' : 'toast.saved', has ? 'info' : 'success')
    },
    [user, persist, showToast],
  )

  const createBooking = useCallback(
    (input: {
      listingId: string
      checkIn: string
      checkOut: string
      guests: number
      paymentMethod: PaymentMethod
    }): BookingResult => {
      if (!data || !user) return { ok: false, errorKey: 'auth.loginError' }
      if (!user.emailVerified) return { ok: false, errorKey: 'auth.verifyEmailFirst' }
      const listing = data.listings.find((l) => l.id === input.listingId)
      if (!listing) return { ok: false, errorKey: 'listing.notFound' }
      const validation = validateStay(
        listing,
        input.checkIn,
        input.checkOut,
        input.guests,
        data.bookings,
      )
      if (!validation.ok) {
        return { ok: false, errorKey: validation.errorKey, vars: validation.vars }
      }
      const quote = calculateQuote(listing, input.checkIn, input.checkOut, currency)
      const booking: Booking = {
        id: randomId('bk'),
        code: `WR-${randomToken().slice(0, 6).toUpperCase()}`,
        listingId: listing.id,
        guestId: user.id,
        hostId: listing.hostId,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guests: input.guests,
        quote,
        paymentMethod: input.paymentMethod,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      }
      persist((current) => ({
        ...current,
        bookings: [booking, ...current.bookings],
        audit: [
          audit(user.id, 'booking.created', `Réservation ${booking.code} — ${listing.title}.`),
          ...current.audit,
        ],
      }))
      return { ok: true, booking }
    },
    [data, user, currency, persist],
  )

  const cancelBooking = useCallback(
    (bookingId: string) => {
      if (!data || !user) return
      const booking = data.bookings.find((b) => b.id === bookingId)
      if (!booking) return
      const listing = data.listings.find((l) => l.id === booking.listingId)
      if (!listing) return
      const refund = cancellationRefund(booking, listing.cancellationPolicy)
      persist((current) => ({
        ...current,
        bookings: current.bookings.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status: 'cancelled',
                cancelledAt: new Date().toISOString(),
                refund: refund.amount,
              }
            : b,
        ),
        audit: [
          audit(user.id, 'booking.cancelled', `Réservation ${booking.code} annulée — remboursement ${refund.percent} %.`),
          ...current.audit,
        ],
      }))
      showToast('toast.bookingCancelled', 'success')
    },
    [data, user, persist, showToast],
  )

  const addReview = useCallback(
    (bookingId: string, rating: number, text: string) => {
      if (!data || !user) return
      const booking = data.bookings.find((b) => b.id === bookingId)
      if (!booking || booking.reviewLeft) return
      const listing = data.listings.find((l) => l.id === booking.listingId)
      if (!listing) return
      const review: Review = {
        id: randomId('rv'),
        listingId: listing.id,
        bookingId,
        authorId: user.id,
        authorName: user.name.split(' ')[0],
        rating: Math.min(5, Math.max(1, rating)),
        text: cleanText(text, 1200),
        createdAt: new Date().toISOString(),
        lang,
      }
      const nextCount = listing.reviewCount + 1
      const nextRating = Math.round(((listing.rating * listing.reviewCount + rating) / nextCount) * 100) / 100
      persist((current) => ({
        ...current,
        reviews: [review, ...current.reviews],
        listings: current.listings.map((l) =>
          l.id === listing.id ? { ...l, reviewCount: nextCount, rating: nextRating } : l,
        ),
        bookings: current.bookings.map((b) =>
          b.id === bookingId ? { ...b, reviewLeft: true } : b,
        ),
        audit: [audit(user.id, 'review.created', `Avis publié sur ${listing.title}.`), ...current.audit],
      }))
      showToast('toast.reviewSubmitted', 'success')
    },
    [data, user, lang, persist, showToast],
  )

  const sendMessage = useCallback(
    (bookingId: string, text: string) => {
      if (!user) return
      const message: Message = {
        id: randomId('ms'),
        bookingId,
        fromId: user.id,
        toId: '',
        text: cleanText(text, 1000),
        at: new Date().toISOString(),
      }
      persist((current) => ({ ...current, messages: [...current.messages, message] }))
      showToast('toast.messageSent', 'success')
    },
    [user, persist, showToast],
  )

  const createListing = useCallback(
    (draft: ListingDraft) => {
      if (!user) return { ok: false, errorKey: 'auth.loginError' }
      if (user.role !== 'host' && user.role !== 'admin') {
        return { ok: false, errorKey: 'host.verificationRequired' }
      }
      if (user.idStatus !== 'verified' || !user.phoneVerified) {
        return { ok: false, errorKey: 'host.verificationRequired' }
      }
      const listing: Listing = {
        ...draft,
        id: randomId('l'),
        hostId: user.id,
        country: draft.country,
        lat: 0,
        lng: 0,
        taxRate: 0.1,
        rating: 0,
        reviewCount: 0,
        superhost: user.superhost ?? false,
        featured: false,
        blockedDates: [],
        status: 'pending',
        createdAt: new Date().toISOString(),
        license: 'En attente de vérification',
        currencyHint: currency,
      }
      const request: VerificationRequest = {
        id: randomId('vr'),
        userId: user.id,
        userName: user.name,
        kind: 'listing',
        docName: `annonce-${listing.id}.json`,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        riskScore: 10,
        note: '',
      }
      persist((current) => ({
        ...current,
        listings: [listing, ...current.listings],
        verifications: [request, ...current.verifications],
        audit: [audit(user.id, 'listing.submitted', `Annonce « ${listing.title} » soumise.`), ...current.audit],
      }))
      return { ok: true, listing }
    },
    [user, currency, persist],
  )

  const setListingStatus = useCallback(
    (listingId: string, status: Listing['status']) => {
      if (!user) return
      persist((current) => ({
        ...current,
        listings: current.listings.map((l) => (l.id === listingId ? { ...l, status } : l)),
        audit: [audit(user.id, 'listing.status', `Annonce ${listingId} → ${status}.`), ...current.audit],
      }))
    },
    [user, persist],
  )

  const addPayoutMethod = useCallback(
    (label: string) => {
      if (!user) return
      persist((current) => ({
        ...current,
        users: current.users.map((u) =>
          u.id === user.id ? { ...u, payoutMethod: cleanText(label, 80) } : u,
        ),
        audit: [audit(user.id, 'payout.added', 'Moyen de versement ajouté.'), ...current.audit],
      }))
      showToast('toast.payoutAdded', 'success')
    },
    [user, persist, showToast],
  )

  const decideVerification = useCallback(
    (requestId: string, approve: boolean, note = '') => {
      if (!data || !user) return
      const request = data.verifications.find((v) => v.id === requestId)
      if (!request) return
      persist((current) => {
        const verifications = current.verifications.map((v) =>
          v.id === requestId
            ? { ...v, status: approve ? ('approved' as const) : ('rejected' as const), note }
            : v,
        )
        let users = current.users
        let listings = current.listings
        if (request.kind === 'identity') {
          users = users.map((u) =>
            u.id === request.userId
              ? {
                  ...u,
                  idStatus: approve ? 'verified' : 'rejected',
                  trustScore: approve ? Math.min(100, u.trustScore + 30) : u.trustScore,
                }
              : u,
          )
        }
        if (request.kind === 'payout') {
          users = users.map((u) =>
            u.id === request.userId ? { ...u, payoutMethod: approve ? u.payoutMethod || 'Compte vérifié' : u.payoutMethod } : u,
          )
        }
        if (request.kind === 'listing') {
          listings = listings.map((l) =>
            l.hostId === request.userId && l.status === 'pending'
              ? { ...l, status: approve ? 'published' : 'paused', license: approve ? 'Vérifié par Wanderra' : 'Refusé' }
              : l,
          )
        }
        return {
          ...current,
          verifications,
          users,
          listings,
          audit: [
            audit(
              user.id,
              approve ? 'moderation.approved' : 'moderation.rejected',
              `${request.kind} — ${request.userName}.`,
            ),
            ...current.audit,
          ],
        }
      })
      showToast(approve ? 'toast.approved' : 'toast.rejected', approve ? 'success' : 'info')
    },
    [data, user, persist, showToast],
  )

  const setUserRole = useCallback(
    (userId: string, role: User['role']) => {
      if (!user) return
      persist((current) => ({
        ...current,
        users: current.users.map((u) => (u.id === userId ? { ...u, role } : u)),
        audit: [audit(user.id, 'user.role', `Rôle de ${userId} → ${role}.`), ...current.audit],
      }))
    },
    [user, persist],
  )

  const setUserSuspended = useCallback(
    (userId: string, suspended: boolean) => {
      if (!user) return
      persist((current) => ({
        ...current,
        users: current.users.map((u) => (u.id === userId ? { ...u, suspended } : u)),
        audit: [audit(user.id, suspended ? 'user.suspended' : 'user.reactivated', userId), ...current.audit],
      }))
    },
    [user, persist],
  )

  const reportIssue = useCallback(
    (text: string) => {
      pushAudit(user?.id ?? 'anonymous', 'trust.report', cleanText(text, 1000))
      showToast('toast.reportSent', 'success')
    },
    [user, pushAudit, showToast],
  )

  const subscribeNewsletter = useCallback(
    (email: string) => {
      const normalized = email.trim().toLowerCase()
      if (!isValidEmail(normalized)) return
      persist((current) => ({
        ...current,
        newsletter: current.newsletter.includes(normalized)
          ? current.newsletter
          : [...current.newsletter, normalized],
      }))
      showToast('toast.newsletter', 'success')
    },
    [persist, showToast],
  )

  const setLang = useCallback(
    (next: Lang) => {
      persist((current) => ({ ...current, settings: { ...current.settings, lang: next } }))
    },
    [persist],
  )

  const setCurrency = useCallback(
    (next: Currency) => {
      persist((current) => ({ ...current, settings: { ...current.settings, currency: next } }))
    },
    [persist],
  )

  const exportData = useCallback(() => {
    if (!data || !user) return
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: {
        name: user.name,
        email: user.email,
        country: user.country,
        phone: user.phone,
        languages: user.languages,
        trustScore: user.trustScore,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        idStatus: user.idStatus,
      },
      bookings: data.bookings.filter((b) => b.guestId === user.id || b.hostId === user.id),
      reviews: data.reviews.filter((r) => r.authorId === user.id),
      messages: data.messages.filter((m) => m.fromId === user.id || m.toId === user.id),
      wishlist: user.wishlist,
      audit: data.audit.filter((a) => a.userId === user.id),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `wanderra-donnees-${user.id}.json`
    link.click()
    URL.revokeObjectURL(url)
    showToast('toast.dataExported', 'success')
  }, [data, user, showToast])

  const deleteAccount = useCallback(() => {
    if (!user) return
    const userId = user.id
    persist((current) => ({
      ...current,
      users: current.users.filter((u) => u.id !== userId),
      session: null,
      bookings: current.bookings.map((b) =>
        b.guestId === userId ? { ...b, guestId: 'deleted' } : b,
      ),
      reviews: current.reviews.map((r) =>
        r.authorId === userId ? { ...r, authorId: 'deleted', authorName: 'Voyageur supprimé' } : r,
      ),
      messages: current.messages.filter((m) => m.fromId !== userId && m.toId !== userId),
      audit: [audit('system', 'account.deleted', userId), ...current.audit],
    }))
    showToast('toast.accountDeleted', 'info')
  }, [user, persist, showToast])

  const resetDemo = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    seedPromise = null
    window.location.hash = '#/'
    window.location.reload()
  }, [])

  const value = useMemo<StoreValue | null>(() => {
    if (!data) return null
    return {
      data,
      ready,
      user,
      lang,
      currency,
      t,
      fmt,
      sessionExpired,
      login,
      signup,
      logout,
      becomeHost,
      verifyEmail,
      resendEmailCode,
      sendPhoneCode,
      verifyPhone,
      submitId,
      toggle2fa,
      updateProfile,
      changePassword,
      addCard,
      removeCard,
      toggleWishlist,
      createBooking,
      cancelBooking,
      addReview,
      sendMessage,
      createListing,
      setListingStatus,
      addPayoutMethod,
      decideVerification,
      setUserRole,
      setUserSuspended,
      reportIssue,
      subscribeNewsletter,
      setLang,
      setCurrency,
      exportData,
      deleteAccount,
      resetDemo,
      demoAccounts: DEMO_ACCOUNTS,
    }
  }, [
    data, ready, user, lang, currency, t, fmt, sessionExpired,
    login, signup, logout, becomeHost, verifyEmail, resendEmailCode, sendPhoneCode, verifyPhone,
    submitId, toggle2fa, updateProfile, changePassword, addCard, removeCard, toggleWishlist,
    createBooking, cancelBooking, addReview, sendMessage, createListing, setListingStatus,
    addPayoutMethod, decideVerification, setUserRole, setUserSuspended, reportIssue,
    subscribeNewsletter, setLang, setCurrency, exportData, deleteAccount, resetDemo,
  ])

  if (!value) {
    return (
      <div className="boot-screen">
        <div className="boot-mark">
          <span className="brand-dot" />
          <span className="brand-word">Wanderra</span>
        </div>
        <p>{makeT('fr')('common.loading')}</p>
      </div>
    )
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used inside StoreProvider')
  return context
}

export function useOptionalStore(): StoreValue | null {
  return useContext(StoreContext)
}

export function nextDay(iso: string): string {
  return addDays(iso, 1)
}

export function today(): string {
  return todayISO()
}
