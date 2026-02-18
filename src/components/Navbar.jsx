import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Package, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { user, isAuthenticated, logout, setShowAuthModal } = useAuth();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const navLinks = [
    { to: '/essence', label: 'The Essence' },
    { to: '/gallery', label: 'Collection' },
  ];

  return (
    <>
      <nav className="fixed top-0 w-full z-[100] flex justify-between items-center px-6 md:px-12 py-8 backdrop-blur-md bg-black/10">
        {/* Logo */}
        <Link to="/" className="text-2xl font-serif tracking-tighter text-white">
          LUPORA
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex space-x-8 text-[10px] tracking-[0.3em] uppercase text-gray-400">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} className="hover:text-[#C5A059] transition-colors">
              {link.label}
            </Link>
          ))}
          <a href="https://www.instagram.com/lupora_perfumes/" target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A059]">Instagram</a>
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-5">
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-3">
              <Link to="/profile" className="text-gray-400 hover:text-[#C5A059] transition-colors" title="My Profile">
                <User size={18} strokeWidth={1.5} />
              </Link>
              <Link to="/orders" className="text-gray-400 hover:text-[#C5A059] transition-colors" title="My Orders">
                <Package size={18} strokeWidth={1.5} />
              </Link>
              <span className="text-gray-400 text-[10px] tracking-[0.2em] uppercase">
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
              className="hidden md:block text-white hover:text-[#C5A059] transition-colors"
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

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden text-white hover:text-[#C5A059] transition-colors"
            aria-label="Open menu"
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
              onClick={() => setMenuOpen(false)}
            />

            {/* Slide-in Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-72 bg-[#0a0a0a] z-[201] flex flex-col"
            >
              {/* Close Button */}
              <div className="flex justify-end p-6">
                <button
                  onClick={() => setMenuOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close menu"
                >
                  <X size={22} strokeWidth={1.5} />
                </button>
              </div>

              {/* Nav Links */}
              <div className="flex flex-col gap-6 px-8 mt-4">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-gray-300 text-[11px] tracking-[0.3em] uppercase hover:text-[#C5A059] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <a
                  href="https://www.instagram.com/lupora_perfumes/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 text-[11px] tracking-[0.3em] uppercase hover:text-[#C5A059] transition-colors"
                >
                  Instagram
                </a>
              </div>

              {/* Divider */}
              <div className="mx-8 my-8 h-px bg-white/10" />

              {/* Auth + Account Links */}
              <div className="flex flex-col gap-5 px-8">
                {isAuthenticated ? (
                  <>
                    <p className="text-[#C5A059] text-[10px] tracking-[0.3em] uppercase">{user.name}</p>
                    <Link to="/profile" className="text-gray-300 text-[11px] tracking-[0.3em] uppercase hover:text-[#C5A059] transition-colors">
                      My Profile
                    </Link>
                    <Link to="/orders" className="text-gray-300 text-[11px] tracking-[0.3em] uppercase hover:text-[#C5A059] transition-colors">
                      My Orders
                    </Link>
                    <Link to="/cart" className="text-gray-300 text-[11px] tracking-[0.3em] uppercase hover:text-[#C5A059] transition-colors">
                      Cart {totalItems > 0 && `(${totalItems})`}
                    </Link>
                    <button
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="text-left text-gray-500 text-[11px] tracking-[0.3em] uppercase hover:text-red-400 transition-colors mt-2"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setShowAuthModal(true); setMenuOpen(false); }}
                    className="text-left text-gray-300 text-[11px] tracking-[0.3em] uppercase hover:text-[#C5A059] transition-colors"
                  >
                    Sign In
                  </button>
                )}
              </div>

              {/* Footer */}
              <div className="mt-auto px-8 pb-8">
                <div className="h-px bg-white/10 mb-6" />
                <p className="text-gray-700 text-[8px] tracking-[0.3em] uppercase">
                  © 2025 Lupora Perfumes
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
