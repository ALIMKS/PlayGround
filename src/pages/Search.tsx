import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Map, SlidersHorizontal, Star, X } from "lucide-react";
import { SearchBar } from "../components/SearchBar";
import { ListingCard } from "../components/ListingCard";
import { MapPanel } from "../components/MapPanel";
import { Dialog } from "../components/Dialog";
import { useStore } from "../store";
import { AMENITIES, CATEGORIES } from "../data";
import { nightsBetween } from "../lib/dates";
import { guestsLabel, nightsLabel } from "../lib/format";
import type { Category, PropertyType } from "../types";

const TYPES: PropertyType[] = [
  "Villa",
  "Chalet",
  "Loft",
  "Riad",
  "Appartement",
  "Cabane",
  "Maison",
];

const SORTS = [
  { value: "recommended", label: "Recommandés" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "rating", label: "Mieux notés" },
];

const TOP_AMENITIES = ["pool", "wifi", "kitchen", "parking", "ac", "fireplace", "seaview", "pets"];

export function Search() {
  const { listings } = useStore();
  const [params, setParams] = useSearchParams();

  const destination = params.get("destination") ?? "";
  const checkIn = params.get("checkIn") ?? "";
  const checkOut = params.get("checkOut") ?? "";
  const guests = Number(params.get("guests") ?? 2);
  const category = (params.get("category") as Category | null) ?? "Tout";

  const [maxPrice, setMaxPrice] = useState(700);
  const [types, setTypes] = useState<PropertyType[]>([]);
  const [bedrooms, setBedrooms] = useState(0);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [instantOnly, setInstantOnly] = useState(false);
  const [sort, setSort] = useState("recommended");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileMap, setMobileMap] = useState(false);

  const nights = nightsBetween(checkIn, checkOut);

  const results = useMemo(() => {
    const needle = destination.trim().toLowerCase();
    const filtered = listings.filter((listing) => {
      if (!listing.active) return false;
      if (needle) {
        const haystack = `${listing.city} ${listing.region} ${listing.country} ${listing.title}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (category !== "Tout" && !listing.categories.includes(category)) return false;
      if (listing.pricePerNight > maxPrice) return false;
      if (types.length > 0 && !types.includes(listing.type)) return false;
      if (listing.bedrooms < bedrooms) return false;
      if (listing.rating < minRating) return false;
      if (instantOnly && !listing.instantBook) return false;
      if (amenities.length > 0 && !amenities.every((amenity) => listing.amenities.includes(amenity))) {
        return false;
      }
      if (guests > 0 && listing.guests < guests) return false;
      return true;
    });

    switch (sort) {
      case "price-asc":
        return filtered.sort((a, b) => a.pricePerNight - b.pricePerNight);
      case "price-desc":
        return filtered.sort((a, b) => b.pricePerNight - a.pricePerNight);
      case "rating":
        return filtered.sort((a, b) => b.rating - a.rating);
      default:
        return filtered.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
  }, [
    listings,
    destination,
    category,
    maxPrice,
    types,
    bedrooms,
    amenities,
    minRating,
    instantOnly,
    guests,
    sort,
  ]);

  const activeFilters =
    (maxPrice < 700 ? 1 : 0) +
    types.length +
    (bedrooms > 0 ? 1 : 0) +
    amenities.length +
    (minRating > 0 ? 1 : 0) +
    (instantOnly ? 1 : 0);

  const resetFilters = () => {
    setMaxPrice(700);
    setTypes([]);
    setBedrooms(0);
    setAmenities([]);
    setMinRating(0);
    setInstantOnly(false);
  };

  const setCategory = (next: Category) => {
    const updated = new URLSearchParams(params);
    if (next === "Tout") updated.delete("category");
    else updated.set("category", next);
    setParams(updated, { replace: true });
  };

  const toggleType = (type: PropertyType) => {
    setTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type],
    );
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((item) => item !== amenity)
        : [...prev, amenity],
    );
  };

  const clearAll = () => {
    resetFilters();
    setParams(new URLSearchParams(), { replace: true });
  };

  return (
    <div className="search-page">
      <div className="search-top">
        <div className="container">
          <SearchBar
            variant="compact"
            initial={{ destination, checkIn, checkOut, guests }}
          />
        </div>
      </div>

      <div className="container search-shell">
        <div className="search-heading">
          <div>
            <p className="eyebrow">
              {destination ? "Votre recherche" : "Tous les séjours"}
            </p>
            <h1>
              {destination
                ? `${destination}, ${results.length} ${results.length > 1 ? "logements" : "logement"}`
                : `${results.length} logements à découvrir`}
            </h1>
            <p className="search-summary">
              {checkIn && checkOut
                ? `${nightsLabel(nights)} · ${guestsLabel(guests)} · du ${new Intl.DateTimeFormat(
                    "fr-FR",
                    { day: "numeric", month: "long" },
                  ).format(new Date(`${checkIn}T12:00:00`))} au ${new Intl.DateTimeFormat(
                    "fr-FR",
                    { day: "numeric", month: "long" },
                  ).format(new Date(`${checkOut}T12:00:00`))}`
                : "Ajoutez des dates pour affiner votre recherche"}
            </p>
          </div>
        </div>

        <div className="filter-bar">
          <div className="filter-categories">
            {CATEGORIES.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`chip${category === item.label ? " is-active" : ""}`}
                onClick={() => setCategory(item.label)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="filter-actions">
            <button
              type="button"
              className="btn btn--outline btn--small"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal size={15} />
              Filtres
              {activeFilters > 0 && <span className="filter-count">{activeFilters}</span>}
            </button>
            <label className="sort-select">
              <span className="sr-only">Trier par</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                {SORTS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={`btn btn--outline btn--small map-toggle${mobileMap ? " is-active" : ""}`}
              onClick={() => setMobileMap((open) => !open)}
            >
              <Map size={15} /> Carte
            </button>
          </div>
        </div>

        {activeFilters > 0 && (
          <div className="active-filters">
            {maxPrice < 700 && (
              <FilterPill
                label={`Jusqu'à ${maxPrice} €`}
                onRemove={() => setMaxPrice(700)}
              />
            )}
            {types.map((type) => (
              <FilterPill key={type} label={type} onRemove={() => toggleType(type)} />
            ))}
            {bedrooms > 0 && (
              <FilterPill
                label={`${bedrooms}+ chambres`}
                onRemove={() => setBedrooms(0)}
              />
            )}
            {amenities.map((amenity) => (
              <FilterPill
                key={amenity}
                label={AMENITIES[amenity]?.label ?? amenity}
                onRemove={() => toggleAmenity(amenity)}
              />
            ))}
            {minRating > 0 && (
              <FilterPill label={`${minRating}+ étoiles`} onRemove={() => setMinRating(0)} />
            )}
            {instantOnly && (
              <FilterPill
                label="Réservation instantanée"
                onRemove={() => setInstantOnly(false)}
              />
            )}
            <button type="button" className="link-underline" onClick={resetFilters}>
              Tout effacer
            </button>
          </div>
        )}

        <div className={`search-layout${mobileMap ? " show-map" : ""}`}>
          <div className="results">
            {results.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">
                  <Map size={26} />
                </span>
                <h2>Aucun logement ne correspond</h2>
                <p>
                  Essayez d'élargir votre budget, de retirer un filtre ou de changer de
                  destination.
                </p>
                <button type="button" className="btn btn--primary" onClick={clearAll}>
                  Réinitialiser la recherche
                </button>
              </div>
            ) : (
              <div className="listing-grid listing-grid--2">
                {results.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    highlighted={activeId === listing.id}
                    onHover={setActiveId}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="map-column">
            <MapPanel
              listings={results}
              activeId={activeId}
              onSelect={(id) => setActiveId((current) => (current === id ? null : id))}
            />
          </aside>
        </div>
      </div>

      <Dialog
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtres"
        wide
      >
        <div className="filters-body">
          <section>
            <h3>Budget par nuit</h3>
            <div className="price-range">
              <span>100 €</span>
              <input
                type="range"
                min={100}
                max={700}
                step={25}
                value={maxPrice}
                onChange={(event) => setMaxPrice(Number(event.target.value))}
                aria-label="Prix maximum par nuit"
              />
              <span className="price-range-value">jusqu'à {maxPrice} €</span>
            </div>
          </section>

          <section>
            <h3>Type de logement</h3>
            <div className="checkbox-grid">
              {TYPES.map((type) => (
                <label key={type} className="check">
                  <input
                    type="checkbox"
                    checked={types.includes(type)}
                    onChange={() => toggleType(type)}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </section>

          <section>
            <h3>Chambres</h3>
            <div className="segmented">
              {[0, 1, 2, 3, 4].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={bedrooms === value ? "is-active" : ""}
                  onClick={() => setBedrooms(value)}
                >
                  {value === 0 ? "Peu importe" : `${value}+`}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3>Équipements</h3>
            <div className="checkbox-grid">
              {TOP_AMENITIES.map((amenity) => (
                <label key={amenity} className="check">
                  <input
                    type="checkbox"
                    checked={amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                  />
                  <span>{AMENITIES[amenity]?.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section>
            <h3>Note minimum</h3>
            <div className="segmented">
              {[0, 4.8, 4.9].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={minRating === value ? "is-active" : ""}
                  onClick={() => setMinRating(value)}
                >
                  {value === 0 ? "Toutes" : (
                    <>
                      {value.toString().replace(".", ",")} <Star size={12} fill="currentColor" />
                    </>
                  )}
                </button>
              ))}
            </div>
          </section>

          <label className="switch-row">
            <span>
              <strong>Réservation instantanée</strong>
              <em>Uniquement les logements réservables sans confirmation.</em>
            </span>
            <input
              type="checkbox"
              checked={instantOnly}
              onChange={(event) => setInstantOnly(event.target.checked)}
            />
          </label>
        </div>

        <div className="filters-foot">
          <button type="button" className="link-underline" onClick={resetFilters}>
            Tout effacer
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setFiltersOpen(false)}
          >
            Afficher {results.length} {results.length > 1 ? "logements" : "logement"}
          </button>
        </div>
      </Dialog>
    </div>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="filter-pill">
      {label}
      <button type="button" onClick={onRemove} aria-label={`Retirer le filtre ${label}`}>
        <X size={12} />
      </button>
    </span>
  );
}
