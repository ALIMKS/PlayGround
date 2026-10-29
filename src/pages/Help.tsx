import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  Home as HomeIcon,
  MessageCircle,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { Accordion, EmptyState } from '../components/ui'

type HelpCategory = 'all' | 'booking' | 'account' | 'hosting' | 'trust'

const CATEGORY_ICONS: Record<Exclude<HelpCategory, 'all'>, typeof CalendarDays> = {
  booking: CalendarDays,
  account: UserRound,
  hosting: HomeIcon,
  trust: ShieldCheck,
}

const ARTICLES: { key: number; category: Exclude<HelpCategory, 'all'>; href: string }[] = [
  { key: 1, category: 'booking', href: '/trips' },
  { key: 2, category: 'booking', href: '/trust' },
  { key: 3, category: 'booking', href: '/trust' },
  { key: 4, category: 'account', href: '/verify' },
  { key: 5, category: 'account', href: '/account' },
  { key: 6, category: 'account', href: '/account' },
  { key: 7, category: 'hosting', href: '/host/new' },
  { key: 8, category: 'hosting', href: '/host' },
  { key: 9, category: 'hosting', href: '/host' },
  { key: 10, category: 'trust', href: '/trust' },
  { key: 11, category: 'trust', href: '/trust' },
  { key: 12, category: 'trust', href: '/trust' },
]

export function Help() {
  const { t } = useStore()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<HelpCategory>('all')
  const [openFaq, setOpenFaq] = useState<string | null>('faq1')

  const articles = ARTICLES.filter((article) => {
    if (category !== 'all' && article.category !== category) return false
    if (!query.trim()) return true
    return t(`help.article${article.key}`).toLowerCase().includes(query.toLowerCase())
  })

  return (
    <div className="help-page">
      <section className="help-hero">
        <div className="container">
          <span className="eyebrow">{t('help.title')}</span>
          <h1>{t('help.heroTitle')}</h1>
          <p>{t('help.subtitle')}</p>
          <div className="help-search">
            <Search size={18} />
            <input
              className="input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('help.searchPlaceholder')}
              aria-label={t('help.searchPlaceholder')}
            />
          </div>
          <div className="help-quick-links">
            <Link to="/trips">{t('help.article1')}</Link>
            <Link to="/verify">{t('help.article4')}</Link>
            <Link to="/host">{t('help.article9')}</Link>
            <Link to="/trust">{t('help.article12')}</Link>
          </div>
        </div>
      </section>

      <div className="container help-body">
        <section className="help-categories">
          <button
            type="button"
            className={`help-category ${category === 'all' ? 'help-category-active' : ''}`}
            onClick={() => setCategory('all')}
          >
            <span className="help-category-icon"><Search size={20} /></span>
            <strong>{t('help.all')}</strong>
            <span>{t('help.articlesCount', { n: ARTICLES.length })}</span>
          </button>
          {(['booking', 'account', 'hosting', 'trust'] as Exclude<HelpCategory, 'all'>[]).map((key) => {
            const Icon = CATEGORY_ICONS[key]
            return (
              <button
                key={key}
                type="button"
                className={`help-category ${category === key ? 'help-category-active' : ''}`}
                onClick={() => setCategory(key)}
              >
                <span className="help-category-icon"><Icon size={20} /></span>
                <strong>{t(`help.category${key.charAt(0).toUpperCase()}${key.slice(1)}`)}</strong>
                <span>{t(`help.category${key.charAt(0).toUpperCase()}${key.slice(1)}Desc`)}</span>
              </button>
            )
          })}
        </section>

        <section className="help-articles">
          <div className="section-heading">
            <span className="eyebrow">{t('help.browse')}</span>
            <h2>{category === 'all' ? t('help.popular') : t(`help.category${category.charAt(0).toUpperCase()}${category.slice(1)}`)}</h2>
          </div>
          {articles.length === 0 ? (
            <EmptyState
              icon={<Search size={28} />}
              title={t('help.noResults')}
              description={t('help.noResultsDesc')}
              action={<button type="button" className="btn btn-ink" onClick={() => { setQuery(''); setCategory('all') }}>{t('help.all')}</button>}
            />
          ) : (
            <div className="help-article-grid">
              {articles.map((article) => (
                <Link to={article.href} className="help-article" key={article.key}>
                  <span className="help-article-icon">
                    {(() => { const Icon = CATEGORY_ICONS[article.category]; return <Icon size={18} /> })()}
                  </span>
                  <div>
                    <strong>{t(`help.article${article.key}`)}</strong>
                    <span>{t(`help.category${article.category.charAt(0).toUpperCase()}${article.category.slice(1)}`)}</span>
                  </div>
                  <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="help-faq">
          <div className="section-heading">
            <span className="eyebrow">{t('trust.faqEyebrow')}</span>
            <h2>{t('trust.faqTitle')}</h2>
          </div>
          <Accordion
            openId={openFaq}
            onToggle={setOpenFaq}
            items={[1, 2, 3, 4].map((n) => ({
              id: `faq${n}`,
              title: t(`trust.faq${n}Q`),
              body: <p>{t(`trust.faq${n}A`)}</p>,
            }))}
          />
        </section>

        <section className="help-contact">
          <div>
            <span className="eyebrow">{t('help.support')}</span>
            <h2>{t('help.stillNeed')}</h2>
            <p>{t('help.stillNeedDesc')}</p>
          </div>
          <div className="help-contact-actions">
            <Link to="/trust" className="btn btn-outline">{t('footer.trustCenter')}</Link>
            <a href="mailto:support@wanderra.app" className="btn btn-coral">
              <MessageCircle size={16} /> {t('help.contact')}
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
