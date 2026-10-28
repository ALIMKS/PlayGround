export type PropertyType =
  | "Villa"
  | "Chalet"
  | "Loft"
  | "Riad"
  | "Appartement"
  | "Cabane"
  | "Maison";

export type Category =
  | "Tout"
  | "Villas"
  | "Cabines"
  | "Lofts"
  | "Riads"
  | "Bord de mer"
  | "Campagne"
  | "Design";

export interface Host {
  id: string;
  name: string;
  initials: string;
  joined: string;
  bio: string;
  superhost: boolean;
  responseRate: number;
  responseTime: string;
  languages: string[];
}

export interface Listing {
  id: string;
  title: string;
  subtitle: string;
  city: string;
  region: string;
  country: string;
  type: PropertyType;
  categories: Category[];
  pricePerNight: number;
  cleaningFee: number;
  rating: number;
  reviewCount: number;
  guests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  hostId: string;
  photos: string[];
  amenities: string[];
  description: string[];
  lat: number;
  lng: number;
  featured: boolean;
  badge?: string;
  instantBook: boolean;
  active: boolean;
}

export interface Review {
  id: string;
  listingId: string;
  author: string;
  initials: string;
  date: string;
  rating: number;
  text: string;
}

export type BookingStatus = "confirmed" | "completed" | "cancelled";

export interface Booking {
  id: string;
  listingId: string;
  guestId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  total: number;
  status: BookingStatus;
  createdAt: string;
}

export interface Message {
  id: string;
  from: "me" | "them";
  text: string;
  at: string;
}

export interface Conversation {
  id: string;
  personName: string;
  initials: string;
  listingId: string;
  messages: Message[];
  unread: number;
}

export interface CurrentUser {
  id: string;
  name: string;
  firstName: string;
  initials: string;
  email: string;
  since: string;
  isHost: boolean;
}

export interface SearchQuery {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

export interface PriceQuote {
  nights: number;
  subtotal: number;
  cleaning: number;
  service: number;
  taxes: number;
  total: number;
}
