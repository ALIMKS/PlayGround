import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Bath,
  BedDouble,
  Check,
  ChevronLeft,
  ChevronRight,
  Flag,
  Heart,
  Languages,
  MapPin,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'
import {
  AMENITIES,
  CANCELLATION_LABELS,
  amenityLabel,
  formatDate,
  formatMonthYear,
  typeLabel,
} from '../lib/catalog'
import { calculateQuote } from '../lib/pricing'
import { nightsBetween } from '../lib/availability'
import { useStore } from '../lib/store'
import { DateRangePicker } from '../components/DateRangePicker'
import { DynamicIcon } from '../components/Icon'
import { MapPanel } from '../components/MapPanel'
import { Avatar, Badge, EmptyState, Modal, Rating, Stepper } from '../components/ui'
import { useToast } from '../components/Toast'

export function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const {
    t,
    lang,
    data,
    user,
    fmt,
    currency,
    toggleWishlist,
    reportIssue,
  } = useStore()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(2)
  const [errorKey, setErrorKey] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportText, setReportText] = useState('')
  const [verifyPrompt, setVerifyPrompt] = useState(false)

  const listing = data.listings.find((item) => item.id === id)
  const host = listing ? data.users.find((item) => item.id === listing.hostId) : undefined
  const reviews = useMemo(
    () =>
      listing
        ? data.reviews
            .filter((review) => review.listingId === listing.id)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [],
    [data.reviews, listing],
  )

  if (!listing || (listing.status !== 'published' && user?.id !== listing.hostId && user?.role !== 'admin')) {
    return (
      <div className="container page-pad">
        <EmptyState
          icon={<MapPin size={28} />}
          title={t('listing.notFound')}
          action={<Link to="/search" className="btn btn-ink">{t('search.title')}</Link>}
        />
      </div>
    )
  }

  const saved = user?.wishlist.includes(listing.id) ?? false
  const quote = checkIn && checkOut ? calculateQuote(listing, checkIn, checkOut, currency) : null
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0
  const cancelLabel = CANCELLATION_LABELS[listing.cancellationPolicy]
  const maxGuests = listing.maxGuests
  const effectiveGuests = Math.min(guests, maxGuests)

  const changeDates = (nextIn: string, nextOut: string, nextError?: string) => {
    setCheckIn(nextIn)
    setCheckOut(nextOut)
    setErrorKey(nextError ?? '')
  }

  const reserve = () => {
    if (!user) {
      navigate(`/login?next=/listing/${listing.id}`)
      return
    }
    if (!user.emailVerified) {
      navigate('/verify?tab=email')
      return
    }
    if (!checkIn || !checkOut) {
      setErrorKey('booking.datesRequired')
      return
    }
    if (nights < listing.minNights) {
      setErrorKey('booking.minNightsError')
      return
    }
    if (effectiveGuests > maxGuests) {
      setErrorKey('booking.guestsOver')
      return
    }
    const totalUsd = quote ? quote.total / quote.fxRate : 0
    if (totalUsd > 500 && user.idStatus !== 'verified') {
      setVerifyPrompt(true)
      return
    }
    navigate(
      `/checkout/${listing.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${effectiveGuests}`,
    )
  }

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showToast('toast.linkCopied', 'success')
    } catch {
      showToast('toast.error', 'error')
    }
  }

  const ratingParts = [
    { label: t('listing.cleanliness'), value: Math.min(5, listing.rating + 0.04) },
    { label: t('listing.communication'), value: Math.min(5, listing.rating + 0.02) },
    { label: t('listing.checkinRating'), value: Math.min(5, listing.rating + 0.01) },
    { label: t('listing.locationRating'), value: Math.min(5, listing.rating - 0.03) },
    { label: t('listing.valueRating'), value: Math.min(5, listing.rating - 0.05) },
  ]

  const scrollToBooking = () => {
    document.getElementById('booking-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="listing-page">
      <div className="container">
        <nav className="breadcrumb" aria-label="Fil d’Ariane">
          <Link to="/">{t('common.home')}</Link>
          <span>/</span>
          <Link to={`/search?destination=${encodeURIComponent(listing.city)}`}>{listing.city}</Link>
          <span>/</span>
          <span>{listing.title}</span>
        </nav>

        <div className="listing-heading">
          <div>
            <div className="listing-badges">
              {listing.superhost && <Badge tone="gold">{t('common.superhost')}</Badge>}
              {listing.instantBook && <Badge tone="success">{t('listing.instant')}</Badge>}
              <Badge tone="neutral">{typeLabel(listing.type, lang)}</Badge>
            </div>
            <h1>{listing.title}</h1>
            <div className="listing-subline">
              <Rating value={listing.rating} count={listing.reviewCount} />
              <span className="dot">·</span>
              <span className="inline-pin"><MapPin size={14} /> {listing.city}, {listing.country}</span>
              <span className="dot">·</span>
              <span>{listing.superhost ? t('common.superhost') : t('listing.verifiedListing')}</span>
            </div>
          </div>
          <div className="listing-actions">
            <button type="button" className="ghost-btn" onClick={share}>
              <Share2 size={16} /> {t('listing.share')}
            </button>
            <button
              type="button"
              className={`ghost-btn ${saved ? 'ghost-btn-active' : ''}`}
              onClick={() => (user ? toggleWishlist(listing.id) : navigate('/login'))}
            >
              <Heart size={16} fill={saved ? 'currentColor' : 'none'} /> {saved ? t('listing.saved') : t('listing.save')}
            </button>
          </div>
        </div>

        <div className="gallery">
          <button type="button" className="gallery-main" onClick={() => setLightbox(0)}>
            <img src={listing.images[0]} alt={listing.title} />
          </button>
          {listing.images.slice(1, 5).map((image, index) => (
            <button
              key={image}
              type="button"
              className="gallery-thumb"
              onClick={() => setLightbox(index + 1)}
            >
              <img src={image} alt={`${listing.title} ${index + 2}`} loading="lazy" />
            </button>
          ))}
          <button type="button" className="gallery-all" onClick={() => setLightbox(0)}>
            <Sparkles size={15} /> {t('listing.gallery')}
          </button>
        </div>

        <div className="listing-layout">
          <div className="listing-content">
            <div className="host-summary">
              <div className="host-summary-left">
                <Avatar name={host?.name ?? 'Wanderra'} hue={host?.avatarHue ?? 24} size={54} />
                <div>
                  <h2>{t('listing.hostedBy', { name: host?.name ?? 'Wanderra' })}</h2>
                  <p>
                    {listing.maxGuests} {t('common.guests')} · {listing.bedrooms} {listing.bedrooms === 1 ? t('common.bedroom') : t('common.bedrooms')} · {listing.beds} {t('common.beds')} · {listing.baths} {t('common.baths')}
                  </p>
                </div>
              </div>
              <div className="host-summary-badges">
                {host?.superhost && <span className="host-badge"><Star size={14} fill="currentColor" strokeWidth={0} /> {t('common.superhost')}</span>}
                <span className="host-badge"><BadgeCheck size={14} /> {t('listing.idVerified')}</span>
              </div>
            </div>

            <div className="listing-highlights">
              <div><ShieldCheck size={20} /><strong>{t('listing.protectedPayment')}</strong><span>{t('booking.protectionDesc')}</span></div>
              <div><BadgeCheck size={20} /><strong>{t('listing.verifiedListing')}</strong><span>{t('listing.hostVerified')}</span></div>
              <div><Languages size={20} /><strong>{t('listing.languagesSpoken')}</strong><span>{host?.languages.join(' · ') ?? 'FR · EN'}</span></div>
            </div>

            <section className="listing-section">
              <h2>{t('listing.aboutTitle')}</h2>
              <p className={`listing-description ${expanded ? '' : 'clamped'}`}>{listing.description}</p>
              <button type="button" className="text-link" onClick={() => setExpanded((value) => !value)}>
                {expanded ? t('common.seeLess') : t('listing.readMore')}
              </button>
              <div className="sleep-grid">
                <div><BedDouble size={20} /><strong>{listing.bedrooms} {listing.bedrooms === 1 ? t('common.bedroom') : t('common.bedrooms')}</strong><span>{listing.beds} {t('common.beds')}</span></div>
                <div><Bath size={20} /><strong>{listing.baths} {listing.baths === 1 ? t('common.bath') : t('common.baths')}</strong><span>{t('listing.sleeps')} {listing.maxGuests}</span></div>
                <div><Users size={20} /><strong>{listing.maxGuests} {t('common.guests')}</strong><span>{listing.minNights} {t('common.nights')} min.</span></div>
              </div>
            </section>

            <section className="listing-section">
              <h2>{t('listing.amenitiesTitle')}</h2>
              <div className="amenities-grid">
                {listing.amenities.map((amenity) => {
                  const info = AMENITIES.find((item) => item.key === amenity)
                  return (
                    <div className="amenity-item" key={amenity}>
                      <DynamicIcon name={info?.icon ?? 'Sparkles'} size={20} />
                      <span>{amenityLabel(amenity, lang)}</span>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="listing-section">
              <h2>{t('listing.locationTitle')}</h2>
              <p className="muted">
                {listing.city}, {listing.country} · {t('listing.nearby')} : {lang === 'fr' ? 'cafés, marchés et transports à pied' : 'cafés, markets and transit on foot'}.
              </p>
              <MapPanel listings={[listing]} compact />
              <p className="muted small">
                {lang === 'fr'
                  ? 'Adresse exacte communiquée après confirmation de la réservation.'
                  : 'Exact address shared after booking confirmation.'}
              </p>
            </section>

            <section className="listing-section">
              <div className="section-inline-head">
                <h2>{t('listing.reviewsTitle')}</h2>
                <Rating value={listing.rating} count={listing.reviewCount} size={16} />
              </div>
              <div className="rating-breakdown">
                {ratingParts.map((part) => (
                  <div className="rating-row" key={part.label}>
                    <span>{part.label}</span>
                    <span className="rating-bar"><i style={{ width: `${(part.value / 5) * 100}%` }} /></span>
                    <strong>{part.value.toFixed(2)}</strong>
                  </div>
                ))}
              </div>
              <div className="review-grid">
                {reviews.slice(0, 4).map((review) => (
                  <article className="review-card" key={review.id}>
                    <div className="review-head">
                      <Avatar name={review.authorName} hue={review.authorName.length * 47} size={38} />
                      <div>
                        <strong>{review.authorName}</strong>
                        <span>{formatMonthYear(review.createdAt, lang)}</span>
                      </div>
                      <span className="review-stars">
                        {Array.from({ length: review.rating }).map((_, index) => (
                          <Star key={index} size={12} fill="currentColor" strokeWidth={0} />
                        ))}
                      </span>
                    </div>
                    <p>{review.text}</p>
                  </article>
                ))}
              </div>
              {reviews.length > 4 && (
                <button type="button" className="btn btn-outline" onClick={() => setReviewsOpen(true)}>
                  {t('listing.showAllReviews', { n: reviews.length })}
                </button>
              )}
            </section>

            <section className="listing-section">
              <h2>{t('listing.houseRules')}</h2>
              <div className="rules-grid">
                <div>
                  <strong>{t('common.checkIn')}</strong>
                  <span>{t('booking.checkInTime')}</span>
                </div>
                <div>
                  <strong>{t('common.checkOut')}</strong>
                  <span>{t('booking.checkOutTime')}</span>
                </div>
                <div>
                  <strong>{t('listing.cancellation')}</strong>
                  <span>{cancelLabel[lang]}</span>
                </div>
                <div>
                  <strong>{t('common.guests')}</strong>
                  <span>{t('listing.maxGuests', { n: listing.maxGuests })}</span>
                </div>
              </div>
              <p className="muted small">
                {lang === 'fr'
                  ? 'Non-fumeur · Pas de fête · Respect du voisinage après 22 h.'
                  : 'No smoking · No parties · Quiet hours after 10 PM.'}
              </p>
            </section>

            <section className="listing-section">
              <h2>{t('listing.safety')}</h2>
              <ul className="check-list">
                <li><Check size={16} /> {lang === 'fr' ? 'Détecteur de fumée et de monoxyde de carbone' : 'Smoke and carbon monoxide detectors'}</li>
                <li><Check size={16} /> {lang === 'fr' ? 'Trousse de premiers secours et extincteur' : 'First-aid kit and fire extinguisher'}</li>
                <li><Check size={16} /> {lang === 'fr' ? 'Entrée privée et serrure connectée' : 'Private entrance and smart lock'}</li>
              </ul>
              <button type="button" className="ghost-btn danger-text" onClick={() => setReportOpen(true)}>
                <Flag size={15} /> {t('listing.report')}
              </button>
            </section>
          </div>

          <aside className="booking-column">
            <div className="booking-card" id="booking-card">
              <div className="booking-card-head">
                <div>
                  <strong className="booking-price">{fmt(listing.price)}</strong>
                  <span className="booking-per">{t('common.perNight')}</span>
                </div>
                <Rating value={listing.rating} count={listing.reviewCount} />
              </div>

              <DateRangePicker
                listing={listing}
                bookings={data.bookings}
                checkIn={checkIn}
                checkOut={checkOut}
                onChange={changeDates}
              />

              <div className="booking-guests-row">
                <div>
                  <strong>{t('listing.guestsLabel')}</strong>
                  <span>{t('listing.maxGuests', { n: maxGuests })}</span>
                </div>
                <Stepper value={effectiveGuests} onChange={setGuests} min={1} max={maxGuests} />
              </div>

              {errorKey && (
                <p className="form-error">
                  {t(errorKey, { n: errorKey.includes('minNights') ? listing.minNights : maxGuests })}
                </p>
              )}

              <button type="button" className="btn btn-coral btn-block btn-lg" onClick={reserve}>
                {t('listing.reserve')} <ArrowRight size={17} />
              </button>
              <p className="booking-fine">{t('listing.youWontBeCharged')}</p>

              {quote && nights > 0 && (
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
                  <div className="quote-total"><span>{t('listing.total')}</span><span>{fmt(quote.total)}</span></div>
                </div>
              )}

              <div className="booking-protection">
                <ShieldCheck size={20} />
                <div>
                  <strong>{t('listing.protectedPayment')}</strong>
                  <span>{t('booking.escrow')} · {t('booking.pci')}</span>
                </div>
              </div>

              {listing.instantBook && (
                <div className="instant-note">
                  <Sparkles size={15} /> {t('listing.instant')}
                </div>
              )}
            </div>

            <div className="host-mini-card">
              <Avatar name={host?.name ?? 'W'} hue={host?.avatarHue ?? 24} size={48} />
              <div>
                <strong>{host?.name}</strong>
                <span>{t('listing.responseRate')} 100% · {t('listing.hostResponse')}</span>
                <span>{t('listing.memberSince', { date: formatDate(host?.createdAt ?? '', lang, { month: 'long', year: 'numeric', day: undefined }) })}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="mobile-booking-bar">
        <div>
          <strong>{fmt(listing.price)}</strong>
          <span> / {t('common.night')}</span>
        </div>
        <button type="button" className="btn btn-coral" onClick={scrollToBooking}>
          {t('listing.reserve')}
        </button>
      </div>

      <Modal
        open={lightbox !== null}
        onClose={() => setLightbox(null)}
        title={t('listing.gallery')}
        size="lg"
      >
        {lightbox !== null && (
          <div className="lightbox">
            <img src={listing.images[lightbox]} alt={`${listing.title} ${lightbox + 1}`} />
            <div className="lightbox-controls">
              <button
                type="button"
                className="icon-btn"
                onClick={() => setLightbox((lightbox - 1 + listing.images.length) % listing.images.length)}
                aria-label="Précédent"
              >
                <ChevronLeft size={20} />
              </button>
              <span>{lightbox + 1} / {listing.images.length}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setLightbox((lightbox + 1) % listing.images.length)}
                aria-label="Suivant"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        title={t('listing.reviewsTitle')}
        size="lg"
      >
        <div className="review-list">
          {reviews.map((review) => (
            <article className="review-card" key={review.id}>
              <div className="review-head">
                <Avatar name={review.authorName} hue={review.authorName.length * 47} size={38} />
                <div>
                  <strong>{review.authorName}</strong>
                  <span>{formatMonthYear(review.createdAt, lang)}</span>
                </div>
                <span className="review-stars">
                  {Array.from({ length: review.rating }).map((_, index) => (
                    <Star key={index} size={12} fill="currentColor" strokeWidth={0} />
                  ))}
                </span>
              </div>
              <p>{review.text}</p>
            </article>
          ))}
        </div>
      </Modal>

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title={t('listing.report')}
        footer={
          <button
            type="button"
            className="btn btn-coral"
            onClick={() => {
              reportIssue(reportText)
              setReportOpen(false)
              setReportText('')
            }}
          >
            {t('common.submit')}
          </button>
        }
      >
        <p className="muted">{t('trust.reportDesc')}</p>
        <textarea
          className="textarea"
          rows={4}
          value={reportText}
          onChange={(event) => setReportText(event.target.value)}
          placeholder={t('trust.reportPlaceholder')}
        />
      </Modal>

      <Modal
        open={verifyPrompt}
        onClose={() => setVerifyPrompt(false)}
        title={t('booking.unverifiedTitle')}
        footer={
          <Link to="/verify?tab=identity" className="btn btn-coral" onClick={() => setVerifyPrompt(false)}>
            {t('booking.verifyNow')}
          </Link>
        }
      >
        <p className="muted">{t('booking.unverifiedDesc')}</p>
      </Modal>

    </div>
  )
}
