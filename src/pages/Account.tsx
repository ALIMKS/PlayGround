import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  Globe2,
  KeyRound,
  Lock,
  Mail,
  Monitor,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserRound,
  Wallet,
} from 'lucide-react'
import { COUNTRIES, CURRENCIES, CURRENCY_CODES, formatDate } from '../lib/catalog'
import { LANGUAGES } from '../lib/i18n'
import {
  cvvValid,
  detectCardBrand,
  expiryValid,
  formatCardNumber,
  formatExpiry,
  luhnValid,
} from '../lib/security'
import { useStore } from '../lib/store'
import type { Currency, Lang } from '../lib/types'
import { Avatar, Badge, Field, Modal, ProgressRing } from '../components/ui'
import { useToast } from '../components/Toast'

type AccountTab = 'profile' | 'security' | 'verification' | 'payments' | 'privacy'

const SPOKEN = ['Français', 'English', 'Español', 'Português', 'العربية', 'Deutsch']

export function Account() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const {
    t,
    lang,
    currency,
    user,
    data,
    updateProfile,
    changePassword,
    toggle2fa,
    addCard,
    removeCard,
    addPayoutMethod,
    exportData,
    deleteAccount,
    subscribeNewsletter,
    setLang,
    setCurrency,
  } = useStore()

  const [tab, setTab] = useState<AccountTab>('profile')
  const [name, setName] = useState(user?.name ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [country, setCountry] = useState(user?.country ?? 'FR')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [languages, setLanguages] = useState<string[]>(user?.languages ?? ['Français'])
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [cardOpen, setCardOpen] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState(user?.name ?? '')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardError, setCardError] = useState('')
  const [payout, setPayout] = useState(user?.payoutMethod ?? '')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteText, setDeleteText] = useState('')

  if (!user) return <Navigate to="/login?next=/account" replace />

  const isSubscribed = data.newsletter.includes(user.email)
  const trustLevel =
    user.trustScore >= 70
      ? t('account.levelTrusted')
      : user.trustScore >= 40
        ? t('account.levelVerified')
        : t('account.levelBasic')
  const completionFields = [
    Boolean(user.name),
    Boolean(user.bio),
    Boolean(user.phone),
    Boolean(user.country),
    user.languages.length > 0,
    user.emailVerified,
    user.phoneVerified,
    user.idStatus === 'verified',
  ]
  const completion = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100)

  const toggleLanguage = (value: string) => {
    setLanguages((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    )
  }

  const saveProfile = () => {
    updateProfile({
      name: name.trim(),
      bio: bio.trim(),
      country,
      phone: phone.trim(),
      languages,
    })
  }

  const submitPassword = async () => {
    setPasswordError('')
    if (newPassword !== confirmPassword) {
      setPasswordError(t('auth.passwordMismatch'))
      return
    }
    const ok = await changePassword(currentPassword, newPassword)
    if (!ok) {
      setPasswordError(t('auth.loginError'))
      return
    }
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    showToast('account.passwordUpdated', 'success')
  }

  const submitCard = () => {
    setCardError('')
    if (!luhnValid(cardNumber)) {
      setCardError(t('booking.invalidCard'))
      return
    }
    if (!cardHolder.trim()) {
      setCardError(t('booking.cardHolderRequired'))
      return
    }
    if (!expiryValid(cardExpiry)) {
      setCardError(t('booking.invalidExpiry'))
      return
    }
    if (!cvvValid(cardCvv)) {
      setCardError(t('booking.invalidCvv'))
      return
    }
    addCard({
      brand: detectCardBrand(cardNumber),
      last4: cardNumber.replace(/\D/g, '').slice(-4),
      expiry: cardExpiry,
      holder: cardHolder.trim(),
    })
    setCardOpen(false)
    setCardNumber('')
    setCardExpiry('')
    setCardCvv('')
  }

  const copyReferral = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/#/?ref=${user.id}`)
      showToast('account.referralCopied', 'success')
    } catch {
      showToast('toast.error', 'error')
    }
  }

  return (
    <div className="account-page">
      <div className="container">
        <div className="account-header">
          <Avatar name={user.name} hue={user.avatarHue} size={82} />
          <div className="account-header-main">
            <div className="account-header-name">
              <h1>{user.name}</h1>
              <Badge tone={user.role === 'admin' ? 'gold' : user.role === 'host' ? 'coral' : 'neutral'}>
                {user.role === 'admin' ? t('auth.demoAdmin') : user.role === 'host' ? t('auth.demoHost') : t('auth.demoGuest')}
              </Badge>
              {user.emailVerified && <Badge tone="success"><BadgeCheck size={12} /> {t('account.levelVerified')}</Badge>}
            </div>
            <p>{user.email} · {t('account.memberSince', { date: formatDate(user.createdAt, lang, { month: 'long', year: 'numeric', day: undefined }) })}</p>
            <div className="account-header-meta">
              <span><ShieldCheck size={14} /> {t('account.trustLevel')} : {trustLevel}</span>
              <span><Globe2 size={14} /> {COUNTRIES.find((item) => item.code === user.country)?.[lang] ?? user.country}</span>
              <span><Mail size={14} /> {user.emailVerified ? t('account.emailCheck') : t('account.verifyNow')}</span>
            </div>
          </div>
          <div className="account-trust">
            <ProgressRing value={user.trustScore} size={68} />
            <span>{t('account.trustScore')}</span>
            <strong>{user.trustScore}/100</strong>
          </div>
        </div>

        <div className="tabs tabs-line account-tabs">
          {([
            ['profile', UserRound],
            ['security', ShieldCheck],
            ['verification', BadgeCheck],
            ['payments', CreditCard],
            ['privacy', Lock],
          ] as [AccountTab, typeof UserRound][]).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              className={`tab ${tab === key ? 'tab-active' : ''}`}
              onClick={() => setTab(key)}
            >
              <Icon size={16} /> {t(`account.tabs${key.charAt(0).toUpperCase()}${key.slice(1)}`)}
            </button>
          ))}
        </div>

        <div className="account-layout">
          <div className="account-main">
            {tab === 'profile' && (
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>{t('account.tabsProfile')}</h2>
                    <p className="muted small">{t('account.profileDesc')}</p>
                  </div>
                  <Badge tone="neutral">{t('account.profileCompletion', { n: completion })}</Badge>
                </div>
                <div className="form-grid">
                  <Field label={t('auth.nameLabel')}>
                    <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
                  </Field>
                  <Field label={t('auth.emailLabel')} hint={t('account.emailLocked')}>
                    <input className="input" value={user.email} readOnly disabled />
                  </Field>
                  <Field label={t('auth.phoneLabel')} hint={user.phoneVerified ? t('account.phoneVerified') : t('account.phoneUnverified')}>
                    <input className="input" value={phone} onChange={(event) => setPhone(event.target.value)} />
                  </Field>
                  <Field label={t('auth.countryLabel')}>
                    <select className="select" value={country} onChange={(event) => setCountry(event.target.value)}>
                      {COUNTRIES.map((item) => (
                        <option key={item.code} value={item.code}>{item[lang]}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label={t('account.bioLabel')} hint={t('account.bioHint')}>
                  <textarea className="textarea" rows={4} value={bio} onChange={(event) => setBio(event.target.value)} />
                </Field>
                <div className="field">
                  <span className="field-label">{t('account.languagesLabel')}</span>
                  <div className="chip-wrap">
                    {SPOKEN.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`filter-chip ${languages.includes(item) ? 'filter-chip-active' : ''}`}
                        onClick={() => toggleLanguage(item)}
                      >
                        {languages.includes(item) && <Check size={13} />} {item}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="panel-actions">
                  <button type="button" className="btn btn-ink" onClick={saveProfile}>{t('common.save')}</button>
                  <Link to="/verify" className="btn btn-outline">{t('account.verifyNow')}</Link>
                </div>
              </section>
            )}

            {tab === 'security' && (
              <>
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <h2>{t('account.passwordChange')}</h2>
                      <p className="muted small">{t('auth.passwordHint')}</p>
                    </div>
                    <KeyRound size={20} />
                  </div>
                  <div className="form-grid">
                    <Field label={t('account.currentPassword')}>
                      <input className="input" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" />
                    </Field>
                    <Field label={t('account.newPassword')}>
                      <input className="input" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" />
                    </Field>
                    <Field label={t('auth.confirmPassword')}>
                      <input className="input" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
                    </Field>
                  </div>
                  {passwordError && <p className="form-error">{passwordError}</p>}
                  <div className="panel-actions">
                    <button type="button" className="btn btn-ink" onClick={submitPassword}>{t('account.updatePassword')}</button>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <h2>{t('auth.twoFactorTitle')}</h2>
                      <p className="muted small">{t('auth.twoFactorDesc')}</p>
                    </div>
                    <Badge tone={user.twoFactor ? 'success' : 'neutral'}>
                      {user.twoFactor ? t('account.twoFactorOn') : t('account.twoFactorOff')}
                    </Badge>
                  </div>
                  <div className="security-row">
                    <div>
                      <strong>{user.twoFactor ? t('account.2faEnabledDesc') : t('account.2faDisabledDesc')}</strong>
                      <span>{t('account.2faHint')}</span>
                    </div>
                    <button type="button" className="btn btn-outline" onClick={toggle2fa}>
                      {user.twoFactor ? t('auth.disable2fa') : t('auth.enable2fa')}
                    </button>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-head">
                    <h2>{t('account.activeSessions')}</h2>
                    <span className="muted small">{t('account.thisDevice')}</span>
                  </div>
                  <div className="session-list">
                    {user.loginHistory.length === 0 && <p className="muted">{t('account.noHistory')}</p>}
                    {user.loginHistory.slice(0, 5).map((event, index) => (
                      <div className="session-row" key={`${event.at}-${index}`}>
                        <Monitor size={18} />
                        <div>
                          <strong>{event.device}</strong>
                          <span>{event.city} · {formatDate(event.at.slice(0, 10), lang)}</span>
                        </div>
                        <Badge tone={event.ok ? 'success' : 'danger'}>{event.ok ? t('account.sessionActive') : t('account.sessionFailed')}</Badge>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {tab === 'verification' && (
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>{t('account.verificationChecklist')}</h2>
                    <p className="muted small">{t('account.verificationDesc')}</p>
                  </div>
                  <Badge tone={completion === 100 ? 'success' : 'gold'}>{t('account.profileCompletion', { n: completion })}</Badge>
                </div>
                <div className="verify-checklist">
                  <div className={user.emailVerified ? 'verify-item verify-item-done' : 'verify-item'}>
                    <Mail size={20} />
                    <div>
                      <strong>{t('account.emailCheck')}</strong>
                      <span>{user.emailVerified ? user.email : t('account.notVerified')}</span>
                    </div>
                    {user.emailVerified ? <CheckCircle2 size={18} /> : <Link to="/verify?tab=email" className="text-link">{t('account.verifyNow')}</Link>}
                  </div>
                  <div className={user.phoneVerified ? 'verify-item verify-item-done' : 'verify-item'}>
                    <Smartphone size={20} />
                    <div>
                      <strong>{t('account.phoneCheck')}</strong>
                      <span>{user.phoneVerified ? user.phone : t('account.notVerified')}</span>
                    </div>
                    {user.phoneVerified ? <CheckCircle2 size={18} /> : <Link to="/verify?tab=phone" className="text-link">{t('account.verifyNow')}</Link>}
                  </div>
                  <div className={user.idStatus === 'verified' ? 'verify-item verify-item-done' : 'verify-item'}>
                    <ShieldCheck size={20} />
                    <div>
                      <strong>{t('account.idCheck')}</strong>
                      <span>{user.idStatus === 'verified' ? t('auth.verificationApproved') : user.idStatus === 'pending' ? t('auth.verificationPending') : t('account.notVerified')}</span>
                    </div>
                    {user.idStatus === 'verified' ? <CheckCircle2 size={18} /> : <Link to="/verify?tab=identity" className="text-link">{t('account.verifyNow')}</Link>}
                  </div>
                  <div className={user.payoutMethod ? 'verify-item verify-item-done' : 'verify-item'}>
                    <Wallet size={20} />
                    <div>
                      <strong>{t('account.payoutCheck')}</strong>
                      <span>{user.payoutMethod || t('account.noPayout')}</span>
                    </div>
                    {user.payoutMethod ? <CheckCircle2 size={18} /> : <button type="button" className="text-link" onClick={() => setTab('payments')}>{t('account.addPayout')}</button>}
                  </div>
                </div>
              </section>
            )}

            {tab === 'payments' && (
              <>
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <h2>{t('account.paymentMethods')}</h2>
                      <p className="muted small">{t('account.paymentDesc')}</p>
                    </div>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setCardOpen(true)}>
                      <CreditCard size={15} /> {t('account.addCard')}
                    </button>
                  </div>
                  {user.cards.length === 0 ? (
                    <p className="muted">{t('account.noPaymentMethods')}</p>
                  ) : (
                    <div className="card-list">
                      {user.cards.map((card, index) => (
                        <div className="saved-card-row" key={card.id}>
                          <div className="card-brand">{card.brand}</div>
                          <div>
                            <strong>{t('account.cardEnding', { last: card.last4 })}</strong>
                            <span>{card.holder} · {t('account.expires', { date: card.expiry })}</span>
                          </div>
                          {index === 0 && <Badge tone="success">{t('account.defaultMethod')}</Badge>}
                          <button type="button" className="text-link danger-text" onClick={() => removeCard(card.id)}>
                            {t('common.remove')}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="secure-note"><Lock size={15} /> {t('account.paymentSecure')}</div>
                </section>

                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <h2>{t('account.payoutTitle')}</h2>
                      <p className="muted small">{t('account.payoutDesc')}</p>
                    </div>
                    <Wallet size={20} />
                  </div>
                  <div className="payout-row">
                    <Field label={t('account.payoutMethod')} hint={t('account.payoutHint')}>
                      <input
                        className="input"
                        value={payout}
                        onChange={(event) => setPayout(event.target.value)}
                        placeholder={t('account.payoutPlaceholder')}
                      />
                    </Field>
                    <button
                      type="button"
                      className="btn btn-ink"
                      onClick={() => addPayoutMethod(payout)}
                      disabled={!payout.trim()}
                    >
                      {t('account.savePayout')}
                    </button>
                  </div>
                  {user.payoutMethod && <p className="muted small">{t('account.currentPayout', { method: user.payoutMethod })}</p>}
                </section>
              </>
            )}

            {tab === 'privacy' && (
              <>
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <h2>{t('account.notifications')}</h2>
                      <p className="muted small">{t('account.notificationsDesc')}</p>
                    </div>
                  </div>
                  <div className="toggle-row">
                    <div>
                      <strong>{t('account.marketing')}</strong>
                      <span>{t('account.marketingDesc')}</span>
                    </div>
                    {isSubscribed ? (
                      <Badge tone="success"><Check size={12} /> {t('account.subscribed')}</Badge>
                    ) : (
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => subscribeNewsletter(user.email)}>
                        {t('account.subscribe')}
                      </button>
                    )}
                  </div>
                  <div className="toggle-row">
                    <div>
                      <strong>{t('account.securityAlerts')}</strong>
                      <span>{t('account.securityAlertsDesc')}</span>
                    </div>
                    <Badge tone="success">{t('account.enabled')}</Badge>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-head">
                    <h2>{t('account.gdprExport')}</h2>
                  </div>
                  <p className="muted">{t('account.gdprExportDesc')}</p>
                  <button type="button" className="btn btn-outline" onClick={exportData}>
                    <Download size={16} /> {t('account.exportData')}
                  </button>
                </section>

                <section className="panel">
                  <div className="panel-head">
                    <h2>{t('account.auditLog')}</h2>
                  </div>
                  <div className="audit-list">
                    {data.audit.filter((entry) => entry.userId === user.id).slice(0, 8).map((entry) => (
                      <div className="audit-row" key={entry.id}>
                        <span>{entry.action}</span>
                        <span>{formatDate(entry.at.slice(0, 10), lang)}</span>
                      </div>
                    ))}
                    {data.audit.filter((entry) => entry.userId === user.id).length === 0 && (
                      <p className="muted">{t('account.noAudit')}</p>
                    )}
                  </div>
                </section>

                <section className="panel panel-danger">
                  <div className="panel-head">
                    <div>
                      <h2>{t('account.deleteAccount')}</h2>
                      <p className="muted small">{t('account.deleteAccountDesc')}</p>
                    </div>
                    <AlertTriangle size={20} />
                  </div>
                  <button type="button" className="btn btn-danger" onClick={() => setDeleteOpen(true)}>
                    <Trash2 size={16} /> {t('account.deleteAccount')}
                  </button>
                </section>
              </>
            )}
          </div>

          <aside className="account-side">
            <div className="side-card">
              <h3>{t('account.profileCompletion', { n: completion })}</h3>
              <div className="completion-bar"><i style={{ width: `${completion}%` }} /></div>
              <p className="muted small">{t('account.completionHint')}</p>
            </div>

            <div className="side-card">
              <h3>{t('account.preferences')}</h3>
              <Field label={t('common.language')}>
                <select
                  className="select"
                  value={lang}
                  onChange={(event) => setLang(event.target.value as Lang)}
                >
                  {LANGUAGES.map((item) => (
                    <option key={item.code} value={item.code}>{item.label}</option>
                  ))}
                </select>
              </Field>
              <Field label={t('common.currency')}>
                <select
                  className="select"
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value as Currency)}
                >
                  {CURRENCY_CODES.map((code) => (
                    <option key={code} value={code}>{code} · {CURRENCIES[code].label[lang]}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="side-card">
              <h3>{t('account.referral')}</h3>
              <p className="muted small">{t('account.referralDesc')}</p>
              <button type="button" className="btn btn-outline btn-block" onClick={copyReferral}>
                <Copy size={15} /> {t('account.referralCta')}
              </button>
            </div>
          </aside>
        </div>
      </div>

      <Modal
        open={cardOpen}
        onClose={() => setCardOpen(false)}
        title={t('account.addCard')}
        footer={<button type="button" className="btn btn-ink btn-block" onClick={submitCard}>{t('common.save')}</button>}
      >
        <div className="form-grid">
          <Field label={t('booking.cardNumber')}>
            <input
              className="input"
              value={cardNumber}
              onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
            />
          </Field>
          <Field label={t('booking.cardHolder')}>
            <input className="input" value={cardHolder} onChange={(event) => setCardHolder(event.target.value)} />
          </Field>
          <Field label={t('booking.expiry')}>
            <input
              className="input"
              value={cardExpiry}
              onChange={(event) => setCardExpiry(formatExpiry(event.target.value))}
              placeholder="MM/AA"
              inputMode="numeric"
            />
          </Field>
          <Field label={t('booking.cvv')}>
            <input
              className="input"
              value={cardCvv}
              onChange={(event) => setCardCvv(event.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="123"
              inputMode="numeric"
            />
          </Field>
        </div>
        {cardError && <p className="form-error">{cardError}</p>}
        <p className="muted small">{t('booking.demoCardHint')}</p>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t('account.deleteAccount')}
        footer={
          <button
            type="button"
            className="btn btn-danger btn-block"
            disabled={deleteText.trim().toUpperCase() !== (lang === 'fr' ? 'SUPPRIMER' : 'DELETE')}
            onClick={() => {
              deleteAccount()
              navigate('/', { replace: true })
            }}
          >
            {t('account.confirmDelete')}
          </button>
        }
      >
        <p className="muted">{t('account.deleteAccountDesc')}</p>
        <Field label={t('account.deleteConfirm')}>
          <input
            className="input"
            value={deleteText}
            onChange={(event) => setDeleteText(event.target.value)}
            placeholder={lang === 'fr' ? 'SUPPRIMER' : 'DELETE'}
          />
        </Field>
      </Modal>
    </div>
  )
}
