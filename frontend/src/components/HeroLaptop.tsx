"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export const HeroLaptop: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  // Motion values for tracking cursor coordinates relative to center bounds
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for rotation angles to create premium Keynote tilt dynamics
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [20, -20]), {
    damping: 24,
    stiffness: 140,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-22, 22]), {
    damping: 24,
    stiffness: 140,
  });
  const rotateZ = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), {
    damping: 24,
    stiffness: 140,
  });

  // Dynamic light reflection map centered relative to mouse
  const reflectionBg = useTransform([x, y], ([latestX, latestY]) => {
    const posX = 50 + (latestX as number) * 100;
    const posY = 50 + (latestY as number) * 100;
    return `radial-gradient(circle at ${posX}% ${posY}%, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0) 65%)`;
  });

  // Energy particle motion values for dynamic parallax cursor reactions
  const p1X = useSpring(useTransform(x, [-0.5, 0.5], [-35, 35]), { damping: 30, stiffness: 80 });
  const p1Y = useSpring(useTransform(y, [-0.5, 0.5], [-35, 35]), { damping: 30, stiffness: 80 });

  const p2X = useSpring(useTransform(x, [-0.5, 0.5], [25, -25]), { damping: 25, stiffness: 90 });
  const p2Y = useSpring(useTransform(y, [-0.5, 0.5], [-25, 25]), { damping: 25, stiffness: 90 });

  const p3X = useSpring(useTransform(x, [-0.5, 0.5], [-45, 45]), { damping: 28, stiffness: 70 });
  const p3Y = useSpring(useTransform(y, [-0.5, 0.5], [45, -45]), { damping: 28, stiffness: 70 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Normalize coordinates relative to element center (-0.5 to 0.5)
    const mouseX = (event.clientX - rect.left) / width - 0.5;
    const mouseY = (event.clientY - rect.top) / height - 0.5;
    
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[320px] sm:h-[450px] overflow-visible flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      style={{ perspective: 1200 }}
    >
      {/* 1. Backdrop expanding soft neon aura */}
      <motion.div
        animate={{
          scale: hovered ? 1.15 : 1,
          opacity: hovered ? 0.95 : 0.7,
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute w-[240px] h-[240px] sm:w-[380px] sm:h-[380px] rounded-full bg-gradient-to-r from-primary/30 via-purple-500/18 to-accent/30 blur-[75px] -z-10"
      />

      {/* 2. Holographic light trail/platform beneath the laptop */}
      <motion.div
        animate={{
          opacity: hovered ? 0.85 : 0.35,
          scaleX: hovered ? 1.18 : 0.95,
          y: hovered ? 5 : 0,
        }}
        transition={{ duration: 0.5 }}
        className="absolute bottom-4 w-[220px] sm:w-[340px] h-[8px] rounded-full bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent blur-[5px] -z-10"
      />
      <motion.div
        animate={{
          opacity: hovered ? 0.5 : 0.15,
          scaleX: hovered ? 1.12 : 0.88,
          y: hovered ? 5 : 0,
        }}
        transition={{ duration: 0.5 }}
        className="absolute bottom-4 w-[280px] sm:w-[400px] h-[2px] rounded-full bg-gradient-to-r from-transparent via-primary/50 to-transparent -z-10"
      />

      {/* 3. Parallax Floating Energy Particles reacting to cursor */}
      <motion.div
        style={{ x: p1X, y: p1Y }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-16 left-8 w-2 h-2 rounded-full bg-cyan-400 blur-[1px] opacity-65 pointer-events-none"
      />
      <motion.div
        style={{ x: p2X, y: p2Y }}
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-24 right-12 w-3 h-3 rounded-full bg-purple-400/80 blur-[2px] opacity-55 pointer-events-none"
      />
      <motion.div
        style={{ x: p3X, y: p3Y }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-36 right-16 w-1.5 h-1.5 rounded-full bg-cyan-300 blur-[0.5px] opacity-75 pointer-events-none"
      />

      {/* 4. Main 3D Tilting / Floating MacBook Pro Image container */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          rotateZ,
          transformStyle: "preserve-3d",
        }}
        animate={
          hovered
            ? { 
                scale: 1.05,
                y: -10,
              }
            : {
                scale: 1,
                y: [0, -14, 0],
                transition: {
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }
        }
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full h-full flex items-center justify-center"
      >
        {/* Apple MacBook Pro 3D Render Image with dynamic screen glow shadows */}
        <motion.img
          src="/macbook_pro_hero.png"
          alt="Apple MacBook Pro 3D Render"
          animate={{
            filter: hovered
              ? "drop-shadow(0 30px 65px rgba(6, 182, 212, 0.6)) drop-shadow(0 10px 25px rgba(139, 92, 246, 0.45))"
              : "drop-shadow(0 20px 45px rgba(6, 182, 212, 0.28)) drop-shadow(0 4px 12px rgba(139, 92, 246, 0.18))",
          }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[340px] sm:max-w-[420px] h-auto object-contain"
          style={{ transform: "translateZ(50px)" }}
        />
        
        {/* 5. Dynamic specular reflection flare overlay */}
        <motion.div
          style={{
            background: reflectionBg,
            transform: "translateZ(75px)",
            opacity: hovered ? 0.35 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 pointer-events-none rounded-[2rem]"
        />
      </motion.div>
    </div>
  );
};
