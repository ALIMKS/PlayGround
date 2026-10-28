import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  MessageCircle,
  Star,
  Users,
} from "lucide-react";
import { useStore } from "../store";
import { useToast } from "../components/Toast";
import { Dialog } from "../components/Dialog";
import { eur, nightsLabel } from "../lib/format";
import { isPastDay } from "../lib/dates";
import type { Booking } from "../types";

type Tab = "upcoming" | "past" | "cancelled";

const TABS: { id: Tab; label: string }[] = [
  { id: "upcoming", label: "À venir" },
  { id: "past", label: "Passés" },
  { id: "cancelled", label: "Annulés" },
];

export function Trips() {
  const { bookings, getListing, user, cancelBooking } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);
  const [stars, setStars] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewed, setReviewed] = useState<string[]>([]);

  const mine = bookings
    .filter((booking) => booking.guestId === user.id)
    .sort((a, b) => (a.checkIn < b.checkIn ? 1 : -1));

  const groups: Record<Tab, Booking[]> = {
    upcoming: mine.filter(
      (booking) => booking.status === "confirmed" && !isPastDay(booking.checkOut),
    ),
    past: mine.filter(
      (booking) =>
        booking.status === "completed" ||
        (booking.status === "confirmed" && isPastDay(booking.checkOut)),
    ),
    cancelled: mine.filter((booking) => booking.status === "cancelled"),
  };

  const list = groups[tab];

  return (
    <div className="trips-page">
      <div className="container">
        <header className="page-head">
          <div>
            <p className="eyebrow">Votre carnet de voyage</p>
            <h1>Mes voyages</h1>
            <p className="page-lede">
              {groups.upcoming.length} séjour{groups.upcoming.length > 1 ? "s" : ""} à venir
              · {groups.past.length} souvenir{groups.past.length > 1 ? "s" : ""}
            </p>
          </div>
          <Link to="/search" className="btn btn--outline">
            Trouver un séjour <ArrowRight size={16} />
          </Link>
        </header>

        <div className="tabs" role="tablist">
          {TABS.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={tab === item.id}
              className={tab === item.id ? "is-active" : ""}
              onClick={() => setTab(item.id)}
            >
              {item.label}
              <span>{groups[item.id].length}</span>
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="empty-state empty-state--card">
            <span className="empty-icon">
              <CalendarDays size={26} />
            </span>
            <h2>
              {tab === "upcoming"
                ? "Aucun voyage prévu"
                : tab === "past"
                  ? "Pas encore de souvenirs"
                  : "Aucune annulation"}
            </h2>
            <p>
              {tab === "upcoming"
                ? "Votre prochaine escapade n'attend que vous. Commencez par explorer nos logements."
                : "Vos séjours terminés apparaîtront ici, avec la possibilité de laisser un avis."}
            </p>
            <Link to="/search" className="btn btn--primary">
              Explorer les séjours
            </Link>
          </div>
        ) : (
          <div className="trips-list">
            {list.map((booking) => {
              const listing = getListing(booking.listingId);
              if (!listing) return null;
              const isUpcoming = tab === "upcoming";
              return (
                <article className="trip-card" key={booking.id}>
                  <Link to={`/listing/${listing.id}`} className="trip-media">
                    <img src={listing.photos[0]} alt={listing.title} loading="lazy" />
                    <span className={`status-chip status-chip--${booking.status}`}>
                      {booking.status === "confirmed"
                        ? "Confirmé"
                        : booking.status === "completed"
                          ? "Terminé"
                          : "Annulé"}
                    </span>
                  </Link>
                  <div className="trip-body">
                    <div className="trip-heading">
                      <div>
                        <h2>
                          <Link to={`/listing/${listing.id}`}>{listing.title}</Link>
                        </h2>
                        <p>
                          <MapPin size={13} /> {listing.city}, {listing.country}
                        </p>
                      </div>
                      <span className="trip-ref">{booking.id}</span>
                    </div>

                    <div className="trip-facts">
                      <span>
                        <CalendarDays size={14} />
                        {new Intl.DateTimeFormat("fr-FR", {
                          day: "numeric",
                          month: "short",
                        }).format(new Date(`${booking.checkIn}T12:00:00`))}
                        {" → "}
                        {new Intl.DateTimeFormat("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(`${booking.checkOut}T12:00:00`))}
                      </span>
                      <span>
                        <Users size={14} /> {booking.guests}{" "}
                        {booking.guests > 1 ? "voyageurs" : "voyageur"}
                      </span>
                      <span>{nightsLabel(booking.nights)}</span>
                    </div>

                    <div className="trip-foot">
                      <span className="trip-total">
                        Total <strong>{eur(booking.total)}</strong>
                      </span>
                      <div className="trip-actions">
                        {isUpcoming && (
                          <button
                            type="button"
                            className="btn btn--ghost btn--small"
                            onClick={() => setCancelTarget(booking)}
                          >
                            Annuler
                          </button>
                        )}
                        {tab === "past" && (
                          <button
                            type="button"
                            className="btn btn--ghost btn--small"
                            disabled={reviewed.includes(booking.id)}
                            onClick={() => {
                              setReviewTarget(booking);
                              setStars(5);
                              setReviewText("");
                            }}
                          >
                            <Star size={14} />
                            {reviewed.includes(booking.id) ? "Avis envoyé" : "Laisser un avis"}
                          </button>
                        )}
                        <Link
                          to={`/messages?to=${listing.hostId}&listing=${listing.id}`}
                          className="btn btn--ghost btn--small"
                        >
                          <MessageCircle size={14} /> Message
                        </Link>
                        <Link
                          to={`/listing/${listing.id}`}
                          className="btn btn--outline btn--small"
                        >
                          Voir l'annonce
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="trips-help">
          <div>
            <h2>Besoin d'aide pour un séjour ?</h2>
            <p>Notre équipe répond 7 j/7, en français, avant et pendant votre voyage.</p>
          </div>
          <Link to="/messages" className="btn btn--outline">
            Contacter l'assistance
          </Link>
        </div>
      </div>

      <Dialog
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        title="Annuler ce séjour ?"
      >
        {cancelTarget && (
          <div className="confirm-dialog">
            <p>
              Vous êtes sur le point d'annuler{" "}
              <strong>{getListing(cancelTarget.listingId)?.title}</strong> du{" "}
              {cancelTarget.checkIn} au {cancelTarget.checkOut}.
            </p>
            <p className="muted">
              Annulation gratuite jusqu'à 7 jours avant l'arrivée. Cette action est
              irréversible dans la démonstration.
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setCancelTarget(null)}
              >
                Garder la réservation
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  cancelBooking(cancelTarget.id);
                  setCancelTarget(null);
                  toast.show("Réservation annulée. Remboursement simulé.");
                  setTab("cancelled");
                }}
              >
                Confirmer l'annulation
              </button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        open={reviewTarget !== null}
        onClose={() => setReviewTarget(null)}
        title="Votre avis"
      >
        {reviewTarget && (
          <div className="review-form">
            <p>
              Comment s'est passé votre séjour à{" "}
              <strong>{getListing(reviewTarget.listingId)?.city}</strong> ?
            </p>
            <div className="star-picker" role="radiogroup" aria-label="Note">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value <= stars ? "is-active" : ""}
                  onClick={() => setStars(value)}
                  aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
                  role="radio"
                  aria-checked={value === stars}
                >
                  <Star size={24} fill={value <= stars ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
            <label className="field">
              <span>Votre récit</span>
              <textarea
                rows={4}
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                placeholder="Ce que vous avez aimé, ce qu'il faut savoir…"
              />
            </label>
            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={() => {
                setReviewed((prev) => [...prev, reviewTarget.id]);
                setReviewTarget(null);
                toast.show("Merci ! Votre avis est enregistré (démo).");
              }}
            >
              Publier mon avis
            </button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
