import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import AuthModal from './components/AuthModal';
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import Features from './components/Features';
import Gallery from './components/Gallery';
import GalleryPage from './components/GalleryPage';
import CartPage from './components/CartPage';
import ProductDetailPage from './components/ProductDetailPage';
import CheckoutPage from './components/CheckoutPage';
import OrderConfirmationPage from './components/OrderConfirmationPage';
import OrdersPage from './components/OrdersPage';
import EssencePage from './components/EssencePage';
import PrivacyPage from './components/PrivacyPage';
import ProfilePage from './components/ProfilePage';
import ShippingPage from './components/ShippingPage';
import NotFoundPage from './components/NotFoundPage';
import Footer from "./components/Footer.jsx";

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
      <section id="essence" className="py-40 bg-white text-black flex flex-col items-center px-6">
        <h2 className="text-4xl font-serif mb-6 italic">The Essence of Elegance</h2>
        <p className="max-w-2xl text-center text-gray-600 leading-loose">
          Inspired by the timeless beauty found in nature, LUPORA crafts scents
          that resonate with the soul. Explore our collection on Instagram.
        </p>
        <button
          onClick={scrollToGallery}
          className="mt-10 px-8 py-3 bg-black text-white uppercase tracking-widest text-xs hover:bg-[#C5A059] transition-colors cursor-pointer"
        >
          View Gallery
        </button>
      </section>
    </main>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router basename="/lupora-web-experience">
          <Navbar />
          <AuthModal />
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
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Footer />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;