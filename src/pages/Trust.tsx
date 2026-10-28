import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  FileCheck2,
  Globe2,
  Lock,
  MessageCircle,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { CURRENCY_CODES, PAYMENT_METHODS } from '../lib/catalog'
import { useStore } from '../lib/store'
import { DynamicIcon } from '../components/Icon'
import { Accordion, Badge } from '../components/ui'

export function Trust() {
  const { t, lang } = useStore()
  const [openFaq, setOpenFaq] = useState<string | null>('faq1')

  return (
    <div className="trust-page">
      <section className="trust-hero">
        <img src="/images/stay-12.jpg" alt="" />
        <div className="trust-hero-overlay" />
        <div className="container trust-hero-content">
          <Badge tone="gold"><ShieldCheck size={13} /> {t('trust.heroBadge')}</Badge>
          <h1>{t('trust.heroTitle')}</h1>
          <p>{t('trust.heroDesc')}</p>
          <div className="trust-hero-actions">
            <Link to="/search" className="btn btn-coral btn-lg">{t('trust.exploreCta')} <ArrowRight size={17} /></Link>
            <Link to="/help" className="btn btn-ghost-light btn-lg">{t('footer.helpCenter')}</Link>
          </div>
          <div className="trust-hero-metrics">
            <div><strong>99,98 %</strong><span>{t('trust.metric1')}</span></div>
            <div><strong>&lt; 2 h</strong><span>{t('trust.metric2')}</span></div>
            <div><strong>12</strong><span>{t('trust.metric3')}</span></div>
          </div>
        </div>
      </section>

      <div className="container trust-body">
        <section className="trust-section">
          <div className="section-heading">
            <span className="eyebrow">{t('trust.architecture')}</span>
            <h2>{t('trust.pillarsTitle')}</h2>
          </div>
          <div className="trust-pillars">
            <article>
              <div className="trust-pillar-icon"><BadgeCheck size={24} /></div>
              <h3>{t('trust.pillar1Title')}</h3>
              <p>{t('trust.pillar1Desc')}</p>
            </article>
            <article>
              <div className="trust-pillar-icon"><Lock size={24} /></div>
              <h3>{t('trust.pillar2Title')}</h3>
              <p>{t('trust.pillar2Desc')}</p>
            </article>
            <article>
              <div className="trust-pillar-icon"><Users size={24} /></div>
              <h3>{t('trust.pillar3Title')}</h3>
              <p>{t('trust.pillar3Desc')}</p>
            </article>
            <article>
              <div className="trust-pillar-icon"><ShieldCheck size={24} /></div>
              <h3>{t('trust.pillar4Title')}</h3>
              <p>{t('trust.pillar4Desc')}</p>
            </article>
          </div>
        </section>

        <section className="trust-section trust-levels">
          <div className="section-heading">
            <span className="eyebrow">{t('trust.verification')}</span>
            <h2>{t('trust.verificationTitle')}</h2>
            <p>{t('trust.verificationDesc')}</p>
          </div>
          <div className="level-track">
            {[1, 2, 3, 4].map((n) => (
              <div className="level-card" key={n}>
                <span className="level-number">{n}</span>
                <h3>{t(`trust.level${n}`)}</h3>
                <p>{t(`trust.level${n}Desc`)}</p>
                <Check size={18} />
              </div>
            ))}
          </div>
          <div className="trust-level-cta">
            <FileCheck2 size={20} />
            <span>{t('trust.verifyDesc')}</span>
            <Link to="/verify" className="btn btn-ink btn-sm">{t('trust.verifyCta')}</Link>
          </div>
        </section>

        <section className="trust-section">
          <div className="section-heading">
            <span className="eyebrow">{t('trust.paymentsEyebrow')}</span>
            <h2>{t('trust.paymentTitle')}</h2>
            <p>{t('trust.paymentDesc')}</p>
          </div>
          <div className="trust-payments">
            <div className="payment-brand-grid">
              {PAYMENT_METHODS.map((method) => (
                <div className="payment-brand" key={method.id}>
                  <DynamicIcon name={method.icon} size={22} />
                  <span>{method[lang]}</span>
                </div>
              ))}
            </div>
            <div className="currency-cloud">
              {CURRENCY_CODES.map((code) => <span key={code}>{code}</span>)}
            </div>
          </div>
        </section>

        <section className="trust-section trust-privacy">
          <div className="trust-privacy-card">
            <div className="trust-privacy-icon"><Lock size={26} /></div>
            <div>
              <h2>{t('trust.privacyTitle')}</h2>
              <p>{t('trust.privacyDesc')}</p>
              <div className="trust-privacy-points">
                <span><Check size={15} /> {t('trust.privacyPoint1')}</span>
                <span><Check size={15} /> {t('trust.privacyPoint2')}</span>
                <span><Check size={15} /> {t('trust.privacyPoint3')}</span>
                <span><Check size={15} /> {t('trust.privacyPoint4')}</span>
              </div>
            </div>
            <Link to="/account" className="btn btn-outline">{t('trust.manageData')}</Link>
          </div>
        </section>

        <section className="trust-section">
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

        <section className="trust-contact">
          <div>
            <span className="eyebrow">{t('trust.contactEyebrow')}</span>
            <h2>{t('trust.contactTitle')}</h2>
            <p>{t('trust.contactDesc')}</p>
          </div>
          <div className="trust-contact-actions">
            <Link to="/help" className="btn btn-coral"><MessageCircle size={16} /> {t('trust.contactCta')}</Link>
            <Link to="/trust" className="btn btn-outline"><Globe2 size={16} /> {t('footer.trustCenter')}</Link>
          </div>
        </section>
      </div>
    </div>
  )
}
