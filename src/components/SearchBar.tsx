import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Search, Users } from "lucide-react";
import { DateField } from "./DateField";
import { LISTINGS } from "../data";
import { addDays, isoDay, todayISO } from "../lib/dates";
import type { SearchQuery } from "../types";

interface SearchBarProps {
  initial?: Partial<SearchQuery>;
  variant?: "hero" | "compact";
}

const DESTINATIONS = Array.from(
  new Map(
    LISTINGS.map((listing) => [
      listing.city,
      { city: listing.city, country: listing.country },
    ]),
  ).values(),
);

export function SearchBar({ initial, variant = "hero" }: SearchBarProps) {
  const navigate = useNavigate();
  const [destination, setDestination] = useState(initial?.destination ?? "");
  const [checkIn, setCheckIn] = useState(initial?.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(initial?.checkOut ?? "");
  const [guests, setGuests] = useState(initial?.guests ?? 2);
  const [showDestinations, setShowDestinations] = useState(false);
  const [showGuests, setShowGuests] = useState(false);
  const rootRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setDestination(initial?.destination ?? "");
    setCheckIn(initial?.checkIn ?? "");
    setCheckOut(initial?.checkOut ?? "");
    setGuests(initial?.guests ?? 2);
  }, [initial?.destination, initial?.checkIn, initial?.checkOut, initial?.guests]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setShowDestinations(false);
        setShowGuests(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const matches = useMemo(() => {
    const needle = destination.trim().toLowerCase();
    const pool = needle
      ? DESTINATIONS.filter(
          (item) =>
            item.city.toLowerCase().includes(needle) ||
            item.country.toLowerCase().includes(needle),
        )
      : DESTINATIONS;
    return pool.slice(0, 6);
  }, [destination]);

  const updateCheckIn = (value: string) => {
    setCheckIn(value);
    if (value && (!checkOut || checkOut <= value)) {
      setCheckOut(isoDay(addDays(new Date(`${value}T12:00:00`), 2)));
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set("destination", destination.trim());
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("guests", String(guests));
    navigate(`/search?${params.toString()}`);
    setShowDestinations(false);
    setShowGuests(false);
  };

  const minCheckOut = checkIn
    ? isoDay(addDays(new Date(`${checkIn}T12:00:00`), 1))
    : isoDay(addDays(new Date(), 1));

  return (
    <form
      ref={rootRef}
      className={`searchbar searchbar--${variant}`}
      onSubmit={submit}
      role="search"
      aria-label="Rechercher un séjour"
    >
      <div className="search-field search-field--destination">
        <label htmlFor={`dest-${variant}`}>Destination</label>
        <input
          id={`dest-${variant}`}
          value={destination}
          onChange={(event) => {
            setDestination(event.target.value);
            setShowDestinations(true);
          }}
          onFocus={() => {
            setShowDestinations(true);
            setShowGuests(false);
          }}
          placeholder="Où partez-vous ?"
          autoComplete="off"
        />
        {showDestinations && matches.length > 0 && (
          <div className="popover destination-popover">
            <p className="popover-label">Destinations populaires</p>
            {matches.map((item) => (
              <button
                type="button"
                key={item.city}
                className="destination-option"
                onClick={() => {
                  setDestination(item.city);
                  setShowDestinations(false);
                }}
              >
                <span className="destination-icon">
                  <Search size={15} />
                </span>
                <span>
                  <strong>{item.city}</strong>
                  <em>{item.country}</em>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="search-field search-field--date">
        <span className="field-label">Arrivée</span>
        <DateField
          value={checkIn}
          onChange={updateCheckIn}
          min={todayISO()}
          placeholder="Choisir"
          ariaLabel="Date d'arrivée"
          compact
        />
      </div>

      <div className="search-field search-field--date">
        <span className="field-label">Départ</span>
        <DateField
          value={checkOut}
          onChange={setCheckOut}
          min={minCheckOut}
          placeholder="Choisir"
          align="right"
          ariaLabel="Date de départ"
          compact
        />
      </div>

      <div className="search-field search-field--guests">
        <span className="field-label">
          <Users size={13} aria-hidden="true" /> Voyageurs
        </span>
        <button
          type="button"
          className="guests-trigger"
          onClick={() => {
            setShowGuests((open) => !open);
            setShowDestinations(false);
          }}
          aria-expanded={showGuests}
        >
          {guests} {guests > 1 ? "voyageurs" : "voyageur"}
        </button>
        {showGuests && (
          <div className="popover guests-popover">
            <div className="guest-row">
              <div>
                <strong>Voyageurs</strong>
                <em>Adultes et enfants</em>
              </div>
              <div className="stepper">
                <button
                  type="button"
                  onClick={() => setGuests((value) => Math.max(1, value - 1))}
                  disabled={guests <= 1}
                  aria-label="Retirer un voyageur"
                >
                  <Minus size={14} />
                </button>
                <span>{guests}</span>
                <button
                  type="button"
                  onClick={() => setGuests((value) => Math.min(10, value + 1))}
                  disabled={guests >= 10}
                  aria-label="Ajouter un voyageur"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <p className="popover-note">10 voyageurs maximum pour cette recherche.</p>
            <button
              type="button"
              className="btn btn--ghost btn--small btn--block"
              onClick={() => setShowGuests(false)}
            >
              Terminé
            </button>
          </div>
        )}
      </div>

      <button type="submit" className="search-submit" aria-label="Rechercher">
        <Search size={18} strokeWidth={2.2} />
        <span>Rechercher</span>
      </button>
    </form>
  );
}
