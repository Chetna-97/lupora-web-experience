import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import Features from './components/Features';
import Gallery from './components/Gallery';
import GalleryPage from './components/GalleryPage';
import Footer from "./components/Footer.jsx";

function HomePage() {
  const scrollToGallery = () => {
    document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main>
      <Navbar />
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
      <section id="footer">
        <Footer />
      </section>
    </main>
  );
}

function App() {
  return (
    <Router basename="/lupora-web-experience">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gallery" element={<GalleryPage />} />
      </Routes>
    </Router>
  );
}

export default App;