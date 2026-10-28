import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  CalendarPlus,
  Check,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useStore } from "../store";
import { HOSTS } from "../data";
import { eur, nightsLabel } from "../lib/format";
import { formatLongDay } from "../lib/dates";

export function Confirmation() {
  const { bookingId = "" } = useParams();
  const { bookings, getListing } = useStore();
  const booking = bookings.find((item) => item.id === bookingId);
  const listing = booking ? getListing(booking.listingId) : undefined;

  if (!booking || !listing) {
    return (
      <div className="container empty-state empty-state--page">
        <h1>Réservation introuvable</h1>
        <p>Cette confirmation n'existe plus dans ce navigateur.</p>
        <Link to="/trips" className="btn btn--primary">
          Voir mes voyages
        </Link>
      </div>
    );
  }

  const host = HOSTS[listing.hostId];

  const calendarFile = () => {
    const stamp = (iso: string) => iso.replace(/-/g, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Sejour//FR",
      "BEGIN:VEVENT",
      `UID:${booking.id}@sejour.fr`,
      `DTSTAMP:${stamp(booking.checkIn)}T090000Z`,
      `DTSTART;VALUE=DATE:${stamp(booking.checkIn)}`,
      `DTEND;VALUE=DATE:${stamp(booking.checkOut)}`,
      `SUMMARY:Séjour — ${listing.title}`,
      `LOCATION:${listing.city}, ${listing.country}`,
      `DESCRIPTION:Réservation ${booking.id} · ${eur(booking.total)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sejour-${booking.id}.ics`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="confirmation-page">
      <div className="container confirmation-shell">
        <div className="confirmation-hero">
          <span className="success-badge">
            <Check size={26} strokeWidth={2.4} />
          </span>
          <p className="eyebrow">Réservation confirmée</p>
          <h1>Votre séjour est réservé.</h1>
          <p className="confirmation-lede">
            En production, un e-mail de confirmation serait envoyé. Ici, tout est
            enregistré dans votre navigateur — cette réservation est une démonstration.
          </p>
          <span className="booking-ref">Référence {booking.id}</span>
        </div>

        <div className="confirmation-card">
          <div className="confirmation-media">
            <img src={listing.photos[0]} alt={listing.title} />
          </div>
          <div className="confirmation-body">
            <div className="confirmation-place">
              <span className="pill pill--soft">{listing.type}</span>
              <span>
                <MapPin size={14} /> {listing.city}, {listing.country}
              </span>
            </div>
            <h2>{listing.title}</h2>
            <div className="confirmation-dates">
              <div>
                <span>Arrivée</span>
                <strong>{formatLongDay(booking.checkIn)}</strong>
              </div>
              <div>
                <span>Départ</span>
                <strong>{formatLongDay(booking.checkOut)}</strong>
              </div>
              <div>
                <span>Séjour</span>
                <strong>{nightsLabel(booking.nights)}</strong>
              </div>
              <div>
                <span>Voyageurs</span>
                <strong>
                  <Users size={14} /> {booking.guests}
                </strong>
              </div>
            </div>

            <div className="confirmation-host">
              <span className="avatar">{host?.initials ?? "H"}</span>
              <div>
                <strong>Chez {host?.name ?? "votre hôte"}</strong>
                <em>L'adresse exacte vous sera envoyée 48 h avant l'arrivée.</em>
              </div>
            </div>

            <div className="confirmation-total">
              <span>Total payé</span>
              <strong>{eur(booking.total)}</strong>
            </div>

            <div className="confirmation-actions">
              <Link to="/trips" className="btn btn--primary">
                Voir mes voyages <ArrowRight size={16} />
              </Link>
              <Link
                to={`/messages?to=${host?.id ?? "h1"}&listing=${listing.id}`}
                className="btn btn--outline"
              >
                <MessageCircle size={16} /> Contacter l'hôte
              </Link>
              <button type="button" className="btn btn--ghost" onClick={calendarFile}>
                <CalendarPlus size={16} /> Ajouter au calendrier
              </button>
            </div>

            <p className="confirmation-note">
              <ShieldCheck size={15} /> Annulation gratuite jusqu'à 7 jours avant l'arrivée.
            </p>
          </div>
        </div>

        <div className="confirmation-next">
          <h2>Et maintenant ?</h2>
          <div className="next-grid">
            <div>
              <span>1</span>
              <strong>Préparez votre arrivée</strong>
              <p>Écrivez à votre hôte pour convenir de l'heure et poser vos questions.</p>
            </div>
            <div>
              <span>2</span>
              <strong>Recevez l'adresse</strong>
              <p>Les informations d'accès arrivent 48 h avant le séjour.</p>
            </div>
            <div>
              <span>3</span>
              <strong>Partez l'esprit léger</strong>
              <p>Notre assistance reste joignable 7 j/7 pendant votre séjour.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
