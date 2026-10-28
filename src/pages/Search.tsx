import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  LayoutGrid,
  Map,
  SearchX,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { AMENITIES, CATEGORIES, LISTING_TYPES, formatDate } from '../lib/catalog'
import { isRangeAvailable } from '../lib/availability'
import { useStore } from '../lib/store'
import type { Listing, ListingCategory, ListingType } from '../lib/types'
import { ListingCard } from '../components/ListingCard'
import { MapPanel } from '../components/MapPanel'
import { SearchBar } from '../components/SearchBar'
import { DynamicIcon } from '../components/Icon'
import { EmptyState, Modal } from '../components/ui'

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function Search() {
  const { t, lang, data, currency } = useStore()
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState<'list' | 'map'>('list')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | undefined>(undefined)

  const destination = params.get('destination') ?? ''
  const checkIn = params.get('checkIn') ?? ''
  const checkOut = params.get('checkOut') ?? ''
  const guests = Number(params.get('guests') ?? '1') || 1
  const category = (params.get('category') ?? 'all') as ListingCategory
  const type = (params.get('type') ?? 'all') as ListingType | 'all'
  const maxPrice = Number(params.get('maxPrice') ?? '500') || 500
  const instantOnly = params.get('instant') === '1'
  const sort = (params.get('sort') ?? 'recommended') as
    | 'recommended'
    | 'price-asc'
    | 'price-desc'
    | 'rating'
  const selectedAmenities = (params.get('amenities') ?? '').split(',').filter(Boolean)

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const toggleAmenity = (key: string) => {
    const set = new Set(selectedAmenities)
    if (set.has(key)) set.delete(key)
    else set.add(key)
    update('amenities', Array.from(set).join(','))
  }

  const clearFilters = () => {
    setParams(new URLSearchParams(), { replace: true })
  }

  const results = useMemo(() => {
    const query = normalize(destination)
    const filtered = data.listings.filter((listing) => {
      if (listing.status !== 'published') return false
      if (query) {
        const haystack = normalize(
          `${listing.city} ${listing.country} ${listing.title} ${listing.subtitle} ${listing.category}`,
        )
        if (!haystack.includes(query)) return false
      }
      if (guests > listing.maxGuests) return false
      if (category !== 'all' && listing.category !== category) return false
      if (type !== 'all' && listing.type !== type) return false
      if (listing.price > maxPrice) return false
      if (instantOnly && !listing.instantBook) return false
      if (!selectedAmenities.every((amenity) => listing.amenities.includes(amenity))) return false
      if (checkIn && checkOut && !isRangeAvailable(listing, checkIn, checkOut, data.bookings)) {
        return false
      }
      return true
    })
    const sorted = [...filtered]
    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price)
    if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating)
    if (sort === 'recommended') {
      sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating)
    }
    return sorted
  }, [
    data.listings,
    data.bookings,
    destination,
    guests,
    category,
    type,
    maxPrice,
    instantOnly,
    selectedAmenities,
    checkIn,
    checkOut,
    sort,
  ])

  const activeListing = results.find((listing) => listing.id === activeId) ?? results[0]

  const filterPanel = (
    <div className="filter-panel">
      <div className="filter-block">
        <div className="filter-head">
          <span>{t('search.priceRange')}</span>
          <strong>{maxPrice >= 500 ? '500+' : maxPrice} USD</strong>
        </div>
        <input
          type="range"
          min={60}
          max={500}
          step={10}
          value={maxPrice}
          onChange={(event) => update('maxPrice', event.target.value)}
          className="range"
          aria-label={t('search.priceRange')}
        />
        <div className="range-scale"><span>60</span><span>500+</span></div>
      </div>

      <div className="filter-block">
        <span className="filter-title">{t('search.propertyType')}</span>
        <div className="chip-wrap">
          <button
            type="button"
            className={`filter-chip ${type === 'all' ? 'filter-chip-active' : ''}`}
            onClick={() => update('type', '')}
          >
            {t('common.all')}
          </button>
          {LISTING_TYPES.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`filter-chip ${type === item.key ? 'filter-chip-active' : ''}`}
              onClick={() => update('type', item.key)}
            >
              {item[lang]}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-block">
        <span className="filter-title">{t('common.amenities')}</span>
        <div className="amenity-checks">
          {AMENITIES.slice(0, 12).map((amenity) => (
            <label key={amenity.key} className="check-row">
              <input
                type="checkbox"
                checked={selectedAmenities.includes(amenity.key)}
                onChange={() => toggleAmenity(amenity.key)}
              />
              <DynamicIcon name={amenity.icon} size={15} />
              <span>{amenity[lang]}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="check-row check-row-strong">
        <input
          type="checkbox"
          checked={instantOnly}
          onChange={(event) => update('instant', event.target.checked ? '1' : '')}
        />
        <span>{t('search.instantBook')}</span>
      </label>

      <div className="filter-actions">
        <button type="button" className="btn btn-outline" onClick={clearFilters}>
          {t('search.clearFilters')}
        </button>
        <button type="button" className="btn btn-ink" onClick={() => setFiltersOpen(false)}>
          {t('search.applyFilters')}
        </button>
      </div>
    </div>
  )

  return (
    <div className="search-page">
      <div className="search-head">
        <div className="container">
          <SearchBar initialDestination={destination} />
          <div className="search-summary">
            <div>
              <span className="eyebrow">{t('search.availability')}</span>
              <h1>
                {destination
                  ? t('search.resultsFor', { q: destination })
                  : t('search.title')}
              </h1>
              <p>
                {checkIn && checkOut
                  ? `${formatDate(checkIn, lang)} → ${formatDate(checkOut, lang)} · ${guests} ${guests === 1 ? t('common.guest') : t('common.guests')}`
                  : `${guests} ${guests === 1 ? t('common.guest') : t('common.guests')} · ${t('search.anyWeek')}`}
                {currency !== 'USD' && ` · ${currency}`}
              </p>
            </div>
            <div className="search-view-toggle">
              <button
                type="button"
                className={`view-btn ${view === 'list' ? 'view-btn-active' : ''}`}
                onClick={() => setView('list')}
              >
                <LayoutGrid size={16} /> {t('search.listView')}
              </button>
              <button
                type="button"
                className={`view-btn ${view === 'map' ? 'view-btn-active' : ''}`}
                onClick={() => setView('map')}
              >
                <Map size={16} /> {t('search.mapView')}
              </button>
            </div>
          </div>

          <div className="category-row category-row-compact">
            {CATEGORIES.map((item) => (
              <Link
                key={item.key}
                to={`/search?${new URLSearchParams({ ...Object.fromEntries(params), category: item.key === 'all' ? '' : item.key }).toString()}`}
                className={`category-chip ${category === item.key ? 'category-chip-active' : ''}`}
              >
                <DynamicIcon name={item.icon} size={17} />
                <span>{item[lang]}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="container search-body">
        <div className="search-toolbar">
          <span className="results-count">{t('search.results', { count: results.length })}</span>
          <div className="toolbar-actions">
            <select
              className="select select-compact"
              value={sort}
              onChange={(event) => update('sort', event.target.value)}
              aria-label={t('search.sortRecommended')}
            >
              <option value="recommended">{t('search.sortRecommended')}</option>
              <option value="price-asc">{t('search.sortPriceAsc')}</option>
              <option value="price-desc">{t('search.sortPriceDesc')}</option>
              <option value="rating">{t('search.sortRating')}</option>
            </select>
            <button type="button" className="btn btn-outline btn-sm filters-mobile" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal size={16} /> {t('common.filters')}
            </button>
          </div>
        </div>

        <div className={`search-layout ${view === 'map' ? 'search-layout-map' : ''}`}>
          <aside className="filter-sidebar">{filterPanel}</aside>

          <div className="search-results">
            {results.length === 0 ? (
              <EmptyState
                icon={<SearchX size={28} />}
                title={t('search.noResults')}
                description={t('search.noResultsDesc')}
                action={
                  <button type="button" className="btn btn-ink" onClick={clearFilters}>
                    {t('search.clearFilters')}
                  </button>
                }
              />
            ) : (
              <>
                {view === 'map' && (
                  <div className="search-map-mobile">
                    <MapPanel
                      listings={results}
                      activeId={activeListing?.id}
                      onSelect={setActiveId}
                      compact
                    />
                    {activeListing && (
                      <div className="map-active-card">
                        <img src={activeListing.images[0]} alt={activeListing.title} />
                        <div>
                          <strong>{activeListing.title}</strong>
                          <span>{activeListing.city} · {t('search.nightly')}</span>
                        </div>
                        <Link to={`/listing/${activeListing.id}`} className="btn btn-ink btn-sm">
                          {t('common.viewAll')}
                        </Link>
                      </div>
                    )}
                  </div>
                )}
                <div className="listing-grid listing-grid-search">
                  {results.map((listing: Listing, index: number) => (
                    <div key={listing.id} onMouseEnter={() => setActiveId(listing.id)}>
                      <ListingCard listing={listing} index={index} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {view === 'map' && results.length > 0 && (
            <aside className="search-map-desktop">
              <MapPanel listings={results} activeId={activeListing?.id} onSelect={setActiveId} />
              {activeListing && (
                <div className="map-active-card">
                  <img src={activeListing.images[0]} alt={activeListing.title} />
                  <div>
                    <strong>{activeListing.title}</strong>
                    <span>{activeListing.city}</span>
                  </div>
                  <Link to={`/listing/${activeListing.id}`} className="btn btn-ink btn-sm">
                    {t('common.viewAll')}
                  </Link>
                </div>
              )}
            </aside>
          )}
        </div>
      </div>

      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={t('common.filters')}
        size="sm"
      >
        {filterPanel}
        <button type="button" className="icon-btn modal-inline-close" onClick={() => setFiltersOpen(false)}>
          <X size={16} />
        </button>
      </Modal>

    </div>
  )
}
