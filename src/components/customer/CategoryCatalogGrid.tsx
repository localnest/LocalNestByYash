'use client';

import React from 'react';
import type { Category } from '@/lib/types';
import {
  Sparkles,
  Utensils,
  Wrench,
  Shield,
  Zap,
  Car,
  Scissors,
  HeartHandshake,
} from 'lucide-react';

interface CategoryCatalogGridProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  maid: <Sparkles className="w-6 h-6 text-teal-400" />,
  cook: <Utensils className="w-6 h-6 text-amber-400" />,
  electrician: <Zap className="w-6 h-6 text-yellow-400" />,
  plumber: <Wrench className="w-6 h-6 text-blue-400" />,
  carpenter: <Wrench className="w-6 h-6 text-orange-400" />,
  carwash: <Car className="w-6 h-6 text-cyan-400" />,
  salon: <Scissors className="w-6 h-6 text-pink-400" />,
  security: <Shield className="w-6 h-6 text-emerald-400" />,
};

export default function CategoryCatalogGrid({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryCatalogGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 mb-8">
      {categories.map((cat) => {
        const isSelected = selectedCategoryId === cat.id;
        const icon = CATEGORY_ICONS[cat.slug] || (
          <HeartHandshake className="w-6 h-6 text-teal-400" />
        );

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all text-center group ${
              isSelected
                ? 'bg-teal-950/60 border-teal-500 shadow-lg shadow-teal-950/40'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div className="mb-2 p-2.5 rounded-xl bg-slate-800/80 group-hover:scale-110 transition-transform">
              {icon}
            </div>
            <span
              className={`text-xs font-medium leading-tight ${
                isSelected ? 'text-teal-300 font-semibold' : 'text-slate-300'
              }`}
            >
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
