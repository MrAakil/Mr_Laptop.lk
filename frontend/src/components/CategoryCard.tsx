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
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl p-6 h-64 border border-glass-border transition-all duration-500 hover:-translate-y-1 hover:shadow-xl ${category.gradient}`}
    >
      {/* Decorative background image overlay */}
      <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-25 group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: `url(${category.image})` }} />

      {/* Floating icon */}
      <div className="relative z-10 self-start p-3.5 rounded-2xl bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-md text-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 transition-all duration-300">
        <Icon className="h-6 w-6" />
      </div>

      {/* Title & Description */}
      <div className="relative z-10 mt-auto">
        <h3 className="text-lg font-black text-foreground mb-1 group-hover:translate-x-1 transition-transform duration-300">
          {category.title}
        </h3>
        <p className="text-xs text-foreground/70 line-clamp-2">
          {category.description}
        </p>
      </div>

      {/* Accent glow on hover */}
      <div className="absolute -inset-px rounded-3xl border border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </Link>
  );
};
