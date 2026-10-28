import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight,
  CalendarPlus,
  Check,
  CheckCircle2,
  Download,
  Mail,
  MapPin,
  Share2,
  ShieldCheck,
} from 'lucide-react'
import { CANCELLATION_LABELS, formatDate, paymentLabel } from '../lib/catalog'
import { useStore } from '../lib/store'
import { Avatar, Badge, EmptyState } from '../components/ui'
import { useToast } from '../components/Toast'

function icsDate(iso: string): string {
  return iso.replace(/-/g, '')
}

export function Confirmation() {
  const { id } = useParams()
  const { t, lang, data, user, fmt } = useStore()
  const { showToast } = useToast()
  const booking = data.bookings.find((item) => item.id === id)
  const listing = booking ? data.listings.find((item) => item.id === booking.listingId) : undefined
  const host = listing ? data.users.find((item) => item.id === listing.hostId) : undefined

  if (!booking || !listing || (user && booking.guestId !== user.id && user.role !== 'admin')) {
    return (
      <div className="container page-pad">
        <EmptyState
          icon={<CheckCircle2 size={28} />}
          title={t('booking.invalidTitle')}
          description={t('booking.invalidDesc')}
          action={<Link to="/trips" className="btn btn-ink">{t('booking.viewTrips')}</Link>}
        />
      </div>
    )
  }

  const nights = booking.quote.nights
  const cancelLabel = CANCELLATION_LABELS[listing.cancellationPolicy]

  const downloadCalendar = () => {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Wanderra//Booking//EN',
      'BEGIN:VEVENT',
      `UID:${booking.id}@wanderra.app`,
      `DTSTART;VALUE=DATE:${icsDate(booking.checkIn)}`,
      `DTEND;VALUE=DATE:${icsDate(booking.checkOut)}`,
      `SUMMARY:${listing.title} — Wanderra`,
      `LOCATION:${listing.city}, ${listing.country}`,
      `DESCRIPTION:Réservation ${booking.code} · ${nights} nuits · ${booking.guests} voyageurs`,
      'END:VEVENT',
      'END:VCALENDAR',
    ]
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `wanderra-${booking.code}.ics`
    link.click()
    URL.revokeObjectURL(url)
    showToast('booking.addToCalendar', 'success')
  }

  const downloadInvoice = () => {
    const lines = [
      'WANDERRA — FACTURE DE DÉMONSTRATION',
      '====================================',
      `Réservation : ${booking.code}`,
      `Date : ${new Date(booking.createdAt).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')}`,
      '',
      `Logement : ${listing.title}`,
      `Adresse : ${listing.city}, ${listing.country}`,
      `Séjour : ${formatDate(booking.checkIn, lang)} → ${formatDate(booking.checkOut, lang)}`,
      `Voyageurs : ${booking.guests}`,
      `Paiement : ${paymentLabel(booking.paymentMethod, lang)}`,
      '',
      `Sous-total : ${fmt(booking.quote.subtotal)}`,
      `Remise : -${fmt(booking.quote.discount)}`,
      `Ménage : ${fmt(booking.quote.cleaning)}`,
      `Service : ${fmt(booking.quote.service)}`,
      `Taxes : ${fmt(booking.quote.taxes)}`,
      `TOTAL : ${fmt(booking.quote.total)} ${booking.quote.currency}`,
      '',
      'Document de démonstration — aucun paiement réel.',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `facture-${booking.code}.txt`
    link.click()
    URL.revokeObjectURL(url)
    showToast('booking.downloadInvoice', 'success')
  }

  const share = async () => {
    const text = `${listing.title} · ${booking.code} · Wanderra`
    try {
      if (navigator.share) await navigator.share({ title: 'Wanderra', text, url: window.location.href })
      else await navigator.clipboard.writeText(window.location.href)
      showToast('toast.linkCopied', 'success')
    } catch {
      showToast('toast.error', 'error')
    }
  }

  return (
    <div className="confirmation-page">
      <div className="confirmation-hero">
        <div className="confirmation-check">
          <CheckCircle2 size={34} />
        </div>
        <span className="eyebrow">{t('booking.stepConfirm')}</span>
        <h1>{t('booking.successTitle')}</h1>
        <p>{t('booking.successDesc', { email: user?.email ?? '' })}</p>
        <div className="confirmation-code">
          <span>{t('booking.confirmationCode')}</span>
          <strong>{booking.code}</strong>
        </div>
      </div>

      <div className="container confirmation-body">
        <div className="confirmation-main">
          <section className="panel">
            <div className="panel-head">
              <h2>{t('booking.yourTrip')}</h2>
              <Badge tone="success"><Check size={13} /> {t('booking.emailSent')}</Badge>
            </div>
            <div className="checkout-trip">
              <img src={listing.images[0]} alt={listing.title} />
              <div>
                <h3>{listing.title}</h3>
                <p><MapPin size={14} /> {listing.city}, {listing.country}</p>
                <div className="trip-facts">
                  <span>{formatDate(booking.checkIn, lang)} → {formatDate(booking.checkOut, lang)}</span>
                  <span>{nights} {nights === 1 ? t('common.night') : t('common.nights')}</span>
                  <span>{booking.guests} {booking.guests === 1 ? t('common.guest') : t('common.guests')}</span>
                </div>
                <Badge tone="neutral">{cancelLabel[lang]}</Badge>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>{t('booking.confirmationCode')}</h2>
            </div>
            <div className="confirmation-grid">
              <div>
                <span>{t('booking.paymentMethod')}</span>
                <strong>{paymentLabel(booking.paymentMethod, lang)}</strong>
              </div>
              <div>
                <span>{t('listing.total')}</span>
                <strong>{fmt(booking.quote.total)} {booking.quote.currency}</strong>
              </div>
              <div>
                <span>{t('common.checkIn')}</span>
                <strong>{t('booking.checkInTime')}</strong>
              </div>
              <div>
                <span>{t('common.checkOut')}</span>
                <strong>{t('booking.checkOutTime')}</strong>
              </div>
            </div>
            <div className="confirmation-note">
              <ShieldCheck size={20} />
              <div>
                <strong>{t('booking.protectionTitle')}</strong>
                <span>{t('booking.protectionDesc')}</span>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>{lang === 'fr' ? 'Prochaines étapes' : 'Next steps'}</h2>
            </div>
            <ol className="next-steps">
              <li>
                <span>1</span>
                <div>
                  <strong>{lang === 'fr' ? 'Vérifiez votre e-mail' : 'Check your email'}</strong>
                  <p>{lang === 'fr' ? 'Le récapitulatif et les instructions d’arrivée y sont détaillés.' : 'The summary and arrival instructions are included.'}</p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>{lang === 'fr' ? 'Échangez avec votre hôte' : 'Chat with your host'}</strong>
                  <p>{lang === 'fr' ? 'Précisez votre heure d’arrivée et posez vos questions.' : 'Share your arrival time and ask any questions.'}</p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>{lang === 'fr' ? 'Profitez du séjour' : 'Enjoy your stay'}</strong>
                  <p>{lang === 'fr' ? 'L’adresse exacte sera communiquée 24 h avant l’arrivée.' : 'The exact address is shared 24 hours before arrival.'}</p>
                </div>
              </li>
            </ol>
          </section>
        </div>

        <aside className="confirmation-side">
          <div className="summary-card">
            <div className="host-mini-card">
              <Avatar name={host?.name ?? 'W'} hue={host?.avatarHue ?? 24} size={48} />
              <div>
                <strong>{t('listing.hostedBy', { name: host?.name ?? 'Wanderra' })}</strong>
                <span>{listing.city}</span>
              </div>
            </div>
            <div className="quote-lines">
              <div><span>{t('listing.cleaningFee')}</span><span>{fmt(booking.quote.cleaning)}</span></div>
              <div><span>{t('listing.serviceFee')}</span><span>{fmt(booking.quote.service)}</span></div>
              <div><span>{t('listing.taxes')}</span><span>{fmt(booking.quote.taxes)}</span></div>
              <div className="quote-total"><span>{t('listing.total')}</span><span>{fmt(booking.quote.total)}</span></div>
            </div>
            <button type="button" className="btn btn-ink btn-block" onClick={downloadCalendar}>
              <CalendarPlus size={16} /> {t('booking.addToCalendar')}
            </button>
            <button type="button" className="btn btn-outline btn-block" onClick={downloadInvoice}>
              <Download size={16} /> {t('booking.downloadInvoice')}
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={share}>
              <Share2 size={16} /> {t('booking.successShare')}
            </button>
          </div>

          <div className="confirmation-help">
            <Mail size={18} />
            <div>
              <strong>{t('booking.needHelp')}</strong>
              <Link to="/help" className="text-link">{t('footer.helpCenter')}</Link>
            </div>
          </div>

          <Link to="/trips" className="btn btn-coral btn-block">
            {t('booking.viewTrips')} <ArrowRight size={16} />
          </Link>
          <Link to="/" className="text-link center-link">{t('notfound.cta')}</Link>
        </aside>
      </div>
    </div>
  )
}
