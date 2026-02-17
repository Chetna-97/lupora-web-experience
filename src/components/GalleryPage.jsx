import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="py-8 px-6 md:px-12 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-white text-2xl font-serif italic">
            Lupora
          </Link>
          <Link
            to="/"
            className="text-white text-[10px] tracking-[0.3em] uppercase hover:text-[#C5A059] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>

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
                  <div className="overflow-hidden aspect-[3/4] bg-neutral-900 relative">
                    <motion.img
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      src={`/lupora-web-experience${product.image}`}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                      <button className="px-8 py-3 border border-white text-white text-[10px] tracking-widest uppercase hover:bg-white hover:text-black transition-all">
                        View Details
                      </button>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-[#C5A059] text-[9px] uppercase tracking-[0.3em] mb-2">
                      {product.category}
                    </p>
                    <h3 className="text-white text-xl font-serif tracking-tight">
                      {product.name}
                    </h3>
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

      {/* Footer */}
      <div className="py-8 px-6 md:px-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500 text-[10px] tracking-widest uppercase">
            Lupora Perfumes - Crafted with Nature's Finest
          </p>
        </div>
      </div>
    </div>
  );
}
