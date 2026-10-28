import { Link } from 'react-router-dom'
import { ArrowLeft, Compass, HelpCircle, Search } from 'lucide-react'
import { useStore } from '../lib/store'

export function NotFound() {
  const { t } = useStore()

  return (
    <div className="notfound-page">
      <div className="notfound-art" aria-hidden="true">
        <span className="notfound-code">404</span>
        <span className="notfound-sun" />
        <span className="notfound-hill notfound-hill-one" />
        <span className="notfound-hill notfound-hill-two" />
        <Compass size={54} className="notfound-compass" />
      </div>
      <div className="notfound-content">
        <span className="eyebrow">{t('notfound.eyebrow')}</span>
        <h1>{t('notfound.title')}</h1>
        <p>{t('notfound.desc')}</p>
        <div className="notfound-actions">
          <Link to="/" className="btn btn-coral btn-lg"><ArrowLeft size={17} /> {t('notfound.cta')}</Link>
          <Link to="/search" className="btn btn-outline btn-lg"><Search size={17} /> {t('nav.search')}</Link>
          <Link to="/help" className="btn btn-ghost btn-lg"><HelpCircle size={17} /> {t('help.title')}</Link>
        </div>
      </div>
    </div>
  )
}
