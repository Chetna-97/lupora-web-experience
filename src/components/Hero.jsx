import React from 'react';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 1. The Video Background - Replaces the 3D Sphere */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-60 scale-105" // slight scale prevents white edges
        >
          {/* Ensure the video is in your /public folder or use the relative path */}
          <source src="/src/assets/lupora-hero-video.mp4" type="video/mp4" />
        </video>
        {/* Luxury Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
      </div>

      {/* 2. Content Overlay (Mont-Fort Style) */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <motion.div
          initial={{ opacity: 0, letterSpacing: "0.2em" }}
          animate={{ opacity: 1, letterSpacing: "0.8em" }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="mb-4"
        >
          <span className="text-[#C5A059] uppercase text-[10px] font-light">
            Botanical Alchemy
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="text-white text-8xl md:text-[10rem] font-serif italic tracking-tighter leading-none"
        >
          Lupora
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-gray-400 mt-8 max-w-md text-[10px] tracking-[0.3em] uppercase leading-loose font-light"
        >
          Signature Fragrances <br/> Inspired by Eternal Nature
        </motion.p>

        <motion.button 
          whileHover={{ scale: 1.05, backgroundColor: "white", color: "black" }}
          className="mt-12 px-12 py-4 border border-white/20 text-white text-[9px] tracking-[0.5em] uppercase transition-all duration-700"
        >
          Discover the Collection
        </motion.button>
      </div>
    </div>
  );
}