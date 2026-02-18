import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
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
  const [addedId, setAddedId] = useState(null);
  const { addToCart } = useCart();
  const { isAuthenticated, setShowAuthModal } = useAuth();

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    try {
      setAddedId(productId);
      await addToCart(productId);
      setTimeout(() => setAddedId(null), 1500);
    } catch (err) {
      console.error('Add to cart failed:', err);
      setAddedId(null);
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
              <Link to={`/product/${product._id || product.id}`} className="block overflow-hidden aspect-[3/4] bg-neutral-900 relative cursor-pointer">
                <img
                  src={`/lupora-web-experience${product.image}`}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                  <span className="px-8 py-3 border border-white text-white text-[10px] tracking-widest uppercase">
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
                <button
                  onClick={() => handleAddToCart(product._id)}
                  className="mt-4 flex items-center gap-2 px-6 py-3 border border-white/20 text-white text-[10px] tracking-widest uppercase hover:bg-[#C5A059] hover:border-[#C5A059] hover:text-black transition-all duration-500"
                >
                  {addedId === product._id ? (
                    'Added to Cart'
                  ) : (
                    <>
                      <ShoppingBag size={14} strokeWidth={1.5} />
                      Add to Cart
                    </>
                  )}
                </button>
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
