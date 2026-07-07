import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

interface LiveBackgroundProps {
  theme: 'dark' | 'light';
}

export default function LiveBackground({ theme }: LiveBackgroundProps) {
  const [mounted, setMounted] = useState(false);
  
  // Mouse tracking coordinates with smooth spring physics
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 30, stiffness: 120, mass: 0.8 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Dynamic Ambient Background Blobs */}
      <div className="absolute inset-0 transition-colors duration-500 ease-in-out">
        {/* Blob 1: Cool cyan/indigo orb in upper right */}
        <motion.div
          animate={{
            x: [0, 50, -40, 20, 0],
            y: [0, -60, 40, -30, 0],
            scale: [1, 1.15, 0.9, 1.05, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`absolute -top-40 -right-40 w-96 h-96 md:w-[600px] md:h-[600px] rounded-full blur-[80px] md:blur-[130px] opacity-25 mix-blend-screen transition-colors duration-500 ${
            theme === 'dark' 
              ? 'bg-blue-600/30 dark:bg-blue-600/20' 
              : 'bg-sky-200/50'
          }`}
        />

        {/* Blob 2: Warm violet/indigo orb in lower left */}
        <motion.div
          animate={{
            x: [0, -80, 50, -30, 0],
            y: [0, 40, -60, 50, 0],
            scale: [1, 0.95, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`absolute -bottom-40 -left-40 w-96 h-96 md:w-[500px] md:h-[500px] rounded-full blur-[80px] md:blur-[120px] opacity-20 mix-blend-screen transition-colors duration-500 ${
            theme === 'dark' 
              ? 'bg-violet-600/35' 
              : 'bg-purple-200/50'
          }`}
        />

        {/* Blob 3: Center ambient pulse */}
        <motion.div
          animate={{
            scale: [0.85, 1.05, 0.9, 1.1, 0.85],
            opacity: [0.12, 0.18, 0.14, 0.22, 0.12],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`absolute top-1/4 left-1/3 w-80 h-80 rounded-full blur-[100px] transition-colors duration-500 ${
            theme === 'dark' 
              ? 'bg-indigo-500/20' 
              : 'bg-blue-100/40'
          }`}
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div 
        className={`absolute inset-0 opacity-[0.25] md:opacity-[0.35] transition-opacity duration-500`}
        style={{
          backgroundImage: theme === 'dark' 
            ? 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)' 
            : 'radial-gradient(circle, rgba(15,23,42,0.1) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Elegant Radial Gradient Vignette/Mask */}
      <div 
        className={`absolute inset-0 transition-all duration-500 ${
          theme === 'dark'
            ? 'bg-[radial-gradient(circle_at_center,transparent_20%,rgba(2,6,23,0.75)_80%)]'
            : 'bg-[radial-gradient(circle_at_center,transparent_30%,rgba(248,250,252,0.4)_90%)]'
        }`}
      />

      {/* Gentle Interactive Mouse Light Trail */}
      <motion.div
        className={`absolute w-32 h-32 rounded-full blur-3xl pointer-events-none mix-blend-screen transition-opacity duration-300 ${
          theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-400/20'
        }`}
        style={{
          x: smoothX,
          y: smoothY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />
    </div>
  );
}
