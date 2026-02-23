import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import AuthModal from './components/AuthModal';
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import Features from './components/Features';
import Gallery from './components/Gallery';
import ErrorBoundary from './components/ErrorBoundary';
import Footer from "./components/Footer.jsx";

// Lazy-load pages that aren't needed on initial homepage render
const GalleryPage = lazy(() => import('./components/GalleryPage'));
const CartPage = lazy(() => import('./components/CartPage'));
const ProductDetailPage = lazy(() => import('./components/ProductDetailPage'));
const CheckoutPage = lazy(() => import('./components/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./components/OrderConfirmationPage'));
const OrdersPage = lazy(() => import('./components/OrdersPage'));
const EssencePage = lazy(() => import('./components/EssencePage'));
const PrivacyPage = lazy(() => import('./components/PrivacyPage'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const ShippingPage = lazy(() => import('./components/ShippingPage'));
const ResetPasswordPage = lazy(() => import('./components/ResetPasswordPage'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function HomePage() {
  const scrollToGallery = () => {
    document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main>
      <section id="hero">
        <Hero />
      </section>
      <section id="gallery">
        <Gallery limit={4} />
      </section>
      <section id="features">
        <Features />
      </section>
      <section id="essence" className="py-40 bg-inverse text-inverse-fg flex flex-col items-center px-6">
        <h2 className="text-4xl font-serif mb-6 italic">The Essence of Elegance</h2>
        <p className="max-w-2xl text-center text-inverse-subtle leading-loose">
          Inspired by the timeless beauty found in nature, LUPORA crafts scents
          that resonate with the soul. Explore our collection on Instagram.
        </p>
        <button
          onClick={scrollToGallery}
          className="mt-10 px-8 py-3 bg-surface text-foreground uppercase tracking-widest text-xs hover:bg-accent transition-colors cursor-pointer"
        >
          View Gallery
        </button>
      </section>
    </main>
  );
}

function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
    <AuthProvider>
      <CartProvider>
        <Router basename="/lupora-web-experience">
          <Navbar />
          <AuthModal />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/essence" element={<EssencePage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/shipping" element={<ShippingPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
          <Footer />
        </Router>
      </CartProvider>
    </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
