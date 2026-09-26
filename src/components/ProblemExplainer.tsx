"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Code2,
  FileText,
  Play,
  RotateCcw,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Activity,
  Layers,
  AlertCircle,
  HelpCircle,
  Cpu,
  Terminal,
} from "lucide-react";
import { useI18n } from "@/lib/I18nProvider";

interface StepExplanation {
  stepNumber: number;
  titleUz: string;
  titleEn: string;
  explanationUz: string;
  explanationEn: string;
  stateSnapshot: string;
  activeLine?: number;
}

interface ProblemAnalysisResponse {
  algorithmName: string;
  algorithmCategory: string;
  approachSummaryUz: string;
  approachSummaryEn: string;
  steps: StepExplanation[];
  complexity: {
    timeWorst: string;
    timeAverage: string;
    space: string;
    edgeCasesUz: string[];
    edgeCasesEn: string[];
    breakdownUz: string;
    breakdownEn: string;
  };
  referenceCode: {
    python: string;
    cpp: string;
  };
}

const PRESET_EXAMPLES = [
  {
    title: "Two Sum: Pair with Given Target",
    mode: "problem" as const,
    content:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    testCase: "nums = [2, 7, 11, 15], target = 9",
  },
  {
    title: "Binary Search on Sorted Range",
    mode: "problem" as const,
    content:
      "Given an array of integers nums sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, return its index. Otherwise, return -1 in O(log n) runtime.",
    testCase: "nums = [-1, 0, 3, 5, 9, 12], target = 9",
  },
  {
    title: "Reverse Array In-Place",
    mode: "code" as const,
    content: `void reverseArray(vector<int>& arr) {
    int left = 0, right = arr.size() - 1;
    while (left < right) {
        swap(arr[left], arr[right]);
        left++;
        right--;
    }
}`,
    testCase: "arr = [1, 2, 3, 4, 5]",
  },
];

export default function ProblemExplainer() {
  const { lang } = useI18n();

  // Mode and form states
  const [mode, setMode] = useState<"problem" | "code">("problem");
  const [title, setTitle] = useState<string>("Two Sum: Target Pair Finder");
  const [content, setContent] = useState<string>(
    "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target."
  );
  const [testCase, setTestCase] = useState<string>(
    "nums = [2, 7, 11, 15], target = 9"
  );

  // Analysis Result and UI states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ProblemAnalysisResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active step in timeline
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [activeCodeTab, setActiveCodeTab] = useState<"python" | "cpp">("python");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleApplyPreset = (ex: (typeof PRESET_EXAMPLES)[0]) => {
    setMode(ex.mode);
    setTitle(ex.title);
    setContent(ex.content);
    setTestCase(ex.testCase);
    setErrorMsg(null);
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() && !content.trim()) {
      setErrorMsg(
        lang === "uz"
          ? "Iltimos, masala sarlavhasi yoki kodini kiriting."
          : "Please provide a problem title or code snippet."
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/explain-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, title, content, testCase, lang }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to analyze problem");
      }

      const data: ProblemAnalysisResponse = await res.json();
      setResult(data);
      setActiveStepIdx(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error analyzing problem";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!result) return;
    const code =
      activeCodeTab === "python"
        ? result.referenceCode.python
        : result.referenceCode.cpp;
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const currentStep = result?.steps[activeStepIdx];

  return (
    <div
      suppressHydrationWarning
      className="w-full flex flex-col gap-8"
    >
      {/* ── Top Header Banner ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-900/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{lang === "uz" ? "AI Masala Tahlilchisi" : "AI Problem Solver & Explainer"}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO CS LAB
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              {lang === "uz"
                ? "Olimpiada masalalari yoki C++/Python kodlaringizni qadam-baqam vizualizatsiya qiling"
                : "Submit CP/Olympiad tasks or code snippets to decompose execution into an interactive timeline"}
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-slate-500">
            {lang === "uz" ? "Namunalar:" : "Examples:"}
          </span>
          {PRESET_EXAMPLES.map((ex, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(ex)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono border border-zinc-700 bg-zinc-800 text-slate-300 hover:text-white hover:border-zinc-500 transition-colors"
            >
              {idx === 0 ? "Two Sum" : idx === 1 ? "Binary Search" : "Reverse"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Input Section: Two Modes ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form (lg:col-span-6) */}
        <form
          onSubmit={handleAnalyze}
          className="lg:col-span-6 flex flex-col gap-4 p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 shadow-lg"
        >
          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="inline-flex rounded-xl bg-zinc-950 border border-zinc-800 p-1">
              <button
                type="button"
                onClick={() => setMode("problem")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  mode === "problem"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                    : "text-slate-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{lang === "uz" ? "Masala Matni" : "Problem Statement"}</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("code")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  mode === "code"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                    : "text-slate-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{lang === "uz" ? "Mening Kodim" : "My Code Snippet"}</span>
              </button>
            </div>
          </div>

          {/* Problem Title Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-semibold text-slate-300">
              {lang === "uz" ? "Masala Sarlavhasi" : "Problem Title / Name"}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Subarray Sum Equals K"
              className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Description or Code Textarea */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-semibold text-slate-300">
                {mode === "problem"
                  ? lang === "uz"
                    ? "Masala Sharti va Cheklovlari"
                    : "Problem Description & Constraints"
                  : lang === "uz"
                  ? "C++ yoki Python Kodingiz"
                  : "C++ or Python Source Code"}
              </label>
              <span className="text-[10px] font-mono text-slate-500">
                {mode === "code" ? "C++ / Python" : "Plain Text / Markdown"}
              </span>
            </div>
            <textarea
              rows={mode === "code" ? 7 : 5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                mode === "problem"
                  ? "Describe the input format, output, and constraints..."
                  : "Paste your algorithmic code here..."
              }
              className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y leading-relaxed"
            />
          </div>

          {/* Optional Testcase Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-semibold text-slate-300">
              {lang === "uz"
                ? "Namunaviy Test (Ixtiyoriy)"
                : "Sample Testcase Input (Optional)"}
            </label>
            <input
              type="text"
              value={testCase}
              onChange={(e) => setTestCase(e.target.value)}
              placeholder="e.g. nums = [2, 7, 11, 15], target = 9"
              className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs font-mono text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center gap-2 mt-1 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-mono font-semibold text-xs transition-all shadow-lg shadow-indigo-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>
                  {lang === "uz"
                    ? "Algoritm Tahlil Qilinmoqda..."
                    : "Analyzing Algorithm & Simulating Steps..."}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>
                  {lang === "uz"
                    ? "Tahlil Qilish & Bosqichma-bosqich Vizualizatsiya"
                    : "Analyze & Generate Step Visualizer"}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Right Info / Quick Guide (lg:col-span-6) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 shadow-lg flex flex-col gap-3.5">
            <div className="flex items-center gap-2 text-indigo-400">
              <Cpu className="w-4 h-4" />
              <h3 className="text-xs font-mono font-semibold uppercase text-slate-200">
                {lang === "uz" ? "AI Explainer Qanday Ishlaydi?" : "How AI Explainer Works"}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {lang === "uz"
                ? "Tizim masalani O(N) murakkablik qonuniyatlariga ko'ra dekompozitsiya qiladi. Natijada sizga aniq bosqichma-bosqich diskret holatlar (State Snapshots), Big-O asimptotik bahosi va toza Python hamda C++ yechimlari taqdim etiladi."
                : "The system decomposes the problem into discrete step snapshots, tracks variables and memory pointers, analyzes asymptotic Big-O runtime, and provides clean reference implementations."}
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col gap-1">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                  Step Timeline
                </span>
                <span className="text-xs text-slate-400">
                  {lang === "uz" ? "1..N qadamlar interaktiv boshqaruvi" : "Interactive 1..N step execution simulation"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col gap-1">
                <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">
                  Dual-Language
                </span>
                <span className="text-xs text-slate-400">
                  {lang === "uz" ? "O'zbek va ingliz tillarida tushuntirish" : "Bilingual explanations in Uzbek & English"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Start Tip */}
          <div className="p-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 flex items-start gap-3">
            <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              {lang === "uz"
                ? "Maslahat: Yuqoridagi 'Two Sum' yoki 'Binary Search' namunalaridan birini tanlab, darhol tahlil natijasini ko'rishingiz mumkin."
                : "Tip: Select one of the presets above (e.g. 'Two Sum') to instantly generate a step simulation without manual typing."}
            </p>
          </div>
        </div>
      </div>

      {/* ── Generated Result Section ────────────────────────────────────── */}
      {result && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          {/* Algorithm Badge & Summary Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-900 to-indigo-950/40 border border-zinc-800 shadow-xl flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  {lang === "uz" ? "Aniqlangan Algoritm:" : "Identified Algorithm:"}
                </span>
                <span className="text-sm font-bold font-mono text-cyan-300">
                  {result.algorithmName}
                </span>
              </div>

              <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
                {result.algorithmCategory}
              </span>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {lang === "uz"
                ? result.approachSummaryUz
                : result.approachSummaryEn}
            </p>
          </div>

          {/* Multi-Stage Interactive Execution Timeline */}
          <div className="flex flex-col gap-4 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-semibold uppercase text-slate-200">
                  {lang === "uz" ? "Ijro Vaqt Shkalasi (Execution Timeline)" : "Execution Step Simulation"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveStepIdx((p) => Math.max(0, p - 1))}
                  disabled={activeStepIdx === 0}
                  className="p-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-slate-300 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
                  {activeStepIdx + 1} / {result.steps.length}
                </span>
                <button
                  onClick={() =>
                    setActiveStepIdx((p) => Math.min(result.steps.length - 1, p + 1))
                  }
                  disabled={activeStepIdx === result.steps.length - 1}
                  className="p-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-slate-300 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Step Bubbles Timeline Scrubber */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 select-none">
              {result.steps.map((st, idx) => {
                const isActive = idx === activeStepIdx;
                const isPassed = idx < activeStepIdx;

                return (
                  <button
                    key={idx}
                    onClick={() => setActiveStepIdx(idx)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-amber-500 text-zinc-950 font-bold shadow-lg shadow-amber-500/20"
                        : isPassed
                        ? "bg-zinc-800 text-slate-300 hover:text-white border border-zinc-700"
                        : "bg-zinc-950 text-slate-500 hover:text-slate-300 border border-zinc-900"
                    }`}
                  >
                    <span>Step {st.stepNumber}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Step Details */}
            {currentStep && (
              <div className="flex flex-col gap-3 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>
                      {lang === "uz" ? currentStep.titleUz : currentStep.titleEn}
                    </span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">
                    Step {currentStep.stepNumber}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  {lang === "uz"
                    ? currentStep.explanationUz
                    : currentStep.explanationEn}
                </p>

                {/* State Snapshot Card */}
                {currentStep.stateSnapshot && (
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs text-cyan-300 flex items-center gap-2">
                    <span className="text-[10px] uppercase text-slate-500 font-semibold">
                      State:
                    </span>
                    <span className="truncate">{currentStep.stateSnapshot}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Side-by-side Complexity & Reference Code ─────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Complexity Breakdown (lg:col-span-5) */}
            <div className="lg:col-span-5 flex flex-col gap-4 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-semibold uppercase text-slate-200">
                  {lang === "uz" ? "Asimptotik Baho (Big-O)" : "Complexity Analysis"}
                </h3>
              </div>

              {/* 3 Metric Badges */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Worst</span>
                  <span className="text-xs font-bold font-mono text-rose-400">
                    {result.complexity.timeWorst}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Average</span>
                  <span className="text-xs font-bold font-mono text-amber-400">
                    {result.complexity.timeAverage}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Space</span>
                  <span className="text-xs font-bold font-mono text-cyan-400">
                    {result.complexity.space}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {lang === "uz"
                  ? result.complexity.breakdownUz
                  : result.complexity.breakdownEn}
              </p>

              {/* Edge Cases */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-800">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase">
                  {lang === "uz" ? "Chekka Holatlar (Edge Cases):" : "Critical Edge Cases:"}
                </span>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 font-sans">
                  {(lang === "uz"
                    ? result.complexity.edgeCasesUz
                    : result.complexity.edgeCasesEn
                  ).map((ec, idx) => (
                    <li key={idx} className="leading-snug">
                      {ec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Reference Implementation (lg:col-span-7) */}
            <div className="lg:col-span-7 flex flex-col rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl overflow-hidden">
              {/* Code Header Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-mono text-slate-300 font-semibold">
                    {lang === "uz" ? "Optimal Referens Yechim" : "Optimal Reference Implementation"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Language switch */}
                  <div className="inline-flex rounded-lg bg-zinc-950 border border-zinc-800 p-0.5">
                    <button
                      onClick={() => setActiveCodeTab("python")}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-medium transition-all ${
                        activeCodeTab === "python"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Python
                    </button>
                    <button
                      onClick={() => setActiveCodeTab("cpp")}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-medium transition-all ${
                        activeCodeTab === "cpp"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      C++
                    </button>
                  </div>

                  {/* Copy Button */}
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-800 text-[11px] font-mono text-slate-300 hover:text-white hover:border-zinc-500 transition-colors"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Code Pre Block */}
              <div className="p-4 font-mono text-xs overflow-x-auto max-h-[380px] overflow-y-auto leading-relaxed text-indigo-200">
                <pre>
                  {activeCodeTab === "python"
                    ? result.referenceCode.python
                    : result.referenceCode.cpp}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
