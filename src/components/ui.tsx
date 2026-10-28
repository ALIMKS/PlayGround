import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Minus, Plus, Star, X } from 'lucide-react'
import type { TKey } from '../lib/i18n'
import { useStore } from '../lib/store'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`logo ${compact ? 'logo-compact' : ''}`} aria-label="Wanderra">
      <svg viewBox="0 0 40 40" className="logo-mark" aria-hidden="true">
        <rect width="40" height="40" rx="12" fill="var(--ink)" />
        <path
          d="M10 24.5c4.2-.7 6.2-3.3 8.1-7.3 1.9-4 4.6-6.6 8.8-7.2-2.7 2.7-4.1 5.4-4.8 8.8-.7 4-2.7 6.7-6.8 8-2 .6-4.1 0-5.3-2.3Z"
          fill="var(--coral)"
        />
        <circle cx="27.5" cy="13.5" r="2.6" fill="var(--gold)" />
      </svg>
      {!compact && <span className="logo-word">Wanderra</span>}
    </span>
  )
}

export function Avatar({
  name,
  hue = 24,
  size = 40,
}: {
  name: string
  hue?: number
  size?: number
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, size * 0.36),
        background: `linear-gradient(145deg, hsl(${hue} 52% 88%), hsl(${(hue + 40) % 360} 48% 72%))`,
        color: `hsl(${hue} 45% 24%)`,
      }}
      aria-hidden="true"
    >
      {initials || 'W'}
    </span>
  )
}

export function Rating({
  value,
  count,
  showCount = true,
  size = 14,
}: {
  value: number
  count?: number
  showCount?: boolean
  size?: number
}) {
  return (
    <span className="rating" aria-label={`${value} / 5`}>
      <Star size={size} fill="currentColor" strokeWidth={0} />
      <span>{value > 0 ? value.toFixed(2) : '—'}</span>
      {showCount && typeof count === 'number' && (
        <span className="rating-count">({count})</span>
      )}
    </span>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'gold' | 'coral'
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="spinner-wrap" role="status">
      <span className="spinner" />
      {label && <span>{label}</span>}
    </span>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={panelRef}
      >
        <div className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  optional,
}: {
  label: string
  hint?: string
  error?: string
  htmlFor?: string
  children: ReactNode
  optional?: string
}) {
  return (
    <label className={`field ${error ? 'field-error' : ''}`} htmlFor={htmlFor}>
      <span className="field-label">
        {label}
        {optional && <span className="field-optional">· {optional}</span>}
      </span>
      {children}
      {error ? (
        <span className="field-message field-message-error">{error}</span>
      ) : hint ? (
        <span className="field-message">{hint}</span>
      ) : null}
    </label>
  )
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 16,
  label,
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
}) {
  return (
    <div className="stepper">
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={label ? `${label} −` : 'Diminuer'}
      >
        <Minus size={16} />
      </button>
      <span className="stepper-value" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={label ? `${label} +` : 'Augmenter'}
      >
        <Plus size={16} />
      </button>
    </div>
  )
}

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          className={`tab ${value === tab.id ? 'tab-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-icon">{icon}</div>}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}

export function Stat({
  label,
  value,
  sub,
  icon,
  tone = 'default',
}: {
  label: string
  value: string
  sub?: string
  icon?: ReactNode
  tone?: 'default' | 'coral' | 'green' | 'gold'
}) {
  return (
    <div className={`stat stat-${tone}`}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {icon && <span className="stat-icon">{icon}</span>}
      </div>
      <strong className="stat-value">{value}</strong>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  )
}

export function ProgressRing({ value, size = 64 }: { value: number; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference
  return (
    <span className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--line)" strokeWidth="5" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--coral)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="progress-ring-value">{Math.round(value)}</span>
    </span>
  )
}

export function Accordion({
  items,
  openId,
  onToggle,
}: {
  items: { id: string; title: string; body: ReactNode }[]
  openId: string | null
  onToggle: (id: string | null) => void
}) {
  return (
    <div className="accordion">
      {items.map((item) => {
        const open = openId === item.id
        return (
          <div className={`accordion-item ${open ? 'accordion-open' : ''}`} key={item.id}>
            <button
              type="button"
              className="accordion-trigger"
              aria-expanded={open}
              onClick={() => onToggle(open ? null : item.id)}
            >
              <span>{item.title}</span>
              <ChevronDown size={18} className="accordion-chevron" />
            </button>
            {open && <div className="accordion-body">{item.body}</div>}
          </div>
        )
      })}
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function T({ k, vars }: { k: TKey | string; vars?: Record<string, string | number> }) {
  const { t } = useStore()
  return <>{t(k, vars)}</>
}
