import { motion } from 'framer-motion';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-[100] flex justify-between items-center px-12 py-8 backdrop-blur-md bg-black/10">
      <div className="text-2xl font-serif tracking-tighter text-white">LUPORA</div>
      <div className="hidden md:flex space-x-8 text-[10px] tracking-[0.3em] uppercase text-gray-400">
        <a href="#" className="hover:text-[#C5A059]">The Essence</a>
        <a href="#" className="hover:text-[#C5A059]">Collection</a>
        <a href="https://www.instagram.com/lupora_perfumes/" target="_blank" className="hover:text-[#C5A059]">Instagram</a>
      </div>
      <button className="text-[10px] tracking-widest border border-white/20 px-6 py-2 hover:bg-[#C5A059] transition-all">SHOP</button>
    </nav>
  );
}