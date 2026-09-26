"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Cpu,
  Globe,
  User,
  X,
  Mail,
  CheckCircle2,
  Lock,
} from "lucide-react";
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
  const { lang, t, toggleLang } = useI18n();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

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

  const handleSendMagicLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setMagicLinkSent(true);
    setTimeout(() => {
      setMagicLinkSent(false);
      setEmailInput("");
    }, 4000);
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-slate-950/90 backdrop-blur-md">
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
        <div className="flex items-center gap-2.5">
          {/* Category Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-xs sm:text-sm text-slate-300 hover:border-indigo-500 hover:text-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <span className="hidden sm:inline text-slate-500 text-xs font-medium mr-0.5">
                {t.categories}:
              </span>
              <span className="max-w-[130px] truncate">
                {selectedCategory
                  ? t.cats[selectedCategory]
                  : t.selectCategory}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div
                role="listbox"
                className="absolute right-0 mt-1.5 w-56 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/60 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                {CATEGORY_KEYS.map((cat) => (
                  <button
                    key={cat}
                    role="option"
                    aria-selected={selectedCategory === cat}
                    onClick={() => handleSelect(cat)}
                    className={`w-full text-left px-4 py-2 text-xs sm:text-sm transition-colors duration-100 ${
                      selectedCategory === cat
                        ? "bg-indigo-600/20 text-indigo-300 font-medium"
                        : "text-slate-300 hover:bg-zinc-800 hover:text-white"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-xs sm:text-sm text-slate-300 hover:border-indigo-500 hover:text-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">{t.langSwitch}</span>
          </button>

          {/* Sign In / Profile Button */}
          <button
            onClick={() => setAuthModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 text-xs sm:text-sm font-medium text-indigo-200 hover:text-white transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono text-xs">
              {lang === "uz" ? "Kirish / Profil" : "Sign In / Profile"}
            </span>
          </button>
        </div>
      </header>

      {/* ── Student Account / OAuth Modal ───────────────────────────────── */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl flex flex-col gap-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {lang === "uz" ? "Talaba Profili" : "Student Account"}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    AlgoUZ CS Lab
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAuthModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {lang === "uz"
                ? "Algoritmik topshiriqlar, shaxsiy test holatlari va laboratoriya yutuqlaringizni saqlash uchun profilingizga kiring."
                : "Sign in to save custom problem submissions, track execution benchmarks, and sync progress across devices."}
            </p>

            {/* OAuth Buttons */}
            <div className="flex flex-col gap-2.5">
              {/* Google Button */}
              <button
                onClick={() => alert("Google OAuth flow ready for Supabase credentials in .env")}
                className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{lang === "uz" ? "Google orqali kirish" : "Continue with Google"}</span>
              </button>

              {/* GitHub Button */}
              <button
                onClick={() => alert("GitHub OAuth flow ready for Supabase credentials in .env")}
                className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm"
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>{lang === "uz" ? "GitHub orqali kirish" : "Continue with GitHub"}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-zinc-800 w-full" />
              <span className="bg-zinc-950 px-2 text-[10px] font-mono uppercase text-slate-500 absolute">
                {lang === "uz" ? "Yoki Email" : "Or Email"}
              </span>
            </div>

            {/* Magic Link Form */}
            <form onSubmit={handleSendMagicLink} className="flex flex-col gap-2.5">
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-mono font-semibold text-white transition-all shadow-lg shadow-indigo-900/30"
              >
                {lang === "uz" ? "Sehrli Havola Yuborish" : "Send Magic Link"}
              </button>
            </form>

            {magicLinkSent && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>
                  {lang === "uz"
                    ? "Havola pochtangizga yuborildi! Pochtani tekshiring."
                    : "Magic link sent! Check your inbox to verify."}
                </span>
              </div>
            )}

            {/* Supabase Status Footer Badge */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] font-mono text-slate-400 leading-snug">
                <span className="text-emerald-300 font-semibold">Supabase & OAuth Ready:</span>{" "}
                Configure <code className="text-indigo-300">NEXT_PUBLIC_SUPABASE_URL</code> in environment to connect cloud storage.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
