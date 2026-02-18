import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
      <div className="aspect-[3/4] bg-neutral-800 animate-pulse" />
      <div className="flex flex-col justify-center py-8">
        <div className="h-2 w-24 bg-neutral-800 animate-pulse rounded mb-4" />
        <div className="h-10 w-64 bg-neutral-800 animate-pulse rounded mb-6" />
        <div className="h-6 w-32 bg-neutral-800 animate-pulse rounded mb-8" />
        <div className="space-y-3 mb-10">
          <div className="h-3 w-full bg-neutral-800 animate-pulse rounded" />
          <div className="h-3 w-5/6 bg-neutral-800 animate-pulse rounded" />
          <div className="h-3 w-4/6 bg-neutral-800 animate-pulse rounded" />
        </div>
        <div className="h-14 w-48 bg-neutral-800 animate-pulse rounded" />
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated, setShowAuthModal } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`);
        if (!response.ok) throw new Error('Product not found');
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        console.error('Failed to fetch product:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    try {
      setAdded(true);
      await addToCart(product._id, quantity);
      setTimeout(() => setAdded(false), 1500);
    } catch (err) {
      console.error('Add to cart failed:', err);
      setAdded(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-24">
      {/* Product Detail */}
      <section className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <DetailSkeleton />
          ) : !product ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-gray-500 text-sm tracking-widest uppercase mb-8">
                Product not found
              </p>
              <Link
                to="/gallery"
                className="px-12 py-4 border border-white/20 text-white text-[9px] tracking-[0.5em] uppercase hover:bg-[#C5A059] hover:border-[#C5A059] hover:text-black transition-all duration-700"
              >
                Explore Collection
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
              {/* Product Image */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="aspect-[3/4] bg-neutral-900 overflow-hidden rounded-2xl border border-white/5 shadow-2xl shadow-black/50"
              >
                <img
                  src={`/lupora-web-experience${product.image}`}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Product Info */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex flex-col justify-center py-4 lg:py-8"
              >
                <p className="text-[#C5A059] text-[9px] uppercase tracking-[0.5em] mb-4">
                  {product.category}
                </p>
                <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-serif italic mb-6">
                  {product.name}
                </h1>
                {product.price && (
                  <p className="text-gray-300 text-2xl font-serif tracking-wider mb-8">
                    &#8377;{product.price.toLocaleString('en-IN')}
                  </p>
                )}
                {product.description && (
                  <p className="text-gray-400 text-sm leading-loose mb-10 max-w-lg">
                    {product.description}
                  </p>
                )}

                {/* Quantity Selector */}
                <div className="flex items-center gap-6 mb-8">
                  <span className="text-gray-500 text-[9px] tracking-[0.3em] uppercase">
                    Quantity
                  </span>
                  <div className="flex items-center gap-4 border border-white/20 px-3 py-2 rounded-full">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="text-gray-400 hover:text-white disabled:opacity-30 transition-colors p-1"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-white text-sm tracking-wider w-8 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="text-gray-400 hover:text-white transition-colors p-1"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  className="flex items-center justify-center gap-3 px-10 py-4 bg-[#C5A059] text-black text-[10px] tracking-[0.3em] uppercase font-medium rounded-full hover:bg-[#d4af6a] transition-all duration-500 w-fit"
                >
                  {added ? (
                    'Added to Cart'
                  ) : (
                    <>
                      <ShoppingBag size={16} strokeWidth={1.5} />
                      Add to Cart
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
