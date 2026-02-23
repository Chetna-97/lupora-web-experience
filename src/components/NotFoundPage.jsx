import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import usePageTitle from '../utils/usePageTitle';

export default function NotFoundPage() {
  usePageTitle('Page Not Found');
  return (
    <div className="min-h-screen bg-surface pt-24 flex items-center justify-center px-6">
      <div className="text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-accent text-[120px] md:text-[180px] font-serif italic leading-none"
        >
          404
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-foreground text-2xl md:text-3xl font-serif italic mt-4 mb-4"
        >
          Page Not Found
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-subtle text-sm tracking-wide mb-10 max-w-md mx-auto"
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
            className="px-10 py-4 bg-accent text-black text-[9px] tracking-[0.5em] uppercase text-center font-medium hover:bg-accent-hover transition-all duration-500"
          >
            Go Home
          </Link>
          <Link
            to="/gallery"
            className="px-10 py-4 border border-foreground/20 text-foreground text-[9px] tracking-[0.5em] uppercase text-center hover:bg-foreground hover:text-surface transition-all duration-700"
          >
            Browse Collection
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
