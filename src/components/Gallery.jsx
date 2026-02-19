import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingBag, Check, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { assetUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function ProductSkeleton({ offset }) {
  return (
    <div className={`relative ${offset ? 'md:mt-32' : ''}`}>
      <div className="aspect-[3/4] bg-neutral-800 animate-pulse rounded" />
      <div className="mt-8">
        <div className="h-2 w-24 bg-neutral-800 animate-pulse rounded mb-3" />
        <div className="h-5 w-40 bg-neutral-800 animate-pulse rounded" />
      </div>
    </div>
  );
}

export default function Gallery({ limit }) {
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
        console.error("❌ Frontend Fetch Error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    getProducts();
  }, []);

  // Apply limit if provided
  const displayProducts = limit ? products.slice(0, limit) : products;

  return (
    <section className="bg-black py-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-[#C5A059] uppercase tracking-[0.5em] text-[10px] mb-4"
          >
            Curated Collections
          </motion.p>
          <h2 className="text-white text-5xl md:text-7xl font-serif italic">Our Gallery</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
          {loading ? (
            <>
              {Array.from({ length: limit || 4 }).map((_, i) => (
                <ProductSkeleton key={i} offset={i % 2 !== 0} />
              ))}
            </>
          ) : displayProducts.length > 0 ? displayProducts.map((product, index) => (
            <motion.div
              key={product._id || product.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: index * 0.2 }}
              viewport={{ once: true }}
              className={`relative group ${index % 2 !== 0 ? 'md:mt-32' : ''}`}
            >
              <Link to={`/product/${product._id || product.id}`} className="block overflow-hidden aspect-[3/4] bg-neutral-900 relative cursor-pointer rounded-2xl border border-white/5 hover:border-[#C5A059]/30 transition-all duration-700 shadow-lg shadow-black/40">
                <img
                  src={assetUrl(product.image)}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-8">
                  <span className="px-8 py-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white text-[10px] tracking-widest uppercase rounded-full">
                    View Details
                  </span>
                </div>
              </Link>

              <div className="mt-8">
                <p className="text-[#C5A059] text-[9px] uppercase tracking-[0.3em] mb-2">
                  {product.category}
                </p>
                <h3 className="text-white text-2xl font-serif tracking-tight">
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
          )) : (
            <p className="text-gray-500">No products found in database.</p>
          )}
        </div>

        {/* Show "View All" button only on homepage (when limit is set) */}
        {limit && products.length > limit && (
          <div className="flex justify-center mt-16">
            <Link
              to="/gallery"
              className="px-12 py-4 border border-white/20 text-white text-[9px] tracking-[0.5em] uppercase hover:bg-white hover:text-black transition-all duration-700"
            >
              View All Collection
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
