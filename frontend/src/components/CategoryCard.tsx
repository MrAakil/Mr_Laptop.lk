"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  category: {
    title: string;
    description: string;
    icon: LucideIcon;
    href: string;
    gradient: string;
    image: string;
  };
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const Icon = category.icon;

  return (
    <Link
      href={category.href}
      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl p-6 h-64 border border-glass-border glass-card hover:-translate-y-2 hover:shadow-2xl transition-all duration-500"
    >
      {/* Dynamic atmospheric light flare in card corner */}
      <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />

      {/* Decorative background image overlay using mix-blend-overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-15 group-hover:opacity-30 group-hover:scale-105 transition-all duration-700" 
        style={{ backgroundImage: `url(${category.image})` }} 
      />

      {/* Floating 3D icon */}
      <div className="relative z-10 self-start p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] group-hover:scale-110 transition-all duration-300">
        <Icon className="h-6 w-6" />
      </div>

      {/* Title & Description */}
      <div className="relative z-10 mt-auto">
        <h3 className="text-lg font-black text-foreground mb-1 group-hover:translate-x-1.5 transition-transform duration-300">
          {category.title}
        </h3>
        <p className="text-xs text-muted-foreground/90 line-clamp-2">
          {category.description}
        </p>
      </div>

      {/* Futuristic Border Overlay on Hover */}
      <div className="absolute inset-0 rounded-3xl border border-transparent group-hover:border-gradient-cyber transition-all duration-500 pointer-events-none" />
    </Link>
  );
};
