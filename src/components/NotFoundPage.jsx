import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-black pt-24 flex items-center justify-center px-6">
      <div className="text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[#C5A059] text-[120px] md:text-[180px] font-serif italic leading-none"
        >
          404
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white text-2xl md:text-3xl font-serif italic mt-4 mb-4"
        >
          Page Not Found
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-500 text-sm tracking-wide mb-10 max-w-md mx-auto"
        >
          The page you're looking for doesn't exist or has been moved.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            to="/"
            className="px-10 py-4 bg-[#C5A059] text-black text-[9px] tracking-[0.5em] uppercase text-center font-medium hover:bg-[#d4af6a] transition-all duration-500"
          >
            Go Home
          </Link>
          <Link
            to="/gallery"
            className="px-10 py-4 border border-white/20 text-white text-[9px] tracking-[0.5em] uppercase text-center hover:bg-white hover:text-black transition-all duration-700"
          >
            Browse Collection
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
