import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  CreditCard,
  Lock,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'
import {
  CANCELLATION_LABELS,
  COUNTRIES,
  PAYMENT_METHODS,
  formatDate,
} from '../lib/catalog'
import { nightsBetween, validateStay } from '../lib/availability'
import { calculateQuote } from '../lib/pricing'
import {
  cvvValid,
  detectCardBrand,
  expiryValid,
  formatCardNumber,
  formatExpiry,
  isValidEmail,
  luhnValid,
} from '../lib/security'
import { randomCode } from '../lib/crypto'
import { useStore } from '../lib/store'
import type { PaymentMethod } from '../lib/types'
import { DynamicIcon } from '../components/Icon'
import { Badge, EmptyState, Field, Modal } from '../components/ui'
import { useToast } from '../components/Toast'

export function Checkout() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { t, lang, data, user, fmt, currency, createBooking, addCard } = useStore()

  const checkIn = params.get('checkIn') ?? ''
  const checkOut = params.get('checkOut') ?? ''
  const guests = Number(params.get('guests') ?? '2') || 2
  const listing = data.listings.find((item) => item.id === id)

  const [firstName, setFirstName] = useState(user?.name.split(' ')[0] ?? '')
  const [lastName, setLastName] = useState(user?.name.split(' ').slice(1).join(' ') ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [country, setCountry] = useState(user?.country ?? 'FR')
  const [arrival, setArrival] = useState('15:00')
  const [message, setMessage] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('card')
  const [selectedCardId, setSelectedCardId] = useState<string | null>(user?.cards[0]?.id ?? null)
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState(user?.name ?? '')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [saveCard, setSaveCard] = useState(false)
  const [iban, setIban] = useState('')
  const [mobileNumber, setMobileNumber] = useState(user?.phone ?? '')
  const [terms, setTerms] = useState(false)
  const [error, setError] = useState('')
  const [challengeOpen, setChallengeOpen] = useState(false)
  const [challengeCode, setChallengeCode] = useState('')
  const [challengeInput, setChallengeInput] = useState('')
  const [challengeError, setChallengeError] = useState('')
  const [paying, setPaying] = useState(false)

  const quote = useMemo(
    () => (listing && checkIn && checkOut ? calculateQuote(listing, checkIn, checkOut, currency) : null),
    [listing, checkIn, checkOut, currency],
  )

  if (!user) {
    const next = encodeURIComponent(`/checkout/${id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  if (!user.emailVerified) return <Navigate to="/verify?tab=email" replace />

  if (!listing || !quote) {
    return (
      <div className="container page-pad">
        <EmptyState
          icon={<CreditCard size={28} />}
          title={t('booking.invalidTitle')}
          description={t('booking.invalidDesc')}
          action={<Link to="/search" className="btn btn-ink">{t('search.title')}</Link>}
        />
      </div>
    )
  }

  if (listing.hostId === user.id) {
    return (
      <div className="container page-pad">
        <EmptyState
          icon={<CreditCard size={28} />}
          title={t('booking.ownListingTitle')}
          description={t('booking.ownListingDesc')}
          action={<Link to={`/listing/${listing.id}`} className="btn btn-ink">{t('listing.backTo')}</Link>}
        />
      </div>
    )
  }

  const validation = validateStay(listing, checkIn, checkOut, guests, data.bookings)
  if (!validation.ok) {
    return (
      <div className="container page-pad">
        <EmptyState
          icon={<CreditCard size={28} />}
          title={t('booking.invalidTitle')}
          description={t(validation.errorKey ?? 'booking.invalidDesc', validation.vars)}
          action={<Link to={`/listing/${listing.id}`} className="btn btn-ink">{t('listing.backTo')}</Link>}
        />
      </div>
    )
  }

  const totalUsd = quote.total
  if (totalUsd > 500 && user.idStatus !== 'verified') {
    return (
      <div className="container page-pad">
        <EmptyState
          icon={<ShieldCheck size={28} />}
          title={t('booking.unverifiedTitle')}
          description={t('booking.unverifiedDesc')}
          action={<Link to="/verify?tab=identity" className="btn btn-coral">{t('booking.verifyNow')}</Link>}
        />
      </div>
    )
  }

  const nights = nightsBetween(checkIn, checkOut)
  const cancelLabel = CANCELLATION_LABELS[listing.cancellationPolicy]
  const selectedCard = user.cards.find((card) => card.id === selectedCardId)
  const isMobileMoney = method === 'mpesa' || method === 'upi'

  const validatePayment = (): string => {
    if (!firstName.trim() || !lastName.trim()) return t('booking.nameRequired')
    if (!isValidEmail(email)) return t('auth.invalidEmail')
    if (!phone.trim()) return t('booking.phoneRequired')
    if (!terms) return t('booking.termsRequired')
    if (method === 'card') {
      if (selectedCard) return ''
      if (!luhnValid(cardNumber)) return t('booking.invalidCard')
      if (!cardHolder.trim()) return t('booking.cardHolderRequired')
      if (!expiryValid(cardExpiry)) return t('booking.invalidExpiry')
      if (!cvvValid(cardCvv)) return t('booking.invalidCvv')
    }
    if (method === 'sepa' && !/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/i.test(iban.replace(/\s/g, ''))) {
      return t('booking.invalidIban')
    }
    if (isMobileMoney && !/^\+?[\d\s()-]{7,20}$/.test(mobileNumber)) {
      return t('booking.invalidPhone')
    }
    return ''
  }

  const startPayment = () => {
    const problem = validatePayment()
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    const code = randomCode()
    setChallengeCode(code)
    setChallengeInput('')
    setChallengeError('')
    setChallengeOpen(true)
  }

  const confirmPayment = () => {
    if (challengeInput.trim() !== challengeCode) {
      setChallengeError(t('booking.wrongCode'))
      return
    }
    setPaying(true)
    const result = createBooking({
      listingId: listing.id,
      checkIn,
      checkOut,
      guests,
      paymentMethod: method,
    })
    setPaying(false)
    if (!result.ok) {
      setChallengeOpen(false)
      setError(t(result.errorKey ?? 'booking.paymentFailed', result.vars))
      return
    }
    if (method === 'card' && !selectedCard && saveCard) {
      addCard({
        brand: detectCardBrand(cardNumber),
        last4: cardNumber.replace(/\D/g, '').slice(-4),
        expiry: cardExpiry,
        holder: cardHolder,
      })
    }
    showToast('toast.bookingConfirmed', 'success')
    setChallengeOpen(false)
    if (result.booking) navigate(`/confirmation/${result.booking.id}`, { replace: true })
  }

  const countryInfo = COUNTRIES.find((item) => item.code === country) ?? COUNTRIES[0]

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-top">
          <Link to={`/listing/${listing.id}`} className="ghost-btn">
            <ArrowLeft size={16} /> {t('listing.backTo')}
          </Link>
          <div className="checkout-steps">
            <span className="checkout-step checkout-step-done"><i>1</i> {t('booking.stepTrip')}</span>
            <span className="checkout-step checkout-step-active"><i>2</i> {t('booking.stepPayment')}</span>
            <span className="checkout-step"><i>3</i> {t('booking.stepConfirm')}</span>
          </div>
          <span className="secure-pill"><Lock size={14} /> {t('booking.secure')}</span>
        </div>

        <div className="checkout-layout">
          <div className="checkout-main">
            <section className="panel">
              <div className="panel-head">
                <h2>{t('booking.yourTrip')}</h2>
                <Link to={`/listing/${listing.id}`} className="text-link">{t('common.edit')}</Link>
              </div>
              <div className="checkout-trip">
                <img src={listing.images[0]} alt={listing.title} />
                <div>
                  <h3>{listing.title}</h3>
                  <p>{listing.city}, {listing.country}</p>
                  <div className="trip-facts">
                    <span>{formatDate(checkIn, lang)} → {formatDate(checkOut, lang)}</span>
                    <span>{nights} {nights === 1 ? t('common.night') : t('common.nights')}</span>
                    <span>{guests} {guests === 1 ? t('common.guest') : t('common.guests')}</span>
                  </div>
                  <Badge tone="neutral">{cancelLabel[lang]}</Badge>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>{t('booking.guestDetails')}</h2>
                <span className="muted small">{t('booking.guestDetailsDesc')}</span>
              </div>
              <div className="form-grid">
                <Field label={t('auth.firstName')}>
                  <input className="input" value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" />
                </Field>
                <Field label={t('auth.lastName')}>
                  <input className="input" value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" />
                </Field>
                <Field label={t('auth.email')}>
                  <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
                </Field>
                <Field label={t('auth.phone')}>
                  <input className="input" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" placeholder={`${countryInfo.dial} …`} />
                </Field>
                <Field label={t('auth.country')}>
                  <select className="select" value={country} onChange={(event) => setCountry(event.target.value)}>
                    {COUNTRIES.map((item) => (
                      <option key={item.code} value={item.code}>{item[lang]}</option>
                    ))}
                  </select>
                </Field>
                <Field label={t('booking.arrivalTime')}>
                  <select className="select" value={arrival} onChange={(event) => setArrival(event.target.value)}>
                    <option value="13:00">13:00</option>
                    <option value="15:00">15:00</option>
                    <option value="17:00">17:00</option>
                    <option value="19:00">19:00</option>
                    <option value="21:00">21:00</option>
                  </select>
                </Field>
              </div>
              <Field label={t('booking.messageToHost')} hint={t('booking.messageHint')}>
                <textarea
                  className="textarea"
                  rows={3}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={t('booking.messagePlaceholder')}
                />
              </Field>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>{t('booking.paymentMethod')}</h2>
                <span className="secure-pill"><Lock size={13} /> {t('booking.encrypted')}</span>
              </div>
              <div className="payment-methods">
                {PAYMENT_METHODS.map((item) => (
                  <label key={item.id} className={`payment-method ${method === item.id ? 'payment-method-active' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value={item.id}
                      checked={method === item.id}
                      onChange={() => setMethod(item.id)}
                    />
                    <DynamicIcon name={item.icon} size={22} />
                    <div className="payment-method-body">
                      <strong>{item[lang]}</strong>
                      <span>{lang === 'fr' ? item.descFr : item.descEn}</span>
                    </div>
                    {item.badge === 'recommended' && <Badge tone="success">{t('booking.recommended')}</Badge>}
                    {item.badge === 'instant' && <Badge tone="gold">{t('common.instant')}</Badge>}
                  </label>
                ))}
              </div>

              {method === 'card' && (
                <div className="payment-details">
                  {user.cards.length > 0 && (
                    <div className="saved-cards">
                      {user.cards.map((card) => (
                        <label key={card.id} className={`saved-card ${selectedCardId === card.id ? 'saved-card-active' : ''}`}>
                          <input
                            type="radio"
                            name="saved-card"
                            checked={selectedCardId === card.id}
                            onChange={() => setSelectedCardId(card.id)}
                          />
                          <CreditCard size={18} />
                          <span>{card.brand} •••• {card.last4}</span>
                          <span className="muted small">{card.expiry}</span>
                        </label>
                      ))}
                      <label className={`saved-card ${selectedCardId === null ? 'saved-card-active' : ''}`}>
                        <input
                          type="radio"
                          name="saved-card"
                          checked={selectedCardId === null}
                          onChange={() => setSelectedCardId(null)}
                        />
                        <Sparkles size={18} />
                        <span>{t('booking.newCard')}</span>
                      </label>
                    </div>
                  )}

                  {!selectedCard && (
                    <>
                      <Field label={t('booking.cardNumber')}>
                        <div className="input-with-icon">
                          <CreditCard size={17} />
                          <input
                            className="input"
                            value={cardNumber}
                            onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                            placeholder="4242 4242 4242 4242"
                            inputMode="numeric"
                            autoComplete="cc-number"
                          />
                        </div>
                      </Field>
                      <Field label={t('booking.cardHolder')}>
                        <input className="input" value={cardHolder} onChange={(event) => setCardHolder(event.target.value)} autoComplete="cc-name" />
                      </Field>
                      <div className="form-grid form-grid-2">
                        <Field label={t('booking.expiry')}>
                          <input
                            className="input"
                            value={cardExpiry}
                            onChange={(event) => setCardExpiry(formatExpiry(event.target.value))}
                            placeholder="MM/AA"
                            inputMode="numeric"
                            autoComplete="cc-exp"
                          />
                        </Field>
                        <Field label={t('booking.cvv')} hint={t('booking.cvvHint')}>
                          <input
                            className="input"
                            value={cardCvv}
                            onChange={(event) => setCardCvv(event.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="123"
                            inputMode="numeric"
                            autoComplete="cc-csc"
                          />
                        </Field>
                      </div>
                      <label className="check-row">
                        <input type="checkbox" checked={saveCard} onChange={(event) => setSaveCard(event.target.checked)} />
                        <span>{t('booking.saveCard')}</span>
                      </label>
                    </>
                  )}
                  <p className="payment-demo-note">
                    <ShieldCheck size={15} /> {t('booking.demoCardHint')}
                  </p>
                </div>
              )}

              {method === 'sepa' && (
                <div className="payment-details">
                  <Field label={t('booking.iban')} hint={t('booking.ibanHint')}>
                    <input className="input" value={iban} onChange={(event) => setIban(event.target.value.toUpperCase())} placeholder="FR76 3000 6000 0112 3456 7890 189" />
                  </Field>
                  <p className="payment-demo-note"><Wallet size={15} /> {t('booking.sepaDemo')}</p>
                </div>
              )}

              {isMobileMoney && (
                <div className="payment-details">
                  <Field label={t('booking.mobileNumber')} hint={t('booking.mobileHint')}>
                    <input className="input" value={mobileNumber} onChange={(event) => setMobileNumber(event.target.value)} placeholder="+254 700 000 000" inputMode="tel" />
                  </Field>
                  <p className="payment-demo-note"><Wallet size={15} /> {t('booking.mobileDemo')}</p>
                </div>
              )}

              {(method === 'paypal' || method === 'applepay' || method === 'googlepay') && (
                <div className="payment-details">
                  <p className="payment-demo-note">
                    <Wallet size={15} />
                    {t('booking.walletDemo', { method: PAYMENT_METHODS.find((item) => item.id === method)?.[lang] ?? method })}
                  </p>
                </div>
              )}
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>{t('booking.reviewPolicy')}</h2>
              </div>
              <label className="check-row check-row-strong">
                <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} />
                <span>{t('booking.termsAgree')}</span>
              </label>
              <p className="muted small">
                {t('booking.cancelPolicy', { policy: cancelLabel[lang] })} · {t('booking.demoPaymentNotice')}
              </p>
            </section>
          </div>

          <aside className="checkout-summary">
            <div className="summary-card">
              <div className="summary-head">
                <div>
                  <strong>{fmt(listing.price)}</strong>
                  <span> / {t('common.night')}</span>
                </div>
                <span className="summary-rating">★ {listing.rating.toFixed(2)}</span>
              </div>
              <div className="summary-dates">
                <div>
                  <span>{t('common.checkIn')}</span>
                  <strong>{formatDate(checkIn, lang)}</strong>
                  <span>{t('booking.checkInTime')}</span>
                </div>
                <div>
                  <span>{t('common.checkOut')}</span>
                  <strong>{formatDate(checkOut, lang)}</strong>
                  <span>{t('booking.checkOutTime')}</span>
                </div>
              </div>
              <div className="summary-guests">
                <span>{t('common.guests')}</span>
                <strong>{guests} {guests === 1 ? t('common.guest') : t('common.guests')}</strong>
              </div>

              <div className="quote-lines">
                <div>
                  <span>{fmt(listing.price)} × {nights} {nights === 1 ? t('common.night') : t('common.nights')}</span>
                  <span>{fmt(quote.subtotal)}</span>
                </div>
                {quote.discount > 0 && (
                  <div className="quote-discount">
                    <span>{t('listing.discount')} {quote.discountLabel}</span>
                    <span>−{fmt(quote.discount)}</span>
                  </div>
                )}
                <div><span>{t('listing.cleaningFee')}</span><span>{fmt(quote.cleaning)}</span></div>
                <div><span>{t('listing.serviceFee')}</span><span>{fmt(quote.service)}</span></div>
                <div><span>{t('listing.taxes')}</span><span>{fmt(quote.taxes)}</span></div>
                <div className="quote-total"><span>{t('listing.total')} ({currency})</span><span>{fmt(quote.total)}</span></div>
              </div>

              {error && <p className="form-error">{error}</p>}

              <button type="button" className="btn btn-coral btn-block btn-lg" onClick={startPayment}>
                <Lock size={16} /> {t('booking.confirmAndPay')}
              </button>
              <p className="booking-fine">{t('booking.youWontBeCharged')}</p>
              <div className="summary-trust">
                <div><ShieldCheck size={16} /><span>{t('booking.escrow')}</span></div>
                <div><Check size={16} /><span>{t('booking.freeCancellation')}</span></div>
                <div><Lock size={16} /><span>{t('booking.pci')}</span></div>
              </div>
            </div>
            <div className="summary-help">
              <strong>{t('booking.needHelp')}</strong>
              <Link to="/help" className="text-link">{t('footer.helpCenter')}</Link>
            </div>
          </aside>
        </div>
      </div>

      <Modal
        open={challengeOpen}
        onClose={() => setChallengeOpen(false)}
        title={t('booking.3dsTitle')}
        footer={
          <button type="button" className="btn btn-ink btn-block" onClick={confirmPayment} disabled={paying}>
            {paying ? t('common.processing') : t('booking.authorize')}
          </button>
        }
      >
        <div className="challenge">
          <div className="challenge-bank">
            <ShieldCheck size={22} />
            <div>
              <strong>{t('booking.3dsBank')}</strong>
              <span>{t('booking.3dsDesc')}</span>
            </div>
          </div>
          <div className="challenge-code">
            <span>{t('booking.3dsDemoCode')}</span>
            <strong>{challengeCode}</strong>
          </div>
          <Field label={t('booking.3dsCode')}>
            <input
              className="input input-code"
              value={challengeInput}
              onChange={(event) => setChallengeInput(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              inputMode="numeric"
              autoFocus
            />
          </Field>
          {challengeError && <p className="form-error">{challengeError}</p>}
          <p className="muted small">{t('booking.3dsNotice')}</p>
        </div>
      </Modal>
    </div>
  )
}
