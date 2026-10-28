import { Link } from 'react-router-dom'
import { MapPin, Navigation } from 'lucide-react'
import { useStore } from '../lib/store'
import type { Listing } from '../lib/types'

export function MapPanel({
  listings,
  activeId,
  onSelect,
  compact = false,
}: {
  listings: Listing[]
  activeId?: string
  onSelect?: (id: string) => void
  compact?: boolean
}) {
  const { fmt, t } = useStore()
  const lats = listings.map((l) => l.lat)
  const lngs = listings.map((l) => l.lng)
  const minLat = Math.min(...lats, 0)
  const maxLat = Math.max(...lats, 1)
  const minLng = Math.min(...lngs, 0)
  const maxLng = Math.max(...lngs, 1)
  const latSpan = Math.max(0.01, maxLat - minLat)
  const lngSpan = Math.max(0.01, maxLng - minLng)

  return (
    <div className={`map-panel ${compact ? 'map-compact' : ''}`} role="img" aria-label={t('search.mapHint')}>
      <svg className="map-art" viewBox="0 0 800 500" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="water" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#cfe3dd" />
            <stop offset="100%" stopColor="#b7d5cc" />
          </linearGradient>
        </defs>
        <rect width="800" height="500" fill="#eef0e7" />
        <path d="M0 360 C140 300 210 380 330 340 C470 294 560 360 800 300 L800 500 L0 500 Z" fill="url(#water)" opacity="0.8" />
        <path d="M0 140 C180 100 260 190 420 150 C560 115 660 175 800 130" fill="none" stroke="#d8d5c6" strokeWidth="26" />
        <path d="M120 0 C160 120 110 240 170 500" fill="none" stroke="#d8d5c6" strokeWidth="18" />
        <path d="M480 0 C460 110 520 210 470 500" fill="none" stroke="#d8d5c6" strokeWidth="14" />
        <path d="M0 250 L800 230" fill="none" stroke="#e3dfd1" strokeWidth="10" />
        <path d="M250 0 L300 500" fill="none" stroke="#e3dfd1" strokeWidth="8" />
        <path d="M600 0 L560 500" fill="none" stroke="#e3dfd1" strokeWidth="8" />
        {[
          [80, 80], [210, 60], [360, 90], [520, 70], [680, 90],
          [90, 220], [300, 210], [640, 220], [220, 310], [420, 300],
          [700, 350], [120, 420], [360, 430], [560, 420],
        ].map(([x, y], index) => (
          <rect key={index} x={x} y={y} width={54 + (index % 3) * 18} height={34 + (index % 2) * 20} rx="4" fill="#e2e0d3" opacity="0.65" />
        ))}
      </svg>
      {listings.map((listing) => {
        const x = 12 + ((listing.lng - minLng) / lngSpan) * 76
        const y = 12 + (1 - (listing.lat - minLat) / latSpan) * 72
        const active = listing.id === activeId
        return onSelect ? (
          <button
            key={listing.id}
            type="button"
            className={`map-pin ${active ? 'map-pin-active' : ''}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => onSelect(listing.id)}
            aria-label={`${listing.title} — ${fmt(listing.price)}`}
          >
            {fmt(listing.price, { compact: true })}
          </button>
        ) : (
          <Link
            key={listing.id}
            to={`/listing/${listing.id}`}
            className="map-pin map-pin-single"
            style={{ left: `${x}%`, top: `${y}%` }}
            aria-label={listing.title}
          >
            <MapPin size={16} />
            {listing.city}
          </Link>
        )
      })}
      <div className="map-legend">
        <Navigation size={14} />
        <span>{t('search.availability')}</span>
      </div>
    </div>
  )
}
