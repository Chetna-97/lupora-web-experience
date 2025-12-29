import { motion } from 'framer-motion';

export default function Features() {
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
          {/* This is a placeholder for a perfume bottle image */}
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 uppercase tracking-widest">
            Product Showcase
          </div>
        </motion.div>
      </div>
    </section>
  );
}