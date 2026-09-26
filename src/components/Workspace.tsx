"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { useI18n } from "@/lib/I18nProvider";
import SortingVisualizer from "@/components/sorting/SortingVisualizer";

type CategoryKey =
  | "sorting"
  | "searching"
  | "graph"
  | "dp"
  | "ml"
  | "dataStructures";

interface WorkspaceProps {
  selectedCategory: CategoryKey | null;
}

export default function Workspace({ selectedCategory }: WorkspaceProps) {
  const { t } = useI18n();

  return (
    <main className="flex-1 flex flex-col items-center justify-start p-6 md:p-10">
      {selectedCategory === "sorting" ? (
        <SortingVisualizer />
      ) : selectedCategory ? (
        /* Generic placeholder for future categories */
        <div className="w-full max-w-4xl h-[480px] rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(to right, #6366f1 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative flex flex-col items-center gap-3 text-center px-4">
            <p className="text-slate-500 text-sm">
              <span className="text-white font-semibold">{t.cats[selectedCategory]}</span>
              {" "}visualizer — coming soon.
            </p>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center gap-6 text-center select-none mt-16">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-indigo-500/60" />
            </div>
            <div className="absolute inset-0 rounded-full bg-indigo-500/5 blur-2xl scale-150" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {t.workspace.title}
            </h1>
            <p className="text-slate-500 max-w-sm text-sm leading-relaxed">
              {t.workspace.subtitle}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
