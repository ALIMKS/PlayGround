import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Home as HomeIcon,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  CANCELLATION_LABELS,
  formatDate,
  formatMonthYear,
} from '../lib/catalog'
import { occupancyRate, parseDate, todayISO } from '../lib/availability'
import { hostNet } from '../lib/pricing'
import { useStore } from '../lib/store'
import type { Booking, Listing } from '../lib/types'
import { Avatar, Badge, EmptyState, Stat } from '../components/ui'

type HostTab = 'overview' | 'listings' | 'bookings' | 'earnings'

export function Host() {
  const {
    t,
    lang,
    data,
    user,
    fmt,
    becomeHost,
    setListingStatus,
  } = useStore()
  const [tab, setTab] = useState<HostTab>('overview')
  const [estimatePrice, setEstimatePrice] = useState(180)
  const [estimateNights, setEstimateNights] = useState(18)

  if (!user) return <Navigate to="/login?next=/host" replace />

  if (user.role === 'guest') {
    const eligible = user.idStatus === 'verified' && user.phoneVerified
    return (
      <div className="host-landing">
        <section className="host-hero">
          <img src="/images/stay-6.jpg" alt="" />
          <div className="host-hero-overlay" />
          <div className="container host-hero-content">
            <span className="eyebrow">{t('host.dashboard')}</span>
            <h1>{t('host.becomeHostTitle')}</h1>
            <p>{t('host.becomeHostDesc')}</p>
            <div className="host-hero-actions">
              {eligible ? (
                <button type="button" className="btn btn-coral btn-lg" onClick={becomeHost}>
                  {t('host.startHosting')} <ArrowRight size={17} />
                </button>
              ) : (
                <Link to="/verify?tab=identity" className="btn btn-coral btn-lg">
                  {t('host.verifyToHost')} <ArrowRight size={17} />
                </Link>
              )}
              <Link to="/trust" className="btn btn-ghost-light btn-lg">{t('host.hostProtection')}</Link>
            </div>
            <div className="host-hero-trust">
              <span><ShieldCheck size={16} /> {t('host.hostProtectionDesc')}</span>
              <span><Wallet size={16} /> {t('host.payoutSchedule')}</span>
            </div>
          </div>
        </section>

        <div className="container host-landing-body">
          <div className="host-benefits">
            <article>
              <div className="host-benefit-icon"><CircleDollarSign size={22} /></div>
              <h3>{t('host.earningsTitle')}</h3>
              <p>{t('host.earningsDesc')}</p>
            </article>
            <article>
              <div className="host-benefit-icon"><ShieldCheck size={22} /></div>
              <h3>{t('host.hostProtection')}</h3>
              <p>{t('host.hostProtectionDesc')}</p>
            </article>
            <article>
              <div className="host-benefit-icon"><CalendarDays size={22} /></div>
              <h3>{t('host.occupancy')}</h3>
              <p>{t('host.occupancyDesc')}</p>
            </article>
          </div>

          <div className="host-calculator">
            <div>
              <span className="eyebrow">{t('host.estimatedRevenue')}</span>
              <h2>{fmt(estimatePrice * estimateNights * 0.97)}</h2>
              <p className="muted">{t('host.estimatedDesc')}</p>
              <div className="calc-controls">
                <label>
                  <span>{t('host.priceLabel')}</span>
                  <input
                    type="range"
                    min={50}
                    max={500}
                    step={10}
                    value={estimatePrice}
                    onChange={(event) => setEstimatePrice(Number(event.target.value))}
                    className="range"
                  />
                  <strong>{estimatePrice} USD</strong>
                </label>
                <label>
                  <span>{t('host.nightsPerMonth')}</span>
                  <input
                    type="range"
                    min={2}
                    max={30}
                    step={1}
                    value={estimateNights}
                    onChange={(event) => setEstimateNights(Number(event.target.value))}
                    className="range"
                  />
                  <strong>{estimateNights} {t('common.nights')}</strong>
                </label>
              </div>
            </div>
            <div className="host-calculator-note">
              <Sparkles size={18} />
              <p>{t('host.estimatedNote')}</p>
            </div>
          </div>

          <div className="host-requirements">
            <div>
              <span className="eyebrow">{t('host.requirements')}</span>
              <h2>{t('host.verifyToHost')}</h2>
              <p className="muted">{t('host.verificationRequiredDesc')}</p>
            </div>
            <div className="requirement-list">
              <div className={user.emailVerified ? 'requirement requirement-done' : 'requirement'}>
                {user.emailVerified ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                <span>{t('host.requirementEmail')}</span>
                {!user.emailVerified && <Link to="/verify?tab=email" className="text-link">{t('account.verifyNow')}</Link>}
              </div>
              <div className={user.phoneVerified ? 'requirement requirement-done' : 'requirement'}>
                {user.phoneVerified ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                <span>{t('host.requirementPhone')}</span>
                {!user.phoneVerified && <Link to="/verify?tab=phone" className="text-link">{t('account.verifyNow')}</Link>}
              </div>
              <div className={user.idStatus === 'verified' ? 'requirement requirement-done' : 'requirement'}>
                {user.idStatus === 'verified' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                <span>{t('host.requirementId')}</span>
                {user.idStatus !== 'verified' && <Link to="/verify?tab=identity" className="text-link">{t('account.verifyNow')}</Link>}
              </div>
              <div className={user.payoutMethod ? 'requirement requirement-done' : 'requirement'}>
                {user.payoutMethod ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                <span>{t('host.requirementPayout')}</span>
                {!user.payoutMethod && <Link to="/account" className="text-link">{t('host.addPayout')}</Link>}
              </div>
            </div>
            <div className="host-requirements-cta">
              {eligible ? (
                <button type="button" className="btn btn-coral btn-lg" onClick={becomeHost}>
                  {t('host.startHosting')} <ArrowRight size={17} />
                </button>
              ) : (
                <Link to="/verify?tab=identity" className="btn btn-coral btn-lg">
                  {t('host.verifyToHost')} <ArrowRight size={17} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const myListings = data.listings.filter((listing) => listing.hostId === user.id)
  const myBookings = data.bookings.filter((booking) => booking.hostId === user.id)
  const activeBookings = myBookings.filter((booking) => booking.status !== 'cancelled')
  const today = todayISO()

  const revenueUsd = (booking: Booking) => {
    const net = hostNet(booking)
    return booking.quote.fxRate ? net / booking.quote.fxRate : net
  }

  const revenue30 = activeBookings
    .filter((booking) => booking.createdAt.slice(0, 10) >= addDaysLocal(today, -30))
    .reduce((sum, booking) => sum + revenueUsd(booking), 0)
  const nightsBooked = activeBookings.reduce((sum, booking) => sum + booking.quote.nights, 0)
  const rated = myListings.filter((listing) => listing.reviewCount > 0)
  const avgRating = rated.length
    ? rated.reduce((sum, listing) => sum + listing.rating, 0) / rated.length
    : 0
  const occupancy = myListings.length
    ? Math.round(myListings.reduce((sum, listing) => sum + occupancyRate(listing, data.bookings), 0) / myListings.length)
    : 0

  const upcoming = myBookings
    .filter((booking) => booking.status === 'confirmed' && booking.checkIn >= today)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))

  const pendingBalance = upcoming.reduce((sum, booking) => sum + revenueUsd(booking), 0)
  const availableBalance = activeBookings
    .filter((booking) => booking.checkIn < today)
    .reduce((sum, booking) => sum + revenueUsd(booking), 0)
  const lifetime = activeBookings.reduce((sum, booking) => sum + revenueUsd(booking), 0)
  const grossLifetime = activeBookings.reduce((sum, booking) => {
    const base = booking.quote.subtotal - booking.quote.discount + booking.quote.cleaning
    return sum + (booking.quote.fxRate ? base / booking.quote.fxRate : base)
  }, 0)
  const feeLifetime = grossLifetime - lifetime

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - (5 - index))
    return date
  })
  const chart = months.map((date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const value = activeBookings
      .filter((booking) => booking.checkIn.startsWith(key))
      .reduce((sum, booking) => sum + revenueUsd(booking), 0)
    return {
      key,
      label: new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' }).format(date),
      value,
    }
  })
  const maxChart = Math.max(1, ...chart.map((item) => item.value))

  const statusBadge = (listing: Listing) => {
    if (listing.status === 'published') return <Badge tone="success">{t('host.published')}</Badge>
    if (listing.status === 'pending') return <Badge tone="warning">{t('host.pending')}</Badge>
    return <Badge tone="neutral">{t('host.paused')}</Badge>
  }

  return (
    <div className="host-page">
      <div className="container">
        <div className="page-head host-page-head">
          <div>
            <span className="eyebrow">{t('host.dashboard')}</span>
            <h1>{t('host.welcome', { name: user.name.split(' ')[0] })}</h1>
            <p>{t('host.dashboardSubtitle')}</p>
          </div>
          <div className="page-head-actions">
            <Link to="/account" className="btn btn-outline">
              <Wallet size={16} /> {t('host.payouts')}
            </Link>
            <Link to="/host/new" className="btn btn-coral">
              <Plus size={16} /> {t('host.newListing')}
            </Link>
          </div>
        </div>

        {(user.idStatus !== 'verified' || !user.phoneVerified) && (
          <div className="alert-banner">
            <ShieldCheck size={20} />
            <div>
              <strong>{t('host.verificationRequired')}</strong>
              <span>{t('host.verificationRequiredDesc')}</span>
            </div>
            <Link to="/verify" className="btn btn-outline btn-sm">{t('account.verifyNow')}</Link>
          </div>
        )}

        <div className="tabs tabs-line">
          {([
            ['overview', t('host.overview')],
            ['listings', t('host.listings')],
            ['bookings', t('host.bookings')],
            ['earnings', t('host.earnings')],
          ] as [HostTab, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`tab ${tab === key ? 'tab-active' : ''}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            <div className="stat-grid">
              <Stat label={t('host.statsRevenue')} value={fmt(revenue30)} sub={t('host.revenueDesc')} icon={<TrendingUp size={18} />} tone="green" />
              <Stat label={t('host.statsBookings')} value={String(activeBookings.length)} sub={t('host.bookingsDesc')} icon={<CalendarDays size={18} />} />
              <Stat label={t('host.statsNights')} value={String(nightsBooked)} sub={t('host.nightsDesc')} icon={<BedDouble size={18} />} tone="coral" />
              <Stat label={t('host.statsRating')} value={avgRating ? avgRating.toFixed(2) : '—'} sub={t('host.ratingDesc')} icon={<Star size={18} />} tone="gold" />
            </div>

            <div className="host-overview-grid">
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>{t('host.revenueChart')}</h2>
                    <p className="muted small">{t('host.revenueChartDesc')}</p>
                  </div>
                  <BarChart3 size={20} />
                </div>
                <div className="bar-chart">
                  {chart.map((item) => (
                    <div className="bar-column" key={item.key}>
                      <span className="bar-value">{item.value > 0 ? fmt(item.value, { compact: true }) : ''}</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ height: `${Math.max(4, (item.value / maxChart) * 100)}%` }} />
                      </div>
                      <span className="bar-label">{item.label}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel">
                <div className="panel-head">
                  <h2>{t('host.occupancy')}</h2>
                  <Badge tone="success">{occupancy}%</Badge>
                </div>
                <div className="occupancy-block">
                  <div
                    className="occupancy-ring"
                    style={{ background: `conic-gradient(var(--coral) ${occupancy}%, var(--line) ${occupancy}% 100%)` }}
                  >
                    <strong>{occupancy}%</strong>
                  </div>
                  <p className="muted small">{t('host.occupancyDesc')}</p>
                </div>
                <div className="occupancy-legend">
                  <span><i className="legend-dot legend-free" /> {t('host.availableNights')}</span>
                  <span><i className="legend-dot legend-blocked" /> {t('host.bookedNights')}</span>
                </div>
              </section>
            </div>

            <section className="panel">
              <div className="panel-head">
                <h2>{t('host.upcoming')}</h2>
                <Link to="/host?tab=bookings" className="text-link">{t('common.viewAll')}</Link>
              </div>
              {upcoming.length === 0 ? (
                <p className="muted">{t('host.noUpcoming')}</p>
              ) : (
                <div className="arrival-list">
                  {upcoming.slice(0, 4).map((booking) => {
                    const listing = data.listings.find((item) => item.id === booking.listingId)
                    const guest = data.users.find((item) => item.id === booking.guestId)
                    return (
                      <div className="arrival-row" key={booking.id}>
                        <Avatar name={guest?.name ?? 'Voyageur'} hue={guest?.avatarHue ?? 24} size={40} />
                        <div className="arrival-main">
                          <strong>{guest?.name ?? t('host.guestName')}</strong>
                          <span>{listing?.title} · {listing?.city}</span>
                        </div>
                        <div className="arrival-date">
                          <span>{t('common.checkIn')}</span>
                          <strong>{formatDate(booking.checkIn, lang)}</strong>
                        </div>
                        <div className="arrival-nights">
                          <span>{booking.quote.nights} {t('common.nights')}</span>
                          <span>{booking.guests} {t('common.guests')}</span>
                        </div>
                        <strong className="arrival-net">{fmt(revenueUsd(booking))}</strong>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {tab === 'listings' && (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>{t('host.manageListings')}</h2>
                <p className="muted small">{t('host.listingsDesc')}</p>
              </div>
              <Link to="/host/new" className="btn btn-coral btn-sm"><Plus size={15} /> {t('host.newListing')}</Link>
            </div>
            {myListings.length === 0 ? (
              <EmptyState
                icon={<HomeIcon size={28} />}
                title={t('host.noListings')}
                action={<Link to="/host/new" className="btn btn-ink">{t('host.newListing')}</Link>}
              />
            ) : (
              <div className="host-listing-list">
                {myListings.map((listing) => {
                  const count = myBookings.filter(
                    (booking) => booking.listingId === listing.id && booking.status !== 'cancelled',
                  ).length
                  return (
                    <div className="host-listing-row" key={listing.id}>
                      <img src={listing.images[0]} alt={listing.title} loading="lazy" />
                      <div className="host-listing-main">
                        <strong>{listing.title}</strong>
                        <span>{listing.city}, {listing.country}</span>
                        <div className="host-listing-meta">
                          {statusBadge(listing)}
                          <span>{count} {t('host.bookings')}</span>
                          <span>{listing.reviewCount > 0 ? `★ ${listing.rating.toFixed(2)} (${listing.reviewCount})` : t('host.noReviews')}</span>
                        </div>
                      </div>
                      <div className="host-listing-price">
                        <strong>{fmt(listing.price)}</strong>
                        <span>{t('common.perNight')}</span>
                      </div>
                      <div className="host-listing-actions">
                        <Link to={`/listing/${listing.id}`} className="btn btn-outline btn-sm">{t('host.reviewListing')}</Link>
                        {listing.status === 'published' && (
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setListingStatus(listing.id, 'paused')}>
                            <Pause size={14} /> {t('host.pause')}
                          </button>
                        )}
                        {listing.status === 'paused' && (
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setListingStatus(listing.id, 'published')}>
                            <Play size={14} /> {t('host.publish')}
                          </button>
                        )}
                        {listing.status === 'pending' && <Badge tone="warning">{t('host.pending')}</Badge>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {tab === 'bookings' && (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>{t('host.bookings')}</h2>
                <p className="muted small">{t('host.bookingsTabDesc')}</p>
              </div>
            </div>
            {myBookings.length === 0 ? (
              <EmptyState icon={<CalendarDays size={28} />} title={t('host.noBookings')} />
            ) : (
              <div className="host-bookings-table">
                <div className="table-head">
                  <span>{t('host.guestName')}</span>
                  <span>{t('host.listing')}</span>
                  <span>{t('common.dates')}</span>
                  <span>{t('common.status')}</span>
                  <span>{t('host.netEarnings')}</span>
                </div>
                {[...myBookings].sort((a, b) => b.checkIn.localeCompare(a.checkIn)).map((booking) => {
                  const listing = data.listings.find((item) => item.id === booking.listingId)
                  const guest = data.users.find((item) => item.id === booking.guestId)
                  return (
                    <div className="table-row" key={booking.id}>
                      <div className="table-guest">
                        <Avatar name={guest?.name ?? 'Voyageur'} hue={guest?.avatarHue ?? 24} size={32} />
                        <div>
                          <strong>{guest?.name ?? t('host.guestName')}</strong>
                          <span>{booking.code}</span>
                        </div>
                      </div>
                      <div>
                        <strong>{listing?.title}</strong>
                        <span>{listing?.city}</span>
                      </div>
                      <div>
                        <strong>{formatDate(booking.checkIn, lang)}</strong>
                        <span>{formatDate(booking.checkOut, lang)}</span>
                      </div>
                      <div>
                        <Badge tone={booking.status === 'cancelled' ? 'danger' : booking.status === 'completed' ? 'neutral' : 'success'}>
                          {booking.status === 'cancelled' ? t('trips.statusCancelled') : booking.status === 'completed' ? t('trips.statusCompleted') : t('trips.statusConfirmed')}
                        </Badge>
                      </div>
                      <div>
                        <strong>{fmt(revenueUsd(booking))}</strong>
                        <span>{CANCELLATION_LABELS[listing?.cancellationPolicy ?? 'flexible'][lang]}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {tab === 'earnings' && (
          <>
            <div className="stat-grid stat-grid-3">
              <Stat label={t('host.availableBalance')} value={fmt(availableBalance)} sub={t('host.availableDesc')} icon={<Wallet size={18} />} tone="green" />
              <Stat label={t('host.pendingBalance')} value={fmt(pendingBalance)} sub={t('host.pendingDesc')} icon={<Clock size={18} />} tone="gold" />
              <Stat label={t('host.lifetimeEarnings')} value={fmt(lifetime)} sub={t('host.lifetimeDesc')} icon={<CircleDollarSign size={18} />} tone="coral" />
            </div>

            <div className="host-overview-grid">
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>{t('host.payoutTitle')}</h2>
                    <p className="muted small">{t('host.payoutDesc')}</p>
                  </div>
                  <Wallet size={20} />
                </div>
                <div className="payout-status">
                  <div>
                    <strong>{user.payoutMethod || t('account.noPayout')}</strong>
                    <span>{t('host.payoutSchedule')}</span>
                  </div>
                  <Link to="/account" className="btn btn-outline btn-sm">{t('host.editPayout')}</Link>
                </div>
                <div className="secure-note"><ShieldCheck size={15} /> {t('host.payoutSecure')}</div>
              </section>

              <section className="panel">
                <div className="panel-head">
                  <h2>{t('host.earningsBreakdown')}</h2>
                </div>
                <div className="earnings-breakdown">
                  <div><span>{t('host.grossEarnings')}</span><strong>{fmt(grossLifetime)}</strong></div>
                  <div><span>{t('host.fee')}</span><strong>−{fmt(feeLifetime)}</strong></div>
                  <div className="quote-total"><span>{t('host.netEarnings')}</span><strong>{fmt(lifetime)}</strong></div>
                </div>
              </section>
            </div>

            <section className="panel">
              <div className="panel-head">
                <h2>{t('host.transactions')}</h2>
              </div>
              {activeBookings.length === 0 ? (
                <p className="muted">{t('host.noBookings')}</p>
              ) : (
                <div className="host-bookings-table">
                  <div className="table-head">
                    <span>{t('host.bookingCode')}</span>
                    <span>{t('common.dates')}</span>
                    <span>{t('host.gross')}</span>
                    <span>{t('host.fee')}</span>
                    <span>{t('host.netEarnings')}</span>
                  </div>
                  {[...activeBookings].sort((a, b) => b.checkIn.localeCompare(a.checkIn)).slice(0, 10).map((booking) => {
                    const net = revenueUsd(booking)
                    const grossBase = booking.quote.subtotal - booking.quote.discount + booking.quote.cleaning
                    const gross = booking.quote.fxRate ? grossBase / booking.quote.fxRate : grossBase
                    return (
                      <div className="table-row" key={booking.id}>
                        <div>
                          <strong>{booking.code}</strong>
                          <span>{formatMonthYear(booking.checkIn, lang)}</span>
                        </div>
                        <div>
                          <strong>{formatDate(booking.checkIn, lang)}</strong>
                          <span>{formatDate(booking.checkOut, lang)}</span>
                        </div>
                        <div><strong>{fmt(gross)}</strong></div>
                        <div><span className="muted">−{fmt(gross - net)}</span></div>
                        <div><strong className="text-green">{fmt(net)}</strong></div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function addDaysLocal(iso: string, days: number): string {
  const date = parseDate(iso)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}
