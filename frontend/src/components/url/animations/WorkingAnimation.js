import React from 'react';
import { motion } from 'framer-motion';

const WorkingAnimation = () => {
  // Animation variants
  const personVariants = {
    initial: { y: 0 },
    animate: {
      y: [0, -5, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };
  
  const armVariants = {
    initial: { rotate: 0 },
    animate: {
      rotate: [-5, 10, -5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };
  
  const laptopScreenVariants = {
    initial: { fill: "#3B82F6" },
    animate: {
      fill: ["#3B82F6", "#60A5FA", "#3B82F6"],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };
  
  const paperVariants = {
    initial: { y: 0 },
    animate: (i) => ({
      y: [0, -10, 0],
      transition: {
        duration: 2,
        delay: i * 0.3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    })
  };
  
  return (
    <div className="h-64 w-full relative overflow-hidden mb-8 bg-gray-50 rounded-lg">
      {/* Office environment */}
      <svg width="100%" height="100%" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Office desk */}
        <rect x="50" y="120" width="300" height="10" rx="2" fill="#8B5CF6" />
        <rect x="60" y="130" width="280" height="5" rx="1" fill="#7C3AED" />
        
        {/* Person 1 - Working on laptop */}
        <motion.g variants={personVariants} initial="initial" animate="animate">
          {/* Body */}
          <rect x="90" y="80" width="30" height="40" rx="5" fill="#3B82F6" />
          
          {/* Head */}
          <circle cx="105" cy="70" r="10" fill="#F9FAFB" />
          
          {/* Arms */}
          <motion.rect variants={armVariants} x="85" y="85" width="5" height="20" rx="2" fill="#F9FAFB" style={{ originX: 1, originY: 0 }} />
          <motion.rect variants={armVariants} x="120" y="85" width="5" height="20" rx="2" fill="#F9FAFB" style={{ originX: 0, originY: 0 }} />
          
          {/* Laptop */}
          <rect x="75" y="105" width="40" height="25" rx="2" fill="#1F2937" />
          <motion.rect variants={laptopScreenVariants} x="80" y="110" width="30" height="15" rx="1" fill="#3B82F6" />
        </motion.g>
        
        {/* Person 2 - Working with papers */}
        <motion.g variants={personVariants} initial="initial" animate="animate" style={{ originX: 0.5, originY: 1 }}>
          {/* Body */}
          <rect x="180" y="80" width="30" height="40" rx="5" fill="#10B981" />
          
          {/* Head */}
          <circle cx="195" cy="70" r="10" fill="#F9FAFB" />
          
          {/* Arms */}
          <motion.rect variants={armVariants} x="175" y="85" width="5" height="20" rx="2" fill="#F9FAFB" style={{ originX: 1, originY: 0 }} />
          <motion.rect variants={armVariants} x="210" y="85" width="5" height="20" rx="2" fill="#F9FAFB" style={{ originX: 0, originY: 0 }} />
          
          {/* Papers on desk */}
          {[...Array(3)].map((_, i) => (
            <motion.rect
              key={i}
              custom={i}
              variants={paperVariants}
              initial="initial"
              animate="animate"
              x={170 + i * 15}
              y={110 - i * 2}
              width="25"
              height="15"
              rx="1"
              fill="#F9FAFB"
            />
          ))}
        </motion.g>
        
        {/* Person 3 - Discussing with someone */}
        <motion.g variants={personVariants} initial="initial" animate="animate" style={{ originX: 0.5, originY: 1 }}>
          {/* Body */}
          <rect x="270" y="80" width="30" height="40" rx="5" fill="#F59E0B" />
          
          {/* Head */}
          <circle cx="285" cy="70" r="10" fill="#F9FAFB" />
          
          {/* Arms */}
          <motion.rect variants={armVariants} x="265" y="85" width="5" height="20" rx="2" fill="#F9FAFB" style={{ originX: 1, originY: 0 }} />
          <motion.rect variants={armVariants} x="300" y="85" width="5" height="20" rx="2" fill="#F9FAFB" style={{ originX: 0, originY: 0 }} />
          
          {/* Speech bubble */}
          <motion.path
            d="M310 60C310 55 315 50 320 50H340C345 50 350 55 350 60V70C350 75 345 80 340 80H330L325 90L320 80H320C315 80 310 75 310 70V60Z"
            fill="#F9FAFB"
            animate={{
              scale: [1, 1.05, 1],
              transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          />
          
          {/* Text lines in speech bubble */}
          <motion.g
            animate={{
              opacity: [0.5, 1, 0.5],
              transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <rect x="315" y="55" width="20" height="2" rx="1" fill="#6B7280" />
            <rect x="315" y="60" width="30" height="2" rx="1" fill="#6B7280" />
            <rect x="315" y="65" width="25" height="2" rx="1" fill="#6B7280" />
          </motion.g>
        </motion.g>
        
        {/* Office items */}
        <rect x="130" y="110" width="20" height="10" rx="1" fill="#EF4444" /> {/* Red box */}
        <rect x="240" y="110" width="15" height="10" rx="1" fill="#F59E0B" /> {/* Yellow box */}
        <circle cx="330" cy="115" r="5" fill="#10B981" /> {/* Green circle */}
      </svg>
    </div>
  );
};

export default WorkingAnimation; 