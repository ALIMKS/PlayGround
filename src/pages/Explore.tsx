import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  HandCoins,
  KeyRound,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { SearchBar } from "../components/SearchBar";
import { ListingCard } from "../components/ListingCard";
import { useStore } from "../store";
import { CATEGORIES } from "../data";
import { eur } from "../lib/format";

const DESTINATIONS = [
  { city: "Saint-Tropez", label: "Côte d'Azur", photo: "img/villa-azur-1.jpg", count: 48 },
  { city: "Lisbonne", label: "Portugal", photo: "img/lisbon-living.jpg", count: 62 },
  { city: "Ubud, Bali", label: "Indonésie", photo: "img/bali-resort.jpg", count: 31 },
  { city: "Chamonix", label: "Alpes françaises", photo: "img/chalet-1.jpg", count: 27 },
];

export function Explore() {
  const { listings } = useStore();
  const active = listings.filter((listing) => listing.active);
  const featured = active.filter((listing) => listing.featured).slice(0, 6);

  return (
    <div className="explore">
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <Sparkles size={14} /> Location entre particuliers
            </p>
            <h1>
              Des séjours qui ont une <em>âme</em>.
            </h1>
            <p className="lede">
              Des maisons habitées, des hôtes qui connaissent leur coin, et rien d'autre
              à penser que le prochain matin. Réservez directement chez des particuliers.
            </p>
            <SearchBar />
            <div className="hero-trust">
              <span>
                <ShieldCheck size={16} /> Paiement sécurisé
              </span>
              <span>
                <BadgeCheck size={16} /> Hôtes vérifiés
              </span>
              <span>
                <KeyRound size={16} /> Annulation flexible
              </span>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-photo hero-photo--main">
              <img src="img/villa-azur-1.jpg" alt="" />
            </div>
            <div className="hero-photo hero-photo--small">
              <img src="img/santorini-1.jpg" alt="" />
            </div>

            <div className="hero-badge">
              <svg viewBox="0 0 120 120" className="hero-badge-ring">
                <defs>
                  <path
                    id="badge-circle"
                    d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"
                  />
                </defs>
                <text>
                  <textPath href="#badge-circle" startOffset="0%">
                    SÉJOUR · DEPUIS 2015 · LOCATION ENTRE PARTICULIERS ·
                  </textPath>
                </text>
              </svg>
              <span className="hero-badge-center">
                <svg viewBox="0 0 40 40" fill="none">
                  <path
                    d="M12 30V19a8 8 0 0 1 16 0v11"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="20" cy="28" r="1.8" fill="currentColor" />
                </svg>
              </span>
            </div>

            <div className="hero-note">
              <div className="hero-note-head">
                <span className="avatar avatar--sm">CM</span>
                <div>
                  <strong>Claire</strong>
                  <em>Superhôte · Saint-Tropez</em>
                </div>
                <span className="rating-inline">
                  <Star size={12} fill="currentColor" /> 4,97
                </span>
              </div>
              <p>« La piscine semble se jeter dans la mer. On a rarement aussi bien dormi. »</p>
              <span className="hero-note-foot">128 avis · 8 ans sur Séjour</span>
            </div>

            <div className="hero-float">
              <MapPin size={14} />
              <span>
                <strong>Sud de la France</strong>
                <em>à partir de {eur(210)} / nuit</em>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="category-rail container" aria-label="Explorer par envie">
        <div className="rail-head">
          <h2>Explorer par envie</h2>
          <span>Huit façons de changer d'air.</span>
        </div>
        <div className="rail-scroll">
          {CATEGORIES.map((category) => {
            const params = new URLSearchParams();
            if (category.label !== "Tout") params.set("category", category.label);
            return (
              <Link
                key={category.label}
                to={`/search${params.toString() ? `?${params.toString()}` : ""}`}
                className="category-chip"
              >
                <img src={category.photo} alt="" loading="lazy" />
                <span>{category.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <div>
            <p className="eyebrow">Sélection de la semaine</p>
            <h2>Séjours en vedette</h2>
          </div>
          <Link to="/search" className="link-arrow">
            Tout voir <ArrowRight size={16} />
          </Link>
        </div>
        <div className="listing-grid listing-grid--3">
          {featured.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="section section--tinted">
        <div className="container">
          <div className="section-head section-head--center">
            <div>
              <p className="eyebrow">L'esprit Séjour</p>
              <h2>Moins d'intermédiaires, plus de présence.</h2>
            </div>
          </div>
          <div className="value-grid">
            <article className="value-card">
              <span className="value-icon">
                <Sparkles size={22} />
              </span>
              <h3>Des lieux choisis à la main</h3>
              <p>
                Chaque logement est visité ou validé par notre équipe. Pas de photos
                trompeuses, pas de surprises à l'arrivée.
              </p>
            </article>
            <article className="value-card">
              <span className="value-icon">
                <HandCoins size={22} />
              </span>
              <h3>Un prix juste, sans frais cachés</h3>
              <p>
                Le total affiché est le total payé. Les hôtes fixent leur prix, nous
                n'ajoutons que le nécessaire.
              </p>
            </article>
            <article className="value-card">
              <span className="value-icon">
                <ShieldCheck size={22} />
              </span>
              <h3>Un séjour protégé</h3>
              <p>
                Paiement sécurisé, assistance 7 j/7 et remboursement intégral si le
                logement ne correspond pas à l'annonce.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <div>
            <p className="eyebrow">Inspirations</p>
            <h2>Destinations à la une</h2>
          </div>
          <Link to="/search" className="link-arrow">
            Toutes les destinations <ArrowRight size={16} />
          </Link>
        </div>
        <div className="destination-grid">
          {DESTINATIONS.map((destination) => (
            <Link
              key={destination.city}
              to={`/search?destination=${encodeURIComponent(destination.city)}`}
              className="destination-tile"
            >
              <img src={destination.photo} alt={destination.label} />
              <div className="destination-overlay">
                <span className="destination-count">{destination.count} séjours</span>
                <strong>{destination.city}</strong>
                <em>{destination.label}</em>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="host-banner-wrap container">
        <div className="host-banner">
          <div className="host-banner-copy">
            <p className="eyebrow eyebrow--light">Devenir hôte</p>
            <h2>Votre chez-vous peut faire voyager.</h2>
            <p>
              Ouvrez votre porte quelques nuits par mois, fixez vos prix, choisissez vos
              voyageurs. Nous nous occupons du paiement et de l'assistance.
            </p>
            <div className="host-banner-actions">
              <Link to="/host/new" className="btn btn--light">
                Mettre mon logement en ligne <ArrowRight size={16} />
              </Link>
              <Link to="/host" className="link-arrow link-arrow--light">
                Voir le tableau de bord
              </Link>
            </div>
            <div className="host-banner-stats">
              <span>
                <strong>2 400 €</strong>
                revenu mensuel moyen
              </span>
              <span>
                <strong>87 %</strong>
                des hôtes recommandent Séjour
              </span>
              <span>
                <strong>24 h</strong>
                pour recevoir sa première demande
              </span>
            </div>
          </div>
          <div className="host-banner-media">
            <img src="img/villa-pool-2.jpg" alt="" loading="lazy" />
          </div>
        </div>
      </section>
    </div>
  );
}
