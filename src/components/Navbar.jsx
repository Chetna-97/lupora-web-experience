import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Package, Menu, X, Search, Sun, Moon } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { assetUrl } from '../utils/api';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const { totalItems } = useCart();
  const { user, isAuthenticated, logout, setShowAuthModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu and search on route change
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setQuery('');
    setResults([]);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/products/search?q=${encodeURIComponent(query.trim())}`
        );
        if (res.ok) setResults(await res.json());
      } catch { /* silent */ }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setQuery('');
        setResults([]);
      }
    };
    if (searchOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen]);

  const handleResultClick = (productId) => {
    navigate(`/product/${productId}`);
    setSearchOpen(false);
    setQuery('');
    setResults([]);
  };

  const navLinks = [
    { to: '/essence', label: 'The Essence' },
    { to: '/gallery', label: 'Collection' },
  ];

  return (
    <>
      <nav className="fixed top-0 w-full z-[100] flex justify-between items-center px-6 md:px-12 py-8 backdrop-blur-md bg-surface/60">
        {/* Logo */}
        <Link to="/" className="text-2xl font-serif tracking-tighter text-foreground">
          LUPORA
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex space-x-8 text-[10px] tracking-[0.3em] uppercase text-muted">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} className="hover:text-accent transition-colors">
              {link.label}
            </Link>
          ))}
          <a href="https://www.instagram.com/lupora_perfumes/" target="_blank" rel="noopener noreferrer" className="hover:text-accent">Instagram</a>
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-5">
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-3">
              <Link to="/profile" className="text-muted hover:text-accent transition-colors" title="My Profile">
                <User size={18} strokeWidth={1.5} />
              </Link>
              <Link to="/orders" className="text-muted hover:text-accent transition-colors" title="My Orders">
                <Package size={18} strokeWidth={1.5} />
              </Link>
              <span className="text-muted text-[10px] tracking-[0.2em] uppercase">
                {user.name}
              </span>
              <button
                onClick={logout}
                className="text-muted hover:text-accent transition-colors"
                title="Sign out"
              >
                <LogOut size={18} strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="hidden md:block text-foreground hover:text-accent transition-colors"
              title="Sign in"
            >
              <User size={20} strokeWidth={1.5} />
            </button>
          )}

          {/* Search */}
          <div className="relative hidden md:block" ref={searchRef}>
            <button
              onClick={() => setSearchOpen(prev => !prev)}
              className="text-muted hover:text-accent transition-colors"
              aria-label="Search"
            >
              <Search size={18} strokeWidth={1.5} />
            </button>

            <AnimatePresence>
              {searchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-10 w-80 bg-surface-raised border border-foreground/10 rounded-xl shadow-2xl z-[300] overflow-hidden"
                >
                  <div className="p-3 border-b border-foreground/5">
                    <div className="flex items-center gap-2">
                      <Search size={14} className="text-subtle flex-shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search fragrances..."
                        className="flex-1 bg-transparent text-foreground text-xs tracking-wide placeholder-faint focus:outline-none"
                      />
                      {query && (
                        <button onClick={() => { setQuery(''); setResults([]); }} aria-label="Clear search">
                          <X size={13} className="text-subtle hover:text-foreground" />
                        </button>
                      )}
                    </div>
                  </div>

                  {searching && (
                    <div className="p-4 text-center">
                      <div className="w-4 h-4 border border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                  )}

                  {!searching && results.length > 0 && (
                    <ul>
                      {results.map(product => (
                        <li key={product._id}>
                          <button
                            onClick={() => handleResultClick(product._id)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-foreground/5 transition-colors text-left"
                          >
                            <div className="w-10 h-12 bg-dim rounded overflow-hidden flex-shrink-0">
                              <img
                                src={assetUrl(product.image)}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="text-foreground text-xs font-serif">{product.name}</p>
                              <p className="text-accent text-[9px] uppercase tracking-widest">{product.category}</p>
                              {product.price && (
                                <p className="text-muted text-[10px] mt-0.5">
                                  &#8377;{product.price.toLocaleString('en-IN')}
                                </p>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {!searching && query.trim().length >= 2 && results.length === 0 && (
                    <p className="p-4 text-faint text-xs text-center tracking-wide">No fragrances found</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="relative text-muted hover:text-accent transition-colors"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <AnimatePresence mode="wait">
              {theme === 'dark' ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, scale: 0, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <Sun size={18} strokeWidth={1.5} />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, scale: 0, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: -90, scale: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <Moon size={18} strokeWidth={1.5} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Cart */}
          <Link to="/cart" className="relative group">
            <ShoppingBag
              size={20}
              className="text-foreground group-hover:text-accent transition-colors"
              strokeWidth={1.5}
            />
            {totalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-accent text-inverse-fg text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
              >
                {totalItems}
              </motion.span>
            )}
          </Link>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden text-foreground hover:text-accent transition-colors"
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
              className="fixed top-0 right-0 h-full w-72 bg-surface-alt z-[201] flex flex-col"
            >
              {/* Close Button */}
              <div className="flex justify-end p-6">
                <button
                  onClick={() => setMenuOpen(false)}
                  className="text-muted hover:text-foreground transition-colors"
                  aria-label="Close menu"
                >
                  <X size={22} strokeWidth={1.5} />
                </button>
              </div>

              {/* Mobile Search */}
              <div className="px-8 mb-4">
                <div className="flex items-center gap-2 border-b border-foreground/10 pb-3">
                  <Search size={13} className="text-subtle" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search..."
                    className="flex-1 bg-transparent text-foreground text-xs tracking-wide placeholder-faint focus:outline-none"
                  />
                </div>
                {results.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {results.map(product => (
                      <li key={product._id}>
                        <button
                          onClick={() => { handleResultClick(product._id); setMenuOpen(false); }}
                          className="w-full text-left text-foreground-2 text-[11px] tracking-[0.2em] uppercase py-1.5 hover:text-accent transition-colors"
                        >
                          {product.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {!searching && query.trim().length >= 2 && results.length === 0 && (
                  <p className="text-faint text-[10px] mt-2">No results</p>
                )}
              </div>

              {/* Nav Links */}
              <div className="flex flex-col gap-6 px-8 mt-4">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-foreground-2 text-[11px] tracking-[0.3em] uppercase hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <a
                  href="https://www.instagram.com/lupora_perfumes/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground-2 text-[11px] tracking-[0.3em] uppercase hover:text-accent transition-colors"
                >
                  Instagram
                </a>
              </div>

              {/* Divider */}
              <div className="mx-8 my-8 h-px bg-foreground/10" />

              {/* Theme Toggle — Mobile */}
              <div className="px-8 mb-6">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-3 text-foreground-2 text-[11px] tracking-[0.3em] uppercase hover:text-accent transition-colors"
                >
                  {theme === 'dark' ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
              </div>

              {/* Auth + Account Links */}
              <div className="flex flex-col gap-5 px-8">
                {isAuthenticated ? (
                  <>
                    <p className="text-accent text-[10px] tracking-[0.3em] uppercase">{user.name}</p>
                    <Link to="/profile" className="text-foreground-2 text-[11px] tracking-[0.3em] uppercase hover:text-accent transition-colors">
                      My Profile
                    </Link>
                    <Link to="/orders" className="text-foreground-2 text-[11px] tracking-[0.3em] uppercase hover:text-accent transition-colors">
                      My Orders
                    </Link>
                    <Link to="/cart" className="text-foreground-2 text-[11px] tracking-[0.3em] uppercase hover:text-accent transition-colors">
                      Cart {totalItems > 0 && `(${totalItems})`}
                    </Link>
                    <button
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="text-left text-subtle text-[11px] tracking-[0.3em] uppercase hover:text-red-400 transition-colors mt-2"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setShowAuthModal(true); setMenuOpen(false); }}
                    className="text-left text-foreground-2 text-[11px] tracking-[0.3em] uppercase hover:text-accent transition-colors"
                  >
                    Sign In
                  </button>
                )}
              </div>

              {/* Footer */}
              <div className="mt-auto px-8 pb-8">
                <div className="h-px bg-foreground/10 mb-6" />
                <p className="text-dim text-[8px] tracking-[0.3em] uppercase">
                  &copy; 2025 Lupora Perfumes
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
