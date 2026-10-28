import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock,
  FileText,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react'
import { formatDate, formatMonthYear } from '../lib/catalog'
import { useStore } from '../lib/store'
import type { Listing, User, VerificationRequest } from '../lib/types'
import { Avatar, Badge, EmptyState, Field, Modal, Stat } from '../components/ui'

type AdminTab = 'overview' | 'verifications' | 'listings' | 'users'

export function Admin() {
  const { t, lang, data, user, fmt, decideVerification, setListingStatus, setUserRole, setUserSuspended } = useStore()
  const [tab, setTab] = useState<AdminTab>('overview')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Listing['status']>('all')
  const [selected, setSelected] = useState<VerificationRequest | null>(null)
  const [note, setNote] = useState('')

  if (!user || user.role !== 'admin') {
    return (
      <div className="container page-pad">
        <EmptyState
          icon={<ShieldCheck size={28} />}
          title={t('admin.noAccess')}
          action={<a href="#/" className="btn btn-ink">{t('common.home')}</a>}
        />
      </div>
    )
  }

  const bookings = data.bookings.filter((booking) => booking.status !== 'cancelled')
  const gmv = bookings.reduce((sum, booking) => sum + (booking.quote.fxRate ? booking.quote.total / booking.quote.fxRate : booking.quote.total), 0)
  const fees = bookings.reduce((sum, booking) => {
    const rate = booking.quote.fxRate || 1
    return sum + (booking.quote.service + (booking.quote.subtotal - booking.quote.discount) * 0.03) / rate
  }, 0)
  const takeRate = gmv ? Math.round((fees / gmv) * 1000) / 10 : 0
  const pending = data.verifications.filter((request) => request.status === 'pending')
  const activeListings = data.listings.filter((listing) => listing.status === 'published').length

  const markets = useMemo(() => {
    const map = new Map<string, { country: string; volume: number; count: number }>()
    for (const booking of bookings) {
      const listing = data.listings.find((item) => item.id === booking.listingId)
      if (!listing) continue
      const key = listing.countryCode
      const current = map.get(key) ?? { country: listing.country, volume: 0, count: 0 }
      current.volume += booking.quote.fxRate ? booking.quote.total / booking.quote.fxRate : booking.quote.total
      current.count += 1
      map.set(key, current)
    }
    const rows = Array.from(map.values()).sort((a, b) => b.volume - a.volume).slice(0, 6)
    const total = rows.reduce((sum, row) => sum + row.volume, 0) || 1
    return rows.map((row) => ({ ...row, share: Math.round((row.volume / total) * 100) }))
  }, [bookings, data.listings])

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - (5 - index))
    return date
  })
  const monthly = months.map((date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    return {
      key,
      label: new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' }).format(date),
      count: data.bookings.filter((booking) => booking.createdAt.startsWith(key)).length,
    }
  })
  const maxMonthly = Math.max(1, ...monthly.map((item) => item.count))

  const filteredUsers = data.users.filter((item) => {
    if (!query.trim()) return true
    const haystack = `${item.name} ${item.email} ${item.country}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  })

  const filteredListings = data.listings.filter(
    (listing) => statusFilter === 'all' || listing.status === statusFilter,
  )

  const kindLabel = (kind: VerificationRequest['kind']) => {
    if (kind === 'identity') return t('admin.kindIdentity')
    if (kind === 'payout') return t('admin.kindPayout')
    return t('admin.kindListing')
  }

  const riskTone = (score: number) => (score >= 60 ? 'danger' : score >= 30 ? 'warning' : 'success')
  const riskLabel = (score: number) =>
    score >= 60 ? t('admin.riskHigh') : score >= 30 ? t('admin.riskMedium') : t('admin.riskLow')

  const roleBadge = (role: User['role']) => (
    <Badge tone={role === 'admin' ? 'gold' : role === 'host' ? 'coral' : 'neutral'}>
      {role === 'admin' ? t('auth.demoAdmin') : role === 'host' ? t('auth.demoHost') : t('auth.demoGuest')}
    </Badge>
  )

  return (
    <div className="admin-page">
      <div className="container">
        <div className="page-head">
          <div>
            <span className="eyebrow">{t('host.dashboard')}</span>
            <h1>{t('admin.title')}</h1>
            <p>{t('admin.subtitle')}</p>
          </div>
          <Badge tone="gold"><ShieldCheck size={13} /> {t('auth.demoAdmin')}</Badge>
        </div>

        <div className="tabs tabs-line">
          {([
            ['overview', t('admin.overview')],
            ['verifications', `${t('admin.verifications')} (${pending.length})`],
            ['listings', t('admin.listingsTab')],
            ['users', t('admin.usersTab')],
          ] as [AdminTab, string][]).map(([key, label]) => (
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
              <Stat label={t('admin.gmv')} value={fmt(gmv, { compact: true })} sub={t('admin.gmvDesc')} icon={<CircleDollarSign size={18} />} tone="green" />
              <Stat label={t('admin.takeRate')} value={`${takeRate}%`} sub={t('admin.takeRateDesc')} icon={<BarChart3 size={18} />} tone="gold" />
              <Stat label={t('admin.activeListings')} value={String(activeListings)} sub={`${data.listings.length} ${t('admin.totalListings')}`} icon={<BadgeCheck size={18} />} />
              <Stat label={t('admin.pendingVerifications')} value={String(pending.length)} sub={t('admin.queueDesc')} icon={<Clock size={18} />} tone="coral" />
              <Stat label={t('admin.totalUsers')} value={String(data.users.length)} sub={`${data.users.filter((item) => item.role === 'host').length} ${t('auth.demoHost')}`} icon={<Users size={18} />} />
              <Stat label={t('host.statsBookings')} value={String(data.bookings.length)} sub={t('admin.bookingsDesc')} icon={<CalendarDays size={18} />} />
            </div>

            <div className="admin-grid">
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>{t('admin.revenueChart')}</h2>
                    <p className="muted small">{t('admin.revenueChartDesc')}</p>
                  </div>
                  <BarChart3 size={20} />
                </div>
                <div className="market-list">
                  {markets.map((market) => (
                    <div className="market-row" key={market.country}>
                      <span>{market.country}</span>
                      <span className="market-bar"><i style={{ width: `${market.share}%` }} /></span>
                      <strong>{fmt(market.volume, { compact: true })}</strong>
                      <span className="muted small">{market.share}%</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>{t('admin.bookingsChart')}</h2>
                    <p className="muted small">{t('admin.bookingsChartDesc')}</p>
                  </div>
                  <CalendarDays size={20} />
                </div>
                <div className="bar-chart">
                  {monthly.map((item) => (
                    <div className="bar-column" key={item.key}>
                      <span className="bar-value">{item.count || ''}</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ height: `${Math.max(4, (item.count / maxMonthly) * 100)}%` }} />
                      </div>
                      <span className="bar-label">{item.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="admin-grid">
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>{t('admin.roadmapTitle')}</h2>
                    <p className="muted small">{t('admin.roadmapDesc')}</p>
                  </div>
                  <Sparkles size={20} />
                </div>
                <div className="roadmap-list">
                  {[1, 2, 3, 4].map((index) => (
                    <div className="roadmap-item" key={index}>
                      <span>{index}</span>
                      <p>{t(`admin.roadmap${index}`)}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel">
                <div className="panel-head">
                  <h2>{t('admin.recentActivity')}</h2>
                </div>
                <div className="audit-list">
                  {data.audit.slice(0, 8).map((entry) => {
                    const actor = data.users.find((item) => item.id === entry.userId)
                    return (
                      <div className="audit-row" key={entry.id}>
                        <span>{actor?.name ?? 'Système'} · {entry.action}</span>
                        <span>{formatDate(entry.at.slice(0, 10), lang)}</span>
                      </div>
                    )
                  })}
                  {data.audit.length === 0 && <p className="muted">{t('admin.noActivity')}</p>}
                </div>
              </section>
            </div>
          </>
        )}

        {tab === 'verifications' && (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>{t('admin.verifications')}</h2>
                <p className="muted small">{t('admin.queueDesc')}</p>
              </div>
              <Badge tone={pending.length ? 'warning' : 'success'}>{pending.length} {t('admin.pending')}</Badge>
            </div>
            {pending.length === 0 ? (
              <EmptyState icon={<CheckCircle2 size={28} />} title={t('admin.noQueue')} description={t('admin.allClear')} />
            ) : (
              <div className="verification-queue">
                {pending.map((request) => (
                  <div className="verification-request" key={request.id}>
                    <div className="verification-icon">
                      {request.kind === 'identity' ? <ShieldCheck size={22} /> : request.kind === 'payout' ? <Wallet size={22} /> : <FileText size={22} />}
                    </div>
                    <div className="verification-main">
                      <div className="verification-title">
                        <strong>{request.userName}</strong>
                        <Badge tone="neutral">{kindLabel(request.kind)}</Badge>
                        <Badge tone={riskTone(request.riskScore)}>{t('admin.riskScore')} {request.riskScore}</Badge>
                      </div>
                      <span>{t('admin.documents')} : {request.docName}</span>
                      <span className="muted small">{t('admin.submitted')} {formatDate(request.submittedAt.slice(0, 10), lang)}</span>
                    </div>
                    <div className="verification-actions">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setSelected(request)
                          setNote('')
                        }}
                      >
                        {t('admin.review')} <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'listings' && (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>{t('admin.listingsTab')}</h2>
                <p className="muted small">{t('admin.listingsDesc')}</p>
              </div>
              <select className="select select-compact" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
                <option value="all">{t('common.all')}</option>
                <option value="published">{t('host.published')}</option>
                <option value="pending">{t('host.pending')}</option>
                <option value="paused">{t('host.paused')}</option>
              </select>
            </div>
            <div className="admin-table">
              <div className="table-head">
                <span>{t('host.listing')}</span>
                <span>{t('trips.host')}</span>
                <span>{t('host.listingStatus')}</span>
                <span>{t('host.nightly')}</span>
                <span>{t('common.actions')}</span>
              </div>
              {filteredListings.map((listing) => {
                const host = data.users.find((item) => item.id === listing.hostId)
                return (
                  <div className="table-row" key={listing.id}>
                    <div className="table-guest">
                      <img className="table-thumb" src={listing.images[0]} alt="" />
                      <div>
                        <strong>{listing.title}</strong>
                        <span>{listing.city}, {listing.country}</span>
                      </div>
                    </div>
                    <div>
                      <strong>{host?.name}</strong>
                      <span>{host?.email}</span>
                    </div>
                    <div>
                      <Badge tone={listing.status === 'published' ? 'success' : listing.status === 'pending' ? 'warning' : 'neutral'}>
                        {listing.status === 'published' ? t('host.published') : listing.status === 'pending' ? t('host.pending') : t('host.paused')}
                      </Badge>
                    </div>
                    <div><strong>{fmt(listing.price)}</strong></div>
                    <div className="table-actions">
                      {listing.status !== 'published' && (
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => setListingStatus(listing.id, 'published')}>
                          {t('host.publish')}
                        </button>
                      )}
                      {listing.status === 'published' && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setListingStatus(listing.id, 'paused')}>
                          {t('host.pause')}
                        </button>
                      )}
                      <a href={`#/listing/${listing.id}`} className="text-link">{t('host.reviewListing')}</a>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {tab === 'users' && (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>{t('admin.usersTab')}</h2>
                <p className="muted small">{t('admin.usersDesc')}</p>
              </div>
              <div className="search-input">
                <Search size={16} />
                <input
                  className="input"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('admin.searchUsers')}
                />
              </div>
            </div>
            <div className="admin-table">
              <div className="table-head">
                <span>{t('admin.user')}</span>
                <span>{t('admin.userRole')}</span>
                <span>{t('admin.country')}</span>
                <span>{t('admin.trust')}</span>
                <span>{t('common.actions')}</span>
              </div>
              {filteredUsers.map((item) => (
                <div className="table-row" key={item.id}>
                  <div className="table-guest">
                    <Avatar name={item.name} hue={item.avatarHue} size={32} />
                    <div>
                      <strong>{item.name} {item.id === user.id && <span className="muted small">(vous)</span>}</strong>
                      <span>{item.email}</span>
                    </div>
                  </div>
                  <div>{roleBadge(item.role)}</div>
                  <div>
                    <strong>{item.country}</strong>
                    <span>{item.emailVerified ? t('admin.verified') : t('admin.notVerified')}</span>
                  </div>
                  <div>
                    <strong>{item.trustScore}/100</strong>
                    <span>{item.suspended ? t('admin.suspended') : t('admin.active')}</span>
                  </div>
                  <div className="table-actions">
                    {item.id !== user.id && (
                      <>
                        {item.role === 'guest' && (
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => setUserRole(item.id, 'host')}>
                            {t('admin.promoteHost')}
                          </button>
                        )}
                        {item.role === 'host' && (
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setUserRole(item.id, 'guest')}>
                            {t('admin.demoteGuest')}
                          </button>
                        )}
                        <button
                          type="button"
                          className={`btn btn-sm ${item.suspended ? 'btn-outline' : 'btn-ghost danger-text'}`}
                          onClick={() => setUserSuspended(item.id, !item.suspended)}
                        >
                          {item.suspended ? t('admin.unsuspend') : t('admin.suspend')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={t('admin.requestDetails')}
        footer={
          selected && (
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline danger-text"
                onClick={() => {
                  decideVerification(selected.id, false, note)
                  setSelected(null)
                }}
              >
                <XCircle size={15} /> {t('admin.reject')}
              </button>
              <button
                type="button"
                className="btn btn-ink"
                onClick={() => {
                  decideVerification(selected.id, true, note)
                  setSelected(null)
                }}
              >
                <CheckCircle2 size={15} /> {t('admin.approve')}
              </button>
            </div>
          )
        }
      >
        {selected && (
          <div className="request-detail">
            <div className="request-detail-head">
              <div className="verification-icon">
                {selected.kind === 'identity' ? <ShieldCheck size={22} /> : selected.kind === 'payout' ? <Wallet size={22} /> : <FileText size={22} />}
              </div>
              <div>
                <h3>{selected.userName}</h3>
                <p>{kindLabel(selected.kind)} · {formatDate(selected.submittedAt.slice(0, 10), lang)}</p>
              </div>
              <Badge tone={riskTone(selected.riskScore)}>{t('admin.riskScore')} {selected.riskScore} · {riskLabel(selected.riskScore)}</Badge>
            </div>
            <div className="request-detail-grid">
              <div><span>{t('admin.documents')}</span><strong>{selected.docName}</strong></div>
              <div><span>{t('admin.riskScore')}</span><strong>{selected.riskScore}/100</strong></div>
              <div><span>{t('admin.submitted')}</span><strong>{formatMonthYear(selected.submittedAt, lang)}</strong></div>
              <div><span>{t('admin.status')}</span><strong>{selected.status}</strong></div>
            </div>
            {selected.note && <p className="muted small">{selected.note}</p>}
            <Field label={t('admin.moderationNote')} hint={t('admin.moderationHint')}>
              <textarea className="textarea" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder={t('admin.notePlaceholder')} />
            </Field>
            <div className="alert-banner alert-banner-soft">
              <AlertTriangle size={18} />
              <span>{t('admin.moderationNotice')}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
