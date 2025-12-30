import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Gallery({ limit }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/products');
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

  if (loading) return <div className="text-white text-center py-20 bg-black">Loading Lupora Collection...</div>;

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
          {displayProducts.length > 0 ? displayProducts.map((product, index) => (
            <motion.div
              key={product._id || product.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: index * 0.2 }}
              viewport={{ once: true }}
              className={`relative group ${index % 2 !== 0 ? 'md:mt-32' : ''}`}
            >
              <div className="overflow-hidden aspect-[3/4] bg-neutral-900 relative">
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  src={`/lupora-web-experience${product.image}`}
                  alt={product.name}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                  <button className="px-8 py-3 border border-white text-white text-[10px] tracking-widest uppercase hover:bg-white hover:text-black transition-all">
                    View Details
                  </button>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-[#C5A059] text-[9px] uppercase tracking-[0.3em] mb-2">
                  {product.category}
                </p>
                <h3 className="text-white text-2xl font-serif tracking-tight">
                  {product.name}
                </h3>
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