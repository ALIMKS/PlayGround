import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, isRangeAvailable, parseDate, toISODate, todayISO, unavailableDates } from '../lib/availability'
import { useStore } from '../lib/store'
import type { Booking, Listing } from '../lib/types'

const WEEKDAYS = {
  fr: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
}

function startOfMonth(iso: string): Date {
  const date = parseDate(iso || todayISO())
  return new Date(date.getFullYear(), date.getMonth(), 1, 12)
}

function monthDays(cursor: Date): (string | null)[] {
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const first = new Date(year, month, 1, 12)
  const offset = (first.getDay() + 6) % 7
  const total = new Date(year, month + 1, 0).getDate()
  const cells: (string | null)[] = Array.from({ length: offset }, () => null)
  for (let day = 1; day <= total; day += 1) {
    cells.push(toISODate(new Date(year, month, day, 12)))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function DateRangePicker({
  listing,
  bookings,
  checkIn,
  checkOut,
  onChange,
  months = 1,
}: {
  listing: Listing
  bookings: Booking[]
  checkIn: string
  checkOut: string
  onChange: (checkIn: string, checkOut: string, errorKey?: string) => void
  months?: number
}) {
  const { lang, t } = useStore()
  const [cursor, setCursor] = useState(() => startOfMonth(checkIn))
  const blocked = useMemo(() => unavailableDates(listing, bookings), [listing, bookings])
  const today = todayISO()

  const monthsToShow = Array.from({ length: months }, (_, index) => {
    const date = new Date(cursor)
    date.setMonth(date.getMonth() + index)
    return date
  })

  const select = (iso: string) => {
    if (blocked.has(iso) || iso < today) return
    if (!checkIn || (checkIn && checkOut) || iso <= checkIn) {
      onChange(iso, '')
      return
    }
    if (!isRangeAvailable(listing, checkIn, iso, bookings)) {
      onChange(iso, '', 'booking.bookingConflict')
      return
    }
    onChange(checkIn, iso)
  }

  const canGoBack = cursor > startOfMonth(today)

  return (
    <div className="date-picker">
      <div className="date-picker-head">
        <div>
          <strong>
            {checkIn && checkOut
              ? `${t('listing.nightsSelected', { n: Math.max(1, Math.round((parseDate(checkOut).getTime() - parseDate(checkIn).getTime()) / 86_400_000)) })}`
              : t('listing.selectDates')}
          </strong>
          <span>{t('listing.minNights', { n: listing.minNights })}</span>
        </div>
        <div className="date-nav">
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              const date = new Date(cursor)
              date.setMonth(date.getMonth() - 1)
              setCursor(date)
            }}
            disabled={!canGoBack}
            aria-label="Mois précédent"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              const date = new Date(cursor)
              date.setMonth(date.getMonth() + 1)
              setCursor(date)
            }}
            aria-label="Mois suivant"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      <div className={`date-months ${months > 1 ? 'date-months-two' : ''}`}>
        {monthsToShow.map((month) => {
          const label = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-US', {
            month: 'long',
            year: 'numeric',
          }).format(month)
          return (
            <div className="date-month" key={label}>
              <div className="date-month-label">{label}</div>
              <div className="date-weekdays">
                {WEEKDAYS[lang].map((day, index) => (
                  <span key={`${day}-${index}`}>{day}</span>
                ))}
              </div>
              <div className="date-grid">
                {monthDays(month).map((iso, index) => {
                  if (!iso) return <span key={`empty-${index}`} className="date-empty" />
                  const disabled = iso < today || blocked.has(iso)
                  const inRange = Boolean(checkIn && checkOut && iso > checkIn && iso < checkOut)
                  const isStart = iso === checkIn
                  const isEnd = iso === checkOut
                  return (
                    <button
                      key={iso}
                      type="button"
                      className={`date-cell ${inRange ? 'date-in-range' : ''} ${isStart ? 'date-start' : ''} ${isEnd ? 'date-end' : ''} ${disabled ? 'date-disabled' : ''}`}
                      onClick={() => select(iso)}
                      disabled={disabled}
                      aria-label={iso}
                      aria-pressed={isStart || isEnd}
                    >
                      {Number(iso.slice(8, 10))}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="date-legend">
        <span><i className="legend-dot legend-free" /> {t('listing.availability')}</span>
        <span><i className="legend-dot legend-blocked" /> {t('listing.unavailableDates')}</span>
      </div>
      <p className="date-hint">
        {checkIn && !checkOut ? t('listing.selectCheckout') : t('listing.minNights', { n: listing.minNights })}
        {' · '}
        {t('common.checkOut')} {addDays(checkIn || today, listing.minNights)}
      </p>
    </div>
  )
}
