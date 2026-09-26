"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import SortingVisualizer from "@/components/SortingVisualizer";
import PathfindingVisualizer from "@/components/PathfindingVisualizer";
import GradientDescentVisualizer from "@/components/GradientDescentVisualizer";
import { I18nProvider, useI18n } from "@/lib/I18nProvider";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "sorting" | "pathfinding" | "ml";

type CategoryKey =
  | "sorting"
  | "searching"
  | "graph"
  | "dp"
  | "ml"
  | "dataStructures";

const TAB_DEFS: { id: Tab; en: string; uz: string; badge?: string }[] = [
  { id: "sorting",      en: "Sorting",          uz: "Saralash"          },
  { id: "pathfinding",  en: "Pathfinding",      uz: "Yo'l topish"       },
  { id: "ml",           en: "Machine Learning", uz: "Mashina o'rganishi" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Inner page (consumes i18n context)
// ─────────────────────────────────────────────────────────────────────────────

function PageContent() {
  const { lang, t } = useI18n();

  const [activeTab, setActiveTab] = useState<Tab>("sorting");

  // Header category dropdown is kept for future visualizers;
  // selecting sorting/graph/ml also switches the active tab.
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryKey>("sorting");

  const handleCategorySelect = (cat: CategoryKey) => {
    setSelectedCategory(cat);
    if (cat === "sorting") setActiveTab("sorting");
    if (cat === "graph")   setActiveTab("pathfinding");
    if (cat === "ml")      setActiveTab("ml");
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      {/* ── Sticky header ────────────────────────────────────────────── */}
      <Header
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
      />

      <main className="flex-1 px-4 py-6 sm:px-8 w-full max-w-[1536px] mx-auto">
        {/* ── Tab bar ────────────────────────────────────────────────── */}
        <div className="w-full mb-7">
          <nav
            role="tablist"
            aria-label={lang === "uz" ? "Vizualizator bo'limlari" : "Visualizer tabs"}
            className="inline-flex gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800"
          >
            {TAB_DEFS.map(({ id, en, uz }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(id)}
                  className={`
                    px-5 py-2 rounded-lg text-xs sm:text-sm font-mono font-semibold transition-all duration-150
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                    ${isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
                      : "text-slate-400 hover:text-white hover:bg-zinc-800"}
                  `}
                >
                  {lang === "uz" ? uz : en}
                </button>
              );
            })}
          </nav>

          {/* Thin accent line below active tab area */}
          <div className="mt-3 border-b border-zinc-800" />
        </div>

        {/* ── Active visualizer ──────────────────────────────────────── */}
        {activeTab === "sorting" ? (
          <SortingVisualizer />
        ) : activeTab === "pathfinding" ? (
          <PathfindingVisualizer />
        ) : activeTab === "ml" ? (
          <GradientDescentVisualizer />
        ) : (
          /* Future tabs */
          <div className="w-full mx-auto flex items-center justify-center min-h-[360px] rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <p className="text-slate-500 text-sm font-mono">
              {lang === "uz" ? "Tez orada…" : "Coming soon…"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <I18nProvider>
      <PageContent />
    </I18nProvider>
  );
}
