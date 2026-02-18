import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#050505] text-white py-20 px-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="max-w-sm">
          <h2 className="text-3xl font-serif text-[#C5A059] mb-4">LUPORA</h2>
          <p className="text-gray-500 text-sm leading-relaxed uppercase tracking-widest">Natural botanicals. Eternal elegance.</p>
        </div>
        <div className="flex flex-col space-y-4 text-[10px] tracking-widest uppercase text-gray-400">
          <Link to="/privacy" className="hover:text-white">Privacy</Link>
          <a href="https://www.instagram.com/lupora_perfumes/" className="text-[#C5A059]">@lupora_perfumes</a>
        </div>
      </div>
      <div className="mt-20 text-center text-[8px] tracking-[0.5em] text-gray-800 uppercase">© 2025 LUPORA PERFUMES</div>
    </footer>
  );
}