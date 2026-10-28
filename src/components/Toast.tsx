import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { translate } from '../lib/i18n'
import type { Lang } from '../lib/types'

export type ToastKind = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  kind: ToastKind
}

interface ToastContextValue {
  showToast: (messageKey: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function currentLang(): Lang {
  try {
    const raw = localStorage.getItem('wanderra.v1')
    if (!raw) return 'fr'
    const parsed = JSON.parse(raw) as { settings?: { lang?: Lang } }
    return parsed.settings?.lang ?? 'fr'
  } catch {
    return 'fr'
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((items) => items.filter((item) => item.id !== id))
  }, [])

  const showToast = useCallback(
    (messageKey: string, kind: ToastKind = 'info') => {
      counter.current += 1
      const id = counter.current
      const message = translate(currentLang(), messageKey)
      setToasts((items) => [...items.slice(-3), { id, message, kind }])
      window.setTimeout(() => dismiss(id), 4200)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.kind}`}>
            <span className="toast-icon">
              {toast.kind === 'success' ? (
                <CheckCircle2 size={18} />
              ) : toast.kind === 'error' ? (
                <AlertCircle size={18} />
              ) : (
                <Info size={18} />
              )}
            </span>
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => dismiss(toast.id)}
              aria-label="Fermer"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
