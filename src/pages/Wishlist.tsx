import { Link, Navigate } from 'react-router-dom'
import { Heart, Share2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { ListingCard } from '../components/ListingCard'
import { EmptyState } from '../components/ui'
import { useToast } from '../components/Toast'

export function Wishlist() {
  const { t, data, user } = useStore()
  const { showToast } = useToast()

  if (!user) return <Navigate to="/login?next=/wishlist" replace />

  const listings = user.wishlist
    .map((id) => data.listings.find((listing) => listing.id === id))
    .filter((listing): listing is NonNullable<typeof listing> => Boolean(listing))

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showToast('toast.linkCopied', 'success')
    } catch {
      showToast('toast.error', 'error')
    }
  }

  return (
    <div className="wishlist-page">
      <div className="container">
        <div className="page-head">
          <div>
            <span className="eyebrow">{t('nav.wishlist')}</span>
            <h1>{t('wishlist.title')}</h1>
            <p>{t('wishlist.subtitle')}</p>
          </div>
          {listings.length > 0 && (
            <div className="page-head-actions">
              <span className="results-count">{t('wishlist.count', { n: listings.length })}</span>
              <button type="button" className="btn btn-outline" onClick={share}>
                <Share2 size={16} /> {t('wishlist.share')}
              </button>
            </div>
          )}
        </div>

        {listings.length === 0 ? (
          <EmptyState
            icon={<Heart size={28} />}
            title={t('wishlist.empty')}
            description={t('wishlist.emptyDesc')}
            action={<Link to="/search" className="btn btn-ink">{t('wishlist.explore')}</Link>}
          />
        ) : (
          <div className="listing-grid listing-grid-wide">
            {listings.map((listing, index) => (
              <ListingCard key={listing.id} listing={listing} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
