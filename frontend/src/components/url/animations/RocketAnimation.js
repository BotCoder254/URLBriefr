import React from 'react';
import { motion } from 'framer-motion';

const RocketAnimation = () => {
  // SVG path animations
  const rocketVariants = {
    initial: { y: 0 },
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };
  
  const flameVariants = {
    initial: { scaleY: 0.8 },
    animate: {
      scaleY: [0.8, 1.2, 0.8],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };
  
  const smokeVariants = {
    initial: { opacity: 0, scale: 0 },
    animate: (i) => ({
      opacity: [0, 0.8, 0],
      scale: [0, 1, 1.5],
      y: [0, -20, -40],
      x: i % 2 === 0 ? [0, 10, 20] : [0, -10, -20],
      transition: {
        duration: 2,
        delay: i * 0.2,
        repeat: Infinity,
        ease: "easeOut"
      }
    })
  };
  
  const starsVariants = {
    initial: { opacity: 0.3 },
    animate: {
      opacity: [0.3, 1, 0.3],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
        repeatType: "reverse"
      }
    }
  };
  
  return (
    <div className="h-64 w-full relative overflow-hidden mb-8">
      {/* Background stars */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            variants={starsVariants}
            initial="initial"
            animate="animate"
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 2 + 's'
            }}
          />
        ))}
      </div>
      
      {/* Rocket and launch pad */}
      <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2">
        {/* Launch pad */}
        <div className="relative">
          <div className="w-40 h-6 bg-gray-700 rounded-lg mx-auto"></div>
          <div className="w-20 h-10 bg-gray-800 rounded-md mx-auto -mt-2"></div>
        </div>
        
        {/* Rocket */}
        <motion.div
          className="relative"
          variants={rocketVariants}
          initial="initial"
          animate="animate"
        >
          {/* Rocket body */}
          <svg width="80" height="120" viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
            {/* Rocket nose */}
            <path d="M40 0C30 15 30 30 40 40C50 30 50 15 40 0Z" fill="#FF5252"/>
            
            {/* Rocket body */}
            <rect x="30" y="40" width="20" height="50" fill="#FFFFFF"/>
            <rect x="30" y="40" width="20" height="50" fill="url(#paint0_linear)"/>
            
            {/* Windows */}
            <circle cx="40" cy="55" r="5" fill="#3B82F6"/>
            <circle cx="40" cy="75" r="5" fill="#3B82F6"/>
            
            {/* Fins */}
            <path d="M30 70L10 100L30 90V70Z" fill="#FF5252"/>
            <path d="M50 70L70 100L50 90V70Z" fill="#FF5252"/>
            
            {/* Bottom */}
            <path d="M30 90H50L40 100L30 90Z" fill="#FF5252"/>
            
            {/* Flame */}
            <motion.path
              variants={flameVariants}
              initial="initial"
              animate="animate"
              d="M35 100C35 110 40 120 40 120C40 120 45 110 45 100C45 95 42.5 90 40 90C37.5 90 35 95 35 100Z"
              fill="url(#paint1_linear)"
              style={{ originY: 0, originX: 0.5 }}
            />
            
            {/* Smoke particles */}
            {[...Array(5)].map((_, i) => (
              <motion.circle
                key={i}
                custom={i}
                variants={smokeVariants}
                initial="initial"
                animate="animate"
                cx={40 + (i % 2 === 0 ? 10 : -10)}
                cy={110}
                r={3}
                fill="#CCCCCC"
              />
            ))}
            
            {/* Gradients */}
            <defs>
              <linearGradient id="paint0_linear" x1="40" y1="40" x2="40" y2="90" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF"/>
                <stop offset="1" stopColor="#E0E0E0"/>
              </linearGradient>
              <linearGradient id="paint1_linear" x1="40" y1="90" x2="40" y2="120" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF9500"/>
                <stop offset="1" stopColor="#FF5252"/>
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </div>
    </div>
  );
};

export default RocketAnimation; 