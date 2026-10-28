import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Camera,
  Check,
  Home,
  MapPin,
  Sparkles,
  Star,
  Users,
  Wallet,
} from "lucide-react";
import { useStore } from "../store";
import { useToast } from "../components/Toast";
import { eur } from "../lib/format";
import type { PropertyType } from "../types";

const TYPES: PropertyType[] = [
  "Villa",
  "Chalet",
  "Loft",
  "Riad",
  "Appartement",
  "Cabane",
  "Maison",
];

const PHOTOS = [
  { src: "img/villa-pool-2.jpg", label: "Villa & piscine" },
  { src: "img/cabin-forest.jpg", label: "Cabane & forêt" },
  { src: "img/loft-1.jpg", label: "Loft urbain" },
  { src: "img/riad-pool.jpg", label: "Riad & patio" },
  { src: "img/santorini-1.jpg", label: "Maison de village" },
  { src: "img/bali-resort.jpg", label: "Maison tropicale" },
];

const CITIES = [
  "Paris",
  "Saint-Tropez",
  "Chamonix",
  "Annecy",
  "Gordes",
  "Lisbonne",
  "Amsterdam",
  "Marrakech",
];

export function HostNew() {
  const { addListing } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("France");
  const [type, setType] = useState<PropertyType>("Villa");
  const [price, setPrice] = useState(180);
  const [guests, setGuests] = useState(4);
  const [bedrooms, setBedrooms] = useState(2);
  const [beds, setBeds] = useState(3);
  const [baths, setBaths] = useState(1);
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(PHOTOS[0].src);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const monthlyEstimate = Math.round(price * 18 * 0.88);

  const validate = () => {
    const next: Record<string, string> = {};
    if (title.trim().length < 4) next.title = "Donnez un nom d'au moins 4 caractères.";
    if (!city.trim()) next.city = "Indiquez une ville.";
    if (!country.trim()) next.country = "Indiquez un pays.";
    if (price < 30) next.price = "Le prix minimum est de 30 € par nuit.";
    if (description.trim().length < 40) {
      next.description = "Décrivez le logement en 40 caractères minimum.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    const listing = addListing({
      title,
      city,
      country,
      type,
      pricePerNight: price,
      guests,
      bedrooms,
      beds,
      baths,
      photo,
      description,
    });
    toast.show("Votre logement est en ligne. Bienvenue parmi les hôtes !");
    navigate(`/listing/${listing.id}`);
  };

  return (
    <div className="host-new-page">
      <div className="container">
        <Link to="/host" className="back-link">
          <ArrowLeft size={16} /> Retour au tableau de bord
        </Link>

        <div className="host-new-head">
          <div>
            <p className="eyebrow">Devenir hôte</p>
            <h1>Mettez votre logement en ligne.</h1>
            <p className="page-lede">
              Trois informations suffisent pour commencer. Vous pourrez tout modifier
              ensuite.
            </p>
          </div>
        </div>

        <form className="host-new-grid" onSubmit={submit}>
          <div className="host-form">
            <section className="form-section">
              <div className="form-section-head">
                <span className="form-icon">
                  <Home size={18} />
                </span>
                <div>
                  <h2>Le logement</h2>
                  <p>Ce que verront les voyageurs en premier.</p>
                </div>
              </div>
              <div className="field-grid">
                <label className={`field field--full${errors.title ? " has-error" : ""}`}>
                  <span>Nom de l'annonce</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Ex. Mas des Lavandes, piscine et figuier"
                  />
                  {errors.title && <em className="field-error">{errors.title}</em>}
                </label>
                <label className={`field${errors.city ? " has-error" : ""}`}>
                  <span>Ville</span>
                  <input
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Gordes"
                    list="villes"
                  />
                  <datalist id="villes">
                    {CITIES.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                  {errors.city && <em className="field-error">{errors.city}</em>}
                </label>
                <label className={`field${errors.country ? " has-error" : ""}`}>
                  <span>Pays</span>
                  <input
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                  />
                  {errors.country && <em className="field-error">{errors.country}</em>}
                </label>
              </div>

              <div className="type-row">
                {TYPES.map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={`chip${type === item ? " is-active" : ""}`}
                    onClick={() => setType(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>

            <section className="form-section">
              <div className="form-section-head">
                <span className="form-icon">
                  <Users size={18} />
                </span>
                <div>
                  <h2>Capacité</h2>
                  <p>Pour que les voyageurs filtrent juste.</p>
                </div>
              </div>
              <div className="counter-grid">
                <Counter
                  icon={<Users size={16} />}
                  label="Voyageurs"
                  value={guests}
                  min={1}
                  max={16}
                  onChange={setGuests}
                />
                <Counter
                  icon={<BedDouble size={16} />}
                  label="Chambres"
                  value={bedrooms}
                  min={1}
                  max={10}
                  onChange={setBedrooms}
                />
                <Counter
                  icon={<BedDouble size={16} />}
                  label="Lits"
                  value={beds}
                  min={1}
                  max={16}
                  onChange={setBeds}
                />
                <Counter
                  icon={<Home size={16} />}
                  label="Salles de bain"
                  value={baths}
                  min={1}
                  max={8}
                  onChange={setBaths}
                />
              </div>
            </section>

            <section className="form-section">
              <div className="form-section-head">
                <span className="form-icon">
                  <Wallet size={18} />
                </span>
                <div>
                  <h2>Prix et revenus</h2>
                  <p>Vous fixez le prix, nous affichons le total aux voyageurs.</p>
                </div>
              </div>
              <label className={`field${errors.price ? " has-error" : ""}`}>
                <span>Prix par nuit (€)</span>
                <div className="price-input">
                  <input
                    type="number"
                    min={30}
                    max={2000}
                    value={price}
                    onChange={(event) => setPrice(Number(event.target.value) || 0)}
                  />
                  <em>€ / nuit</em>
                </div>
                {errors.price && <em className="field-error">{errors.price}</em>}
              </label>
              <div className="estimate">
                <div>
                  <span>Revenu mensuel estimé</span>
                  <strong>{eur(monthlyEstimate)}</strong>
                  <em>sur la base de 18 nuits louées</em>
                </div>
                <div>
                  <span>Vous gardez</span>
                  <strong>88 %</strong>
                  <em>dont frais de service 12 %</em>
                </div>
              </div>
            </section>

            <section className="form-section">
              <div className="form-section-head">
                <span className="form-icon">
                  <Sparkles size={18} />
                </span>
                <div>
                  <h2>Votre récit</h2>
                  <p>Deux paragraphes valent mieux qu'une liste.</p>
                </div>
              </div>
              <label className={`field${errors.description ? " has-error" : ""}`}>
                <span>Description</span>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="La maison, le quartier, ce qui rend le lieu unique…"
                />
                {errors.description && (
                  <em className="field-error">{errors.description}</em>
                )}
              </label>
            </section>

            <section className="form-section">
              <div className="form-section-head">
                <span className="form-icon">
                  <Camera size={18} />
                </span>
                <div>
                  <h2>La première photo</h2>
                  <p>Choisissez une ambiance, vous pourrez ajouter les vôtres.</p>
                </div>
              </div>
              <div className="photo-picker">
                {PHOTOS.map((item) => (
                  <button
                    type="button"
                    key={item.src}
                    className={photo === item.src ? "is-active" : ""}
                    onClick={() => setPhoto(item.src)}
                    aria-pressed={photo === item.src}
                  >
                    <img src={item.src} alt={item.label} loading="lazy" />
                    <span>
                      <Check size={13} /> {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <button type="submit" className="btn btn--primary btn--lg btn--block">
              Publier mon annonce <ArrowRight size={16} />
            </button>
            <p className="publish-note">
              En publiant, vous acceptez les conditions hôtes de Séjour. Aucun frais
              d'inscription.
            </p>
          </div>

          <aside className="host-preview">
            <div className="preview-card">
              <div className="preview-badge">Aperçu en direct</div>
              <div className="preview-media">
                <img src={photo} alt="" />
                <span className="heart-btn is-saved" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12 21s-7.5-4.7-9.5-9A5.3 5.3 0 0 1 12 5.6 5.3 5.3 0 0 1 21.5 12c-2 4.3-9.5 9-9.5 9Z" />
                  </svg>
                </span>
              </div>
              <div className="preview-body">
                <div className="preview-title">
                  <strong>{title.trim() || "Votre futur logement"}</strong>
                  <span className="rating-inline rating-inline--new">Nouveau</span>
                </div>
                <p>
                  <MapPin size={13} /> {city.trim() || "Ville"},{" "}
                  {country.trim() || "Pays"}
                </p>
                <p className="preview-meta">
                  {type} · {guests} voyageurs · {bedrooms}{" "}
                  {bedrooms > 1 ? "chambres" : "chambre"}
                </p>
                <p className="preview-price">
                  <strong>{eur(price || 0)}</strong> / nuit
                </p>
              </div>
            </div>

            <div className="preview-note">
              <Star size={15} />
              <p>
                Les annonces avec un titre évocateur et une photo lumineuse reçoivent en
                moyenne <strong>2,4× plus de demandes</strong>.
              </p>
            </div>

            <div className="preview-checks">
              <p>
                <Check size={14} /> Paiement sécurisé
              </p>
              <p>
                <Check size={14} /> Assistance 7 j/7
              </p>
              <p>
                <Check size={14} /> Annulation paramétrable
              </p>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}

function Counter({
  icon,
  label,
  value,
  min,
  max,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="counter">
      <span className="counter-label">
        {icon} {label}
      </span>
      <div className="stepper">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Diminuer ${label}`}
        >
          −
        </button>
        <span>{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Augmenter ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
