import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, MapPin, Search, Users } from 'lucide-react'
import { addDays, todayISO } from '../lib/availability'
import { formatDate } from '../lib/catalog'
import { useStore } from '../lib/store'
import { Stepper } from './ui'

type Panel = 'destination' | 'dates' | 'guests' | null

function useOutside(onClose: () => void) {
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])
  return ref
}

export function SearchBar({ initialDestination = '' }: { initialDestination?: string }) {
  const { t, lang } = useStore()
  const navigate = useNavigate()
  const [destination, setDestination] = useState(initialDestination)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(2)
  const [panel, setPanel] = useState<Panel>(null)
  const ref = useOutside(() => setPanel(null))

  const dateLabel =
    checkIn && checkOut
      ? `${formatDate(checkIn, lang, { day: 'numeric', month: 'short' })} → ${formatDate(checkOut, lang, { day: 'numeric', month: 'short' })}`
      : t('home.addDates')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (destination.trim()) params.set('destination', destination.trim())
    if (checkIn) params.set('checkIn', checkIn)
    if (checkOut) params.set('checkOut', checkOut)
    if (guests > 0) params.set('guests', String(guests))
    navigate(`/search?${params.toString()}`)
    setPanel(null)
  }

  const applyDates = (from: string, to: string) => {
    setCheckIn(from)
    setCheckOut(to)
    setPanel(null)
  }

  const setCheckInSafe = (value: string) => {
    setCheckIn(value)
    if (checkOut && checkOut <= value) setCheckOut(addDays(value, 1))
  }

  return (
    <form className="search-bar" onSubmit={submit} ref={ref} role="search">
      <div className={`search-segment search-destination ${panel === 'destination' ? 'segment-active' : ''}`}>
        <span className="search-label">
          <MapPin size={14} /> {t('home.destination')}
        </span>
        <input
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
          onFocus={() => setPanel('destination')}
          placeholder={t('home.destinationPlaceholder')}
          aria-label={t('home.destination')}
        />
      </div>

      <span className="search-separator" />

      <div className={`search-segment ${panel === 'dates' ? 'segment-active' : ''}`}>
        <button
          type="button"
          className="search-segment-btn"
          onClick={() => setPanel(panel === 'dates' ? null : 'dates')}
          aria-expanded={panel === 'dates'}
        >
          <span className="search-label">
            <CalendarDays size={14} /> {t('common.dates')}
          </span>
          <span className={checkIn ? 'search-value' : 'search-placeholder'}>{dateLabel}</span>
        </button>
        {panel === 'dates' && (
          <div className="search-popover popover-dates">
            <div className="date-grid">
              <label className="field">
                <span className="field-label">{t('home.checkIn')}</span>
                <input
                  type="date"
                  value={checkIn}
                  min={todayISO()}
                  onChange={(event) => setCheckInSafe(event.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">{t('home.checkOut')}</span>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn ? addDays(checkIn, 1) : addDays(todayISO(), 1)}
                  onChange={(event) => setCheckOut(event.target.value)}
                />
              </label>
            </div>
            <div className="quick-dates">
              <button type="button" onClick={() => applyDates(addDays(todayISO(), 1), addDays(todayISO(), 4))}>
                {t('common.weekend')}
              </button>
              <button type="button" onClick={() => applyDates(addDays(todayISO(), 1), addDays(todayISO(), 8))}>
                1 {t('common.week')}
              </button>
              <button type="button" onClick={() => applyDates(addDays(todayISO(), 1), addDays(todayISO(), 29))}>
                1 {t('common.month')}
              </button>
              <button type="button" className="quick-clear" onClick={() => applyDates('', '')}>
                {t('common.clear')}
              </button>
            </div>
          </div>
        )}
      </div>

      <span className="search-separator" />

      <div className={`search-segment search-guests ${panel === 'guests' ? 'segment-active' : ''}`}>
        <button
          type="button"
          className="search-segment-btn"
          onClick={() => setPanel(panel === 'guests' ? null : 'guests')}
          aria-expanded={panel === 'guests'}
        >
          <span className="search-label">
            <Users size={14} /> {t('home.guests')}
          </span>
          <span className="search-value">
            {guests} {guests === 1 ? t('common.guest') : t('common.guests')}
          </span>
        </button>
        {panel === 'guests' && (
          <div className="search-popover popover-guests">
            <div className="guest-row">
              <div>
                <strong>{t('home.guests')}</strong>
                <span>{t('common.maxGuestsHint')}</span>
              </div>
              <Stepper value={guests} onChange={setGuests} min={1} max={16} label={t('home.guests')} />
            </div>
            <button type="button" className="btn btn-ink btn-block" onClick={() => setPanel(null)}>
              {t('common.apply')}
            </button>
          </div>
        )}
      </div>

      <button type="submit" className="search-submit" aria-label={t('home.searchButton')}>
        <Search size={18} />
        <span>{t('home.searchButton')}</span>
      </button>
    </form>
  )
}
