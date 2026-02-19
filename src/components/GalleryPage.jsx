import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingBag, Check, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { assetUrl } from '../utils/api';
import usePageTitle from '../utils/usePageTitle';

function ProductSkeleton() {
  return (
    <div className="relative">
      <div className="aspect-[3/4] bg-neutral-800 animate-pulse rounded" />
      <div className="mt-6">
        <div className="h-2 w-24 bg-neutral-800 animate-pulse rounded mb-3" />
        <div className="h-4 w-36 bg-neutral-800 animate-pulse rounded" />
      </div>
    </div>
  );
}

export default function GalleryPage() {
  usePageTitle('Collection');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const { addToCart, items: cartItems } = useCart();
  const { isAuthenticated, setShowAuthModal } = useAuth();

  const getQuantity = (productId) => quantities[productId] || 1;

  const updateQty = (productId, delta) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    try {
      await addToCart(productId, getQuantity(productId));
      setQuantities(prev => { const n = { ...prev }; delete n[productId]; return n; });
    } catch (err) {
      console.error('Add to cart failed:', err);
    }
  };

  useEffect(() => {
    const getProducts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products`);
        if (!response.ok) throw new Error("Server response was not ok");
        const data = await response.json();
        setProducts(data);
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
    <div className="min-h-screen bg-black pt-24">
      {/* Gallery Content */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[#C5A059] uppercase tracking-[0.5em] text-[10px] mb-4"
            >
              Complete Collection
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white text-5xl md:text-7xl font-serif italic"
            >
              Our Gallery
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 mt-6 max-w-2xl mx-auto text-sm leading-loose"
            >
              Explore our complete collection of signature fragrances, each crafted with the finest ingredients from around the world.
            </motion.p>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {loading ? (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </>
            ) : (
              products.map((product, index) => (
                <motion.div
                  key={product._id || product.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative group"
                >
                  <Link to={`/product/${product._id || product.id}`} className="block overflow-hidden aspect-[3/4] bg-neutral-900 relative cursor-pointer rounded-2xl border border-white/5 hover:border-[#C5A059]/30 transition-all duration-700 shadow-lg shadow-black/40">
                    <img
                      src={assetUrl(product.image)}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-8 rounded-2xl">
                      <span className="px-8 py-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white text-[10px] tracking-widest uppercase rounded-full">
                        View Details
                      </span>
                    </div>
                  </Link>

                  <div className="mt-6">
                    <p className="text-[#C5A059] text-[9px] uppercase tracking-[0.3em] mb-2">
                      {product.category}
                    </p>
                    <h3 className="text-white text-xl font-serif tracking-tight">
                      {product.name}
                    </h3>
                    {product.price && (
                      <p className="text-gray-400 text-sm mt-2 tracking-wider">
                        &#8377;{product.price.toLocaleString('en-IN')}
                      </p>
                    )}
                    {cartItems.some(ci => ci.productId === product._id) ? (
                      <Link
                        to="/cart"
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-xs tracking-wide rounded-full hover:bg-[#C5A059]/20 transition-all duration-300"
                      >
                        <Check size={13} strokeWidth={2.5} />
                        In Cart
                      </Link>
                    ) : (
                      <div className="mt-4 flex items-center gap-2">
                        <div className="flex items-center border border-white/15 rounded-full">
                          <button
                            onClick={() => updateQty(product._id, -1)}
                            disabled={getQuantity(product._id) <= 1}
                            className="px-2.5 py-2 text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="text-white text-xs w-6 text-center">
                            {getQuantity(product._id)}
                          </span>
                          <button
                            onClick={() => updateQty(product._id, 1)}
                            className="px-2.5 py-2 text-gray-500 hover:text-white transition-colors"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                        <button
                          onClick={() => handleAddToCart(product._id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 border border-white/15 text-white text-xs tracking-wide rounded-full hover:bg-[#C5A059] hover:border-[#C5A059] hover:text-black transition-all duration-300"
                        >
                          <ShoppingBag size={13} strokeWidth={1.5} />
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Back to Home Button */}
          <div className="flex justify-center mt-20">
            <Link
              to="/"
              className="px-12 py-4 border border-white/20 text-white text-[9px] tracking-[0.5em] uppercase hover:bg-white hover:text-black transition-all duration-700"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
