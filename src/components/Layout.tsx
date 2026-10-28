import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ChevronDown,
  Globe,
  Heart,
  Home,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MapPin,
  Menu,
  Search,
  Shield,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'
import { CURRENCY_CODES, CURRENCIES } from '../lib/catalog'
import { LANGUAGES } from '../lib/i18n'
import { useStore } from '../lib/store'
import { Avatar, Logo } from './ui'

function useClickOutside<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])
  return ref
}

function LocaleMenu() {
  const { lang, currency, setLang, setCurrency, t } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false))

  return (
    <div className="menu-root" ref={ref}>
      <button
        type="button"
        className="ghost-btn locale-btn"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Globe size={17} />
        <span>{lang.toUpperCase()} · {currency}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="dropdown dropdown-locale" role="menu">
          <div className="dropdown-section">
            <span className="dropdown-title">{t('common.language')}</span>
            <div className="segmented">
              {LANGUAGES.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  className={`segmented-item ${lang === language.code ? 'segmented-active' : ''}`}
                  onClick={() => setLang(language.code)}
                >
                  {language.label}
                </button>
              ))}
            </div>
          </div>
          <div className="dropdown-section">
            <span className="dropdown-title">{t('common.currency')}</span>
            <select
              className="select select-compact"
              value={currency}
              onChange={(event) => setCurrency(event.target.value as typeof currency)}
            >
              {CURRENCY_CODES.map((code) => (
                <option key={code} value={code}>
                  {code} — {CURRENCIES[code].label[lang]}
                </option>
              ))}
            </select>
          </div>
          <Link to="/trust" className="dropdown-link" onClick={() => setOpen(false)}>
            <ShieldCheck size={16} />
            {t('nav.trustCenter')}
          </Link>
        </div>
      )}
    </div>
  )
}

function UserMenu() {
  const { user, t, logout, data } = useStore()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false))
  const pendingVerifications = data.verifications.filter((v) => v.status === 'pending').length

  if (!user) {
    return (
      <div className="header-auth">
        <Link to="/login" className="ghost-btn">
          {t('common.login')}
        </Link>
        <Link to="/signup" className="btn btn-ink btn-sm">
          {t('common.signup')}
        </Link>
      </div>
    )
  }

  return (
    <div className="menu-root" ref={ref}>
      <button
        type="button"
        className="avatar-btn"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('nav.account')}
      >
        <Avatar name={user.name} hue={user.avatarHue} size={36} />
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="dropdown dropdown-user" role="menu">
          <div className="dropdown-profile">
            <Avatar name={user.name} hue={user.avatarHue} size={44} />
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>
          <Link to="/trips" className="dropdown-link" onClick={() => setOpen(false)}>
            <CalendarDays size={16} />
            {t('nav.trips')}
          </Link>
          <Link to="/wishlist" className="dropdown-link" onClick={() => setOpen(false)}>
            <Heart size={16} />
            {t('nav.wishlist')}
          </Link>
          <Link to="/account" className="dropdown-link" onClick={() => setOpen(false)}>
            <User size={16} />
            {t('nav.account')}
          </Link>
          {(user.role === 'host' || user.role === 'admin') && (
            <Link to="/host" className="dropdown-link" onClick={() => setOpen(false)}>
              <LayoutDashboard size={16} />
              {t('nav.host')}
            </Link>
          )}
          {user.role === 'guest' && (
            <Link to="/host" className="dropdown-link" onClick={() => setOpen(false)}>
              <Home size={16} />
              {t('nav.becomeHost')}
            </Link>
          )}
          {user.role === 'admin' && (
            <Link to="/admin" className="dropdown-link" onClick={() => setOpen(false)}>
              <Shield size={16} />
              {t('nav.admin')}
              {pendingVerifications > 0 && <span className="count-pill">{pendingVerifications}</span>}
            </Link>
          )}
          <div className="dropdown-divider" />
          <button
            type="button"
            className="dropdown-link dropdown-danger"
            onClick={() => {
              setOpen(false)
              logout()
              navigate('/')
            }}
          >
            <LogOut size={16} />
            {t('common.logout')}
          </button>
        </div>
      )}
    </div>
  )
}

function Header() {
  const { t, user } = useStore()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [destination, setDestination] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const submitCompact = (event: FormEvent) => {
    event.preventDefault()
    const query = destination.trim()
    navigate(query ? `/search?destination=${encodeURIComponent(query)}` : '/search')
  }

  return (
    <header className={`site-header ${scrolled ? 'site-header-scrolled' : ''}`}>
      <div className="header-inner">
        <Link to="/" className="header-logo" aria-label={t('common.home')}>
          <Logo />
        </Link>

        {!isHome && (
          <form className="compact-search" onSubmit={submitCompact} role="search">
            <MapPin size={15} />
            <input
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder={t('home.destinationPlaceholder')}
              aria-label={t('home.destination')}
            />
            <span className="compact-divider" />
            <span className="compact-meta">{t('search.anyWeek')}</span>
            <button type="submit" className="compact-search-btn" aria-label={t('common.search')}>
              <Search size={15} />
            </button>
          </form>
        )}

        <nav className="header-nav" aria-label="Navigation principale">
          <Link to={user?.role === 'guest' ? '/host' : '/host'} className="nav-link">
            {t('nav.becomeHost')}
          </Link>
          <Link to="/help" className="nav-link">
            {t('common.help')}
          </Link>
          <LocaleMenu />
          <UserMenu />
        </nav>

        <button
          type="button"
          className="icon-btn mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label={t('nav.menu')}
        >
          <Menu size={22} />
        </button>
      </div>

      {mobileOpen && (
        <div className="mobile-drawer">
          <div className="mobile-drawer-head">
            <Logo />
            <button type="button" className="icon-btn" onClick={() => setMobileOpen(false)} aria-label={t('common.close')}>
              <X size={22} />
            </button>
          </div>
          <form className="mobile-search" onSubmit={submitCompact}>
            <Search size={17} />
            <input
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder={t('home.destinationPlaceholder')}
              aria-label={t('home.destination')}
            />
          </form>
          <div className="mobile-links">
            <Link to="/search" className="mobile-link">
              <Search size={18} /> {t('common.search')}
            </Link>
            <Link to="/trips" className="mobile-link">
              <CalendarDays size={18} /> {t('nav.trips')}
            </Link>
            <Link to="/wishlist" className="mobile-link">
              <Heart size={18} /> {t('nav.wishlist')}
            </Link>
            <Link to="/host" className="mobile-link">
              <Home size={18} /> {t('nav.becomeHost')}
            </Link>
            <Link to="/account" className="mobile-link">
              <User size={18} /> {t('nav.account')}
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="mobile-link">
                <Shield size={18} /> {t('nav.admin')}
              </Link>
            )}
            <Link to="/trust" className="mobile-link">
              <ShieldCheck size={18} /> {t('nav.trustCenter')}
            </Link>
            <Link to="/help" className="mobile-link">
              <LifeBuoy size={18} /> {t('common.help')}
            </Link>
          </div>
          <div className="mobile-drawer-foot">
            <LocaleMenu />
            {!user && (
              <div className="mobile-auth">
                <Link to="/login" className="btn btn-outline">
                  {t('common.login')}
                </Link>
                <Link to="/signup" className="btn btn-coral">
                  {t('common.signup')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

function Footer() {
  const { t, lang, subscribeNewsletter } = useStore()
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const year = new Date().getFullYear()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    subscribeNewsletter(email)
    setDone(true)
    setEmail('')
  }

  return (
    <footer className="site-footer">
      <div className="footer-newsletter">
        <div>
          <h3>{t('footer.newsletter')}</h3>
          <p>{t('footer.newsletterDesc')}</p>
        </div>
        <form className="newsletter-form" onSubmit={submit}>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t('home.newsletterPlaceholder')}
            aria-label={t('home.newsletterPlaceholder')}
          />
          <button type="submit" className="btn btn-coral">
            {t('home.newsletterCta')}
          </button>
        </form>
        {done && <span className="newsletter-done">{t('home.newsletterDone')}</span>}
      </div>

      <div className="footer-grid">
        <div className="footer-brand">
          <Logo />
          <p>{t('footer.madeWith')}</p>
          <div className="footer-badges">
            <span><ShieldCheck size={14} /> {t('trust.securePayment')}</span>
            <span><Globe size={14} /> 12 {t('common.currency').toLowerCase()}</span>
          </div>
        </div>
        <div className="footer-col">
          <h4>{t('footer.explore')}</h4>
          <Link to="/search">{t('common.search')}</Link>
          <Link to="/search?category=beach">{t('category.beach')}</Link>
          <Link to="/search?category=city">{t('category.city')}</Link>
          <Link to="/search?category=design">{t('category.design')}</Link>
          <Link to="/trust">{t('footer.trustCenter')}</Link>
        </div>
        <div className="footer-col">
          <h4>{t('footer.hosting')}</h4>
          <Link to="/host">{t('nav.becomeHost')}</Link>
          <Link to="/host/new">{t('host.newListing')}</Link>
          <Link to="/trust">{t('host.hostProtection')}</Link>
          <Link to="/help">{t('footer.helpCenter')}</Link>
        </div>
        <div className="footer-col">
          <h4>{t('footer.company')}</h4>
          <Link to="/trust">{t('footer.about')}</Link>
          <Link to="/help">{t('footer.support')}</Link>
          <Link to="/help">{t('footer.careers')}</Link>
          <Link to="/help">{t('footer.press')}</Link>
        </div>
        <div className="footer-col">
          <h4>{t('footer.legal')}</h4>
          <Link to="/trust">{t('footer.terms')}</Link>
          <Link to="/trust">{t('footer.privacy')}</Link>
          <Link to="/trust">{t('footer.cancellation')}</Link>
          <Link to="/trust">{t('footer.safety')}</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <span>{t('footer.rights', { year })}</span>
        <span className="footer-payments">
          <span>Visa</span><span>Mastercard</span><span>PayPal</span><span>Apple Pay</span><span>SEPA</span><span>Pix</span><span>M-Pesa</span><span>UPI</span>
        </span>
        <span>{lang.toUpperCase()} · EUR · USD · GBP · MAD · XOF · JPY · BRL · INR</span>
      </div>
      <p className="footer-disclaimer">{t('footer.disclaimer')}</p>
    </footer>
  )
}

function DemoStrip() {
  const { t } = useStore()
  const [visible, setVisible] = useState(() => sessionStorage.getItem('wanderra.demo-strip') !== 'hidden')
  if (!visible) return null
  return (
    <div className="demo-strip">
      <span className="demo-dot" />
      <span>{t('common.demo')} — {t('booking.demoNotice')}</span>
      <Link to="/trust">{t('common.learnMore')}</Link>
      <button
        type="button"
        className="demo-strip-close"
        aria-label={t('common.close')}
        onClick={() => {
          sessionStorage.setItem('wanderra.demo-strip', 'hidden')
          setVisible(false)
        }}
      >
        <X size={13} />
      </button>
    </div>
  )
}

export function Layout() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname])

  return (
    <div className="app-shell">
      <DemoStrip />
      <Header />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export function PageContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`container ${className}`}>{children}</div>
}

export function StatusLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink to={to} className="text-link">
      {children}
    </NavLink>
  )
}
