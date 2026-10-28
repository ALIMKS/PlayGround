import { Link } from "react-router-dom";
import { Heart, Star, Zap } from "lucide-react";
import type { Listing } from "../types";
import { useStore } from "../store";
import { useToast } from "./Toast";
import { eur, rating as formatRating } from "../lib/format";

interface ListingCardProps {
  listing: Listing;
  compact?: boolean;
  onHover?: (id: string | null) => void;
  highlighted?: boolean;
}

export function ListingCard({ listing, compact, onHover, highlighted }: ListingCardProps) {
  const { isFavorite, toggleFavorite } = useStore();
  const toast = useToast();
  const saved = isFavorite(listing.id);

  return (
    <article
      className={`listing-card${compact ? " listing-card--compact" : ""}${
        highlighted ? " is-highlighted" : ""
      }`}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <Link to={`/listing/${listing.id}`} className="card-media" aria-label={listing.title}>
        <img src={listing.photos[0]} alt={listing.title} loading="lazy" />
        {listing.badge && <span className="card-badge">{listing.badge}</span>}
        {listing.instantBook && !listing.badge && (
          <span className="card-badge card-badge--light">
            <Zap size={11} /> Instantané
          </span>
        )}
        <button
          type="button"
          className={`heart-btn${saved ? " is-saved" : ""}`}
          onClick={(event) => {
            event.preventDefault();
            const added = toggleFavorite(listing.id);
            toast.show(
              added ? `${listing.title} ajouté aux favoris` : `${listing.title} retiré des favoris`,
              "favorite",
            );
          }}
          aria-label={saved ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-pressed={saved}
        >
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </Link>
      <div className="card-body">
        <div className="card-title-row">
          <h3>
            <Link to={`/listing/${listing.id}`}>{listing.title}</Link>
          </h3>
          {listing.reviewCount > 0 ? (
            <span className="rating-inline">
              <Star size={13} fill="currentColor" aria-hidden="true" />
              {formatRating(listing.rating)}
            </span>
          ) : (
            <span className="rating-inline rating-inline--new">Nouveau</span>
          )}
        </div>
        <p className="card-place">
          {listing.city}
          {listing.country ? `, ${listing.country}` : ""}
        </p>
        {!compact && (
          <p className="card-meta">
            {listing.type} · {listing.guests} voyageurs · {listing.bedrooms}{" "}
            {listing.bedrooms > 1 ? "chambres" : "chambre"}
          </p>
        )}
        <p className="card-price">
          <strong>{eur(listing.pricePerNight)}</strong> <span>/ nuit</span>
        </p>
      </div>
    </article>
  );
}
