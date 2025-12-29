import React from 'react';
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import Features from './components/Features';
import Footer from "./components/Footer.jsx";

function App() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Features />
      <section className="py-40 bg-white text-black flex flex-col items-center px-6">
        <h2 className="text-4xl font-serif mb-6 italic">The Essence of Elegance</h2>
        <p className="max-w-2xl text-center text-gray-600 leading-loose">
          Inspired by the timeless beauty found in nature, LUPORA crafts scents 
          that resonate with the soul. Explore our collection on Instagram.
        </p>
        <a 
          href="https://www.instagram.com/lupora_perfumes/" 
          target="_blank" 
          className="mt-10 px-8 py-3 bg-black text-white uppercase tracking-widest text-xs hover:bg-[#C5A059] transition-colors"
        >
          View Gallery
        </a>
      </section>
      <Footer />
    </main>
  );
}

export default App;