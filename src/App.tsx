import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import { Layout } from './components/Layout'
import { StoreProvider } from './lib/store'
import { Home } from './pages/Home'
import { Search } from './pages/Search'
import { ListingDetail } from './pages/ListingDetail'
import { Checkout } from './pages/Checkout'
import { Confirmation } from './pages/Confirmation'
import { Trips } from './pages/Trips'
import { Wishlist } from './pages/Wishlist'
import { Auth } from './pages/Auth'
import { Verify } from './pages/Verify'
import { Account } from './pages/Account'
import { Host } from './pages/Host'
import { NewListing } from './pages/NewListing'
import { Admin } from './pages/Admin'
import { Trust } from './pages/Trust'
import { Help } from './pages/Help'
import { NotFound } from './pages/NotFound'

export function App() {
  return (
    <ToastProvider>
      <StoreProvider>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
              <Route path="/checkout/:id" element={<Checkout />} />
              <Route path="/confirmation/:id" element={<Confirmation />} />
              <Route path="/trips" element={<Trips />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/signup" element={<Auth />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/account" element={<Account />} />
              <Route path="/host" element={<Host />} />
              <Route path="/host/new" element={<NewListing />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/trust" element={<Trust />} />
              <Route path="/help" element={<Help />} />
              <Route path="/hosting" element={<Navigate to="/host" replace />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </HashRouter>
      </StoreProvider>
    </ToastProvider>
  )
}
