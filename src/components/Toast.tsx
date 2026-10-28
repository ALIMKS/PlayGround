import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, Heart, Info } from "lucide-react";

type ToastTone = "success" | "info" | "favorite";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastValue {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const show = useCallback((message: string, tone: ToastTone = "success") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3400);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.tone}`}>
            <span className="toast-icon">
              {toast.tone === "favorite" ? <Heart size={15} /> : toast.tone === "info" ? <Info size={15} /> : <Check size={15} />}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
