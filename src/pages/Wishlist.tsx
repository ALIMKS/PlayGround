import { Link } from "react-router-dom";
import { ArrowRight, Heart } from "lucide-react";
import { useStore } from "../store";
import { ListingCard } from "../components/ListingCard";

export function Wishlist() {
  const { listings, favorites } = useStore();
  const saved = favorites
    .map((id) => listings.find((listing) => listing.id === id))
    .filter((listing): listing is NonNullable<typeof listing> => Boolean(listing));

  return (
    <div className="wishlist-page">
      <div className="container">
        <header className="page-head">
          <div>
            <p className="eyebrow">Vos coups de cœur</p>
            <h1>Mes favoris</h1>
            <p className="page-lede">
              {saved.length > 0
                ? `${saved.length} logement${saved.length > 1 ? "s" : ""} enregistré${
                    saved.length > 1 ? "s" : ""
                  } pour plus tard.`
                : "Enregistrez les logements qui vous plaisent pour les retrouver ici."}
            </p>
          </div>
          <Link to="/search" className="btn btn--outline">
            Explorer <ArrowRight size={16} />
          </Link>
        </header>

        {saved.length === 0 ? (
          <div className="empty-state empty-state--card">
            <span className="empty-icon">
              <Heart size={26} />
            </span>
            <h2>Votre liste est vide</h2>
            <p>
              Touchez le cœur sur une annonce pour la garder de côté. Vos favoris restent
              dans ce navigateur.
            </p>
            <Link to="/" className="btn btn--primary">
              Découvrir les séjours
            </Link>
          </div>
        ) : (
          <div className="listing-grid listing-grid--3">
            {saved.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {saved.length > 0 && (
          <div className="wishlist-note">
            <Heart size={18} />
            <p>
              Les prix et disponibilités peuvent évoluer. Enregistrez vos dates sur chaque
              annonce pour comparer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
