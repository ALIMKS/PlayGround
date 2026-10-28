import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  CalendarCheck,
  Heart,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Plus,
  X,
} from "lucide-react";
import { useStore } from "../store";

const NAV = [
  { to: "/", label: "Explorer", end: true },
  { to: "/wishlist", label: "Favoris" },
  { to: "/trips", label: "Voyages" },
  { to: "/messages", label: "Messages" },
];

export function Header() {
  const { user, conversations } = useStore();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const unread = conversations.reduce((sum, conversation) => sum + conversation.unread, 0);

  useEffect(() => {
    setProfileOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setProfileOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand" aria-label="Séjour, accueil">
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

        <nav className="main-nav" aria-label="Navigation principale">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {item.label}
              {item.to === "/messages" && unread > 0 && (
                <span className="nav-badge">{unread}</span>
              )}
            </NavLink>
          ))}
          <NavLink to="/host">Hôte</NavLink>
        </nav>

        <div className="header-actions">
          <Link className="header-host-link" to="/host/new">
            <Plus size={15} />
            Mettre mon logement en ligne
          </Link>

          <div className="profile-wrap" ref={wrapRef}>
            <button
              type="button"
              className="profile-btn"
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
              aria-label="Menu du profil"
            >
              <Menu size={16} strokeWidth={2} />
              <span className="avatar avatar--sm">{user.initials}</span>
            </button>
            {profileOpen && (
              <div className="popover profile-menu">
                <div className="profile-head">
                  <span className="avatar">{user.initials}</span>
                  <div>
                    <strong>Bonjour {user.firstName}</strong>
                    <em>{user.email}</em>
                  </div>
                </div>
                <div className="profile-links">
                  <Link to="/trips">
                    <CalendarCheck size={16} /> Mes voyages
                  </Link>
                  <Link to="/wishlist">
                    <Heart size={16} /> Mes favoris
                  </Link>
                  <Link to="/messages">
                    <MessageCircle size={16} /> Messages
                    {unread > 0 && <span className="nav-badge">{unread}</span>}
                  </Link>
                  <Link to="/host">
                    <LayoutDashboard size={16} /> Tableau de bord hôte
                  </Link>
                  <Link to="/host/new">
                    <Plus size={16} /> Ajouter un logement
                  </Link>
                </div>
                <p className="profile-note">
                  Espace de démonstration — vos actions sont enregistrées dans ce navigateur.
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            className="mobile-toggle"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-label="Ouvrir le menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="mobile-menu">
          <div className="container">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {item.label}
                {item.to === "/messages" && unread > 0 && (
                  <span className="nav-badge">{unread}</span>
                )}
              </NavLink>
            ))}
            <NavLink to="/host">Tableau de bord hôte</NavLink>
            <Link to="/host/new" className="btn btn--primary btn--block">
              Mettre mon logement en ligne
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
