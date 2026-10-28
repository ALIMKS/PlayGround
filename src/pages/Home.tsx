import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  Globe2,
  Headphones,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'
import { CATEGORIES } from '../lib/catalog'
import { useStore } from '../lib/store'
import { ListingCard } from '../components/ListingCard'
import { SearchBar } from '../components/SearchBar'
import { DynamicIcon } from '../components/Icon'
import { SectionHeading } from '../components/ui'

const destinations = [
  { city: 'Paris', country: 'France', image: '/images/paris.jpg', query: 'Paris', note: 'Lofts & ateliers' },
  { city: 'Bali', country: 'Indonésie', image: '/images/bali.jpg', query: 'Ubud', note: 'Villas jungle' },
  { city: 'Lisbonne', country: 'Portugal', image: '/images/lisbon.jpg', query: 'Lisbonne', note: 'Azulejos & lumière' },
  { city: 'Marrakech', country: 'Maroc', image: '/images/marrakech.jpg', query: 'Marrakech', note: 'Riads secrets' },
  { city: 'Tokyo', country: 'Japon', image: '/images/tokyo.jpg', query: 'Tokyo', note: 'Design minimal' },
  { city: 'Santorin', country: 'Grèce', image: '/images/santorini.jpg', query: 'Santorin', note: 'Vue caldeira' },
]

export function Home() {
  const { t, data, fmt, lang } = useStore()
  const published = data.listings.filter((listing) => listing.status === 'published')
  const featured = published.filter((listing) => listing.featured).slice(0, 8)
  const totalReviews = published.reduce((sum, listing) => sum + listing.reviewCount, 0)
  const avgRating =
    published.length > 0
      ? (published.reduce((sum, listing) => sum + listing.rating, 0) / published.length).toFixed(2)
      : '4.9'

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-glow hero-glow-a" />
        <div className="hero-glow hero-glow-b" />
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="hero-eyebrow">
              <Sparkles size={14} />
              {t('home.heroSubtitle').split('.')[0]}
            </span>
            <h1>{t('home.heroTitle')}</h1>
            <p className="hero-subtitle">{t('home.heroSubtitle')}</p>
            <div className="hero-trust">
              <div className="avatar-stack" aria-hidden="true">
                {['Amina', 'Lucas', 'Inês', 'Made'].map((name, index) => (
                  <span
                    key={name}
                    className="stack-avatar"
                    style={{ background: `hsl(${18 + index * 46} 55% 82%)`, color: `hsl(${18 + index * 46} 45% 24%)` }}
                  >
                    {name[0]}
                  </span>
                ))}
              </div>
              <span>
                <Star size={14} fill="currentColor" strokeWidth={0} /> {avgRating} · {totalReviews.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')} {t('common.reviews')}
              </span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-photo hero-photo-main">
              <img src="/images/santorini.jpg" alt="Santorin, Grèce" />
            </div>
            <div className="hero-photo hero-photo-small hero-photo-a">
              <img src="/images/bali.jpg" alt="Ubud, Indonésie" />
            </div>
            <div className="hero-photo hero-photo-small hero-photo-b">
              <img src="/images/paris.jpg" alt="Paris, France" />
            </div>
            <div className="floating-card floating-verified">
              <span className="floating-icon"><BadgeCheck size={18} /></span>
              <div>
                <strong>{t('home.value1Title')}</strong>
                <span>{t('listing.hostVerified')}</span>
              </div>
            </div>
            <div className="floating-card floating-payment">
              <span className="floating-icon"><ShieldCheck size={18} /></span>
              <div>
                <strong>{t('listing.protectedPayment')}</strong>
                <span>{t('booking.escrow')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container hero-search-wrap">
          <SearchBar />
          <div className="hero-search-note">
            <span><ShieldCheck size={14} /> {t('trust.securePayment')}</span>
            <span><Globe2 size={14} /> 12 {t('common.currency').toLowerCase()}</span>
            <span><Headphones size={14} /> {t('trust.support')}</span>
          </div>
        </div>
      </section>

      <section className="container categories-section">
        <SectionHeading
          eyebrow={t('home.categoriesTitle')}
          title={t('home.categoriesTitle')}
          action={
            <Link to="/search" className="text-link">
              {t('common.viewAll')} <ArrowRight size={15} />
            </Link>
          }
        />
        <div className="category-row">
          {CATEGORIES.filter((category) => category.key !== 'all').map((category) => (
            <Link
              key={category.key}
              to={`/search?category=${category.key}`}
              className="category-chip"
            >
              <span className="category-icon">
                <DynamicIcon name={category.icon} size={20} />
              </span>
              <span>{category[lang]}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <SectionHeading
          eyebrow={t('home.featuredTitle')}
          title={t('home.featuredTitle')}
          description={t('home.featuredSubtitle')}
          action={
            <Link to="/search" className="text-link">
              {t('common.viewAll')} <ArrowRight size={15} />
            </Link>
          }
        />
        <div className="listing-grid">
          {featured.map((listing, index) => (
            <ListingCard key={listing.id} listing={listing} index={index} />
          ))}
        </div>
      </section>

      <section className="container section">
        <SectionHeading
          eyebrow={t('home.destinationsTitle')}
          title={t('home.destinationsTitle')}
          description={t('home.destinationsSubtitle')}
        />
        <div className="destination-grid">
          {destinations.map((destination, index) => {
            const count = published.filter((listing) =>
              listing.city.toLowerCase().includes(destination.query.toLowerCase()) ||
              destination.query.toLowerCase().includes(listing.city.toLowerCase()),
            ).length
            return (
              <Link
                key={destination.city}
                to={`/search?destination=${encodeURIComponent(destination.query)}`}
                className={`destination-card ${index === 0 ? 'destination-wide' : ''}`}
              >
                <img src={destination.image} alt={`${destination.city}, ${destination.country}`} loading="lazy" />
                <span className="destination-shade" />
                <span className="destination-info">
                  <strong>{destination.city}</strong>
                  <span>{destination.country} · {destination.note}</span>
                  <span className="destination-count">
                    {count > 0 ? `${count} ${t('search.results', { count }).replace('{count} ', '')}` : t('common.new')}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="value-band">
        <div className="container">
          <SectionHeading
            eyebrow={t('home.trustTitle')}
            title={t('home.valueTitle')}
            description={t('home.valueSubtitle')}
          />
          <div className="value-grid">
            {[
              { icon: BadgeCheck, title: t('home.value1Title'), desc: t('home.value1Desc') },
              { icon: ShieldCheck, title: t('home.value2Title'), desc: t('home.value2Desc') },
              { icon: CreditCard, title: t('home.value3Title'), desc: t('home.value3Desc') },
              { icon: Headphones, title: t('home.value4Title'), desc: t('home.value4Desc') },
            ].map((value) => (
              <article className="value-card" key={value.title}>
                <span className="value-icon"><value.icon size={22} /></span>
                <h3>{value.title}</h3>
                <p>{value.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="plus-banner">
          <div className="plus-copy">
            <span className="eyebrow">{t('home.plusTitle')}</span>
            <h2>{t('home.plusDesc')}</h2>
            <Link to="/account" className="btn btn-gold">
              {t('home.plusCta')} <ArrowRight size={16} />
            </Link>
          </div>
          <div className="plus-art" aria-hidden="true">
            <span className="plus-orbit" />
            <span className="plus-orbit plus-orbit-2" />
            <span className="plus-star"><Star size={42} fill="currentColor" strokeWidth={0} /></span>
            <span className="plus-badge">{t('home.plusTitle')}</span>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="host-cta">
          <div className="host-cta-media">
            <img src="/images/stay-1.jpg" alt="Intérieur d’un loft Wanderra" loading="lazy" />
            <div className="host-cta-stat">
              <strong>{fmt(2480)}</strong>
              <span>{t('host.statsRevenue')}</span>
            </div>
          </div>
          <div className="host-cta-copy">
            <span className="eyebrow">{t('nav.becomeHost')}</span>
            <h2>{t('home.hostCtaTitle')}</h2>
            <p>{t('home.hostCtaDesc')}</p>
            <ul className="check-list">
              <li><BadgeCheck size={17} /> {t('host.hostProtection')} — {t('host.hostProtectionDesc')}</li>
              <li><ShieldCheck size={17} /> {t('home.value2Desc')}</li>
              <li><CreditCard size={17} /> {t('host.payoutSchedule')}</li>
            </ul>
            <Link to="/host" className="btn btn-coral">
              {t('home.hostCtaButton')} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="stats-band">
        <div className="container stats-grid">
          <div><strong>60+</strong><span>{t('home.statsCountries')}</span></div>
          <div><strong>{published.length * 147}+</strong><span>{t('home.statsStays')}</span></div>
          <div><strong>38k</strong><span>{t('home.statsGuests')}</span></div>
          <div><strong>{avgRating}</strong><span>{t('home.statsRating')}</span></div>
        </div>
      </section>

      <section className="container section quote-section">
        <Quote size={34} className="quote-mark" />
        <blockquote>
          {lang === 'fr'
            ? '« J’ai réservé un riad à Marrakech en trois minutes, avec une hôte vérifiée et un paiement protégé. C’est la première fois que je me sens vraiment en confiance en ligne. »'
            : '“I booked a riad in Marrakech in three minutes, with a verified host and protected payment. It is the first time I have truly felt safe booking online.”'}
        </blockquote>
        <div className="quote-author">
          <span className="stack-avatar" style={{ background: 'hsl(20 55% 82%)', color: 'hsl(20 45% 24%)' }}>A</span>
          <div>
            <strong>Amina Diallo</strong>
            <span>Dakar → Marrakech</span>
          </div>
          <span className="quote-stars">
            {[0, 1, 2, 3, 4].map((star) => <Star key={star} size={14} fill="currentColor" strokeWidth={0} />)}
          </span>
        </div>
      </section>
    </div>
  )
}
