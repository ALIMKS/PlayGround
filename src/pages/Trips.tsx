import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  ReceiptText,
  RotateCcw,
  Star,
  XCircle,
} from 'lucide-react'
import { CANCELLATION_LABELS, formatDate, paymentLabel } from '../lib/catalog'
import { cancellationRefund } from '../lib/pricing'
import { nightsBetween, parseDate, todayISO } from '../lib/availability'
import { useStore } from '../lib/store'
import type { Booking } from '../lib/types'
import { Avatar, Badge, EmptyState, Field, Modal } from '../components/ui'
import { useToast } from '../components/Toast'

type Tab = 'upcoming' | 'past' | 'cancelled'

export function Trips() {
  const { t, lang, data, user, fmt, cancelBooking, addReview, sendMessage } = useStore()
  const { showToast } = useToast()
  const [tab, setTab] = useState<Tab>('upcoming')
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null)
  const [messageTarget, setMessageTarget] = useState<Booking | null>(null)
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [messageText, setMessageText] = useState('')

  if (!user) return <Navigate to="/login?next=/trips" replace />

  const today = todayISO()
  const myBookings = data.bookings.filter((booking) => booking.guestId === user.id)

  const groups = useMemo(() => {
    const upcoming = myBookings
      .filter((booking) => booking.status === 'confirmed' && booking.checkOut >= today)
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
    const past = myBookings
      .filter(
        (booking) =>
          booking.status === 'completed' ||
          (booking.status === 'confirmed' && booking.checkOut < today),
      )
      .sort((a, b) => b.checkIn.localeCompare(a.checkIn))
    const cancelled = myBookings
      .filter((booking) => booking.status === 'cancelled')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return { upcoming, past, cancelled }
  }, [myBookings, today])

  const current = groups[tab]

  const openReview = (booking: Booking) => {
    setReviewTarget(booking)
    setRating(5)
    setReviewText('')
  }

  const submitReview = () => {
    if (!reviewTarget || !reviewText.trim()) return
    addReview(reviewTarget.id, rating, reviewText.trim())
    showToast('toast.reviewSubmitted', 'success')
    setReviewTarget(null)
    setReviewText('')
  }

  const submitMessage = () => {
    if (!messageTarget || !messageText.trim()) return
    sendMessage(messageTarget.id, messageText.trim())
    setMessageText('')
    showToast('toast.messageSent', 'success')
  }

  const messagesForTarget = messageTarget
    ? data.messages.filter((message) => message.bookingId === messageTarget.id)
    : []

  const emptyCopy = {
    upcoming: t('trips.emptyUpcoming'),
    past: t('trips.emptyPast'),
    cancelled: t('trips.emptyCancelled'),
  }[tab]

  return (
    <div className="trips-page">
      <div className="container">
        <div className="page-head">
          <div>
            <span className="eyebrow">{t('nav.trips')}</span>
            <h1>{t('trips.title')}</h1>
            <p>{t('trips.subtitle')}</p>
          </div>
          <Link to="/search" className="btn btn-ink">{t('trips.explore')}</Link>
        </div>

        <div className="tabs tabs-line">
          {(['upcoming', 'past', 'cancelled'] as Tab[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`tab ${tab === key ? 'tab-active' : ''}`}
              onClick={() => setTab(key)}
            >
              {t(`trips.${key}`)}
              <span className="tab-count">{groups[key].length}</span>
            </button>
          ))}
        </div>

        {current.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={28} />}
            title={t('trips.empty')}
            description={emptyCopy}
            action={<Link to="/search" className="btn btn-ink">{t('trips.explore')}</Link>}
          />
        ) : (
          <div className="trip-list">
            {current.map((booking) => {
              const listing = data.listings.find((item) => item.id === booking.listingId)
              const host = data.users.find((item) => item.id === booking.hostId)
              if (!listing) return null
              const nights = nightsBetween(booking.checkIn, booking.checkOut)
              const review = data.reviews.find((item) => item.bookingId === booking.id)
              const daysUntil = Math.ceil(
                (parseDate(booking.checkIn).getTime() - parseDate(today).getTime()) / 86_400_000,
              )
              const isPast = tab === 'past'
              const isCancelled = tab === 'cancelled'

              return (
                <article className="trip-card" key={booking.id}>
                  <Link to={`/listing/${listing.id}`} className="trip-image">
                    <img src={listing.images[0]} alt={listing.title} loading="lazy" />
                  </Link>
                  <div className="trip-body">
                    <div className="trip-top">
                      <div>
                        <div className="trip-status-row">
                          {isCancelled ? (
                            <Badge tone="danger"><XCircle size={12} /> {t('trips.statusCancelled')}</Badge>
                          ) : isPast ? (
                            <Badge tone="neutral"><CheckCircle2 size={12} /> {t('trips.statusCompleted')}</Badge>
                          ) : (
                            <Badge tone="success"><Clock size={12} /> {t('trips.statusConfirmed')}</Badge>
                          )}
                          <span className="muted small">{t('trips.code')} {booking.code}</span>
                        </div>
                        <h2><Link to={`/listing/${listing.id}`}>{listing.title}</Link></h2>
                        <p className="trip-location"><MapPin size={14} /> {listing.city}, {listing.country}</p>
                      </div>
                      <div className="trip-total">
                        <span>{t('listing.total')}</span>
                        <strong>{fmt(booking.quote.total)}</strong>
                      </div>
                    </div>

                    <div className="trip-meta">
                      <div><span>{t('common.checkIn')}</span><strong>{formatDate(booking.checkIn, lang)}</strong></div>
                      <div><span>{t('common.checkOut')}</span><strong>{formatDate(booking.checkOut, lang)}</strong></div>
                      <div><span>{t('common.guests')}</span><strong>{booking.guests}</strong></div>
                      <div><span>{t('common.nights')}</span><strong>{nights}</strong></div>
                    </div>

                    <div className="trip-host">
                      <Avatar name={host?.name ?? 'W'} hue={host?.avatarHue ?? 24} size={34} />
                      <span>{t('trips.host')} · {host?.name}</span>
                      <span className="dot">·</span>
                      <span>{paymentLabel(booking.paymentMethod, lang)}</span>
                      <span className="dot">·</span>
                      <span>{CANCELLATION_LABELS[listing.cancellationPolicy][lang]}</span>
                    </div>

                    {!isCancelled && !isPast && daysUntil >= 0 && daysUntil <= 30 && (
                      <div className="trip-countdown">
                        <Clock size={15} /> {t('trips.upcomingIn', { n: daysUntil })}
                      </div>
                    )}

                    {isCancelled && booking.refund !== undefined && (
                      <div className="trip-refund">
                        <RotateCcw size={15} /> {t('trips.refunded', { amount: fmt(booking.refund) })}
                      </div>
                    )}

                    <div className="trip-actions">
                      <Link to={`/confirmation/${booking.id}`} className="btn btn-outline btn-sm">
                        <ReceiptText size={15} /> {t('trips.viewReceipt')}
                      </Link>
                      {!isCancelled && (
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => setMessageTarget(booking)}>
                          <MessageCircle size={15} /> {t('trips.messageHost')}
                        </button>
                      )}
                      {isPast && !review && !booking.reviewLeft && (
                        <button type="button" className="btn btn-coral btn-sm" onClick={() => openReview(booking)}>
                          <Star size={15} /> {t('trips.review')}
                        </button>
                      )}
                      {isPast && (review || booking.reviewLeft) && (
                        <span className="review-done"><CheckCircle2 size={15} /> {t('trips.reviewLeft')}</span>
                      )}
                      {!isCancelled && !isPast && booking.status === 'confirmed' && booking.checkIn > today && (
                        <button type="button" className="btn btn-ghost btn-sm danger-text" onClick={() => setCancelTarget(booking)}>
                          {t('trips.cancel')}
                        </button>
                      )}
                      {isCancelled && (
                        <Link to={`/listing/${listing.id}`} className="btn btn-ink btn-sm">
                          {t('trips.bookAgain')}
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title={t('trips.cancelTitle')}
        footer={
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setCancelTarget(null)}>
              {t('trips.keep')}
            </button>
            <button
              type="button"
              className="btn btn-coral"
              onClick={() => {
                if (cancelTarget) cancelBooking(cancelTarget.id)
                showToast('toast.bookingCancelled', 'info')
                setCancelTarget(null)
              }}
            >
              {t('trips.confirmCancel')}
            </button>
          </div>
        }
      >
        {cancelTarget && (() => {
          const listing = data.listings.find((item) => item.id === cancelTarget.listingId)
          if (!listing) return null
          const refund = cancellationRefund(cancelTarget, listing.cancellationPolicy)
          return (
            <div className="cancel-summary">
              <p className="muted">{t('trips.cancelDesc')}</p>
              <div className="cancel-policy">
                <span>{t('trips.cancelPolicy')}</span>
                <strong>{CANCELLATION_LABELS[listing.cancellationPolicy][lang]}</strong>
              </div>
              <div className="cancel-refund">
                <span>{t('trips.refund')}</span>
                <strong>{fmt(refund.amount)}</strong>
                <span>{refund.percent}%</span>
              </div>
              <p className="muted small">{t('booking.demoPaymentNotice')}</p>
            </div>
          )
        })()}
      </Modal>

      <Modal
        open={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        title={t('trips.reviewTitle')}
        footer={
          <button type="button" className="btn btn-coral btn-block" onClick={submitReview} disabled={!reviewText.trim()}>
            {t('trips.submitReview')}
          </button>
        }
      >
        <p className="muted">{t('trips.reviewDesc')}</p>
        <div className="star-picker" role="radiogroup" aria-label={t('trips.reviewTitle')}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className={value <= rating ? 'star-on' : ''}
              onClick={() => setRating(value)}
              aria-label={`${value} / 5`}
              aria-pressed={value === rating}
            >
              <Star size={26} fill={value <= rating ? 'currentColor' : 'none'} />
            </button>
          ))}
          <span>{rating} / 5</span>
        </div>
        <Field label={t('trips.reviewPlaceholder')}>
          <textarea
            className="textarea"
            rows={4}
            value={reviewText}
            onChange={(event) => setReviewText(event.target.value)}
            placeholder={t('trips.reviewPlaceholder')}
          />
        </Field>
      </Modal>

      <Modal
        open={Boolean(messageTarget)}
        onClose={() => setMessageTarget(null)}
        title={t('trips.messages')}
        footer={
          <div className="message-compose">
            <input
              className="input"
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder={t('trips.messagePlaceholder')}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitMessage()
              }}
            />
            <button type="button" className="btn btn-ink" onClick={submitMessage} disabled={!messageText.trim()}>
              {t('trips.send')}
            </button>
          </div>
        }
      >
        <div className="message-thread">
          {messagesForTarget.length === 0 && <p className="muted">{t('trips.noMessages')}</p>}
          {messagesForTarget.map((message) => (
            <div
              key={message.id}
              className={`message-bubble ${message.fromId === user.id ? 'message-mine' : ''}`}
            >
              <p>{message.text}</p>
              <span>{formatDate(message.at.slice(0, 10), lang)}</span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
