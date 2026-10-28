import type { MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, MapPin, Zap } from 'lucide-react'
import { CANCELLATION_LABELS } from '../lib/catalog'
import { useStore } from '../lib/store'
import type { Listing } from '../lib/types'
import { Rating } from './ui'

export function ListingCard({ listing, index = 0 }: { listing: Listing; index?: number }) {
  const { t, fmt, user, toggleWishlist, lang } = useStore()
  const navigate = useNavigate()
  const saved = user?.wishlist.includes(listing.id) ?? false

  const onSave = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!user) {
      navigate('/login?next=/search')
      return
    }
    toggleWishlist(listing.id)
  }

  return (
    <article className="listing-card" style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
      <Link to={`/listing/${listing.id}`} className="card-media" aria-label={listing.title}>
        <img
          src={listing.images[0]}
          alt={listing.title}
          loading={index < 4 ? 'eager' : 'lazy'}
          width={640}
          height={480}
        />
        <div className="card-badges">
          {listing.superhost && <span className="pill pill-ink">{t('common.superhost')}</span>}
          {listing.instantBook && (
            <span className="pill pill-light">
              <Zap size={12} /> {t('common.instant')}
            </span>
          )}
        </div>
        <button
          type="button"
          className={`wish-btn ${saved ? 'wish-btn-active' : ''}`}
          onClick={onSave}
          aria-label={saved ? t('listing.saved') : t('listing.save')}
          aria-pressed={saved}
        >
          <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </Link>
      <div className="card-body">
        <div className="card-topline">
          <span className="card-location">
            <MapPin size={13} />
            {listing.city}, {listing.country}
          </span>
          <Rating value={listing.rating} count={listing.reviewCount} />
        </div>
        <Link to={`/listing/${listing.id}`} className="card-title">
          {listing.title}
        </Link>
        <p className="card-subtitle">{listing.subtitle}</p>
        <div className="card-meta">
          {listing.maxGuests} {t('common.guests')} · {listing.bedrooms} {listing.bedrooms === 1 ? t('common.bedroom') : t('common.bedrooms')} · {listing.baths} {t('common.baths')}
        </div>
        <div className="card-price">
          <strong>{fmt(listing.price)}</strong>
          <span>{t('common.perNight')}</span>
          <span className="card-note">
            {CANCELLATION_LABELS[listing.cancellationPolicy][lang === 'fr' ? 'shortFr' : 'shortEn']}
          </span>
        </div>
      </div>
    </article>
  )
}

export function ListingCardSkeleton() {
  return (
    <div className="listing-card skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton-media" />
      <div className="card-body">
        <div className="skeleton skeleton-line" style={{ width: '55%' }} />
        <div className="skeleton skeleton-line" style={{ width: '85%' }} />
        <div className="skeleton skeleton-line" style={{ width: '40%' }} />
      </div>
    </div>
  )
}
