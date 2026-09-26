"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Shuffle,
  ChevronRight,
} from "lucide-react";
import { useI18n } from "@/lib/I18nProvider";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Step = {
  array: number[];
  comparingIndices: number[];
  swappedIndices: number[];
  sortedIndices: number[];
  explanationUz: string;
  explanationEn: string;
};

type AlgoId = "bubble" | "merge";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function randomArray(n = 20): number[] {
  return Array.from(
    { length: n },
    () => Math.floor(Math.random() * 86) + 15 // [15, 100]
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bubble Sort — full step precomputation
// ─────────────────────────────────────────────────────────────────────────────

function precomputeBubble(input: number[]): Step[] {
  const a = [...input];
  const steps: Step[] = [];
  const n = a.length;
  const sorted: number[] = [];

  steps.push({
    array: [...a],
    comparingIndices: [],
    swappedIndices: [],
    sortedIndices: [],
    explanationUz: "Boshlang'ich holat. Bubble Sort boshlandi.",
    explanationEn: "Initial state. Bubble Sort started.",
  });

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      // — compare —
      steps.push({
        array: [...a],
        comparingIndices: [j, j + 1],
        swappedIndices: [],
        sortedIndices: [...sorted],
        explanationUz: `Indekslar taqqoslanmoqda: [${j}] va [${j + 1}]. arr[${j}]=${a[j]}, arr[${j + 1}]=${a[j + 1]}. Kattaroq qiymat o'ng tomonga suriladi.`,
        explanationEn: `Comparing indices [${j}] and [${j + 1}]. arr[${j}]=${a[j]}, arr[${j + 1}]=${a[j + 1]}. Larger value moves right.`,
      });

      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        // — swap —
        steps.push({
          array: [...a],
          comparingIndices: [],
          swappedIndices: [j, j + 1],
          sortedIndices: [...sorted],
          explanationUz: `${a[j + 1]} > ${a[j]} edi — [${j}] va [${j + 1}] almashtirildi. Yangi: arr[${j}]=${a[j]}, arr[${j + 1}]=${a[j + 1]}.`,
          explanationEn: `Swap! Elements at [${j}] and [${j + 1}] swapped. Now: arr[${j}]=${a[j]}, arr[${j + 1}]=${a[j + 1]}.`,
        });
      } else {
        // — no swap —
        steps.push({
          array: [...a],
          comparingIndices: [],
          swappedIndices: [],
          sortedIndices: [...sorted],
          explanationUz: `arr[${j}]=${a[j]} ≤ arr[${j + 1}]=${a[j + 1]} — almashtirish kerak emas.`,
          explanationEn: `arr[${j}]=${a[j]} ≤ arr[${j + 1}]=${a[j + 1]} — no swap needed.`,
        });
      }
    }

    // mark element placed
    sorted.unshift(n - 1 - i);
    steps.push({
      array: [...a],
      comparingIndices: [],
      swappedIndices: [],
      sortedIndices: [...sorted],
      explanationUz: `[${n - 1 - i}]-indeks o'z joyiga tushdi (qiymat: ${a[n - 1 - i]}). ${i + 1}-o'tish tugadi.`,
      explanationEn: `Index [${n - 1 - i}] is in its final position (value: ${a[n - 1 - i]}). Pass ${i + 1} complete.`,
    });
  }

  sorted.unshift(0);
  steps.push({
    array: [...a],
    comparingIndices: [],
    swappedIndices: [],
    sortedIndices: [...sorted],
    explanationUz: "Saralash tugadi! Massiv to'liq tartibga keltirildi. ✓",
    explanationEn: "Sorting complete! The array is fully sorted. ✓",
  });

  return steps;
}

// ─────────────────────────────────────────────────────────────────────────────
// Merge Sort — full step precomputation
// ─────────────────────────────────────────────────────────────────────────────

function precomputeMerge(input: number[]): Step[] {
  const a = [...input];
  const steps: Step[] = [];

  steps.push({
    array: [...a],
    comparingIndices: [],
    swappedIndices: [],
    sortedIndices: [],
    explanationUz: "Boshlang'ich holat. Merge Sort boshlandi.",
    explanationEn: "Initial state. Merge Sort started.",
  });

  function merge(left: number, mid: number, right: number) {
    const L = a.slice(left, mid + 1);
    const R = a.slice(mid + 1, right + 1);
    let i = 0,
      j = 0,
      k = left;

    steps.push({
      array: [...a],
      comparingIndices: [],
      swappedIndices: [],
      sortedIndices: [],
      explanationUz: `[${left}..${mid}] va [${mid + 1}..${right}] qismlar birlashtirilmoqda.`,
      explanationEn: `Merging subarrays [${left}..${mid}] and [${mid + 1}..${right}].`,
    });

    while (i < L.length && j < R.length) {
      steps.push({
        array: [...a],
        comparingIndices: [left + i, mid + 1 + j],
        swappedIndices: [],
        sortedIndices: [],
        explanationUz: `Taqqoslanmoqda: [${left + i}]=${L[i]} va [${mid + 1 + j}]=${R[j]}.`,
        explanationEn: `Comparing: [${left + i}]=${L[i]} and [${mid + 1 + j}]=${R[j]}.`,
      });

      if (L[i] <= R[j]) {
        a[k] = L[i++];
      } else {
        a[k] = R[j++];
      }

      steps.push({
        array: [...a],
        comparingIndices: [],
        swappedIndices: [k],
        sortedIndices: [],
        explanationUz: `[${k}]-indeksga ${a[k]} qiymati yozildi.`,
        explanationEn: `Placed value ${a[k]} at index [${k}].`,
      });
      k++;
    }

    while (i < L.length) {
      a[k] = L[i++];
      steps.push({
        array: [...a],
        comparingIndices: [],
        swappedIndices: [k],
        sortedIndices: [],
        explanationUz: `Qolgan chap qism ko'chirilmoqda: [${k}]=${a[k]}.`,
        explanationEn: `Copying remaining left: [${k}]=${a[k]}.`,
      });
      k++;
    }

    while (j < R.length) {
      a[k] = R[j++];
      steps.push({
        array: [...a],
        comparingIndices: [],
        swappedIndices: [k],
        sortedIndices: [],
        explanationUz: `Qolgan o'ng qism ko'chirilmoqda: [${k}]=${a[k]}.`,
        explanationEn: `Copying remaining right: [${k}]=${a[k]}.`,
      });
      k++;
    }

    const mergedRange = Array.from(
      { length: right - left + 1 },
      (_, idx) => left + idx
    );
    steps.push({
      array: [...a],
      comparingIndices: [],
      swappedIndices: [],
      sortedIndices: mergedRange,
      explanationUz: `[${left}..${right}] oraliq muvaffaqiyatli birlashtirildi.`,
      explanationEn: `Subarray [${left}..${right}] successfully merged.`,
    });
  }

  function sort(left: number, right: number) {
    if (left >= right) return;
    const mid = Math.floor((left + right) / 2);
    steps.push({
      array: [...a],
      comparingIndices: [],
      swappedIndices: [],
      sortedIndices: [],
      explanationUz: `[${left}..${right}] ikki qismga bo'linmoqda: [${left}..${mid}] va [${mid + 1}..${right}].`,
      explanationEn: `Dividing [${left}..${right}] into [${left}..${mid}] and [${mid + 1}..${right}].`,
    });
    sort(left, mid);
    sort(mid + 1, right);
    merge(left, mid, right);
  }

  sort(0, a.length - 1);

  const allSorted = Array.from({ length: a.length }, (_, i) => i);
  steps.push({
    array: [...a],
    comparingIndices: [],
    swappedIndices: [],
    sortedIndices: allSorted,
    explanationUz: "Saralash tugadi! Massiv to'liq tartibga keltirildi. ✓",
    explanationEn: "Sorting complete! The array is fully sorted. ✓",
  });

  return steps;
}

// ─────────────────────────────────────────────────────────────────────────────
// Speed config  (0.5× → 3× maps to delay in ms)
// ─────────────────────────────────────────────────────────────────────────────

const SPEED_OPTIONS = [
  { label: "0.5×", delay: 1200 },
  { label: "1×",   delay: 600  },
  { label: "1.5×", delay: 400  },
  { label: "2×",   delay: 250  },
  { label: "2.5×", delay: 150  },
  { label: "3×",   delay: 80   },
];

// ─────────────────────────────────────────────────────────────────────────────
// Bar colour logic
// ─────────────────────────────────────────────────────────────────────────────

function barColour(
  idx: number,
  step: Step,
  isDone: boolean
): string {
  if (isDone || step.sortedIndices.includes(idx))
    return "bg-emerald-500 border-emerald-400";
  if (step.swappedIndices.includes(idx))
    return "bg-red-500 border-red-400";
  if (step.comparingIndices.includes(idx))
    return "bg-amber-400 border-amber-300";
  return "bg-indigo-500 border-indigo-400";
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_ARRAY = [
  72, 34, 88, 19, 56, 43, 91, 25, 67, 38,
  82, 16, 95, 48, 61, 29, 77, 53, 85, 30,
];

export default function SortingVisualizer() {
  const { lang } = useI18n();
  const [mounted, setMounted] = useState(false);

  // ── Source array & algorithm ──────────────────────────────────────────────
  const [sourceArray, setSourceArray] = useState<number[]>(DEFAULT_ARRAY);
  const [algo, setAlgo] = useState<AlgoId>("bubble");

  // Only randomize array on client after mounting to avoid SSR hydration mismatch
  useEffect(() => {
    setMounted(true);
    setSourceArray(randomArray());
  }, []);

  // ── Precomputed steps (memoised, recomputed only on array / algo change) ──
  const steps = useMemo<Step[]>(
    () =>
      algo === "bubble"
        ? precomputeBubble(sourceArray)
        : precomputeMerge(sourceArray),
    [sourceArray, algo]
  );

  // ── Playback state ────────────────────────────────────────────────────────
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1); // default 1× = 600ms

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = steps[stepIdx] || steps[0];
  const isDone = stepIdx === steps.length - 1;
  const isFirst = stepIdx === 0;

  // ── Auto-play ticker ──────────────────────────────────────────────────────
  const stopInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isPlaying) { stopInterval(); return; }

    intervalRef.current = setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, SPEED_OPTIONS[speedIdx].delay);

    return stopInterval;
  }, [isPlaying, speedIdx, steps.length, stopInterval]);

  // Stop playing when we reach the end
  useEffect(() => {
    if (isDone && isPlaying) setIsPlaying(false);
  }, [isDone, isPlaying]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleShuffle = useCallback(() => {
    stopInterval();
    setIsPlaying(false);
    setStepIdx(0);
    setSourceArray(randomArray());
  }, [stopInterval]);

  const handleReset = useCallback(() => {
    stopInterval();
    setIsPlaying(false);
    setStepIdx(0);
  }, [stopInterval]);

  const handleAlgoChange = useCallback(
    (id: AlgoId) => {
      stopInterval();
      setIsPlaying(false);
      setStepIdx(0);
      setAlgo(id);
    },
    [stopInterval]
  );

  const handleNext = useCallback(() => {
    stopInterval();
    setIsPlaying(false);
    setStepIdx((p) => Math.min(p + 1, steps.length - 1));
  }, [steps.length, stopInterval]);

  const handlePrev = useCallback(() => {
    stopInterval();
    setIsPlaying(false);
    setStepIdx((p) => Math.max(p - 1, 0));
  }, [stopInterval]);

  const handlePlayPause = useCallback(() => {
    if (isDone) { handleReset(); return; }
    setIsPlaying((p) => !p);
  }, [isDone, handleReset]);

  const handleSpeedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const idx = Number(e.target.value);
      setSpeedIdx(idx);
      // Restart interval immediately at new speed if playing
      if (isPlaying) {
        stopInterval();
        setIsPlaying(false);
        // small delay so the effect restarts cleanly
        requestAnimationFrame(() => setIsPlaying(true));
      }
    },
    [isPlaying, stopInterval]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const MAX_VALUE = 100;

  return (
    <div
      suppressHydrationWarning
      className="w-full max-w-4xl mx-auto flex flex-col gap-5"
    >

      {/* ── Algorithm selector ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {lang === "uz" ? "Algoritm" : "Algorithm"}
        </span>
        {(["bubble", "merge"] as AlgoId[]).map((id) => (
          <button
            key={id}
            onClick={() => handleAlgoChange(id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
              algo === id
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/30"
                : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
            }`}
          >
            {id === "bubble"
              ? lang === "uz" ? "Bubble Sort" : "Bubble Sort"
              : lang === "uz" ? "Merge Sort" : "Merge Sort"}
          </button>
        ))}

        {/* Progress */}
        <span
          suppressHydrationWarning
          className="ml-auto text-xs text-slate-500 tabular-nums"
        >
          {lang === "uz"
            ? `Qadam ${stepIdx + 1} / ${steps.length}`
            : `Step ${stepIdx + 1} of ${steps.length}`}
        </span>
      </div>

      {/* ── Bar canvas ─────────────────────────────────────────────────── */}
      <div
        suppressHydrationWarning
        className="relative w-full rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden"
        style={{ height: "300px" }}
        role="img"
        aria-label={
          lang === "uz" ? "Saralash vizualizatsiyasi" : "Sorting visualization"
        }
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(to right, #6366f1 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Bars */}
        <div
          suppressHydrationWarning
          className="absolute inset-0 flex items-end px-3 pb-3 gap-[3px]"
        >
          {currentStep.array.map((value, idx) => {
            const heightPct = (value / MAX_VALUE) * 100;
            const colour = barColour(idx, currentStep, isDone);

            return (
              <div
                key={idx}
                className={`flex-1 flex flex-col items-center justify-end rounded-t-sm border-t ${colour}`}
                style={{
                  height: `${heightPct}%`,
                  transition: "height 180ms ease, background-color 120ms ease",
                  minWidth: 0,
                }}
                aria-hidden="true"
              >
                {/* Show value label for small arrays (≤24 bars) */}
                {currentStep.array.length <= 24 && (
                  <span
                    suppressHydrationWarning
                    className="text-[9px] font-bold text-white/80 pb-0.5 leading-none select-none"
                  >
                    {value}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Done overlay */}
        {isDone && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 backdrop-blur-[2px]">
            <div className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 shadow-xl">
              <span className="text-2xl">✓</span>
              <span className="text-emerald-300 font-semibold">
                {lang === "uz"
                  ? `Saralash tugadi — ${steps.length - 1} qadam`
                  : `Sorted in ${steps.length - 1} steps`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
        {[
          { colour: "bg-indigo-500",  label: lang === "uz" ? "Saralanmagan"    : "Unsorted" },
          { colour: "bg-amber-400",   label: lang === "uz" ? "Taqqoslanmoqda"  : "Comparing" },
          { colour: "bg-red-500",     label: lang === "uz" ? "Almashtirilmoqda": "Swapping / Writing" },
          { colour: "bg-emerald-500", label: lang === "uz" ? "Saralangan"      : "Sorted" },
        ].map(({ colour, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`inline-block w-2.5 h-2.5 rounded-sm ${colour}`} />
            {label}
          </span>
        ))}
      </div>

      {/* ── Explanation banner ─────────────────────────────────────────── */}
      <div
        suppressHydrationWarning
        className="min-h-[56px] flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/70"
      >
        <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0" />
        <p
          suppressHydrationWarning
          className="text-sm text-slate-200 leading-snug"
        >
          {lang === "uz"
            ? currentStep.explanationUz
            : currentStep.explanationEn}
        </p>
      </div>

      {/* ── Controls ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-800 pt-4">

        {/* Playback buttons */}
        <div className="flex items-center gap-2">
          {/* Shuffle */}
          <button
            onClick={handleShuffle}
            title={lang === "uz" ? "Yangi massiv" : "New random array"}
            className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            disabled={isFirst && !isPlaying}
            title={lang === "uz" ? "Qayta boshlash" : "Reset"}
            className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Prev step */}
          <button
            onClick={handlePrev}
            disabled={isFirst || isPlaying}
            title={lang === "uz" ? "Oldingi qadam" : "Previous step"}
            className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={handlePlayPause}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-indigo-900/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            {isPlaying ? (
              <><Pause className="w-4 h-4" />{lang === "uz" ? "To'xtat" : "Pause"}</>
            ) : isDone ? (
              <><RotateCcw className="w-4 h-4" />{lang === "uz" ? "Qayta" : "Replay"}</>
            ) : (
              <><Play className="w-4 h-4" />{lang === "uz" ? "Ijro" : "Play"}</>
            )}
          </button>

          {/* Next step */}
          <button
            onClick={handleNext}
            disabled={isDone || isPlaying}
            title={lang === "uz" ? "Keyingi qadam" : "Next step"}
            className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            {lang === "uz" ? "Tezlik" : "Speed"}
          </span>
          <input
            type="range"
            min={0}
            max={SPEED_OPTIONS.length - 1}
            step={1}
            value={speedIdx}
            onChange={handleSpeedChange}
            className="w-28 accent-indigo-500 cursor-pointer"
            aria-label={lang === "uz" ? "Animatsiya tezligi" : "Animation speed"}
          />
          <span className="text-xs font-semibold text-indigo-400 w-8 tabular-nums">
            {SPEED_OPTIONS[speedIdx].label}
          </span>
        </div>
      </div>
    </div>
  );
}
