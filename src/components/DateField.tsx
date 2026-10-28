import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDay, isoDay, parseDay, todayISO } from "../lib/dates";

interface DateFieldProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  placeholder?: string;
  align?: "left" | "right";
  compact?: boolean;
  ariaLabel: string;
}

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const monthFmt = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

export function DateField({
  value,
  onChange,
  min = todayISO(),
  placeholder = "Ajouter une date",
  align = "left",
  compact,
  ariaLabel,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const base = value ? parseDay(value) : parseDay(min);
    return new Date(base.getFullYear(), base.getMonth(), 1, 12);
  });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const base = value ? parseDay(value) : parseDay(min);
    setView(new Date(base.getFullYear(), base.getMonth(), 1, 12));
  }, [open, value, min]);

  const days = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const first = new Date(year, month, 1, 12);
    const offset = (first.getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = Array.from({ length: offset }, () => null);
    for (let day = 1; day <= total; day += 1) {
      cells.push(isoDay(new Date(year, month, day, 12)));
    }
    return cells;
  }, [view]);

  const minDate = parseDay(min);
  const minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1, 12);
  const maxMonth = new Date(minDate.getFullYear() + 2, minDate.getMonth(), 1, 12);
  const canGoBack =
    view.getFullYear() > minMonth.getFullYear() ||
    (view.getFullYear() === minMonth.getFullYear() && view.getMonth() > minMonth.getMonth());
  const canGoForward =
    view.getFullYear() < maxMonth.getFullYear() ||
    (view.getFullYear() === maxMonth.getFullYear() && view.getMonth() < maxMonth.getMonth());

  const shift = (delta: number) => {
    setView((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1, 12));
  };

  return (
    <div className={`datefield${compact ? " datefield--compact" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="date-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className={value ? "" : "is-placeholder"}>
          {value ? formatDay(value) : placeholder}
        </span>
        <CalendarDays size={13} />
      </button>

      {open && (
        <div
          className={`date-popover${align === "right" ? " date-popover--right" : ""}`}
          role="dialog"
          aria-label={ariaLabel}
        >
          <div className="date-popover-head">
            <button
              type="button"
              className="icon-btn"
              onClick={() => shift(-1)}
              disabled={!canGoBack}
              aria-label="Mois précédent"
            >
              <ChevronLeft size={16} />
            </button>
            <strong>{monthFmt.format(view)}</strong>
            <button
              type="button"
              className="icon-btn"
              onClick={() => shift(1)}
              disabled={!canGoForward}
              aria-label="Mois suivant"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="date-weekdays" aria-hidden="true">
            {WEEKDAYS.map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
          </div>

          <div className="date-grid">
            {days.map((iso, index) =>
              iso === null ? (
                <span key={`empty-${index}`} />
              ) : (
                <button
                  type="button"
                  key={iso}
                  className={`${iso === value ? "is-selected" : ""}${
                    iso === todayISO() ? " is-today" : ""
                  }`}
                  disabled={iso < min}
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  aria-pressed={iso === value}
                >
                  {parseDay(iso).getDate()}
                </button>
              ),
            )}
          </div>

          <div className="date-popover-foot">
            {value ? (
              <button
                type="button"
                className="link-underline"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                Effacer
              </button>
            ) : (
              <span>Choisissez une date</span>
            )}
            <button type="button" className="btn btn--ghost btn--small" onClick={() => setOpen(false)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
