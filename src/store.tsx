import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CURRENT_USER,
  LISTINGS,
  SEED_BOOKINGS,
  SEED_CONVERSATIONS,
} from "./data";
import { bookingCode } from "./lib/format";
import { isoDay, todayISO } from "./lib/dates";
import type {
  Booking,
  Conversation,
  CurrentUser,
  Listing,
  PropertyType,
} from "./types";

const STORAGE_KEY = "sejour-state-v3";

interface PersistedState {
  listings: Listing[];
  bookings: Booking[];
  favorites: string[];
  conversations: Conversation[];
  user: CurrentUser;
}

interface NewBooking {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  total: number;
}

export interface NewListingInput {
  title: string;
  city: string;
  country: string;
  type: PropertyType;
  pricePerNight: number;
  guests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  photo: string;
  description: string;
}

interface StoreValue {
  listings: Listing[];
  bookings: Booking[];
  favorites: string[];
  conversations: Conversation[];
  user: CurrentUser;
  getListing: (id: string) => Listing | undefined;
  toggleFavorite: (id: string) => boolean;
  isFavorite: (id: string) => boolean;
  createBooking: (input: NewBooking) => Booking;
  cancelBooking: (id: string) => void;
  addListing: (input: NewListingInput) => Listing;
  toggleListingActive: (id: string) => void;
  startConversation: (hostId: string, listingId: string) => string;
  sendMessage: (conversationId: string, text: string) => void;
  markConversationRead: (conversationId: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const COORDS: Record<string, [number, number]> = {
  Paris: [48.859, 2.3622],
  "Saint-Tropez": [43.2677, 6.6407],
  Chamonix: [45.9247, 6.872],
  Annecy: [45.8992, 6.1294],
  Gordes: [43.9113, 5.2002],
  Amsterdam: [52.376, 4.883],
  Marrakech: [31.6295, -7.9811],
  "Oia, Santorin": [36.4618, 25.3753],
  "Ubud, Bali": [-8.5069, 115.2625],
  Malibu: [34.0259, -118.7798],
  Lisbonne: [38.7116, -9.1305],
  "Mont-Tremblant": [46.1184, -74.5967],
};

function initialState(): PersistedState {
  return {
    listings: LISTINGS,
    bookings: SEED_BOOKINGS,
    favorites: ["cave-santorini", "loft-canal"],
    conversations: SEED_CONVERSATIONS,
    user: CURRENT_USER,
  };
}

function loadState(): PersistedState {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (!parsed.listings?.length || !parsed.user) return initialState();
    return {
      listings: parsed.listings,
      bookings: parsed.bookings ?? SEED_BOOKINGS,
      favorites: parsed.favorites ?? [],
      conversations: parsed.conversations ?? SEED_CONVERSATIONS,
      user: parsed.user,
    };
  } catch {
    return initialState();
  }
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 42);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota exceeded — the demo keeps working in memory */
    }
  }, [state]);

  const getListing = useCallback(
    (id: string) => state.listings.find((listing) => listing.id === id),
    [state.listings],
  );

  const toggleFavorite = useCallback((id: string) => {
    const current = stateRef.current;
    const isSaved = current.favorites.includes(id);
    setState((prev) => ({
      ...prev,
      favorites: isSaved
        ? prev.favorites.filter((fav) => fav !== id)
        : [id, ...prev.favorites],
    }));
    return !isSaved;
  }, []);

  const isFavorite = useCallback(
    (id: string) => state.favorites.includes(id),
    [state.favorites],
  );

  const createBooking = useCallback((input: NewBooking) => {
    const booking: Booking = {
      id: bookingCode(),
      listingId: input.listingId,
      guestId: stateRef.current.user.id,
      guestName: stateRef.current.user.name,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guests: input.guests,
      nights: input.nights,
      total: input.total,
      status: "confirmed",
      createdAt: todayISO(),
    };
    setState((prev) => ({ ...prev, bookings: [booking, ...prev.bookings] }));
    return booking;
  }, []);

  const cancelBooking = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((booking) =>
        booking.id === id ? { ...booking, status: "cancelled" } : booking,
      ),
    }));
  }, []);

  const addListing = useCallback((input: NewListingInput) => {
    const user = stateRef.current.user;
    const base = slugify(input.title) || "logement";
    const id = `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
    const [lat, lng] = COORDS[input.city] ?? [46.6, 2.3];
    const listing: Listing = {
      id,
      title: input.title.trim(),
      subtitle: input.description.split(".")[0]?.trim() || "Un séjour à votre image",
      city: input.city.trim(),
      region: "",
      country: input.country.trim(),
      type: input.type,
      categories: ["Tout"],
      pricePerNight: input.pricePerNight,
      cleaningFee: Math.round(input.pricePerNight * 0.2),
      rating: 0,
      reviewCount: 0,
      guests: input.guests,
      bedrooms: input.bedrooms,
      beds: input.beds,
      baths: input.baths,
      hostId: user.id,
      photos: [input.photo],
      amenities: ["wifi", "kitchen", "heating"],
      description: input.description
        .split("\n")
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
      lat,
      lng,
      featured: false,
      instantBook: true,
      active: true,
    };
    setState((prev) => ({ ...prev, listings: [listing, ...prev.listings] }));
    return listing;
  }, []);

  const toggleListingActive = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      listings: prev.listings.map((listing) =>
        listing.id === id ? { ...listing, active: !listing.active } : listing,
      ),
    }));
  }, []);

  const startConversation = useCallback((hostId: string, listingId: string) => {
    const existing = stateRef.current.conversations.find(
      (conversation) => conversation.id === `c-${listingId}`,
    );
    if (existing) return existing.id;

    const listing = stateRef.current.listings.find((item) => item.id === listingId);
    const host = stateRef.current.user.id === hostId
      ? { name: "Voyageur", initials: "V" }
      : { name: hostName(hostId), initials: hostInitials(hostId) };
    const id = `c-${listingId}`;
    const conversation: Conversation = {
      id,
      personName: host.name,
      initials: host.initials,
      listingId,
      unread: 0,
      messages: [
        {
          id: `${id}-intro`,
          from: "me",
          text: `Bonjour, je vous contacte au sujet de « ${listing?.title ?? "votre logement"} ».`,
          at: `${todayISO()}T10:00`,
        },
      ],
    };
    setState((prev) => ({
      ...prev,
      conversations: [conversation, ...prev.conversations],
    }));
    return id;
  }, []);

  const sendMessage = useCallback((conversationId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const now = new Date();
    const at = `${isoDay(now)}T${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes(),
    ).padStart(2, "0")}`;
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: [
                ...conversation.messages,
                { id: `m-${Date.now()}`, from: "me", text: trimmed, at },
              ],
            }
          : conversation,
      ),
    }));

    const replies = [
      "Avec plaisir, je regarde ça et je reviens vers vous dans la journée.",
      "Merci pour votre message ! Oui, c'est tout à fait possible.",
      "Bonjour, merci beaucoup. Je vous confirme que le logement est prêt à vous accueillir.",
    ];
    window.setTimeout(() => {
      const reply = replies[Math.floor(Math.random() * replies.length)];
      setState((prev) => ({
        ...prev,
        conversations: prev.conversations.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: [
                  ...conversation.messages,
                  {
                    id: `m-${Date.now()}-r`,
                    from: "them",
                    text: reply,
                    at,
                  },
                ],
              }
            : conversation,
        ),
      }));
    }, 1600);
  }, []);

  const markConversationRead = useCallback((conversationId: string) => {
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, unread: 0 }
          : conversation,
      ),
    }));
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      getListing,
      toggleFavorite,
      isFavorite,
      createBooking,
      cancelBooking,
      addListing,
      toggleListingActive,
      startConversation,
      sendMessage,
      markConversationRead,
    }),
    [
      state,
      getListing,
      toggleFavorite,
      isFavorite,
      createBooking,
      cancelBooking,
      addListing,
      toggleListingActive,
      startConversation,
      sendMessage,
      markConversationRead,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function hostName(hostId: string): string {
  const names: Record<string, string> = {
    h1: "Claire Moreau",
    h2: "Jasper van Dijk",
    h3: "Yasmine Benali",
    h4: "Théo Marchand",
    h5: "Lucia Ferreira",
    h6: "Maïa Sutanto",
    h7: "Noah Ellis",
    u1: "Camille Laurent",
  };
  return names[hostId] ?? "Votre hôte";
}

function hostInitials(hostId: string): string {
  return hostName(hostId)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside StoreProvider");
  return context;
}
