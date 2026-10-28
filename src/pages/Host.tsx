import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Plus,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useStore } from "../store";
import { useToast } from "../components/Toast";
import { eur, nightsLabel, plural, rating as formatRating } from "../lib/format";
import { formatLongDay, formatMonthYear, isPastDay } from "../lib/dates";

export function Host() {
  const { user, listings, bookings, toggleListingActive, markConversationRead } = useStore();
  const toast = useToast();

  const myListings = listings.filter((listing) => listing.hostId === user.id);
  const myIds = new Set(myListings.map((listing) => listing.id));
  const hostBookings = bookings.filter((booking) => myIds.has(booking.listingId));

  const stats = useMemo(() => {
    const valid = hostBookings.filter((booking) => booking.status !== "cancelled");
    const revenue = valid.reduce((sum, booking) => sum + booking.total, 0);
    const upcoming = valid.filter(
      (booking) => booking.status === "confirmed" && !isPastDay(booking.checkOut),
    );
    const nights = valid.reduce((sum, booking) => sum + booking.nights, 0);
    const capacity = Math.max(1, myListings.length * 90);
    const occupancy = Math.min(96, Math.round((nights / capacity) * 100));
    const rated = myListings.filter((listing) => listing.reviewCount > 0);
    const avgRating =
      rated.reduce((sum, listing) => sum + listing.rating, 0) / Math.max(1, rated.length);
    return { revenue, upcoming, nights, occupancy, avgRating };
  }, [hostBookings, myListings]);

  const months = useMemo(() => {
    const base = new Date();
    base.setDate(1);
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(base);
      date.setMonth(date.getMonth() - (5 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const amount = hostBookings
        .filter(
          (booking) =>
            booking.status !== "cancelled" && booking.checkIn.slice(0, 7) === key,
        )
        .reduce((sum, booking) => sum + booking.total, 0);
      return { key, label: formatMonthYear(`${key}-01`).split(" ")[0], amount };
    });
  }, [hostBookings]);

  const maxAmount = Math.max(1, ...months.map((month) => month.amount));
  const nextPayout = stats.upcoming
    .slice()
    .sort((a, b) => (a.checkIn < b.checkIn ? -1 : 1))[0];

  return (
    <div className="host-page">
      <div className="container">
        <header className="page-head host-head">
          <div>
            <p className="eyebrow">Espace hôte</p>
            <h1>Bonjour {user.firstName}.</h1>
            <p className="page-lede">
              {myListings.length} {plural(myListings.length, "logement")} ·{" "}
              {stats.upcoming.length} {plural(stats.upcoming.length, "réservation")} à venir
              {user.isHost && (
                <span className="superhost-inline">
                  <BadgeCheck size={14} /> Superhôte
                </span>
              )}
            </p>
          </div>
          <div className="page-head-actions">
            <Link to="/host/new" className="btn btn--primary">
              <Plus size={16} /> Ajouter un logement
            </Link>
            <Link to="/messages" className="btn btn--outline">
              Messages
            </Link>
          </div>
        </header>

        <section className="kpi-grid">
          <article className="kpi">
            <span className="kpi-icon">
              <Wallet size={18} />
            </span>
            <p>Revenus confirmés</p>
            <strong>{eur(stats.revenue)}</strong>
            <em>sur l'ensemble des séjours</em>
          </article>
          <article className="kpi">
            <span className="kpi-icon">
              <CalendarDays size={18} />
            </span>
            <p>Réservations à venir</p>
            <strong>{stats.upcoming.length}</strong>
            <em>
              {stats.upcoming.length > 0
                ? `prochaine le ${formatLongDay(
                    stats.upcoming
                      .slice()
                      .sort((a, b) => (a.checkIn < b.checkIn ? -1 : 1))[0].checkIn,
                  )}`
                : "aucune pour le moment"}
            </em>
          </article>
          <article className="kpi">
            <span className="kpi-icon">
              <TrendingUp size={18} />
            </span>
            <p>Taux d'occupation</p>
            <strong>{stats.occupancy} %</strong>
            <em>{nightsLabel(stats.nights)} réservées (90 j)</em>
          </article>
          <article className="kpi">
            <span className="kpi-icon">
              <Star size={18} />
            </span>
            <p>Note moyenne</p>
            <strong>{formatRating(stats.avgRating || 0)}</strong>
            <em>
              {myListings.reduce((sum, listing) => sum + listing.reviewCount, 0)} avis reçus
            </em>
          </article>
        </section>

        <div className="host-grid">
          <section className="panel revenue-panel">
            <div className="panel-head">
              <div>
                <h2>Revenus par mois</h2>
                <p>Montants bruts des réservations confirmées.</p>
              </div>
              <span className="pill pill--soft">
                <ArrowUpRight size={13} /> 6 derniers mois
              </span>
            </div>
            <div className="bar-chart" role="img" aria-label="Revenus des six derniers mois">
              {months.map((month) => (
                <div className="bar-col" key={month.key}>
                  <span className="bar-value">
                    {month.amount > 0 ? eur(month.amount) : "—"}
                  </span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        height: `${Math.max(4, (month.amount / maxAmount) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="bar-label">{month.label}</span>
                </div>
              ))}
            </div>
            <div className="panel-foot">
              <span>
                <Wallet size={15} /> Prochain versement estimé
              </span>
              <strong>
                {nextPayout ? eur(Math.round(nextPayout.total * 0.88)) : "—"}
                {nextPayout && (
                  <em> le {formatLongDay(nextPayout.checkIn)}</em>
                )}
              </strong>
            </div>
          </section>

          <section className="panel payout-panel">
            <div className="panel-head">
              <div>
                <h2>Votre activité</h2>
                <p>Un coup d'œil sur les 30 prochains jours.</p>
              </div>
            </div>
            <div className="activity-list">
              {stats.upcoming.slice(0, 3).map((booking) => {
                const listing = listings.find((item) => item.id === booking.listingId);
                return (
                  <div className="activity-item" key={booking.id}>
                    <span className="avatar avatar--sm">
                      {initialsOf(booking.guestName)}
                    </span>
                    <div>
                      <strong>{booking.guestName}</strong>
                      <em>
                        {listing?.title} · {nightsLabel(booking.nights)}
                      </em>
                    </div>
                    <span className="activity-amount">{eur(booking.total)}</span>
                  </div>
                );
              })}
              {stats.upcoming.length === 0 && (
                <p className="muted">Aucune arrivée planifiée pour l'instant.</p>
              )}
            </div>
            <Link to="/messages" className="panel-link">
              <Users size={15} /> Voir les messages
            </Link>
          </section>
        </div>

        <section className="panel reservations-panel">
          <div className="panel-head">
            <div>
              <h2>Réservations à venir</h2>
              <p>Les voyageurs qui arrivent prochainement.</p>
            </div>
            <span className="pill pill--soft">
              {stats.upcoming.length} {plural(stats.upcoming.length, "séjour")}
            </span>
          </div>
          <div className="table-wrap">
            <table className="reservations-table">
              <thead>
                <tr>
                  <th>Voyageur</th>
                  <th>Logement</th>
                  <th>Dates</th>
                  <th>Voyageurs</th>
                  <th>Montant</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {stats.upcoming
                  .slice()
                  .sort((a, b) => (a.checkIn < b.checkIn ? -1 : 1))
                  .map((booking) => {
                    const listing = listings.find((item) => item.id === booking.listingId);
                    return (
                      <tr key={booking.id}>
                        <td>
                          <div className="table-person">
                            <span className="avatar avatar--sm">
                              {initialsOf(booking.guestName)}
                            </span>
                            <span>
                              <strong>{booking.guestName}</strong>
                              <em>{booking.id}</em>
                            </span>
                          </div>
                        </td>
                        <td>{listing?.title}</td>
                        <td>
                          {formatLongDay(booking.checkIn)} →{" "}
                          {formatLongDay(booking.checkOut)}
                        </td>
                        <td>{booking.guests}</td>
                        <td className="table-amount">{eur(booking.total)}</td>
                        <td>
                          <Link
                            to={`/listing/${booking.listingId}`}
                            className="table-link"
                            aria-label={`Voir ${listing?.title}`}
                          >
                            <ArrowRight size={16} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {stats.upcoming.length === 0 && (
              <p className="table-empty">Aucune réservation à venir.</p>
            )}
          </div>
        </section>

        <section className="host-listings">
          <div className="section-head">
            <div>
              <h2>Mes logements</h2>
              <p className="muted">Un logement en pause n'apparaît plus dans la recherche.</p>
            </div>
            <Link to="/host/new" className="link-arrow">
              <Plus size={15} /> Ajouter <ArrowRight size={15} />
            </Link>
          </div>
          <div className="host-listing-grid">
            {myListings.map((listing) => (
              <article className="host-listing" key={listing.id}>
                <Link to={`/listing/${listing.id}`} className="host-listing-media">
                  <img src={listing.photos[0]} alt={listing.title} loading="lazy" />
                  <span className={`status-chip status-chip--${listing.active ? "confirmed" : "cancelled"}`}>
                    {listing.active ? "En ligne" : "En pause"}
                  </span>
                </Link>
                <div className="host-listing-body">
                  <h3>{listing.title}</h3>
                  <p>
                    {listing.city} · {listing.type}
                  </p>
                  <div className="host-listing-stats">
                    <span>
                      {listing.reviewCount > 0 ? (
                        <>
                          <Star size={12} fill="currentColor" /> {formatRating(listing.rating)}
                        </>
                      ) : (
                        "Nouveau"
                      )}
                    </span>
                    <span>{eur(listing.pricePerNight)} / nuit</span>
                  </div>
                  <div className="host-listing-actions">
                    <Link to={`/listing/${listing.id}`} className="btn btn--outline btn--small">
                      Voir
                    </Link>
                    <button
                      type="button"
                      className={`btn btn--small ${listing.active ? "btn--ghost" : "btn--primary"}`}
                      onClick={() => {
                        toggleListingActive(listing.id);
                        toast.show(
                          listing.active
                            ? "Logement mis en pause."
                            : "Logement remis en ligne.",
                          "info",
                        );
                      }}
                    >
                      {listing.active ? "Mettre en pause" : "Publier"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
            <Link to="/host/new" className="host-listing-new">
              <span>
                <Plus size={22} />
              </span>
              <strong>Ajouter un logement</strong>
              <em>Quelques minutes suffisent</em>
            </Link>
          </div>
        </section>

        <div className="host-tip">
          <div>
            <p className="eyebrow eyebrow--light">Conseil d'hôte</p>
            <h2>Les annonces avec 5 photos et un texte personnel reçoivent 2,4× plus de demandes.</h2>
          </div>
          <button
            type="button"
            className="btn btn--light"
            onClick={() => {
              markConversationRead("c1");
              toast.show("Astuce enregistrée. Bonne location !");
            }}
          >
            Noter l'astuce
          </button>
        </div>
      </div>
    </div>
  );
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
