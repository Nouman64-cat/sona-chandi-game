"use client"

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#3B82F6', '#EF4444', '#10B981'];

export default function Confetti() {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -20,
      size: Math.random() * 10 + 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 2,
      duration: Math.random() * 3 + 2,
      rotation: Math.random() * 360,
    }));
    setParticles(newParticles);
    
    const timer = setTimeout(() => setParticles([]), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}vw`, y: '-10vh', rotate: 0, opacity: 1 }}
          animate={{ 
            y: '110vh', 
            rotate: p.rotation + 720,
            opacity: 0 
          }}
          transition={{ 
            duration: p.duration, 
            delay: p.delay,
            ease: "easeIn"
          }}
          className="absolute rounded-sm"
          style={{ 
            width: p.size, 
            height: p.size, 
            backgroundColor: p.color,
            boxShadow: `0 0 10px ${p.color}40`
          }}
        />
      ))}
    </div>
  );
}
