import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function EssencePage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black pt-24">
      {/* Hero Section */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[#C5A059] uppercase tracking-[0.5em] text-[10px] mb-6"
          >
            Our Philosophy
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white text-5xl md:text-7xl font-serif italic mb-8"
          >
            The Essence of Lupora
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 text-sm md:text-base leading-loose max-w-2xl mx-auto"
          >
            LUPORA is a homemade perfume brand born out of pure passion for fragrance.
            Every scent is personally handcrafted at home with love and care — blending
            natural ingredients to create perfumes that feel personal, authentic, and truly unique.
          </motion.p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[#C5A059] text-[9px] uppercase tracking-[0.5em] mb-4">Our Story</p>
            <h2 className="text-white text-3xl md:text-4xl font-serif italic mb-6">
              Handmade with Heart
            </h2>
            <p className="text-gray-400 text-sm leading-loose mb-6">
              Lupora started as a simple passion — crafting perfumes by hand at home,
              one bottle at a time. What began as a personal hobby grew into something
              meaningful: a homemade brand that puts soul into every fragrance.
            </p>
            <p className="text-gray-400 text-sm leading-loose">
              There are no factories or machines here. Each perfume is carefully mixed,
              tested, and bottled by hand. We choose every ingredient ourselves — natural
              oils, botanicals, and essences — to make sure each scent feels special
              and one of a kind.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="aspect-[3/4] bg-neutral-900 overflow-hidden"
          >
            <div className="w-full h-full bg-gradient-to-br from-[#C5A059]/10 to-transparent flex items-center justify-center">
              <p className="text-[#C5A059] text-6xl font-serif italic opacity-20">L</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#C5A059] text-[9px] uppercase tracking-[0.5em] mb-4">What We Stand For</p>
            <h2 className="text-white text-3xl md:text-4xl font-serif italic">Our Values</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: 'Homemade & Handcrafted',
                description: 'Every perfume is made by hand at home in small batches. No mass production — just genuine care poured into each bottle.'
              },
              {
                title: 'Natural Ingredients',
                description: 'We use carefully selected natural oils, botanicals, and essences. Each ingredient is chosen for its quality and character.'
              },
              {
                title: 'Made with Passion',
                description: 'Lupora is driven by a love for fragrance. Every scent is a personal creation, crafted with dedication and attention to detail.'
              }
            ].map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-12 h-[1px] bg-[#C5A059] mx-auto mb-8" />
                <h3 className="text-white text-lg font-serif italic mb-4">{value.title}</h3>
                <p className="text-gray-500 text-sm leading-loose">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-white text-3xl md:text-4xl font-serif italic mb-6">
            Experience the Collection
          </h2>
          <p className="text-gray-400 text-sm leading-loose mb-10">
            Every Lupora perfume is handmade with love. Discover scents that are
            crafted personally, just for you.
          </p>
          <Link
            to="/gallery"
            className="px-12 py-4 border border-white/20 text-white text-[9px] tracking-[0.5em] uppercase hover:bg-[#C5A059] hover:border-[#C5A059] hover:text-black transition-all duration-700"
          >
            Explore Collection
          </Link>
        </div>
      </section>
    </div>
  );
}
