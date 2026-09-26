"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Cpu, Globe } from "lucide-react";
import { useI18n } from "@/lib/I18nProvider";

const CATEGORY_KEYS = [
  "sorting",
  "searching",
  "graph",
  "dp",
  "ml",
  "dataStructures",
] as const;

type CategoryKey = (typeof CATEGORY_KEYS)[number];

interface HeaderProps {
  selectedCategory: CategoryKey | null;
  onSelectCategory: (cat: CategoryKey) => void;
}

export default function Header({
  selectedCategory,
  onSelectCategory,
}: HeaderProps) {
  const { t, toggleLang } = useI18n();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (cat: CategoryKey) => {
    onSelectCategory(cat);
    setDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex items-center gap-2.5 select-none">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 shadow-lg shadow-indigo-900/40">
          <Cpu className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="leading-none">
          <span className="text-lg font-bold tracking-tight text-white">
            Algo
          </span>
          <span className="text-lg font-bold tracking-tight text-indigo-400">
            UZ
          </span>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5 hidden sm:block">
            {t.tagline}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Category Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-900 text-sm text-slate-300 hover:border-indigo-500 hover:text-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <span className="hidden sm:inline text-slate-500 text-xs font-medium mr-0.5">
              {t.categories}:
            </span>
            <span className="max-w-[140px] truncate">
              {selectedCategory
                ? t.cats[selectedCategory]
                : t.selectCategory}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div
              role="listbox"
              className="absolute right-0 mt-1.5 w-56 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              {CATEGORY_KEYS.map((cat) => (
                <button
                  key={cat}
                  role="option"
                  aria-selected={selectedCategory === cat}
                  onClick={() => handleSelect(cat)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-100 ${
                    selectedCategory === cat
                      ? "bg-indigo-600/20 text-indigo-300 font-medium"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {t.cats[cat]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Language Toggle */}
        <button
          onClick={toggleLang}
          title="Switch language / Tilni almashtirish"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-sm text-slate-300 hover:border-indigo-500 hover:text-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium">{t.langSwitch}</span>
        </button>
      </div>
    </header>
  );
}
