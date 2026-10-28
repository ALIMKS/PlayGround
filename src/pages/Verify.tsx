import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  ShieldCheck,
  Smartphone,
  Upload,
  XCircle,
} from 'lucide-react'
import { maskEmail } from '../lib/security'
import { useStore } from '../lib/store'
import { Badge, Field, ProgressRing } from '../components/ui'
import { useToast } from '../components/Toast'

type Tab = 'email' | 'phone' | 'identity'

export function Verify() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { t, user, data, verifyEmail, resendEmailCode, sendPhoneCode, verifyPhone, submitId } = useStore()
  const { showToast } = useToast()

  const initialTab = (params.get('tab') ?? 'email') as Tab
  const [tab, setTab] = useState<Tab>(['email', 'phone', 'identity'].includes(initialTab) ? initialTab : 'email')
  const [emailCode, setEmailCode] = useState('')
  const [emailDemoCode, setEmailDemoCode] = useState(user?.emailCode ?? '')
  const [emailError, setEmailError] = useState('')
  const [phoneInput, setPhoneInput] = useState(user?.phone ?? '')
  const [phoneCode, setPhoneCode] = useState('')
  const [phoneDemoCode, setPhoneDemoCode] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [fileName, setFileName] = useState(user?.idDocName ?? '')
  const [fileError, setFileError] = useState('')

  if (!user) return <Navigate to="/login?next=/verify" replace />

  const identityRequest = data.verifications.find(
    (request) => request.userId === user.id && request.kind === 'identity',
  )

  const submitEmail = (event: FormEvent) => {
    event.preventDefault()
    setEmailError('')
    if (verifyEmail(emailCode)) {
      showToast('auth.emailVerified', 'success')
      setEmailCode('')
    } else {
      setEmailError(t('auth.wrongCode'))
    }
  }

  const resendEmail = () => {
    const code = resendEmailCode()
    setEmailDemoCode(code)
    setEmailError('')
    showToast('toast.codeSent', 'success')
  }

  const sendPhone = () => {
    setPhoneError('')
    if (!phoneInput.trim()) {
      setPhoneError(t('booking.phoneRequired'))
      return
    }
    const code = sendPhoneCode(phoneInput)
    setPhoneDemoCode(code)
    showToast('toast.codeSent', 'success')
  }

  const submitPhone = (event: FormEvent) => {
    event.preventDefault()
    setPhoneError('')
    if (verifyPhone(phoneCode)) {
      showToast('auth.phoneVerified', 'success')
      setPhoneCode('')
    } else {
      setPhoneError(t('auth.wrongCode'))
    }
  }

  const pickFile = (event: ChangeEvent<HTMLInputElement>) => {
    setFileError('')
    const file = event.target.files?.[0]
    if (!file) return
    const validType = file.type.startsWith('image/') || file.type === 'application/pdf'
    if (!validType) {
      setFileError(t('auth.docTypes'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError(t('auth.docTypes'))
      return
    }
    setFileName(file.name)
  }

  const submitIdentity = () => {
    if (!fileName) {
      setFileError(t('auth.docTypes'))
      return
    }
    submitId(fileName)
  }

  const statusBadge = (status: string) => {
    if (status === 'verified') return <Badge tone="success"><CheckCircle2 size={12} /> {t('auth.verificationApproved')}</Badge>
    if (status === 'pending') return <Badge tone="warning"><Clock size={12} /> {t('auth.verificationPending')}</Badge>
    if (status === 'rejected') return <Badge tone="danger"><XCircle size={12} /> {t('auth.verificationRejected')}</Badge>
    return <Badge tone="neutral">{t('verify.notStarted')}</Badge>
  }

  return (
    <div className="verify-page">
      <div className="container">
        <div className="page-head">
          <div>
            <span className="eyebrow">{t('nav.verify')}</span>
            <h1>{t('verify.title')}</h1>
            <p>{t('verify.subtitle')}</p>
          </div>
          <Badge tone={user.trustScore >= 70 ? 'success' : 'gold'}>
            <ShieldCheck size={13} /> {t('verify.trustScore', { n: user.trustScore })}
          </Badge>
        </div>

        <div className="verify-layout">
          <div className="verify-main">
            <div className="tabs tabs-line">
              {(['email', 'phone', 'identity'] as Tab[]).map((key) => {
                const icon = key === 'email' ? <Mail size={16} /> : key === 'phone' ? <Smartphone size={16} /> : <ShieldCheck size={16} />
                const done =
                  key === 'email' ? user.emailVerified : key === 'phone' ? user.phoneVerified : user.idStatus === 'verified'
                return (
                  <button
                    key={key}
                    type="button"
                    className={`tab ${tab === key ? 'tab-active' : ''}`}
                    onClick={() => setTab(key)}
                  >
                    {icon}
                    {t(`verify.${key}Tab`)}
                    {done && <CheckCircle2 size={14} className="tab-done" />}
                  </button>
                )
              })}
            </div>

            {tab === 'email' && (
              <section className="panel verify-panel">
                <div className="verify-panel-head">
                  <div className="verify-icon"><Mail size={22} /></div>
                  <div>
                    <h2>{t('auth.verifyEmailTitle')}</h2>
                    <p>{t('verify.emailDesc', { email: maskEmail(user.email) })}</p>
                  </div>
                  {statusBadge(user.emailVerified ? 'verified' : 'none')}
                </div>

                {user.emailVerified ? (
                  <div className="verify-success">
                    <CheckCircle2 size={26} />
                    <div>
                      <strong>{t('auth.emailVerified')}</strong>
                      <p>{t('verify.emailNote')}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="verify-demo-code">
                      <span>{t('verify.demoCode')}</span>
                      <strong>{emailDemoCode || '—'}</strong>
                      <button type="button" className="text-link" onClick={resendEmail}>
                        {t('auth.resendCode')}
                      </button>
                    </div>
                    <form className="verify-form" onSubmit={submitEmail}>
                      <Field label={t('auth.codeLabel')}>
                        <input
                          className="input input-code"
                          value={emailCode}
                          onChange={(event) => setEmailCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="••••••"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                        />
                      </Field>
                      {emailError && <p className="form-error">{emailError}</p>}
                      <button type="submit" className="btn btn-coral">
                        {t('auth.verifyCode')} <ArrowRight size={16} />
                      </button>
                    </form>
                  </>
                )}
              </section>
            )}

            {tab === 'phone' && (
              <section className="panel verify-panel">
                <div className="verify-panel-head">
                  <div className="verify-icon"><Smartphone size={22} /></div>
                  <div>
                    <h2>{t('auth.phoneVerifyTitle')}</h2>
                    <p>{t('verify.phoneDesc')}</p>
                  </div>
                  {statusBadge(user.phoneVerified ? 'verified' : 'none')}
                </div>

                {user.phoneVerified ? (
                  <div className="verify-success">
                    <CheckCircle2 size={26} />
                    <div>
                      <strong>{t('verify.phoneVerified', { phone: user.phone }) || t('auth.phoneVerifyTitle')}</strong>
                      <p>{t('verify.phoneNote')}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="form-grid form-grid-2">
                      <Field label={t('auth.phoneLabel')}>
                        <input
                          className="input"
                          value={phoneInput}
                          onChange={(event) => setPhoneInput(event.target.value)}
                          placeholder="+33 6 12 34 56 78"
                          autoComplete="tel"
                        />
                      </Field>
                      <div className="verify-send">
                        <button type="button" className="btn btn-outline" onClick={sendPhone}>
                          {t('auth.sendCode')}
                        </button>
                      </div>
                    </div>
                    {phoneDemoCode && (
                      <div className="verify-demo-code">
                        <span>{t('verify.demoCode')}</span>
                        <strong>{phoneDemoCode}</strong>
                      </div>
                    )}
                    <form className="verify-form" onSubmit={submitPhone}>
                      <Field label={t('auth.codeLabel')}>
                        <input
                          className="input input-code"
                          value={phoneCode}
                          onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="••••••"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                        />
                      </Field>
                      {phoneError && <p className="form-error">{phoneError}</p>}
                      <button type="submit" className="btn btn-coral">
                        {t('auth.verifyCode')} <ArrowRight size={16} />
                      </button>
                    </form>
                  </>
                )}
              </section>
            )}

            {tab === 'identity' && (
              <section className="panel verify-panel">
                <div className="verify-panel-head">
                  <div className="verify-icon"><ShieldCheck size={22} /></div>
                  <div>
                    <h2>{t('auth.idVerifyTitle')}</h2>
                    <p>{t('auth.idVerifyDesc')}</p>
                  </div>
                  {statusBadge(user.idStatus)}
                </div>

                {user.idStatus === 'verified' ? (
                  <div className="verify-success">
                    <BadgeCheck size={26} />
                    <div>
                      <strong>{t('auth.verificationApproved')}</strong>
                      <p>{t('verify.identityNote')}</p>
                    </div>
                  </div>
                ) : user.idStatus === 'pending' ? (
                  <div className="verify-pending">
                    <Clock size={26} />
                    <div>
                      <strong>{t('auth.verificationPending')}</strong>
                      <p>{t('verify.pendingNote')}</p>
                      {user.idDocName && (
                        <span className="doc-pill"><FileText size={14} /> {user.idDocName}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {user.idStatus === 'rejected' && (
                      <div className="verify-rejected">
                        <XCircle size={22} />
                        <div>
                          <strong>{t('auth.verificationRejected')}</strong>
                          <p>{identityRequest?.note || t('verify.rejectedNote')}</p>
                        </div>
                      </div>
                    )}
                    <label className="upload-zone" htmlFor="id-document">
                      <Upload size={26} />
                      <strong>{fileName || t('auth.uploadDoc')}</strong>
                      <span>{t('auth.docTypes')}</span>
                      <input
                        id="id-document"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={pickFile}
                        className="sr-only"
                      />
                    </label>
                    {fileError && <p className="form-error">{fileError}</p>}
                    <div className="verify-actions">
                      <button type="button" className="btn btn-coral" onClick={submitIdentity} disabled={!fileName}>
                        {t('auth.submitVerification')}
                      </button>
                      <span className="muted small">{t('verify.demoNotice')}</span>
                    </div>
                  </>
                )}
              </section>
            )}
          </div>

          <aside className="verify-side">
            <div className="trust-card">
              <div className="trust-card-head">
                <ProgressRing value={user.trustScore} size={72} />
                <div>
                  <span className="eyebrow">{t('verify.trustScoreLabel')}</span>
                  <strong>{user.trustScore} / 100</strong>
                  <p>{t('verify.trustDesc')}</p>
                </div>
              </div>
              <div className="trust-checklist">
                <div className={user.emailVerified ? 'trust-done' : ''}>
                  {user.emailVerified ? <CheckCircle2 size={17} /> : <Mail size={17} />}
                  <span>{t('verify.needEmail')}</span>
                </div>
                <div className={user.phoneVerified ? 'trust-done' : ''}>
                  {user.phoneVerified ? <CheckCircle2 size={17} /> : <Smartphone size={17} />}
                  <span>{t('verify.needPhone')}</span>
                </div>
                <div className={user.idStatus === 'verified' ? 'trust-done' : ''}>
                  {user.idStatus === 'verified' ? <CheckCircle2 size={17} /> : <ShieldCheck size={17} />}
                  <span>{t('verify.needId')}</span>
                </div>
                <div className={user.role === 'host' ? 'trust-done' : ''}>
                  {user.role === 'host' ? <CheckCircle2 size={17} /> : <BadgeCheck size={17} />}
                  <span>{t('verify.needHost')}</span>
                </div>
              </div>
            </div>

            <div className="verify-why">
              <h3>{t('verify.whyTitle')}</h3>
              <p>{t('verify.whyDesc')}</p>
              <div className="verify-why-points">
                <span><ShieldCheck size={15} /> {t('verify.why1')}</span>
                <span><BadgeCheck size={15} /> {t('verify.why2')}</span>
                <span><Clock size={15} /> {t('verify.why3')}</span>
              </div>
            </div>

            <button type="button" className="btn btn-ink btn-block" onClick={() => navigate('/account')}>
              {t('verify.continue')} <ArrowRight size={16} />
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}
