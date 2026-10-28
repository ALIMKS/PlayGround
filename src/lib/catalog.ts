import type {
  CancellationPolicy,
  Currency,
  Lang,
  ListingCategory,
  ListingType,
  PaymentMethod,
} from './types'

export interface CurrencyInfo {
  rate: number
  locale: string
  label: { fr: string; en: string }
  zeroDecimal?: boolean
}

export const CURRENCIES: Record<Currency, CurrencyInfo> = {
  USD: { rate: 1, locale: 'en-US', label: { fr: 'Dollar américain', en: 'US dollar' } },
  EUR: { rate: 0.92, locale: 'fr-FR', label: { fr: 'Euro', en: 'Euro' } },
  GBP: { rate: 0.79, locale: 'en-GB', label: { fr: 'Livre sterling', en: 'British pound' } },
  MAD: { rate: 9.95, locale: 'fr-MA', label: { fr: 'Dirham marocain', en: 'Moroccan dirham' } },
  XOF: { rate: 605, locale: 'fr-SN', label: { fr: 'Franc CFA (UEMOA)', en: 'CFA franc (UEMOA)' }, zeroDecimal: true },
  XAF: { rate: 605, locale: 'fr-CM', label: { fr: 'Franc CFA (CEMAC)', en: 'CFA franc (CEMAC)' }, zeroDecimal: true },
  CAD: { rate: 1.36, locale: 'en-CA', label: { fr: 'Dollar canadien', en: 'Canadian dollar' } },
  AED: { rate: 3.67, locale: 'en-AE', label: { fr: 'Dirham des Émirats', en: 'UAE dirham' } },
  JPY: { rate: 151, locale: 'ja-JP', label: { fr: 'Yen japonais', en: 'Japanese yen' }, zeroDecimal: true },
  BRL: { rate: 5.05, locale: 'pt-BR', label: { fr: 'Réal brésilien', en: 'Brazilian real' } },
  INR: { rate: 83.2, locale: 'en-IN', label: { fr: 'Roupie indienne', en: 'Indian rupee' } },
  ZAR: { rate: 18.6, locale: 'en-ZA', label: { fr: 'Rand sud-africain', en: 'South African rand' } },
}

export const CURRENCY_CODES = Object.keys(CURRENCIES) as Currency[]

export function convertFromUsd(usd: number, currency: Currency): number {
  return usd * CURRENCIES[currency].rate
}

export function formatMoney(
  usd: number,
  currency: Currency,
  lang: Lang,
  options?: { compact?: boolean },
): string {
  const info = CURRENCIES[currency]
  const locale = lang === 'fr' ? 'fr-FR' : info.locale
  const value = convertFromUsd(usd, currency)
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: options?.compact || info.zeroDecimal ? 0 : 0,
      minimumFractionDigits: 0,
      notation: options?.compact ? 'compact' : 'standard',
    }).format(value)
  } catch {
    return `${Math.round(value)} ${currency}`
  }
}

export function formatDate(iso: string, lang: Lang, options?: Intl.DateTimeFormatOptions): string {
  if (!iso) return ''
  const date = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''))
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date)
}

export function formatMonthYear(iso: string, lang: Lang): string {
  return formatDate(iso, lang, { day: undefined, month: 'long', year: 'numeric' })
}

export interface AmenityInfo {
  key: string
  icon: string
  fr: string
  en: string
}

export const AMENITIES: AmenityInfo[] = [
  { key: 'wifi', icon: 'Wifi', fr: 'Wi-Fi fibre', en: 'Fibre Wi-Fi' },
  { key: 'kitchen', icon: 'UtensilsCrossed', fr: 'Cuisine équipée', en: 'Full kitchen' },
  { key: 'pool', icon: 'Waves', fr: 'Piscine', en: 'Pool' },
  { key: 'ac', icon: 'Wind', fr: 'Climatisation', en: 'Air conditioning' },
  { key: 'heating', icon: 'Flame', fr: 'Chauffage', en: 'Heating' },
  { key: 'washer', icon: 'WashingMachine', fr: 'Lave-linge', en: 'Washer' },
  { key: 'parking', icon: 'Car', fr: 'Parking privé', en: 'Private parking' },
  { key: 'workspace', icon: 'Laptop', fr: 'Espace de travail', en: 'Workspace' },
  { key: 'beach', icon: 'Umbrella', fr: 'Accès plage', en: 'Beach access' },
  { key: 'gym', icon: 'Dumbbell', fr: 'Salle de sport', en: 'Gym' },
  { key: 'breakfast', icon: 'Coffee', fr: 'Petit-déjeuner', en: 'Breakfast' },
  { key: 'fireplace', icon: 'Flame', fr: 'Cheminée', en: 'Fireplace' },
  { key: 'tv', icon: 'Tv', fr: 'Télévision', en: 'TV' },
  { key: 'pets', icon: 'PawPrint', fr: 'Animaux acceptés', en: 'Pets allowed' },
  { key: 'ev', icon: 'Zap', fr: 'Borne de recharge', en: 'EV charger' },
  { key: 'seaView', icon: 'Sailboat', fr: 'Vue mer', en: 'Sea view' },
  { key: 'garden', icon: 'Trees', fr: 'Jardin', en: 'Garden' },
  { key: 'bbq', icon: 'Beef', fr: 'Barbecue', en: 'BBQ' },
  { key: 'crib', icon: 'Baby', fr: 'Lit bébé', en: 'Crib' },
  { key: 'hottub', icon: 'Bath', fr: 'Bain à remous', en: 'Hot tub' },
  { key: 'sauna', icon: 'ThermometerSun', fr: 'Sauna', en: 'Sauna' },
  { key: 'terrace', icon: 'Sun', fr: 'Terrasse', en: 'Terrace' },
  { key: 'security', icon: 'ShieldCheck', fr: 'Sécurité 24/7', en: '24/7 security' },
]

export function amenityLabel(key: string, lang: Lang): string {
  const item = AMENITIES.find((a) => a.key === key)
  return item ? item[lang] : key
}

export interface CategoryInfo {
  key: ListingCategory
  icon: string
  fr: string
  en: string
}

export const CATEGORIES: CategoryInfo[] = [
  { key: 'all', icon: 'Sparkles', fr: 'Tous les séjours', en: 'All stays' },
  { key: 'beach', icon: 'Umbrella', fr: 'Bord de mer', en: 'Beachfront' },
  { key: 'city', icon: 'Building2', fr: 'Villes', en: 'Cities' },
  { key: 'mountain', icon: 'Mountain', fr: 'Montagne', en: 'Mountains' },
  { key: 'design', icon: 'Palette', fr: 'Design', en: 'Design' },
  { key: 'countryside', icon: 'Trees', fr: 'Campagne', en: 'Countryside' },
  { key: 'tropical', icon: 'Palmtree', fr: 'Tropical', en: 'Tropical' },
  { key: 'desert', icon: 'Sun', fr: 'Désert', en: 'Desert' },
]

export const LISTING_TYPES: { key: ListingType; fr: string; en: string }[] = [
  { key: 'apartment', fr: 'Appartement', en: 'Apartment' },
  { key: 'house', fr: 'Maison', en: 'House' },
  { key: 'villa', fr: 'Villa', en: 'Villa' },
  { key: 'loft', fr: 'Loft', en: 'Loft' },
  { key: 'cabin', fr: 'Chalet', en: 'Cabin' },
  { key: 'riad', fr: 'Riad', en: 'Riad' },
  { key: 'treehouse', fr: 'Cabane perchée', en: 'Treehouse' },
  { key: 'boat', fr: 'Bateau', en: 'Boat' },
]

export function typeLabel(type: ListingType, lang: Lang): string {
  return LISTING_TYPES.find((t) => t.key === type)?.[lang] ?? type
}

export interface PaymentInfo {
  id: PaymentMethod
  icon: string
  fr: string
  en: string
  descFr: string
  descEn: string
  badge?: 'recommended' | 'instant'
  regions: string
}

export const PAYMENT_METHODS: PaymentInfo[] = [
  {
    id: 'card',
    icon: 'CreditCard',
    fr: 'Carte bancaire',
    en: 'Credit or debit card',
    descFr: 'Visa, Mastercard, Amex, UnionPay',
    descEn: 'Visa, Mastercard, Amex, UnionPay',
    badge: 'recommended',
    regions: 'Monde',
  },
  {
    id: 'paypal',
    icon: 'Wallet',
    fr: 'PayPal',
    en: 'PayPal',
    descFr: 'Payer avec votre compte PayPal',
    descEn: 'Pay with your PayPal account',
    regions: 'Monde',
  },
  {
    id: 'applepay',
    icon: 'Apple',
    fr: 'Apple Pay',
    en: 'Apple Pay',
    descFr: 'Touch ID ou Face ID',
    descEn: 'Touch ID or Face ID',
    regions: 'Monde',
  },
  {
    id: 'googlepay',
    icon: 'Chrome',
    fr: 'Google Pay',
    en: 'Google Pay',
    descFr: 'Paiement en un geste',
    descEn: 'One-tap payment',
    regions: 'Monde',
  },
  {
    id: 'sepa',
    icon: 'Landmark',
    fr: 'Virement SEPA',
    en: 'SEPA transfer',
    descFr: 'Zone euro — 1 à 2 jours ouvrés',
    descEn: 'Euro area — 1–2 business days',
    regions: 'Europe',
  },
  {
    id: 'pix',
    icon: 'Zap',
    fr: 'Pix',
    en: 'Pix',
    descFr: 'Brésil — paiement instantané',
    descEn: 'Brazil — instant payment',
    badge: 'instant',
    regions: 'Brésil',
  },
  {
    id: 'mpesa',
    icon: 'Smartphone',
    fr: 'M-Pesa',
    en: 'M-Pesa',
    descFr: 'Kenya, Tanzanie, Afrique de l’Est',
    descEn: 'Kenya, Tanzania, East Africa',
    badge: 'instant',
    regions: 'Afrique',
  },
  {
    id: 'upi',
    icon: 'Smartphone',
    fr: 'UPI',
    en: 'UPI',
    descFr: 'Inde — paiement instantané',
    descEn: 'India — instant payment',
    badge: 'instant',
    regions: 'Inde',
  },
]

export function paymentLabel(id: PaymentMethod, lang: Lang): string {
  return PAYMENT_METHODS.find((p) => p.id === id)?.[lang] ?? id
}

export const CANCELLATION_LABELS: Record<CancellationPolicy, { fr: string; en: string; shortFr: string; shortEn: string }> = {
  flexible: { fr: 'Flexible', en: 'Flexible', shortFr: 'Gratuite 48 h avant', shortEn: 'Free 48h before' },
  moderate: { fr: 'Modérée', en: 'Moderate', shortFr: 'Gratuite 5 jours avant', shortEn: 'Free 5 days before' },
  strict: { fr: 'Stricte', en: 'Strict', shortFr: '50 % 7 jours avant', shortEn: '50% 7 days before' },
}

export interface CountryInfo {
  code: string
  fr: string
  en: string
  dial: string
  currencyHint: Currency
  taxRate: number
}

export const COUNTRIES: CountryInfo[] = [
  { code: 'FR', fr: 'France', en: 'France', dial: '+33', currencyHint: 'EUR', taxRate: 0.1 },
  { code: 'US', fr: 'États-Unis', en: 'United States', dial: '+1', currencyHint: 'USD', taxRate: 0.08875 },
  { code: 'GB', fr: 'Royaume-Uni', en: 'United Kingdom', dial: '+44', currencyHint: 'GBP', taxRate: 0.2 },
  { code: 'DE', fr: 'Allemagne', en: 'Germany', dial: '+49', currencyHint: 'EUR', taxRate: 0.19 },
  { code: 'ES', fr: 'Espagne', en: 'Spain', dial: '+34', currencyHint: 'EUR', taxRate: 0.1 },
  { code: 'PT', fr: 'Portugal', en: 'Portugal', dial: '+351', currencyHint: 'EUR', taxRate: 0.06 },
  { code: 'IT', fr: 'Italie', en: 'Italy', dial: '+39', currencyHint: 'EUR', taxRate: 0.1 },
  { code: 'GR', fr: 'Grèce', en: 'Greece', dial: '+30', currencyHint: 'EUR', taxRate: 0.13 },
  { code: 'IS', fr: 'Islande', en: 'Iceland', dial: '+354', currencyHint: 'EUR', taxRate: 0.11 },
  { code: 'MA', fr: 'Maroc', en: 'Morocco', dial: '+212', currencyHint: 'MAD', taxRate: 0.1 },
  { code: 'SN', fr: 'Sénégal', en: 'Senegal', dial: '+221', currencyHint: 'XOF', taxRate: 0.18 },
  { code: 'CI', fr: 'Côte d’Ivoire', en: 'Ivory Coast', dial: '+225', currencyHint: 'XOF', taxRate: 0.18 },
  { code: 'CM', fr: 'Cameroun', en: 'Cameroon', dial: '+237', currencyHint: 'XAF', taxRate: 0.1925 },
  { code: 'CA', fr: 'Canada', en: 'Canada', dial: '+1', currencyHint: 'CAD', taxRate: 0.13 },
  { code: 'MX', fr: 'Mexique', en: 'Mexico', dial: '+52', currencyHint: 'USD', taxRate: 0.16 },
  { code: 'BR', fr: 'Brésil', en: 'Brazil', dial: '+55', currencyHint: 'BRL', taxRate: 0.1 },
  { code: 'AE', fr: 'Émirats arabes unis', en: 'United Arab Emirates', dial: '+971', currencyHint: 'AED', taxRate: 0.05 },
  { code: 'JP', fr: 'Japon', en: 'Japan', dial: '+81', currencyHint: 'JPY', taxRate: 0.1 },
  { code: 'IN', fr: 'Inde', en: 'India', dial: '+91', currencyHint: 'INR', taxRate: 0.12 },
  { code: 'ZA', fr: 'Afrique du Sud', en: 'South Africa', dial: '+27', currencyHint: 'ZAR', taxRate: 0.15 },
  { code: 'ID', fr: 'Indonésie', en: 'Indonesia', dial: '+62', currencyHint: 'USD', taxRate: 0.11 },
  { code: 'KE', fr: 'Kenya', en: 'Kenya', dial: '+254', currencyHint: 'USD', taxRate: 0.16 },
  { code: 'NG', fr: 'Nigéria', en: 'Nigeria', dial: '+234', currencyHint: 'USD', taxRate: 0.075 },
  { code: 'AU', fr: 'Australie', en: 'Australia', dial: '+61', currencyHint: 'USD', taxRate: 0.1 },
  { code: 'NL', fr: 'Pays-Bas', en: 'Netherlands', dial: '+31', currencyHint: 'EUR', taxRate: 0.21 },
  { code: 'BE', fr: 'Belgique', en: 'Belgium', dial: '+32', currencyHint: 'EUR', taxRate: 0.21 },
  { code: 'CH', fr: 'Suisse', en: 'Switzerland', dial: '+41', currencyHint: 'EUR', taxRate: 0.077 },
  { code: 'TR', fr: 'Turquie', en: 'Türkiye', dial: '+90', currencyHint: 'EUR', taxRate: 0.1 },
  { code: 'TH', fr: 'Thaïlande', en: 'Thailand', dial: '+66', currencyHint: 'USD', taxRate: 0.07 },
  { code: 'VN', fr: 'Viêt Nam', en: 'Vietnam', dial: '+84', currencyHint: 'USD', taxRate: 0.1 },
  { code: 'PH', fr: 'Philippines', en: 'Philippines', dial: '+63', currencyHint: 'USD', taxRate: 0.12 },
  { code: 'CO', fr: 'Colombie', en: 'Colombia', dial: '+57', currencyHint: 'USD', taxRate: 0.19 },
  { code: 'AR', fr: 'Argentine', en: 'Argentina', dial: '+54', currencyHint: 'USD', taxRate: 0.21 },
  { code: 'EG', fr: 'Égypte', en: 'Egypt', dial: '+20', currencyHint: 'USD', taxRate: 0.14 },
]

export function countryLabel(code: string, lang: Lang): string {
  return COUNTRIES.find((c) => c.code === code)?.[lang] ?? code
}

export function countryByCode(code: string): CountryInfo | undefined {
  return COUNTRIES.find((c) => c.code === code)
}
