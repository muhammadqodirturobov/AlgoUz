"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Cpu,
  Globe,
  User as UserIcon,
  X,
  Mail,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Zap,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useI18n } from "@/lib/I18nProvider";
import {
  supabase,
  setStoredLocalUser,
  clearStoredLocalUser,
  subscribeToAuth,
} from "@/lib/supabaseClient";

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

  // Category dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auth state & modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMsg, setAuthMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Initialize unified Supabase + Local Auth listener
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

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

  // Auth actions
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setAuthMsg({
        type: "error",
        text:
          lang === "uz"
            ? "Email va parolni kiriting."
            : "Please enter your email and password.",
      });
      return;
    }

    setAuthLoading(true);
    setAuthMsg(null);

    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        // If session is null (due to Supabase email verification settings),
        // provide immediate fallback to local session so students don't have to wait.
        if (!data.session) {
          setAuthMsg({
            type: "success",
            text:
              lang === "uz"
                ? "Hisob yaratildi! Tizimga kiritilmoqda..."
                : "Account created! Signing you in...",
          });

          const localUser = setStoredLocalUser(email, data.user?.id);
          setUser(localUser);

          setTimeout(() => {
            setAuthModalOpen(false);
          }, 1200);
        } else {
          setUser(data.session.user);
          setAuthMsg({
            type: "success",
            text:
              lang === "uz"
                ? "Ro'yxatdan muvaffaqiyatli o'tdingiz!"
                : "Account created! Signed in successfully!",
          });
          setTimeout(() => setAuthModalOpen(false), 1200);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          const isEmailNotConfirmed =
            error.message?.toLowerCase().includes("email not confirmed") ||
            (error as { code?: string }).code === "email_not_confirmed";

          if (isEmailNotConfirmed) {
            // Automatic bypass for unconfirmed emails so students can test immediately
            setAuthMsg({
              type: "success",
              text:
                lang === "uz"
                  ? "Email tasdiqlanmagan, ammo test rejimi faollashtirildi! Tizimga kiritilmoqda..."
                  : "Email not confirmed. Activating instant student test access...",
            });

            const localUser = setStoredLocalUser(email);
            setUser(localUser);

            setTimeout(() => {
              setAuthModalOpen(false);
            }, 1400);
            return;
          }

          throw error;
        }

        if (data.session?.user) {
          setUser(data.session.user);
          setAuthMsg({
            type: "success",
            text:
              lang === "uz"
                ? "Tizimga xush kelibsiz!"
                : "Signed in successfully!",
          });
          setTimeout(() => setAuthModalOpen(false), 1200);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication error";
      setAuthMsg({ type: "error", text: msg });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleInstantBypass = () => {
    const targetEmail = email.trim() || "student@algouz.edu";
    setAuthMsg({
      type: "success",
      text:
        lang === "uz"
          ? "Tezkor talaba hisobi yoqildi!"
          : "Instant student access activated!",
    });
    const localUser = setStoredLocalUser(targetEmail);
    setUser(localUser);
    setTimeout(() => setAuthModalOpen(false), 800);
  };

  const handleGoogleOAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "OAuth error";
      setAuthMsg({ type: "error", text: msg });
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    clearStoredLocalUser();
    setUser(null);
    setAuthModalOpen(false);
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

          {/* Student Auth / Profile Badge */}
          {user ? (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs sm:text-sm font-mono text-emerald-300 transition-all shadow-sm"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="max-w-[120px] truncate">
                {user.email?.split("@")[0] || "Student"}
              </span>
            </button>
          ) : (
            <button
              onClick={() => {
                setAuthMsg(null);
                setAuthModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 text-xs sm:text-sm font-medium text-indigo-200 hover:text-white transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono text-xs">
                {lang === "uz" ? "Kirish" : "Sign In"}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* ── Student Account / Supabase Auth Modal ───────────────────────── */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl flex flex-col gap-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white shadow-md">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {user
                      ? lang === "uz"
                        ? "Talaba Kabineti"
                        : "Student Profile"
                      : authMode === "signin"
                      ? lang === "uz"
                        ? "Tizimga Kirish"
                        : "Student Sign In"
                      : lang === "uz"
                        ? "Ro'yxatdan O'tish"
                        : "Create Account"}
                  </h3>
                  <p className="text-[11px] font-mono text-indigo-300">
                    Supabase Auth · AlgoUZ CS Lab
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

            {/* Authenticated View */}
            {user ? (
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    {lang === "uz"
                      ? "Faol Talaba Akkaunti"
                      : "Active Student Account"}
                  </span>
                  <span className="text-sm font-mono font-bold text-white break-all">
                    {user.email}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {user.user_metadata?.is_local_bypass
                      ? lang === "uz"
                        ? "Tezkor Talaba Rejimi (Email tasdiqisiz faol)"
                        : "Instant Student Access (Active)"
                      : lang === "uz"
                      ? "Bulutli saqlash faol"
                      : "Cloud Sync Active"}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {user.user_metadata?.is_local_bypass
                    ? lang === "uz"
                      ? "Siz email tasdiqlanishini kutmasdan barcha laboratoriya vositalari va AI Masala Yechuvchidan to'liq foydalanishingiz mumkin."
                      : "You have instant student access without email verification delays. All labs and AI Problem Solver runs are fully functional."
                    : lang === "uz"
                    ? "Siz tizimga muvaffaqiyatli ulangansiz. 'AI Masala Yechuvchi' bo'limida tahlil qilingan masalalar avtomatik ravishda profilingizga saqlanadi."
                    : "You are signed in with Supabase. Analyses generated in the AI Problem Solver will sync to your personal account history."}
                </p>

                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-mono text-xs font-semibold transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>
                    {lang === "uz" ? "Chiqish (Sign Out)" : "Sign Out"}
                  </span>
                </button>
              </div>
            ) : (
              /* Unauthenticated View: Sign In / Sign Up */
              <div className="flex flex-col gap-4">
                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signin");
                      setAuthMsg(null);
                    }}
                    className={`py-1.5 rounded-lg transition-all ${
                      authMode === "signin"
                        ? "bg-indigo-600 text-white font-bold shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {lang === "uz" ? "Kirish" : "Sign In"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup");
                      setAuthMsg(null);
                    }}
                    className={`py-1.5 rounded-lg transition-all ${
                      authMode === "signup"
                        ? "bg-indigo-600 text-white font-bold shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {lang === "uz" ? "Ro'yxatdan O'tish" : "Sign Up"}
                  </button>
                </div>

                {/* Google OAuth Button */}
                <button
                  onClick={handleGoogleOAuth}
                  type="button"
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
                  <span>
                    {lang === "uz"
                      ? "Google orqali kirish"
                      : "Continue with Google"}
                  </span>
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-zinc-800 w-full" />
                  <span className="bg-zinc-950 px-2 text-[10px] font-mono uppercase text-slate-500 absolute">
                    {lang === "uz" ? "Yoki Email bilan" : "Or with Email"}
                  </span>
                </div>

                {/* Email / Password Form */}
                <form
                  onSubmit={handleEmailAuth}
                  className="flex flex-col gap-3"
                >
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@university.edu"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>

                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-mono font-semibold text-white transition-all shadow-lg shadow-indigo-900/30 disabled:opacity-50"
                  >
                    {authLoading ? (
                      <span>...</span>
                    ) : authMode === "signin" ? (
                      lang === "uz" ? "Kirish" : "Sign In"
                    ) : (
                      lang === "uz" ? "Hisob Ochish" : "Sign Up"
                    )}
                  </button>

                  {/* Instant Test Mode Bypass Button */}
                  <button
                    type="button"
                    onClick={handleInstantBypass}
                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/80 text-[11px] font-mono text-slate-400 hover:text-emerald-300 transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {lang === "uz"
                        ? "Email tasdiqisiz tezkor kirish (Instant Access)"
                        : "Instant Student Access (No email wait)"}
                    </span>
                  </button>
                </form>

                {authMsg && (
                  <div
                    className={`flex items-start gap-2 p-2.5 rounded-xl text-xs font-mono border animate-in fade-in ${
                      authMsg.type === "success"
                        ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                        : "bg-rose-950/60 border-rose-500/40 text-rose-300"
                    }`}
                  >
                    {authMsg.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    )}
                    <span className="leading-snug">{authMsg.text}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
