import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Heart,
  Lock,
  MessageCircle,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { useStore } from "../store";
import { useToast } from "../components/Toast";
import { HOSTS } from "../data";
import { quote } from "../lib/pricing";
import { eur, nightsLabel, rating as formatRating } from "../lib/format";
import { formatLongDay, isBefore, addDays, isoDay, nightsBetween } from "../lib/dates";

export function Checkout() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { getListing, createBooking, user, isFavorite, toggleFavorite } = useStore();
  const toast = useToast();
  const listing = getListing(id);

  const checkIn = params.get("checkIn") ?? "";
  const checkOut = params.get("checkOut") ?? "";
  const guests = Number(params.get("guests") ?? 2);

  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.name.split(" ").slice(1).join(" ") || "Laurent");
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState("+33 6 12 34 56 78");
  const [message, setMessage] = useState("");
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/29");
  const [cvc, setCvc] = useState("123");
  const [accepted, setAccepted] = useState(true);
  const [processing, setProcessing] = useState(false);

  if (!listing) {
    return (
      <div className="container empty-state empty-state--page">
        <h1>Annonce introuvable</h1>
        <Link to="/search" className="btn btn--primary">
          Retour aux séjours
        </Link>
      </div>
    );
  }

  const nights = nightsBetween(checkIn, checkOut);
  if (!checkIn || !checkOut || nights < 1 || isBefore(checkOut, checkIn)) {
    return (
      <div className="container empty-state empty-state--page">
        <h1>Choisissez d'abord vos dates</h1>
        <p>Sélectionnez une arrivée et un départ pour continuer.</p>
        <Link to={`/listing/${listing.id}`} className="btn btn--primary">
          Retour à l'annonce
        </Link>
      </div>
    );
  }

  const host = HOSTS[listing.hostId];
  const price = quote(listing, checkIn, checkOut);
  const freeCancelDate = isoDay(addDays(new Date(`${checkIn}T12:00:00`), -7));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const digits = card.replace(/\s/g, "");
    if (!firstName.trim() || !lastName.trim() || !email.includes("@")) {
      toast.show("Vérifiez vos coordonnées de voyageur.", "info");
      return;
    }
    if (digits.length !== 16 || expiry.length < 5 || cvc.length < 3) {
      toast.show("Vérifiez les informations de votre carte.", "info");
      return;
    }
    if (!accepted) {
      toast.show("Veuillez accepter les conditions du séjour.", "info");
      return;
    }
    setProcessing(true);
    window.setTimeout(() => {
      const booking = createBooking({
        listingId: listing.id,
        checkIn,
        checkOut,
        guests,
        nights,
        total: price.total,
      });
      navigate(`/confirmation/${booking.id}`, { replace: true });
    }, 900);
  };

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-top">
          <Link to={`/listing/${listing.id}`} className="back-link">
            <ArrowLeft size={16} /> Retour à l'annonce
          </Link>
          <span className="checkout-secure">
            <Lock size={14} /> Paiement chiffré · démonstration
          </span>
        </div>

        <div className="checkout-grid">
          <form className="checkout-form" onSubmit={submit}>
            <div>
              <p className="eyebrow">Étape 2 sur 2</p>
              <h1>Confirmez et payez</h1>
              <p className="checkout-lede">
                Vos informations ne sont utilisées que pour ce séjour. Aucun prélèvement
                réel n'est effectué dans cette démonstration.
              </p>
            </div>

            <section className="checkout-card checkout-trip">
              <div className="checkout-trip-media">
                <img src={listing.photos[0]} alt={listing.title} />
              </div>
              <div className="checkout-trip-body">
                <div className="checkout-trip-top">
                  <span className="pill pill--soft">{listing.type}</span>
                  <span className="rating-inline">
                    <Star size={12} fill="currentColor" /> {formatRating(listing.rating)}
                  </span>
                </div>
                <h2>{listing.title}</h2>
                <p className="muted">
                  {listing.city}, {listing.country}
                </p>
                <div className="checkout-trip-facts">
                  <span>
                    <CalendarDays size={15} />
                    {formatLongDay(checkIn)} → {formatLongDay(checkOut)}
                  </span>
                  <span>
                    <Users size={15} /> {guests} {guests > 1 ? "voyageurs" : "voyageur"}
                  </span>
                </div>
              </div>
              <Link to={`/listing/${listing.id}`} className="checkout-trip-edit">
                Modifier
              </Link>
            </section>

            <section className="checkout-card">
              <div className="checkout-section-head">
                <h2>Voyageur principal</h2>
                <span>Comme sur votre pièce d'identité</span>
              </div>
              <div className="field-grid">
                <label className="field">
                  <span>Prénom</span>
                  <input
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    autoComplete="given-name"
                  />
                </label>
                <label className="field">
                  <span>Nom</span>
                  <input
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    autoComplete="family-name"
                  />
                </label>
                <label className="field field--full">
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                  />
                </label>
                <label className="field field--full">
                  <span>Téléphone</span>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    autoComplete="tel"
                  />
                </label>
              </div>
            </section>

            <section className="checkout-card">
              <div className="checkout-section-head">
                <h2>
                  <MessageCircle size={18} /> Un mot pour {host?.name.split(" ")[0] ?? "l'hôte"}
                </h2>
                <span>Facultatif</span>
              </div>
              <label className="field">
                <textarea
                  rows={3}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Heure d'arrivée, occasion du séjour, questions…"
                />
              </label>
            </section>

            <section className="checkout-card">
              <div className="checkout-section-head">
                <h2>
                  <CreditCard size={18} /> Paiement
                </h2>
                <span className="secure-inline">
                  <Lock size={12} /> Chiffré
                </span>
              </div>
              <label className="field field--full">
                <span>Numéro de carte</span>
                <input
                  value={card}
                  inputMode="numeric"
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "").slice(0, 16);
                    setCard(digits.replace(/(.{4})/g, "$1 ").trim());
                  }}
                  autoComplete="cc-number"
                />
              </label>
              <div className="field-grid">
                <label className="field">
                  <span>Expiration</span>
                  <input
                    value={expiry}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
                      setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
                    }}
                    placeholder="MM/AA"
                    autoComplete="cc-exp"
                  />
                </label>
                <label className="field">
                  <span>CVC</span>
                  <input
                    value={cvc}
                    inputMode="numeric"
                    onChange={(event) => setCvc(event.target.value.replace(/\D/g, "").slice(0, 4))}
                    autoComplete="cc-csc"
                  />
                </label>
              </div>
              <p className="card-note">
                <Lock size={13} /> Carte de test préremplie. Aucun paiement réel ne sera
                effectué.
              </p>
            </section>

            <label className="check check--terms">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
              />
              <span>
                J'accepte les conditions du séjour et la politique d'annulation de l'hôte.
              </span>
            </label>

            <button
              type="submit"
              className="btn btn--primary btn--lg btn--block"
              disabled={processing}
            >
              {processing ? (
                <>
                  <span className="spinner" aria-hidden="true" /> Paiement en cours…
                </>
              ) : (
                <>Confirmer et payer {eur(price.total)}</>
              )}
            </button>
            <p className="checkout-legal">
              En confirmant, vous réservez ce logement pour les dates indiquées. Le montant
              total est de {eur(price.total)}.
            </p>
          </form>

          <aside className="checkout-summary">
            <div className="summary-card">
              <div className="summary-head">
                <img src={listing.photos[0]} alt="" />
                <div>
                  <strong>{listing.title}</strong>
                  <em>
                    {listing.city} · {listing.type}
                  </em>
                  <span className="rating-inline">
                    <Star size={11} fill="currentColor" /> {formatRating(listing.rating)}
                  </span>
                </div>
              </div>

              <div className="summary-dates">
                <div>
                  <span>Arrivée</span>
                  <strong>{formatLongDay(checkIn)}</strong>
                </div>
                <div>
                  <span>Départ</span>
                  <strong>{formatLongDay(checkOut)}</strong>
                </div>
              </div>
              <p className="summary-nights">
                {nightsLabel(nights)} · {guests} {guests > 1 ? "voyageurs" : "voyageur"}
              </p>

              <div className="price-lines">
                <div>
                  <span>
                    {eur(listing.pricePerNight)} × {nights} {nights > 1 ? "nuits" : "nuit"}
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
                  <span>Total (EUR)</span>
                  <span>{eur(price.total)}</span>
                </div>
              </div>

              <div className="summary-cancel">
                <p>
                  <strong>Annulation gratuite</strong>
                  <br />
                  jusqu'au {formatLongDay(freeCancelDate)}. Ensuite, 50 % du séjour est
                  remboursé.
                </p>
              </div>

              <p className="summary-guarantee">
                <ShieldCheck size={15} /> Couvert par la garantie Séjour : si le logement ne
                correspond pas à l'annonce, nous vous relogeons ou vous remboursons.
              </p>
              <button
                type="button"
                className="summary-fav summary-fav--button"
                onClick={() => toggleFavorite(listing.id)}
              >
                <Heart
                  size={13}
                  fill={isFavorite(listing.id) ? "currentColor" : "none"}
                />
                {isFavorite(listing.id)
                  ? "Enregistré dans vos favoris"
                  : "Enregistrer dans mes favoris"}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
