import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Heart,
  Image as ImageIcon,
  Languages,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";
import { useStore } from "../store";
import { useToast } from "../components/Toast";
import { AMENITIES, HOSTS, REVIEWS } from "../data";
import { AmenityIcon } from "../components/AmenityIcon";
import { Dialog } from "../components/Dialog";
import { DateField } from "../components/DateField";
import { MapPanel } from "../components/MapPanel";
import { quote } from "../lib/pricing";
import { eur, nightsLabel, rating as formatRating } from "../lib/format";
import { addDays, formatLongDay, isoDay, todayISO } from "../lib/dates";

export function ListingDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { getListing, isFavorite, toggleFavorite, startConversation } = useStore();
  const toast = useToast();
  const listing = getListing(id);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [reviewsOpen, setReviewsOpen] = useState(false);

  useEffect(() => {
    if (listing && guests > listing.guests) setGuests(listing.guests);
  }, [listing, guests]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        setLightbox((index) =>
          index === null ? null : (index + 1) % (listing?.photos.length ?? 1),
        );
      }
      if (event.key === "ArrowLeft") {
        setLightbox((index) =>
          index === null
            ? null
            : (index - 1 + (listing?.photos.length ?? 1)) % (listing?.photos.length ?? 1),
        );
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox, listing?.photos.length]);

  if (!listing) {
    return (
      <div className="container empty-state empty-state--page">
        <h1>Ce logement n'existe pas</h1>
        <p>L'annonce a peut-être été retirée par son hôte.</p>
        <Link to="/search" className="btn btn--primary">
          Voir tous les séjours
        </Link>
      </div>
    );
  }

  const host = HOSTS[listing.hostId] ?? HOSTS.u1;
  const saved = isFavorite(listing.id);
  const reviews = REVIEWS.filter((review) => review.listingId === listing.id);
  const price = quote(listing, checkIn, checkOut);
  const hasDates = price.nights > 0;
  const photos = listing.photos.slice(0, 5);

  const updateCheckIn = (value: string) => {
    setCheckIn(value);
    if (value && (!checkOut || checkOut <= value)) {
      setCheckOut(isoDay(addDays(new Date(`${value}T12:00:00`), 3)));
    }
  };

  const reserve = () => {
    if (!hasDates) {
      toast.show("Choisissez vos dates d'arrivée et de départ.", "info");
      document.getElementById("booking-dates")?.scrollIntoView({ block: "center" });
      return;
    }
    navigate(
      `/checkout/${listing.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`,
    );
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.show("Lien de l'annonce copié.");
    } catch {
      toast.show("Impossible de copier le lien.", "info");
    }
  };

  const ratingBars = [
    ["Propreté", 0.02],
    ["Communication", 0.04],
    ["Arrivée", 0.0],
    ["Emplacement", 0.03],
    ["Rapport qualité/prix", -0.06],
  ] as const;

  return (
    <div className="listing-page">
      <div className="container">
        <nav className="breadcrumb" aria-label="Fil d'Ariane">
          <Link to="/">Explorer</Link>
          <span>/</span>
          <Link to={`/search?destination=${encodeURIComponent(listing.city)}`}>
            {listing.city}
          </Link>
          <span>/</span>
          <span>{listing.title}</span>
        </nav>

        <header className="listing-head">
          <div>
            <h1>{listing.title}</h1>
            <p className="listing-subtitle-row">
              <span className="rating-inline">
                <Star size={14} fill="currentColor" /> {formatRating(listing.rating)}
              </span>
              <span className="dot-sep">·</span>
              <span>{listing.reviewCount} avis</span>
              {host.superhost && (
                <>
                  <span className="dot-sep">·</span>
                  <span className="superhost-inline">
                    <BadgeCheck size={14} /> Superhôte
                  </span>
                </>
              )}
              <span className="dot-sep">·</span>
              <span className="listing-place">
                <MapPin size={14} /> {listing.city}, {listing.country}
              </span>
            </p>
          </div>
          <div className="listing-actions">
            <button type="button" className="btn btn--ghost btn--small" onClick={share}>
              <Share2 size={16} /> Partager
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => {
                const added = toggleFavorite(listing.id);
                toast.show(
                  added ? "Ajouté à vos favoris" : "Retiré de vos favoris",
                  "favorite",
                );
              }}
            >
              <Heart size={16} fill={saved ? "currentColor" : "none"} />
              {saved ? "Enregistré" : "Enregistrer"}
            </button>
          </div>
        </header>

        <div className="gallery">
          <button
            type="button"
            className="gallery-main"
            onClick={() => setLightbox(0)}
            aria-label="Ouvrir la galerie"
          >
            <img src={photos[0]} alt={listing.title} />
          </button>
          {photos.slice(1, 5).map((photo, index) => (
            <button
              type="button"
              key={photo + index}
              className="gallery-thumb"
              onClick={() => setLightbox(index + 1)}
              aria-label={`Voir la photo ${index + 2}`}
            >
              <img src={photo} alt="" loading="lazy" />
            </button>
          ))}
          <button
            type="button"
            className="gallery-more"
            onClick={() => setLightbox(0)}
          >
            <ImageIcon size={15} /> Voir les {listing.photos.length} photos
          </button>
        </div>

        <div className="listing-body">
          <div className="listing-main">
            <div className="listing-intro">
              <div>
                <h2>
                  {listing.type} entier · chez {host.name.split(" ")[0]}
                </h2>
                <p>
                  {listing.guests} voyageurs · {listing.bedrooms}{" "}
                  {listing.bedrooms > 1 ? "chambres" : "chambre"} · {listing.beds} lits ·{" "}
                  {listing.baths} {listing.baths > 1 ? "salles de bain" : "salle de bain"}
                </p>
              </div>
              {listing.instantBook && (
                <span className="instant-tag">
                  <Zap size={14} /> Réservation instantanée
                </span>
              )}
            </div>

            <div className="host-strip">
              <span className="avatar avatar--lg">{host.initials}</span>
              <div>
                <strong>
                  Hôte : {host.name}
                  {host.superhost && <BadgeCheck size={15} className="superhost-icon" />}
                </strong>
                <em>
                  Membre depuis {host.joined} · {host.responseRate} % de réponse ·{" "}
                  {host.responseTime}
                </em>
              </div>
            </div>

            <div className="highlights">
              <div className="highlight">
                <Sparkles size={20} />
                <div>
                  <strong>Un lieu qui a du caractère</strong>
                  <p>{listing.subtitle}</p>
                </div>
              </div>
              <div className="highlight">
                <ShieldCheck size={20} />
                <div>
                  <strong>Annulation flexible</strong>
                  <p>Remboursement intégral jusqu'à 7 jours avant l'arrivée.</p>
                </div>
              </div>
              <div className="highlight">
                <MessageCircle size={20} />
                <div>
                  <strong>Un hôte qui répond</strong>
                  <p>
                    {host.name.split(" ")[0]} répond généralement {host.responseTime}.
                  </p>
                </div>
              </div>
            </div>

            <div className="listing-section">
              <h2>À propos de ce logement</h2>
              {listing.description.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>

            <div className="listing-section">
              <h2>Ce que propose ce logement</h2>
              <div className="amenities-grid">
                {listing.amenities.map((amenity) => (
                  <div key={amenity} className="amenity">
                    <AmenityIcon name={amenity} />
                    <span>{AMENITIES[amenity]?.label ?? amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="listing-section">
              <div className="reviews-head">
                <h2>
                  <Star size={18} fill="currentColor" /> {formatRating(listing.rating)} ·{" "}
                  {listing.reviewCount} avis
                </h2>
              </div>
              <div className="rating-bars">
                {ratingBars.map(([label, offset]) => {
                  const value = Math.min(5, Math.max(4.4, listing.rating + offset));
                  return (
                    <div className="rating-bar" key={label}>
                      <span>{label}</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${(value / 5) * 100}%` }} />
                      </div>
                      <strong>{formatRating(value)}</strong>
                    </div>
                  );
                })}
              </div>

              <div className="review-grid">
                {reviews.slice(0, 3).map((review) => (
                  <article key={review.id} className="review-card">
                    <header>
                      <span className="avatar avatar--sm">{review.initials}</span>
                      <div>
                        <strong>{review.author}</strong>
                        <em>{review.date}</em>
                      </div>
                      <span className="review-stars">
                        {Array.from({ length: review.rating }).map((_, index) => (
                          <Star key={index} size={12} fill="currentColor" />
                        ))}
                      </span>
                    </header>
                    <p>{review.text}</p>
                  </article>
                ))}
              </div>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setReviewsOpen(true)}
              >
                Voir les {listing.reviewCount} avis
              </button>
            </div>

            <div className="listing-section">
              <h2>Où vous serez</h2>
              <p className="muted">
                {listing.city}
                {listing.region ? `, ${listing.region}` : ""} ·{" "}
                {listing.country}
              </p>
              <MapPanel
                listings={[listing]}
                mode="detail"
                city={listing.city}
              />
              <p className="location-note">
                <MapPin size={15} /> L'adresse exacte vous sera communiquée après la
                réservation.
              </p>
            </div>

            <div className="listing-section host-section">
              <div className="host-section-head">
                <span className="avatar avatar--xl">{host.initials}</span>
                <div>
                  <h2>Rencontrez {host.name.split(" ")[0]}</h2>
                  <p>
                    {host.responseRate} % de taux de réponse · répond {host.responseTime}
                  </p>
                </div>
              </div>
              <p className="host-bio">{host.bio}</p>
              <div className="host-facts">
                <span>
                  <Languages size={16} /> {host.languages.join(", ")}
                </span>
                <span>
                  <CalendarDays size={16} /> Membre depuis {host.joined}
                </span>
                {host.superhost && (
                  <span>
                    <BadgeCheck size={16} /> Superhôte
                  </span>
                )}
              </div>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => {
                  const conversationId = startConversation(host.id, listing.id);
                  navigate(`/messages/${conversationId}`);
                }}
              >
                <MessageCircle size={16} /> Contacter l'hôte
              </button>
            </div>
          </div>

          <aside className="booking-column">
            <div className="booking-card">
              <div className="booking-price">
                <span>
                  <strong>{eur(listing.pricePerNight)}</strong> / nuit
                </span>
                <span className="rating-inline">
                  <Star size={13} fill="currentColor" /> {formatRating(listing.rating)}
                </span>
              </div>

              <div className="booking-dates" id="booking-dates">
                <div className="booking-date">
                  <span>Arrivée</span>
                  <DateField
                    value={checkIn}
                    onChange={updateCheckIn}
                    min={todayISO()}
                    placeholder="Choisir"
                    ariaLabel="Date d'arrivée"
                    compact
                  />
                </div>
                <div className="booking-date">
                  <span>Départ</span>
                  <DateField
                    value={checkOut}
                    onChange={setCheckOut}
                    min={
                      checkIn
                        ? isoDay(addDays(new Date(`${checkIn}T12:00:00`), 1))
                        : isoDay(addDays(new Date(), 1))
                    }
                    placeholder="Choisir"
                    align="right"
                    ariaLabel="Date de départ"
                    compact
                  />
                </div>
              </div>

              <label className="booking-guests">
                <span>Voyageurs</span>
                <select
                  value={guests}
                  onChange={(event) => setGuests(Number(event.target.value))}
                >
                  {Array.from({ length: listing.guests }).map((_, index) => (
                    <option key={index} value={index + 1}>
                      {index + 1} {index === 0 ? "voyageur" : "voyageurs"}
                    </option>
                  ))}
                </select>
              </label>

              <button type="button" className="btn btn--primary btn--block" onClick={reserve}>
                Réserver
              </button>

              {hasDates ? (
                <>
                  <p className="booking-note">
                    {nightsLabel(price.nights)} · du {formatLongDay(checkIn)} au{" "}
                    {formatLongDay(checkOut)}
                  </p>
                  <div className="price-lines">
                    <div>
                      <span>
                        {eur(listing.pricePerNight)} × {price.nights}{" "}
                        {price.nights > 1 ? "nuits" : "nuit"}
                      </span>
                      <span>{eur(price.subtotal)}</span>
                    </div>
                    <div>
                      <span>Frais de ménage</span>
                      <span>{eur(price.cleaning)}</span>
                    </div>
                    <div>
                      <span>Frais de service Séjour</span>
                      <span>{eur(price.service)}</span>
                    </div>
                    <div>
                      <span>Taxes de séjour</span>
                      <span>{eur(price.taxes)}</span>
                    </div>
                    <div className="price-total">
                      <span>Total</span>
                      <span>{eur(price.total)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="booking-note">
                  Ajoutez vos dates pour voir le prix total.
                </p>
              )}

              <p className="booking-safe">
                <ShieldCheck size={14} /> Vous ne serez débité qu'après confirmation de
                l'hôte.
              </p>
            </div>

            <button type="button" className="report-link">
              Signaler cette annonce
            </button>
          </aside>
        </div>
      </div>

      <Dialog
        open={lightbox !== null}
        onClose={() => setLightbox(null)}
        wide
        flush
        title={`Photos de ${listing.title}`}
      >
        <div className="lightbox">
          <div className="lightbox-stage">
            <img
              src={listing.photos[lightbox ?? 0]}
              alt={`${listing.title}, photo ${(lightbox ?? 0) + 1}`}
            />
            <button
              type="button"
              className="lightbox-nav lightbox-nav--prev"
              onClick={() =>
                setLightbox((index) =>
                  index === null
                    ? null
                    : (index - 1 + listing.photos.length) % listing.photos.length,
                )
              }
              aria-label="Photo précédente"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="lightbox-nav lightbox-nav--next"
              onClick={() =>
                setLightbox((index) =>
                  index === null ? null : (index + 1) % listing.photos.length,
                )
              }
              aria-label="Photo suivante"
            >
              <ChevronRight size={20} />
            </button>
            <span className="lightbox-counter">
              {(lightbox ?? 0) + 1} / {listing.photos.length}
            </span>
          </div>
          <div className="lightbox-thumbs">
            {listing.photos.map((photo, index) => (
              <button
                type="button"
                key={photo + index}
                className={lightbox === index ? "is-active" : ""}
                onClick={() => setLightbox(index)}
                aria-label={`Photo ${index + 1}`}
              >
                <img src={photo} alt="" />
              </button>
            ))}
          </div>
        </div>
      </Dialog>

      <Dialog
        open={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        title={`${listing.reviewCount} avis`}
        wide
      >
        <div className="review-modal">
          <div className="review-modal-score">
            <Star size={26} fill="currentColor" />
            <strong>{formatRating(listing.rating)}</strong>
            <span>sur 5 · {listing.reviewCount} avis vérifiés</span>
          </div>
          <div className="review-list">
            {reviews.map((review) => (
              <article key={review.id} className="review-card review-card--wide">
                <header>
                  <span className="avatar avatar--sm">{review.initials}</span>
                  <div>
                    <strong>{review.author}</strong>
                    <em>{review.date}</em>
                  </div>
                  <span className="review-stars">
                    {Array.from({ length: review.rating }).map((_, index) => (
                      <Star key={index} size={12} fill="currentColor" />
                    ))}
                  </span>
                </header>
                <p>{review.text}</p>
              </article>
            ))}
          </div>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => setReviewsOpen(false)}
          >
            Fermer <X size={15} />
          </button>
        </div>
      </Dialog>
    </div>
  );
}
