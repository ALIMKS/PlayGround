const eurFmt = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const numberFmt = new Intl.NumberFormat("fr-FR");

export function eur(value: number): string {
  return eurFmt.format(Math.round(value));
}

export function num(value: number): string {
  return numberFmt.format(value);
}

export function rating(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function guestsLabel(guests: number): string {
  return guests > 1 ? `${guests} voyageurs` : "1 voyageur";
}

export function nightsLabel(nights: number): string {
  if (nights <= 0) return "0 nuit";
  return nights > 1 ? `${nights} nuits` : "1 nuit";
}

export function plural(count: number, singular: string, pluralForm?: string): string {
  return count > 1 ? (pluralForm ?? `${singular}s`) : singular;
}

export function bookingCode(): string {
  return `SJ-${Math.floor(100000 + Math.random() * 900000)}`;
}
