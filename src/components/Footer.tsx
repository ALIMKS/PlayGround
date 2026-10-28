import { Link } from "react-router-dom";
import { Leaf, ShieldCheck, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="brand brand--footer">
              <span className="brand-mark" aria-hidden="true">
                <svg viewBox="0 0 40 40" fill="none">
                  <path
                    d="M11 31V19a9 9 0 0 1 18 0v12"
                    stroke="currentColor"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                  />
                  <circle cx="20" cy="29" r="2" fill="currentColor" />
                </svg>
              </span>
              <span className="brand-word">
                Séjour<span className="brand-dot">.</span>
              </span>
            </Link>
            <p>
              Des logements uniques chez des particuliers, choisis avec soin. Voyager
              autrement, sans intermédiaire de trop.
            </p>
            <div className="footer-trust">
              <span>
                <ShieldCheck size={15} /> Paiement sécurisé
              </span>
              <span>
                <Sparkles size={15} /> Hôtes vérifiés
              </span>
              <span>
                <Leaf size={15} /> Voyage plus doux
              </span>
            </div>
          </div>

          <div className="footer-col">
            <h3>Explorer</h3>
            <Link to="/search?destination=Saint-Tropez">Saint-Tropez</Link>
            <Link to="/search?destination=Chamonix">Chamonix</Link>
            <Link to="/search?destination=Lisbonne">Lisbonne</Link>
            <Link to="/search?destination=Ubud%2C%20Bali">Bali</Link>
            <Link to="/search?destination=Marrakech">Marrakech</Link>
          </div>

          <div className="footer-col">
            <h3>Hôtes</h3>
            <Link to="/host/new">Mettre un logement en ligne</Link>
            <Link to="/host">Tableau de bord</Link>
            <Link to="/messages">Messages</Link>
            <Link to="/trips">Réservations</Link>
          </div>

          <div className="footer-col">
            <h3>Séjour</h3>
            <Link to="/">À propos</Link>
            <Link to="/">Confiance &amp; sécurité</Link>
            <Link to="/">Conditions générales</Link>
            <Link to="/">Confidentialité</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Séjour — projet de démonstration. Photographies : Unsplash.</p>
          <p className="footer-locale">Français (FR) · EUR (€)</p>
        </div>
      </div>
    </footer>
  );
}
