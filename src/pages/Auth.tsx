import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  Globe2,
  Lock,
  ShieldCheck,
  Star,
} from 'lucide-react'
import { COUNTRIES } from '../lib/catalog'
import { DEMO_ACCOUNTS } from '../lib/seed'
import { assessPassword } from '../lib/security'
import { useStore } from '../lib/store'
import { Field, Modal } from '../components/ui'
import { useToast } from '../components/Toast'

type View = 'login' | 'signup' | 'forgot'

export function Auth() {
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { t, lang, user, login, signup } = useStore()
  const { showToast } = useToast()

  const isSignupPath = location.pathname === '/signup'
  const [view, setView] = useState<View>(isSignupPath ? 'signup' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [name, setName] = useState('')
  const [country, setCountry] = useState('FR')
  const [phone, setPhone] = useState('')
  const [terms, setTerms] = useState(false)
  const [marketing, setMarketing] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [twoFactorOpen, setTwoFactorOpen] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorInput, setTwoFactorInput] = useState('')
  const [twoFactorError, setTwoFactorError] = useState('')

  const rawNext = params.get('next') ?? '/'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.startsWith('/login') && !rawNext.startsWith('/signup')
    ? rawNext
    : '/'

  if (user) {
    return <Navigate to={user.emailVerified ? next : '/verify?tab=email'} replace />
  }

  const switchView = (target: View) => {
    setView(target)
    setError('')
    setForgotSent(false)
    if (target === 'login') navigate('/login')
    if (target === 'signup') navigate('/signup')
  }

  const handleLoginResult = (result: Awaited<ReturnType<typeof login>>) => {
    if (result.needs2fa) {
      setTwoFactorCode(result.code ?? '')
      setTwoFactorInput('')
      setTwoFactorError('')
      setTwoFactorOpen(true)
      return
    }
    if (!result.ok) {
      setError(t(result.errorKey ?? 'auth.loginError', result.vars))
      return
    }
    showToast('toast.loggedIn', 'success')
    navigate(next, { replace: true })
  }

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    handleLoginResult(result)
  }

  const submitTwoFactor = async (event: FormEvent) => {
    event.preventDefault()
    setTwoFactorError('')
    setLoading(true)
    const result = await login(email, password, twoFactorInput)
    setLoading(false)
    if (!result.ok) {
      setTwoFactorError(t(result.errorKey ?? 'auth.twoFactorInvalid'))
      return
    }
    setTwoFactorOpen(false)
    showToast('toast.loggedIn', 'success')
    navigate(next, { replace: true })
  }

  const quickLogin = async (accountEmail: string) => {
    setEmail(accountEmail)
    setPassword(DEMO_ACCOUNTS.password)
    setError('')
    setLoading(true)
    const result = await login(accountEmail, DEMO_ACCOUNTS.password)
    setLoading(false)
    handleLoginResult(result)
  }

  const submitSignup = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (password !== confirm) {
      setError(t('auth.passwordMismatch'))
      return
    }
    if (!terms) {
      setError(t('auth.termsRequired'))
      return
    }
    setLoading(true)
    const result = await signup({
      name,
      email,
      password,
      country,
      phone,
      marketing,
    })
    setLoading(false)
    if (!result.ok) {
      setError(t(result.errorKey ?? 'common.error'))
      return
    }
    showToast('auth.accountCreated', 'success')
    navigate('/verify?tab=email', { replace: true })
  }

  const submitForgot = (event: FormEvent) => {
    event.preventDefault()
    setForgotSent(true)
  }

  const strength = assessPassword(password)

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <img src="/images/stay-4.jpg" alt="" />
        <div className="auth-visual-overlay" />
        <div className="auth-visual-content">
          <Link to="/" className="auth-logo">Wanderra</Link>
          <div className="auth-quote">
            <div className="auth-quote-stars">
              {[1, 2, 3, 4, 5].map((value) => (
                <Star key={value} size={16} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <blockquote>
              {lang === 'fr'
                ? '« Le seul site où je réserve sans vérifier trois fois. Les hôtes sont réels, les photos aussi. »'
                : '“The only site where I book without checking three times. The hosts are real, and so are the photos.”'}
            </blockquote>
            <div className="auth-quote-author">
              <span>Camille R.</span>
              <span>{lang === 'fr' ? 'Voyageuse · 14 séjours' : 'Traveller · 14 stays'}</span>
            </div>
          </div>
          <div className="auth-visual-features">
            <div><BadgeCheck size={18} /> {t('home.value1Title')}</div>
            <div><ShieldCheck size={18} /> {t('home.value2Title')}</div>
            <div><Globe2 size={18} /> {t('home.statsCountries')}</div>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-tabs">
            <button
              type="button"
              className={view === 'login' ? 'auth-tab auth-tab-active' : 'auth-tab'}
              onClick={() => switchView('login')}
            >
              {t('auth.loginCta')}
            </button>
            <button
              type="button"
              className={view === 'signup' ? 'auth-tab auth-tab-active' : 'auth-tab'}
              onClick={() => switchView('signup')}
            >
              {t('auth.createAccount')}
            </button>
          </div>

          {view === 'login' && (
            <>
              <div className="auth-heading">
                <span className="eyebrow">{t('nav.login')}</span>
                <h1>{t('auth.loginTitle')}</h1>
                <p>{t('auth.loginSubtitle')}</p>
              </div>
              <form className="auth-form" onSubmit={submitLogin}>
                <Field label={t('auth.emailLabel')}>
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="vous@exemple.com"
                    required
                  />
                </Field>
                <Field label={t('auth.passwordLabel')}>
                  <div className="input-with-icon input-with-action">
                    <Lock size={17} />
                    <input
                      className="input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      placeholder="••••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="input-action"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </Field>
                <div className="auth-row">
                  <button type="button" className="text-link" onClick={() => switchView('forgot')}>
                    {t('auth.forgotPassword')}
                  </button>
                </div>
                {error && <p className="form-error">{error}</p>}
                <button type="submit" className="btn btn-coral btn-block btn-lg" disabled={loading}>
                  {loading ? t('common.processing') : t('auth.loginCta')} <ArrowRight size={17} />
                </button>
              </form>

              <div className="demo-accounts">
                <div className="demo-accounts-head">
                  <strong>{t('auth.demoAccounts')}</strong>
                  <span>{t('auth.demoHint')}</span>
                </div>
                <div className="demo-account-grid">
                  {[
                    { key: 'guest', email: DEMO_ACCOUNTS.guest, label: t('auth.demoGuest') },
                    { key: 'host', email: DEMO_ACCOUNTS.host, label: t('auth.demoHost') },
                    { key: 'admin', email: DEMO_ACCOUNTS.admin, label: t('auth.demoAdmin') },
                  ].map((account) => (
                    <button
                      key={account.key}
                      type="button"
                      className="demo-account"
                      onClick={() => quickLogin(account.email)}
                      disabled={loading}
                    >
                      <span>{account.label}</span>
                      <strong>{account.email}</strong>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {view === 'signup' && (
            <>
              <div className="auth-heading">
                <span className="eyebrow">{t('nav.signup')}</span>
                <h1>{t('auth.signupTitle')}</h1>
                <p>{t('auth.signupSubtitle')}</p>
              </div>
              <form className="auth-form" onSubmit={submitSignup}>
                <Field label={t('auth.nameLabel')}>
                  <input
                    className="input"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    placeholder="Camille Rousseau"
                    required
                  />
                </Field>
                <Field label={t('auth.emailLabel')}>
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="vous@exemple.com"
                    required
                  />
                </Field>
                <div className="form-grid form-grid-2">
                  <Field label={t('auth.countryLabel')}>
                    <select className="select" value={country} onChange={(event) => setCountry(event.target.value)}>
                      {COUNTRIES.map((item) => (
                        <option key={item.code} value={item.code}>{item[lang]}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('auth.phoneLabel')} optional={t('common.optional')}>
                    <input
                      className="input"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      autoComplete="tel"
                      placeholder="+33 6 12 34 56 78"
                    />
                  </Field>
                </div>
                <Field label={t('auth.passwordLabel')} hint={t('auth.passwordHint')}>
                  <div className="input-with-icon input-with-action">
                    <Lock size={17} />
                    <input
                      className="input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="new-password"
                      placeholder="••••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="input-action"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {password && (
                    <div className={`strength strength-${strength.score}`}>
                      <span className="strength-bar"><i style={{ width: `${(strength.score / 4) * 100}%` }} /></span>
                      <span>{t(strength.labelKey)}</span>
                    </div>
                  )}
                </Field>
                <Field label={t('auth.confirmPassword')}>
                  <input
                    className="input"
                    type="password"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••••"
                    required
                  />
                </Field>
                <label className="check-row">
                  <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} />
                  <span>{t('auth.acceptTerms')}</span>
                </label>
                <label className="check-row">
                  <input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} />
                  <span>{t('auth.marketingOptIn')}</span>
                </label>
                {error && <p className="form-error">{error}</p>}
                <button type="submit" className="btn btn-coral btn-block btn-lg" disabled={loading}>
                  {loading ? t('common.processing') : t('auth.createAccount')} <ArrowRight size={17} />
                </button>
              </form>
            </>
          )}

          {view === 'forgot' && (
            <>
              <div className="auth-heading">
                <span className="eyebrow">{t('auth.forgotTitle')}</span>
                <h1>{t('auth.forgotTitle')}</h1>
                <p>{t('auth.forgotDesc')}</p>
              </div>
              {forgotSent ? (
                <div className="auth-success">
                  <ShieldCheck size={26} />
                  <p>{t('auth.resetSent')}</p>
                  <button type="button" className="btn btn-ink" onClick={() => switchView('login')}>
                    {t('auth.loginCta')}
                  </button>
                </div>
              ) : (
                <form className="auth-form" onSubmit={submitForgot}>
                  <Field label={t('auth.emailLabel')}>
                    <input
                      className="input"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      placeholder="vous@exemple.com"
                      required
                    />
                  </Field>
                  <button type="submit" className="btn btn-coral btn-block btn-lg">
                    {t('auth.sendLink')}
                  </button>
                  <button type="button" className="text-link center-link" onClick={() => switchView('login')}>
                    {t('auth.loginCta')}
                  </button>
                </form>
              )}
            </>
          )}

          <p className="auth-legal">
            <ShieldCheck size={14} /> {t('booking.demoNotice')}
          </p>
        </div>
      </div>

      <Modal
        open={twoFactorOpen}
        onClose={() => setTwoFactorOpen(false)}
        title={t('auth.twoFactorTitle')}
        footer={
          <button type="submit" form="two-factor-form" className="btn btn-ink btn-block" disabled={loading}>
            {loading ? t('common.processing') : t('auth.verifyCode')}
          </button>
        }
      >
        <form id="two-factor-form" onSubmit={submitTwoFactor}>
          <p className="muted">{t('auth.twoFactorPrompt', { code: twoFactorCode })}</p>
          <Field label={t('auth.twoFactorCode')}>
            <input
              className="input input-code"
              value={twoFactorInput}
              onChange={(event) => setTwoFactorInput(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              inputMode="numeric"
              autoFocus
            />
          </Field>
          {twoFactorError && <p className="form-error">{twoFactorError}</p>}
        </form>
      </Modal>
    </div>
  )
}
