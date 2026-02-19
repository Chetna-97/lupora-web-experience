import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { assetUrl } from '../utils/api';

export default function Features() {
  const [featuredProduct, setFeaturedProduct] = useState(null);

  useEffect(() => {
    const getFeaturedProduct = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products`);
        if (!response.ok) throw new Error("Server response was not ok");
        const data = await response.json();
        if (data.length > 0) {
          setFeaturedProduct(data[0]);
        }
      } catch (err) {
        console.error("Failed to fetch media:", err.message);
      }
    };
    getFeaturedProduct();
  }, []);

  return (
    <section className="py-32 px-10 bg-white text-black">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="text-5xl font-serif italic">The Signature Scent</h2>
          <p className="text-gray-600 leading-loose">
            Lupora is more than a fragrance; it is a whispered secret. Each bottle
            is a blend of hand-picked ingredients sourced from the world's
            most hidden gardens.
          </p>
          <div className="pt-4">
            <a href="https://www.instagram.com/lupora_perfumes/" className="border-b-2 border-black pb-1 font-bold hover:text-[#C5A059] transition-colors">
              VIEW THE COLLECTION
            </a>
          </div>
        </motion.div>

        <motion.div
          className="relative h-[600px] bg-[#f4f4f4] overflow-hidden rounded-sm"
          whileHover={{ scale: 0.98 }}
          transition={{ duration: 0.5 }}
        >
          {featuredProduct && (
            <img
              src={assetUrl(featuredProduct.image)}
              alt={featuredProduct.name}
              className="w-full h-full object-cover"
            />
          )}
        </motion.div>
      </div>
    </section>
  );
}