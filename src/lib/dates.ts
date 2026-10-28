const DAY = 86_400_000;

export function isoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

export function parseDay(iso: string): Date {
  if (!iso) return new Date(NaN);
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12);
}

export function todayISO(): string {
  return isoDay(new Date());
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const diff = parseDay(checkOut).getTime() - parseDay(checkIn).getTime();
  return Math.max(0, Math.round(diff / DAY));
}

const shortFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const longFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const weekdayFmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
const monthFmt = new Intl.DateTimeFormat("fr-FR", { month: "short" });
const fullMonthFmt = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

export function formatDay(iso: string): string {
  if (!iso) return "";
  return shortFmt.format(parseDay(iso));
}

export function formatLongDay(iso: string): string {
  if (!iso) return "";
  return longFmt.format(parseDay(iso));
}

export function formatWeekday(iso: string): string {
  if (!iso) return "";
  return weekdayFmt.format(parseDay(iso));
}

export function formatMonth(iso: string): string {
  return monthFmt.format(parseDay(iso));
}

export function formatMonthYear(iso: string): string {
  return fullMonthFmt.format(parseDay(iso));
}

export function formatRange(checkIn: string, checkOut: string): string {
  if (!checkIn) return "Ajouter des dates";
  if (!checkOut) return formatWeekday(checkIn);
  const a = parseDay(checkIn);
  const b = parseDay(checkOut);
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (sameMonth) {
    return `${a.getDate()} – ${b.getDate()} ${monthFmt.format(b)}`;
  }
  return `${shortFmt.format(a)} – ${shortFmt.format(b)}`;
}

export function isPastDay(iso: string): boolean {
  return parseDay(iso).getTime() < parseDay(todayISO()).getTime();
}

export function isBefore(a: string, b: string): boolean {
  return parseDay(a).getTime() < parseDay(b).getTime();
}

export function sameDay(a: string, b: string): boolean {
  return a === b;
}
