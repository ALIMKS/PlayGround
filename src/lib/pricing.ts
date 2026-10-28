import type { Listing, PriceQuote } from "../types";
import { nightsBetween } from "./dates";

export const SERVICE_RATE = 0.12;
export const TOURIST_TAX_PER_NIGHT = 2.4;

export function quote(listing: Listing, checkIn: string, checkOut: string): PriceQuote {
  const nights = nightsBetween(checkIn, checkOut);
  const subtotal = nights * listing.pricePerNight;
  const cleaning = nights > 0 ? listing.cleaningFee : 0;
  const service = Math.round(subtotal * SERVICE_RATE);
  const taxes = Math.round(nights * TOURIST_TAX_PER_NIGHT);
  return {
    nights,
    subtotal,
    cleaning,
    service,
    taxes,
    total: subtotal + cleaning + service + taxes,
  };
}
