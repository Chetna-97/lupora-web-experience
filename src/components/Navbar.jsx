import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { totalItems } = useCart();
  const { user, isAuthenticated, logout, setShowAuthModal } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-[100] flex justify-between items-center px-6 md:px-12 py-8 backdrop-blur-md bg-black/10">
      <div className="text-2xl font-serif tracking-tighter text-white">LUPORA</div>
      <div className="hidden md:flex space-x-8 text-[10px] tracking-[0.3em] uppercase text-gray-400">
        <a href="#" className="hover:text-[#C5A059]">The Essence</a>
        <Link to="/gallery" className="hover:text-[#C5A059]">Collection</Link>
        <a href="https://www.instagram.com/lupora_perfumes/" target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A059]">Instagram</a>
      </div>
      <div className="flex items-center gap-5">
        {/* User Auth */}
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <Link to="/orders" className="text-gray-400 hover:text-[#C5A059] transition-colors" title="My Orders">
              <Package size={18} strokeWidth={1.5} />
            </Link>
            <span className="hidden md:block text-gray-400 text-[10px] tracking-[0.2em] uppercase">
              {user.name}
            </span>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-[#C5A059] transition-colors"
              title="Sign out"
            >
              <LogOut size={18} strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="text-white hover:text-[#C5A059] transition-colors"
            title="Sign in"
          >
            <User size={20} strokeWidth={1.5} />
          </button>
        )}

        {/* Cart */}
        <Link to="/cart" className="relative group">
          <ShoppingBag
            size={20}
            className="text-white group-hover:text-[#C5A059] transition-colors"
            strokeWidth={1.5}
          />
          {totalItems > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-[#C5A059] text-black text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
            >
              {totalItems}
            </motion.span>
          )}
        </Link>
      </div>
    </nav>
  );
}
