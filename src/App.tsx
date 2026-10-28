import { useEffect } from "react";
import {
  HashRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Explore } from "./pages/Explore";
import { Search } from "./pages/Search";
import { ListingDetail } from "./pages/ListingDetail";
import { Checkout } from "./pages/Checkout";
import { Confirmation } from "./pages/Confirmation";
import { Trips } from "./pages/Trips";
import { Wishlist } from "./pages/Wishlist";
import { Messages } from "./pages/Messages";
import { Host } from "./pages/Host";
import { HostNew } from "./pages/HostNew";

function Shell() {
  const location = useLocation();
  const hideFooter =
    location.pathname.startsWith("/messages") ||
    location.pathname.startsWith("/checkout");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Aller au contenu
      </a>
      <Header />
      <main id="main">
        <Routes>
          <Route path="/" element={<Explore />} />
          <Route path="/search" element={<Search />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/checkout/:id" element={<Checkout />} />
          <Route path="/confirmation/:bookingId" element={<Confirmation />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:conversationId" element={<Messages />} />
          <Route path="/host" element={<Host />} />
          <Route path="/host/new" element={<HostNew />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

function NotFound() {
  return (
    <div className="container empty-state empty-state--page">
      <span className="eyebrow">Erreur 404</span>
      <h1>Cette page a pris le large.</h1>
      <p>Le lien est peut-être ancien, ou la page n'existe pas encore.</p>
      <Link to="/" className="btn btn--primary">
        Revenir à l'accueil
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
