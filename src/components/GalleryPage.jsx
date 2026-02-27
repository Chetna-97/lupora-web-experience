import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { assetUrl } from '../utils/api';
import usePageTitle from '../utils/usePageTitle';
import PriceDisplay from './PriceDisplay';

function ProductSkeleton() {
  return (
    <div className="relative">
      <div className="aspect-[3/4] bg-dim animate-pulse rounded" />
      <div className="mt-6">
        <div className="h-2 w-24 bg-dim animate-pulse rounded mb-3" />
        <div className="h-4 w-36 bg-dim animate-pulse rounded" />
      </div>
    </div>
  );
}

export default function GalleryPage() {
  usePageTitle('Collection');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const { addToCart, updateQuantity, removeFromCart, items: cartItems } = useCart();
  const { isAuthenticated, setShowAuthModal } = useAuth();
  const busyRef = useRef(false);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map(p => p.category))).sort()],
    [products]
  );

  const filteredProducts = useMemo(
    () => activeCategory === 'All'
      ? products
      : products.filter(p => p.category === activeCategory),
    [products, activeCategory]
  );

  const handleQtyChange = async (productId, currentQty, delta) => {
    if (busyRef.current) return;
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    busyRef.current = true;
    const newQty = currentQty + delta;
    try {
      const cartItem = cartItems.find(ci => ci.productId === productId && (ci.size === '50ml' || ci.size === null));
      if (cartItem) {
        if (newQty < 1) {
          await removeFromCart(productId, '50ml');
        } else {
          await updateQuantity(productId, newQty, '50ml');
        }
      } else {
        await addToCart(productId, 1, '50ml');
      }
    } catch (err) {
      console.error('Cart update failed:', err);
    } finally {
      busyRef.current = false;
    }
  };

  useEffect(() => {
    const getProducts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products`);
        if (!response.ok) throw new Error("Server response was not ok");
        const data = await response.json();
        setProducts(data.filter(p => p.image));
      } catch (err) {
        console.error("Failed to fetch products:", err.message);
      } finally {
        setLoading(false);
      }
    };
    getProducts();
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-surface pt-24">
      {/* Gallery Content */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-accent uppercase tracking-[0.5em] text-[10px] mb-4"
            >
              Complete Collection
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-foreground text-5xl md:text-7xl font-serif italic"
            >
              Our Gallery
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted mt-6 max-w-2xl mx-auto text-sm leading-loose"
            >
              Explore our complete collection of signature fragrances, each crafted with the finest ingredients from around the world.
            </motion.p>
          </div>

          {/* Category Filter Tabs */}
          {!loading && categories.length > 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-3 mb-12"
            >
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2 text-[9px] tracking-[0.4em] uppercase transition-all duration-300 rounded-full border ${
                    activeCategory === cat
                      ? 'bg-accent border-accent text-black font-medium'
                      : 'border-foreground/15 text-muted hover:border-accent/50 hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </motion.div>
          )}

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {loading ? (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredProducts.length > 0 ? filteredProducts.map((product, index) => (
                  <motion.div
                    key={product._id || product.id}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="relative group"
                  >
                    <Link to={`/product/${product._id || product.id}`} className="block overflow-hidden aspect-[3/4] bg-surface-alt relative cursor-pointer rounded-2xl border border-foreground/5 hover:border-accent/30 transition-all duration-700 shadow-lg shadow-black/40">
                      <img
                        src={assetUrl(product.image)}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                      />
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded-2xl">
                          <span className="px-6 py-2 border border-white/30 text-white text-[9px] tracking-[0.4em] uppercase bg-black/40 backdrop-blur-sm">
                            Sold Out
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-8 rounded-2xl">
                        <span className="px-8 py-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white text-[10px] tracking-widest uppercase rounded-full">
                          View Details
                        </span>
                      </div>
                    </Link>

                    <div className="mt-6">
                      <p className="text-accent text-[9px] uppercase tracking-[0.3em] mb-2">
                        {product.category}
                      </p>
                      <h3 className="text-foreground text-xl font-serif tracking-tight">
                        {product.name}
                      </h3>
                      {product.price && (
                        <div className="mt-2">
                          <PriceDisplay price={product.price} originalPrice={product.originalPrice} />
                        </div>
                      )}
                      {product.stock === 0 ? (
                        <p className="mt-4 text-[9px] uppercase tracking-[0.4em] text-faint">Sold Out</p>
                      ) : (() => {
                        const cartItem = cartItems.find(ci => ci.productId === product._id && (ci.size === '50ml' || ci.size === null));
                        const inCart = !!cartItem;
                        const displayQty = inCart ? cartItem.quantity : 0;
                        return (
                          <div className="mt-4 flex items-center gap-2">
                            <div className={`flex items-center border ${inCart ? 'border-accent/30' : 'border-foreground/15'} rounded-full`}>
                              <button
                                onClick={() => handleQtyChange(product._id, displayQty, -1)}
                                disabled={!inCart}
                                aria-label={`Decrease quantity of ${product.name}`}
                                className="px-2.5 py-2 text-subtle hover:text-foreground disabled:opacity-30 transition-colors"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="text-foreground text-xs w-6 text-center" aria-label={`Quantity: ${displayQty}`}>
                                {displayQty}
                              </span>
                              <button
                                onClick={() => handleQtyChange(product._id, displayQty, 1)}
                                aria-label={`Increase quantity of ${product.name}`}
                                className="px-2.5 py-2 text-subtle hover:text-foreground transition-colors"
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                            {inCart && (
                              <Link
                                to="/cart"
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent/10 border border-accent/30 text-accent text-xs tracking-wide rounded-full hover:bg-accent/20 transition-all duration-300"
                              >
                                <Check size={13} strokeWidth={2.5} />
                                In Cart
                              </Link>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </motion.div>
                )) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-3 text-center py-20"
                  >
                    <p className="text-faint text-sm tracking-widest uppercase">No products in this category</p>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Back to Home Button */}
          <div className="flex justify-center mt-20">
            <Link
              to="/"
              className="px-12 py-4 border border-foreground/20 text-foreground text-[9px] tracking-[0.5em] uppercase hover:bg-foreground hover:text-surface transition-all duration-700"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
