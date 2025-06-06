import React from 'react';
import { motion } from 'framer-motion';

const DiggingAnimation = () => {
  // Animation variants
  const diggerVariants = {
    initial: { y: 0 },
    animate: {
      y: [0, -3, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };
  
  const shovelVariants = {
    initial: { rotate: 0 },
    animate: {
      rotate: [0, -15, 0, 15, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };
  
  const dirtVariants = {
    initial: { opacity: 0, y: 0, x: 0 },
    animate: (i) => ({
      opacity: [0, 1, 0],
      y: [0, -20, -30],
      x: i % 2 === 0 ? [0, 10, 20] : [0, -10, -20],
      transition: {
        duration: 1.5,
        delay: i * 0.3,
        repeat: Infinity,
        ease: "easeOut"
      }
    })
  };
  
  const pickaxeVariants = {
    initial: { rotate: -20 },
    animate: {
      rotate: [-20, 20, -20],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };
  
  return (
    <div className="h-64 w-full relative overflow-hidden mb-8 bg-gray-50 rounded-lg">
      {/* Construction site */}
      <svg width="100%" height="100%" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Ground/dirt */}
        <rect x="0" y="130" width="400" height="70" fill="#92400E" />
        <rect x="0" y="120" width="400" height="10" fill="#B45309" />
        
        {/* Hole in the ground */}
        <ellipse cx="200" cy="140" rx="80" ry="20" fill="#78350F" />
        
        {/* Dirt pile */}
        <path d="M300 130C320 110 340 120 350 130H300Z" fill="#B45309" />
        
        {/* Person 1 - Digging with shovel */}
        <motion.g variants={diggerVariants} initial="initial" animate="animate">
          {/* Body */}
          <rect x="90" y="80" width="30" height="40" rx="5" fill="#3B82F6" />
          
          {/* Head */}
          <circle cx="105" cy="70" r="10" fill="#F9FAFB" />
          <circle cx="101" cy="67" r="2" fill="#1F2937" /> {/* Eye */}
          <circle cx="109" cy="67" r="2" fill="#1F2937" /> {/* Eye */}
          
          {/* Hard hat */}
          <path d="M95 60C95 55 115 55 115 60L118 65H92L95 60Z" fill="#F59E0B" />
          
          {/* Arms */}
          <rect x="120" y="85" width="5" height="25" rx="2" fill="#F9FAFB" />
          <rect x="85" y="85" width="5" height="25" rx="2" fill="#F9FAFB" />
          
          {/* Shovel */}
          <motion.g variants={shovelVariants} style={{ originX: 0, originY: 0 }}>
            <rect x="125" y="85" width="40" height="5" rx="2" fill="#78350F" /> {/* Handle */}
            <path d="M165 80L175 85L165 90V80Z" fill="#78350F" /> {/* Shovel head */}
          </motion.g>
          
          {/* Legs */}
          <rect x="95" y="120" width="8" height="30" rx="2" fill="#1F2937" />
          <rect x="107" y="120" width="8" height="30" rx="2" fill="#1F2937" />
        </motion.g>
        
        {/* Person 2 - Using pickaxe */}
        <motion.g variants={diggerVariants} initial="initial" animate="animate">
          {/* Body */}
          <rect x="250" y="80" width="30" height="40" rx="5" fill="#EF4444" />
          
          {/* Head */}
          <circle cx="265" cy="70" r="10" fill="#F9FAFB" />
          <circle cx="261" cy="67" r="2" fill="#1F2937" /> {/* Eye */}
          <circle cx="269" cy="67" r="2" fill="#1F2937" /> {/* Eye */}
          
          {/* Hard hat */}
          <path d="M255 60C255 55 275 55 275 60L278 65H252L255 60Z" fill="#F59E0B" />
          
          {/* Arms */}
          <rect x="280" y="85" width="5" height="25" rx="2" fill="#F9FAFB" />
          <rect x="245" y="85" width="5" height="25" rx="2" fill="#F9FAFB" />
          
          {/* Pickaxe */}
          <motion.g variants={pickaxeVariants} style={{ originX: 0.2, originY: 1 }}>
            <rect x="280" y="75" width="5" height="40" rx="2" fill="#78350F" /> {/* Handle */}
            <path d="M275 75L285 75L295 65L285 65L275 75Z" fill="#6B7280" /> {/* Pickaxe head */}
            <path d="M275 75L285 75L295 85L285 85L275 75Z" fill="#6B7280" /> {/* Pickaxe head */}
          </motion.g>
          
          {/* Legs */}
          <rect x="255" y="120" width="8" height="30" rx="2" fill="#1F2937" />
          <rect x="267" y="120" width="8" height="30" rx="2" fill="#1F2937" />
        </motion.g>
        
        {/* Flying dirt particles */}
        {[...Array(6)].map((_, i) => (
          <motion.circle
            key={i}
            custom={i}
            variants={dirtVariants}
            initial="initial"
            animate="animate"
            cx={170 + (i * 10)}
            cy={130}
            r={3 + (i % 3)}
            fill="#92400E"
          />
        ))}
        
        {/* Construction sign */}
        <rect x="30" y="70" width="40" height="30" rx="2" fill="#F59E0B" stroke="#78350F" strokeWidth="2" />
        <rect x="45" y="100" width="10" height="30" rx="1" fill="#78350F" />
        <motion.g
          animate={{
            opacity: [0.7, 1, 0.7],
            transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <path d="M40 80L45 85L60 70" stroke="#000000" strokeWidth="2" />
          <path d="M40 90L45 95L60 80" stroke="#000000" strokeWidth="2" />
        </motion.g>
      </svg>
    </div>
  );
};

export default DiggingAnimation; 