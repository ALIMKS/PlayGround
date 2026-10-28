import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock,
  ImagePlus,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import {
  AMENITIES,
  CANCELLATION_LABELS,
  CATEGORIES,
  COUNTRIES,
  LISTING_TYPES,
  typeLabel,
} from '../lib/catalog'
import { useStore } from '../lib/store'
import type { Listing, ListingType } from '../lib/types'
import { DynamicIcon } from '../components/Icon'
import { Badge, Field } from '../components/ui'
import { useToast } from '../components/Toast'

const PHOTOS = [
  'stay-1', 'stay-2', 'stay-3', 'stay-4', 'stay-5', 'stay-6',
  'stay-7', 'stay-8', 'paris', 'bali', 'santorini', 'marrakech',
].map((name) => `/images/${name}.jpg`)

const STEPS = ['host.stepBasics', 'host.stepDetails', 'host.stepPricing', 'host.stepPhotos'] as const

export function NewListing() {
  const { t, lang, user, fmt, createListing } = useStore()
  const { showToast } = useToast()
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<ListingType>('apartment')
  const [category, setCategory] = useState<Listing['category']>('city')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState(user?.country ?? 'FR')
  const [maxGuests, setMaxGuests] = useState(2)
  const [bedrooms, setBedrooms] = useState(1)
  const [beds, setBeds] = useState(1)
  const [baths, setBaths] = useState(1)
  const [amenities, setAmenities] = useState<string[]>(['wifi', 'kitchen', 'ac'])
  const [minNights, setMinNights] = useState(2)
  const [cancellationPolicy, setCancellationPolicy] = useState<Listing['cancellationPolicy']>('moderate')
  const [instantBook, setInstantBook] = useState(true)
  const [price, setPrice] = useState(180)
  const [cleaningFee, setCleaningFee] = useState(60)
  const [images, setImages] = useState<string[]>([])
  const [error, setError] = useState('')
  const [created, setCreated] = useState<Listing | null>(null)

  if (!user) return <Navigate to="/login?next=/host/new" replace />
  if (user.role === 'guest') return <Navigate to="/host" replace />
  if (user.idStatus !== 'verified' || !user.phoneVerified) {
    return (
      <div className="container page-pad">
        <div className="panel gate-panel">
          <ShieldCheck size={30} />
          <h1>{t('host.verificationRequired')}</h1>
          <p className="muted">{t('host.verificationRequiredDesc')}</p>
          <Link to="/verify" className="btn btn-coral">{t('account.verifyNow')}</Link>
        </div>
      </div>
    )
  }

  const countryName = COUNTRIES.find((item) => item.code === country)?.[lang] ?? country
  const categoryInfo = CATEGORIES.find((item) => item.key === category)
  const subtotal = price * 5
  const service = (subtotal + cleaningFee) * 0.12
  const taxes = (subtotal + cleaningFee) * 0.1
  const guestTotal = subtotal + cleaningFee + service + taxes
  const hostEstimate = (subtotal + cleaningFee) * 0.97

  const toggleAmenity = (key: string) => {
    setAmenities((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    )
  }

  const toggleImage = (image: string) => {
    setImages((current) => {
      if (current.includes(image)) return current.filter((item) => item !== image)
      if (current.length >= 5) return current
      return [...current, image]
    })
  }

  const validate = (): boolean => {
    setError('')
    if (step === 0) {
      if (title.trim().length < 8) return fail('host.errorTitle')
      if (subtitle.trim().length < 6) return fail('host.errorSubtitle')
      if (description.trim().length < 40) return fail('host.errorDesc')
      if (!city.trim()) return fail('host.errorCity')
    }
    if (step === 1) {
      if (maxGuests < 1 || bedrooms < 0 || beds < 1 || baths < 1) return fail('host.errorDetails')
      if (amenities.length < 3) return fail('host.errorAmenities')
      if (minNights < 1) return fail('host.errorNights')
    }
    if (step === 2) {
      if (price < 20 || price > 2000) return fail('host.errorPrice')
      if (cleaningFee < 0 || cleaningFee > 500) return fail('host.errorCleaning')
    }
    if (step === 3) {
      if (images.length < 3) return fail('host.errorPhotos')
    }
    return true
  }

  const fail = (key: string): false => {
    setError(t(key))
    return false
  }

  const next = () => {
    if (validate()) setStep((value) => Math.min(3, value + 1))
  }

  const submit = () => {
    if (!validate()) return
    const result = createListing({
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      type,
      category,
      city: city.trim(),
      country: countryName,
      countryCode: country,
      price,
      cleaningFee,
      maxGuests,
      bedrooms,
      beds,
      baths,
      amenities,
      images,
      minNights,
      cancellationPolicy,
      instantBook,
    })
    if (!result.ok || !result.listing) {
      setError(t(result.errorKey ?? 'common.error'))
      return
    }
    setCreated(result.listing)
    showToast('host.listingCreated', 'success')
  }

  const reset = () => {
    setCreated(null)
    setStep(0)
    setTitle('')
    setSubtitle('')
    setDescription('')
    setCity('')
    setImages([])
    setAmenities(['wifi', 'kitchen', 'ac'])
    setPrice(180)
    setCleaningFee(60)
    setError('')
  }

  if (created) {
    return (
      <div className="container page-pad">
        <div className="listing-created">
          <div className="listing-created-icon"><CheckCircle2 size={36} /></div>
          <span className="eyebrow">{t('host.listingCreated')}</span>
          <h1>{created.title}</h1>
          <p>{t('host.listingPending')}</p>
          <div className="listing-created-meta">
            <Badge tone="warning"><Clock size={12} /> {t('host.pending')}</Badge>
            <span>{created.city}, {created.country}</span>
            <span>{fmt(created.price)} / {t('common.night')}</span>
          </div>
          <div className="listing-created-actions">
            <Link to="/host" className="btn btn-ink">{t('host.goToHost')}</Link>
            <Link to={`/listing/${created.id}`} className="btn btn-outline">{t('host.reviewListing')}</Link>
            <button type="button" className="btn btn-ghost" onClick={reset}>{t('host.anotherListing')}</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="new-listing-page">
      <div className="container">
        <div className="new-listing-top">
          <Link to="/host" className="ghost-btn"><ArrowLeft size={16} /> {t('host.dashboard')}</Link>
          <div className="wizard-steps">
            {STEPS.map((key, index) => (
              <button
                key={key}
                type="button"
                className={`wizard-step ${index === step ? 'wizard-step-active' : ''} ${index < step ? 'wizard-step-done' : ''}`}
                onClick={() => {
                  if (index < step) setStep(index)
                }}
              >
                <i>{index < step ? <Check size={13} /> : index + 1}</i>
                <span>{t(key)}</span>
              </button>
            ))}
          </div>
          <span className="muted small">{t('host.stepOf', { n: step + 1, total: 4 })}</span>
        </div>

        <div className="new-listing-layout">
          <div className="new-listing-main">
            <div className="panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">{t('host.createTitle')}</span>
                  <h1>{t(STEPS[step])}</h1>
                  <p className="muted small">{t('host.createSubtitle')}</p>
                </div>
              </div>

              {step === 0 && (
                <div className="wizard-form">
                  <Field label={t('host.listingTitleLabel')} hint={t('host.titleHint')}>
                    <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('host.titlePlaceholder')} maxLength={80} />
                  </Field>
                  <Field label={t('host.listingSubtitleLabel')} hint={t('host.subtitleHint')}>
                    <input className="input" value={subtitle} onChange={(event) => setSubtitle(event.target.value)} placeholder={t('host.subtitlePlaceholder')} maxLength={100} />
                  </Field>
                  <div className="form-grid form-grid-2">
                    <Field label={t('host.typeLabel')}>
                      <select className="select" value={type} onChange={(event) => setType(event.target.value as ListingType)}>
                        {LISTING_TYPES.map((item) => (
                          <option key={item.key} value={item.key}>{item[lang]}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label={t('host.categoryLabel')}>
                      <select className="select" value={category} onChange={(event) => setCategory(event.target.value as Listing['category'])}>
                        {CATEGORIES.filter((item) => item.key !== 'all').map((item) => (
                          <option key={item.key} value={item.key}>{item[lang]}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label={t('host.cityLabel')}>
                      <input className="input" value={city} onChange={(event) => setCity(event.target.value)} placeholder={t('host.cityPlaceholder')} />
                    </Field>
                    <Field label={t('host.countryLabel')}>
                      <select className="select" value={country} onChange={(event) => setCountry(event.target.value)}>
                        {COUNTRIES.map((item) => (
                          <option key={item.code} value={item.code}>{item[lang]}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <Field label={t('host.listingDescLabel')} hint={t('host.descHint')}>
                    <textarea className="textarea" rows={6} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t('host.descPlaceholder')} maxLength={1200} />
                  </Field>
                </div>
              )}

              {step === 1 && (
                <div className="wizard-form">
                  <div className="form-grid form-grid-4">
                    <Field label={t('host.guestsLabel')}>
                      <input className="input" type="number" min={1} max={20} value={maxGuests} onChange={(event) => setMaxGuests(Number(event.target.value))} />
                    </Field>
                    <Field label={t('host.bedroomsLabel')}>
                      <input className="input" type="number" min={0} max={10} value={bedrooms} onChange={(event) => setBedrooms(Number(event.target.value))} />
                    </Field>
                    <Field label={t('host.bedsLabel')}>
                      <input className="input" type="number" min={1} max={20} value={beds} onChange={(event) => setBeds(Number(event.target.value))} />
                    </Field>
                    <Field label={t('host.bathsLabel')}>
                      <input className="input" type="number" min={1} max={10} value={baths} onChange={(event) => setBaths(Number(event.target.value))} />
                    </Field>
                  </div>

                  <div className="field">
                    <span className="field-label">{t('host.amenitiesLabel')}</span>
                    <p className="field-hint">{t('host.amenitiesHint')}</p>
                    <div className="amenities-picker">
                      {AMENITIES.map((amenity) => (
                        <button
                          key={amenity.key}
                          type="button"
                          className={`amenity-pick ${amenities.includes(amenity.key) ? 'amenity-pick-active' : ''}`}
                          onClick={() => toggleAmenity(amenity.key)}
                        >
                          <DynamicIcon name={amenity.icon} size={18} />
                          <span>{amenity[lang]}</span>
                          {amenities.includes(amenity.key) && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-grid form-grid-2">
                    <Field label={t('host.minNightsLabel')}>
                      <input className="input" type="number" min={1} max={30} value={minNights} onChange={(event) => setMinNights(Number(event.target.value))} />
                    </Field>
                    <Field label={t('host.policyLabel')}>
                      <select className="select" value={cancellationPolicy} onChange={(event) => setCancellationPolicy(event.target.value as Listing['cancellationPolicy'])}>
                        {Object.entries(CANCELLATION_LABELS).map(([key, value]) => (
                          <option key={key} value={key}>{value[lang]} — {lang === 'fr' ? value.shortFr : value.shortEn}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <label className="toggle-row toggle-row-box">
                    <div>
                      <strong>{t('host.instantLabel')}</strong>
                      <span>{t('host.instantDesc')}</span>
                    </div>
                    <input type="checkbox" checked={instantBook} onChange={(event) => setInstantBook(event.target.checked)} />
                  </label>
                </div>
              )}

              {step === 2 && (
                <div className="wizard-form">
                  <div className="form-grid form-grid-2">
                    <Field label={t('host.priceLabel')} hint={t('host.priceHint')}>
                      <input className="input input-money" type="number" min={20} max={2000} value={price} onChange={(event) => setPrice(Number(event.target.value))} />
                    </Field>
                    <Field label={t('host.cleaningLabel')} hint={t('host.cleaningHint')}>
                      <input className="input input-money" type="number" min={0} max={500} value={cleaningFee} onChange={(event) => setCleaningFee(Number(event.target.value))} />
                    </Field>
                  </div>
                  <div className="price-preview">
                    <div>
                      <span>{t('host.estimatedGuestTotal')}</span>
                      <strong>{fmt(guestTotal)}</strong>
                      <span>{t('host.forFiveNights')}</span>
                    </div>
                    <div>
                      <span>{t('host.estHostNet')}</span>
                      <strong>{fmt(hostEstimate)}</strong>
                      <span>{t('host.afterFee')}</span>
                    </div>
                    <div>
                      <span>{t('host.nightly')}</span>
                      <strong>{fmt(price)}</strong>
                      <span>{t('common.perNight')}</span>
                    </div>
                  </div>
                  <p className="muted small">{t('host.pricingNote')}</p>
                </div>
              )}

              {step === 3 && (
                <div className="wizard-form">
                  <div className="photos-head">
                    <div>
                      <h2>{t('host.choosePhotos')}</h2>
                      <p className="muted small">{t('host.photosHint')}</p>
                    </div>
                    <Badge tone={images.length >= 3 ? 'success' : 'warning'}>
                      {t('host.photosSelected', { n: images.length })}
                    </Badge>
                  </div>
                  <div className="photo-grid">
                    {PHOTOS.map((image) => {
                      const selected = images.includes(image)
                      return (
                        <button
                          key={image}
                          type="button"
                          className={`photo-pick ${selected ? 'photo-pick-active' : ''}`}
                          onClick={() => toggleImage(image)}
                        >
                          <img src={image} alt="" loading="lazy" />
                          <span className="photo-check">{selected ? <Check size={16} /> : <ImagePlus size={16} />}</span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="muted small">{t('host.photoCredit')}</p>

                  <div className="wizard-review">
                    <h2>{t('host.reviewSummary')}</h2>
                    <div className="wizard-summary-grid">
                      <div><span>{t('host.listingTitleLabel')}</span><strong>{title}</strong></div>
                      <div><span>{t('host.typeLabel')}</span><strong>{typeLabel(type, lang)}</strong></div>
                      <div><span>{t('host.guestsLabel')}</span><strong>{maxGuests}</strong></div>
                      <div><span>{t('host.priceLabel')}</span><strong>{fmt(price)}</strong></div>
                      <div><span>{t('host.cleaningLabel')}</span><strong>{fmt(cleaningFee)}</strong></div>
                      <div><span>{t('host.amenitiesLabel')}</span><strong>{amenities.length}</strong></div>
                    </div>
                    <p className="muted small">{t('host.publishNote')}</p>
                  </div>
                </div>
              )}

              {error && <p className="form-error">{error}</p>}

              <div className="wizard-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setStep((value) => Math.max(0, value - 1))}
                  disabled={step === 0}
                >
                  <ArrowLeft size={16} /> {t('common.back')}
                </button>
                {step < 3 ? (
                  <button type="button" className="btn btn-ink" onClick={next}>
                    {t('common.continue')} <ArrowRight size={16} />
                  </button>
                ) : (
                  <button type="button" className="btn btn-coral" onClick={submit}>
                    {t('host.publishListing')} <Sparkles size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <aside className="new-listing-side">
            <div className="listing-preview-card">
              <div className="listing-preview-image">
                <img src={images[0] ?? PHOTOS[0]} alt="" />
                <Badge tone="gold">{t('host.preview')}</Badge>
              </div>
              <div className="listing-preview-body">
                <div className="listing-preview-title">
                  <h3>{title || t('host.previewTitle')}</h3>
                  <span>★ {t('host.noReviews')}</span>
                </div>
                <p><MapPin size={13} /> {city || t('host.cityPlaceholder')}, {countryName}</p>
                <div className="listing-preview-meta">
                  <span>{typeLabel(type, lang)}</span>
                  <span>{categoryInfo?.[lang]}</span>
                  <span>{maxGuests} {t('common.guests')}</span>
                </div>
                <div className="listing-preview-price">
                  <strong>{fmt(price)}</strong>
                  <span> / {t('common.night')}</span>
                </div>
                <div className="listing-preview-trust">
                  <span><ShieldCheck size={14} /> {t('host.hostProtection')}</span>
                  <span><BadgeCheck size={14} /> {t('host.pending')}</span>
                </div>
              </div>
            </div>

            <div className="wizard-help">
              <Sparkles size={18} />
              <div>
                <strong>{t('host.createSubtitle')}</strong>
                <p>{t('host.publishNote')}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
