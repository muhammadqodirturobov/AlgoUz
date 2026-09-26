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
  Code2,
  Terminal,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
} from "lucide-react";
import { useI18n } from "@/lib/I18nProvider";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type Step = {
  array: number[];
  comparingIndices: number[];
  swappedIndices: number[];
  sortedIndices: number[];
  comparisonsCount: number;
  swapsCount: number;
  codeLine: number; // 1-indexed line number in source template
  explanationUz: string;
  explanationEn: string;
};

export type AlgoId = "bubble" | "merge";
export type CodeLanguage = "python" | "cpp" | "pseudo";

// ─────────────────────────────────────────────────────────────────────────────
// Algorithm Complexity Definitions
// ─────────────────────────────────────────────────────────────────────────────

interface AlgorithmComplexity {
  worstTime: string;
  avgTime: string;
  bestTime: string;
  space: string;
  stable: boolean;
  descEn: string;
  descUz: string;
}

const COMPLEXITY_DATA: Record<AlgoId, AlgorithmComplexity> = {
  bubble: {
    worstTime: "O(n²)",
    avgTime: "Θ(n²)",
    bestTime: "Ω(n)",
    space: "O(1)",
    stable: true,
    descEn:
      "Repeatedly steps through the list, compares adjacent elements, and swaps them if out of order.",
    descUz:
      "Massiv bo'ylab ketma-ket yurib, qo'shni elementlarni taqqoslaydi va noto'g'ri tartibda bo'lsa almashtiradi.",
  },
  merge: {
    worstTime: "O(n log n)",
    avgTime: "Θ(n log n)",
    bestTime: "Ω(n log n)",
    space: "O(n)",
    stable: true,
    descEn:
      "Divide-and-conquer paradigm that splits the list in halves, sorts recursively, and merges sorted sublists.",
    descUz:
      "Bo'lib tashla va hukmronlik qil: massivni ikkiga bo'ladi, rekursiv tartiblaydi va natijalarni birlashtiradi.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Multi-Language Code Templates
// ─────────────────────────────────────────────────────────────────────────────

const CODE_TEMPLATES: Record<
  AlgoId,
  Record<CodeLanguage, { name: string; lines: string[]; mapLine: (l: number) => number }>
> = {
  bubble: {
    python: {
      name: "bubble_sort.py",
      lines: [
        "def bubble_sort(arr):",
        "    n = len(arr)",
        "    for i in range(n - 1):",
        "        for j in range(n - i - 1):",
        "            if arr[j] > arr[j + 1]:",
        "                arr[j], arr[j + 1] = arr[j + 1], arr[j]",
        "    return arr",
      ],
      mapLine: (l) => l,
    },
    cpp: {
      name: "bubbleSort.cpp",
      lines: [
        "void bubbleSort(vector<int>& arr) {",
        "    int n = arr.size();",
        "    for (int i = 0; i < n - 1; i++) {",
        "        for (int j = 0; j < n - i - 1; j++) {",
        "            if (arr[j] > arr[j + 1]) {",
        "                swap(arr[j], arr[j + 1]);",
        "            }",
        "        }",
        "    }",
        "}",
      ],
      mapLine: (l) => {
        if (l === 7) return 10;
        return l;
      },
    },
    pseudo: {
      name: "bubble_sort.algo",
      lines: [
        "algorithm BubbleSort(A):",
        "    n ← length(A)",
        "    for i ← 0 to n - 2 do:",
        "        for j ← 0 to n - i - 2 do:",
        "            if A[j] > A[j + 1] then:",
        "                swap(A[j], A[j + 1])",
        "    return A",
      ],
      mapLine: (l) => l,
    },
  },
  merge: {
    python: {
      name: "merge_sort.py",
      lines: [
        "def merge_sort(arr, l, r):",
        "    if l < r:",
        "        m = (l + r) // 2",
        "        merge_sort(arr, l, m)",
        "        merge_sort(arr, m + 1, r)",
        "        merge(arr, l, m, r)",
        "",
        "def merge(arr, l, m, r):",
        "    if L[i] <= R[j]:",
        "        arr[k] = L[i]",
        "    else:",
        "        arr[k] = R[j]",
      ],
      mapLine: (l) => l,
    },
    cpp: {
      name: "mergeSort.cpp",
      lines: [
        "void mergeSort(vector<int>& a, int l, int r) {",
        "    if (l < r) {",
        "        int m = l + (r - l) / 2;",
        "        mergeSort(a, l, m);",
        "        mergeSort(a, m + 1, r);",
        "        merge(a, l, m, r);",
        "    }",
        "}",
        "void merge(vector<int>& a, int l, int m, int r) {",
        "    if (L[i] <= R[j]) a[k] = L[i++];",
        "    else a[k] = R[j++];",
        "}",
      ],
      mapLine: (l) => {
        if (l >= 8 && l <= 12) return 10;
        return l;
      },
    },
    pseudo: {
      name: "merge_sort.algo",
      lines: [
        "procedure MergeSort(A, left, right):",
        "    if left < right then:",
        "        mid ← ⌊(left + right) / 2⌋",
        "        MergeSort(A, left, mid)",
        "        MergeSort(A, mid + 1, right)",
        "        Merge(A, left, mid, right)",
        "procedure Merge(A, left, mid, right):",
        "    if L[i] ≤ R[j] then:",
        "        A[k] ← L[i]",
        "    else:",
        "        A[k] ← R[j]",
      ],
      mapLine: (l) => {
        if (l >= 8) return Math.min(11, l - 1);
        return l;
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Preset Generators
// ─────────────────────────────────────────────────────────────────────────────

function generateRandom(n = 20): number[] {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 86) + 15);
}

function generateReversed(n = 20): number[] {
  const step = Math.floor(82 / Math.max(1, n - 1));
  return Array.from({ length: n }, (_, i) => Math.max(15, 98 - i * step));
}

function generateNearlySorted(n = 20): number[] {
  const step = Math.floor(80 / Math.max(1, n - 1));
  const arr = Array.from({ length: n }, (_, i) => 15 + i * step);
  if (n > 6) {
    [arr[2], arr[4]] = [arr[4], arr[2]];
    [arr[n - 3], arr[n - 5]] = [arr[n - 5], arr[n - 3]];
  }
  return arr;
}

function generateFewUnique(n = 20): number[] {
  const pool = [22, 48, 76, 96];
  return Array.from({ length: n }, () => pool[Math.floor(Math.random() * pool.length)]);
}

const DEFAULT_ARRAY = [
  72, 34, 88, 19, 56, 43, 91, 25, 67, 38,
  82, 16, 95, 48, 61, 29, 77, 53, 85, 30,
];

// ─────────────────────────────────────────────────────────────────────────────
// Bubble Sort — Step Precomputation with Telemetry & Line Tracking
// ─────────────────────────────────────────────────────────────────────────────

function precomputeBubble(input: number[]): Step[] {
  const a = [...input];
  const steps: Step[] = [];
  const n = a.length;
  const sorted: number[] = [];
  let comparisons = 0;
  let swaps = 0;

  steps.push({
    array: [...a],
    comparingIndices: [],
    swappedIndices: [],
    sortedIndices: [],
    comparisonsCount: 0,
    swapsCount: 0,
    codeLine: 1,
    explanationUz: "Boshlang'ich holat. Bubble Sort tahlili boshlandi.",
    explanationEn: "Initial state. Bubble Sort execution initialized.",
  });

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      steps.push({
        array: [...a],
        comparingIndices: [j, j + 1],
        swappedIndices: [],
        sortedIndices: [...sorted],
        comparisonsCount: comparisons,
        swapsCount: swaps,
        codeLine: 5,
        explanationUz: `Taqqoslash: [${j}] (${a[j]}) va [${j + 1}] (${a[j + 1]}). Agar a[j] > a[j+1] bo'lsa, o'rin almashadi.`,
        explanationEn: `Comparing indices [${j}] (${a[j]}) and [${j + 1}] (${a[j + 1]}). If a[j] > a[j+1], a swap occurs.`,
      });

      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swaps++;
        steps.push({
          array: [...a],
          comparingIndices: [],
          swappedIndices: [j, j + 1],
          sortedIndices: [...sorted],
          comparisonsCount: comparisons,
          swapsCount: swaps,
          codeLine: 6,
          explanationUz: `Almashtirish bajarildi: [${j}] va [${j + 1}] o'rinlari almashdi. Yangi tartib: ${a[j]}, ${a[j + 1]}.`,
          explanationEn: `Swap executed: [${j}] and [${j + 1}] exchanged. Elements now: ${a[j]}, ${a[j + 1]}.`,
        });
      } else {
        steps.push({
          array: [...a],
          comparingIndices: [],
          swappedIndices: [],
          sortedIndices: [...sorted],
          comparisonsCount: comparisons,
          swapsCount: swaps,
          codeLine: 4,
          explanationUz: `Tartib to'g'ri (a[${j}] <= a[${j + 1}]). Keyingi qo'shni juftlikka o'tilmoqda.`,
          explanationEn: `Order correct (a[${j}] <= a[${j + 1}]). Advancing to next adjacent pair.`,
        });
      }
    }

    sorted.unshift(n - 1 - i);
    steps.push({
      array: [...a],
      comparingIndices: [],
      swappedIndices: [],
      sortedIndices: [...sorted],
      comparisonsCount: comparisons,
      swapsCount: swaps,
      codeLine: 3,
      explanationUz: `O'tish ${i + 1} yakunlandi. Maksimal qiymat [${n - 1 - i}] indeksiga o'rnatildi (${a[n - 1 - i]}).`,
      explanationEn: `Pass ${i + 1} completed. Maximum element bubbled to final index [${n - 1 - i}] (${a[n - 1 - i]}).`,
    });
  }

  sorted.unshift(0);
  steps.push({
    array: [...a],
    comparingIndices: [],
    swappedIndices: [],
    sortedIndices: [...sorted],
    comparisonsCount: comparisons,
    swapsCount: swaps,
    codeLine: 7,
    explanationUz: `Saralash muvaffaqiyatli yakunlandi! Jami taqqoslashlar: ${comparisons}, almashtirishlar: ${swaps}.`,
    explanationEn: `Sorting completed successfully! Total comparisons: ${comparisons}, swaps: ${swaps}.`,
  });

  return steps;
}

// ─────────────────────────────────────────────────────────────────────────────
// Merge Sort — Step Precomputation with Telemetry & Line Tracking
// ─────────────────────────────────────────────────────────────────────────────

function precomputeMerge(input: number[]): Step[] {
  const a = [...input];
  const steps: Step[] = [];
  let comparisons = 0;
  let accesses = 0;

  steps.push({
    array: [...a],
    comparingIndices: [],
    swappedIndices: [],
    sortedIndices: [],
    comparisonsCount: 0,
    swapsCount: 0,
    codeLine: 1,
    explanationUz: "Boshlang'ich holat. Merge Sort (bo'lib tashla va hukmronlik qil) boshlandi.",
    explanationEn: "Initial state. Merge Sort (divide-and-conquer) initialized.",
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
      comparisonsCount: comparisons,
      swapsCount: accesses,
      codeLine: 6,
      explanationUz: `Qismlar birlashtirilmoqda: [${left}..${mid}] va [${mid + 1}..${right}].`,
      explanationEn: `Merging subarrays: [${left}..${mid}] and [${mid + 1}..${right}].`,
    });

    while (i < L.length && j < R.length) {
      comparisons++;
      steps.push({
        array: [...a],
        comparingIndices: [left + i, mid + 1 + j],
        swappedIndices: [],
        sortedIndices: [],
        comparisonsCount: comparisons,
        swapsCount: accesses,
        codeLine: 9,
        explanationUz: `Taqqoslash: chap [${left + i}]=${L[i]} va o'ng [${mid + 1 + j}]=${R[j]}.`,
        explanationEn: `Comparing: left [${left + i}]=${L[i]} and right [${mid + 1 + j}]=${R[j]}.`,
      });

      if (L[i] <= R[j]) {
        a[k] = L[i++];
      } else {
        a[k] = R[j++];
      }
      accesses++;

      steps.push({
        array: [...a],
        comparingIndices: [],
        swappedIndices: [k],
        sortedIndices: [],
        comparisonsCount: comparisons,
        swapsCount: accesses,
        codeLine: 10,
        explanationUz: `Kichikroq qiymat (${a[k]}) asosiy massivning [${k}] indeksiga yozildi.`,
        explanationEn: `Smaller value (${a[k]}) placed into master array index [${k}].`,
      });
      k++;
    }

    while (i < L.length) {
      a[k] = L[i++];
      accesses++;
      steps.push({
        array: [...a],
        comparingIndices: [],
        swappedIndices: [k],
        sortedIndices: [],
        comparisonsCount: comparisons,
        swapsCount: accesses,
        codeLine: 10,
        explanationUz: `Chap qismdan qolgan element (${a[k]}) [${k}] ga ko'chirildi.`,
        explanationEn: `Remaining element from left partition (${a[k]}) copied to [${k}].`,
      });
      k++;
    }

    while (j < R.length) {
      a[k] = R[j++];
      accesses++;
      steps.push({
        array: [...a],
        comparingIndices: [],
        swappedIndices: [k],
        sortedIndices: [],
        comparisonsCount: comparisons,
        swapsCount: accesses,
        codeLine: 12,
        explanationUz: `O'ng qismdan qolgan element (${a[k]}) [${k}] ga ko'chirildi.`,
        explanationEn: `Remaining element from right partition (${a[k]}) copied to [${k}].`,
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
      comparisonsCount: comparisons,
      swapsCount: accesses,
      codeLine: 6,
      explanationUz: `[${left}..${right}] oraliq muvaffaqiyatli saralangan holatda birlashtirildi.`,
      explanationEn: `Subarray [${left}..${right}] successfully merged in sorted order.`,
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
      comparisonsCount: comparisons,
      swapsCount: accesses,
      codeLine: 3,
      explanationUz: `Bo'lish: oraliq [${left}..${right}] o'rtasi m=${mid} orqali ikkiga ajratildi.`,
      explanationEn: `Divide: subarray [${left}..${right}] split at mid m=${mid}.`,
    });
    sort(left, mid);
    sort(mid + 1, right);
    merge(left, mid, right);
  }

  sort(0, a.length - 1);

  const allSorted = Array.from({ length: a.length }, (_, idx) => idx);
  steps.push({
    array: [...a],
    comparingIndices: [],
    swappedIndices: [],
    sortedIndices: allSorted,
    comparisonsCount: comparisons,
    swapsCount: accesses,
    codeLine: 1,
    explanationUz: `Merge Sort yakunlandi! Jami taqqoslashlar: ${comparisons}, yozishlar: ${accesses}.`,
    explanationEn: `Merge Sort complete! Total comparisons: ${comparisons}, array writes: ${accesses}.`,
  });

  return steps;
}

// ─────────────────────────────────────────────────────────────────────────────
// Speed Options
// ─────────────────────────────────────────────────────────────────────────────

const SPEED_OPTIONS = [
  { label: "0.5×", delay: 1000 },
  { label: "1×", delay: 500 },
  { label: "1.5×", delay: 300 },
  { label: "2×", delay: 180 },
  { label: "2.5×", delay: 90 },
  { label: "3×", delay: 40 },
];

function barColour(idx: number, step: Step, isDone: boolean): string {
  if (isDone || step.sortedIndices.includes(idx))
    return "bg-emerald-500 border-emerald-400 text-emerald-200 shadow-emerald-500/20";
  if (step.swappedIndices.includes(idx))
    return "bg-rose-500 border-rose-400 text-rose-200 shadow-rose-500/30";
  if (step.comparingIndices.includes(idx))
    return "bg-amber-400 border-amber-300 text-amber-950 shadow-amber-400/30";
  return "bg-indigo-600 border-indigo-500 text-indigo-200";
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function SortingVisualizer() {
  const { lang } = useI18n();

  // ── State ─────────────────────────────────────────────────────────────────
  const [sourceArray, setSourceArray] = useState<number[]>(DEFAULT_ARRAY);
  const [algo, setAlgo] = useState<AlgoId>("bubble");
  const [activeLang, setActiveLang] = useState<CodeLanguage>("python");
  const [isCodePanelOpen, setIsCodePanelOpen] = useState<boolean>(true);

  // Custom Array Input state
  const [customInput, setCustomInput] = useState<string>(" ");
  const [inputError, setInputError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>("random");

  // Playback state
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedIdx, setSpeedIdx] = useState<number>(1); // default 1× = 500ms

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mount effect to randomize array strictly on client
  useEffect(() => {
    setSourceArray(generateRandom(20));
    setCustomInput("");
  }, []);

  // Precomputed steps
  const steps = useMemo<Step[]>(
    () =>
      algo === "bubble"
        ? precomputeBubble(sourceArray)
        : precomputeMerge(sourceArray),
    [sourceArray, algo]
  );

  const currentStep = steps[stepIdx] || steps[0];
  const isDone = stepIdx === steps.length - 1;
  const isFirst = stepIdx === 0;
  const complexity = COMPLEXITY_DATA[algo];
  const codeTemplate = CODE_TEMPLATES[algo][activeLang];

  // ── Auto-play ticker ──────────────────────────────────────────────────────
  const stopInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      stopInterval();
      return;
    }

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

  useEffect(() => {
    if (isDone && isPlaying) setIsPlaying(false);
  }, [isDone, isPlaying]);

  // ── Handlers ──────────────────────────────────────────────────────────────
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
    if (isDone) {
      handleReset();
      return;
    }
    setIsPlaying((p) => !p);
  }, [isDone, handleReset]);

  // Custom array apply
  const handleApplyCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInputError(null);
    const parts = customInput.split(/[,\s]+/).filter((s) => s.trim().length > 0);
    const nums = parts.map((p) => parseInt(p, 10)).filter((p) => !isNaN(p));

    if (nums.length < 4) {
      setInputError(
        lang === "uz"
          ? "Kamida 4 ta son kiriting (masalan: 45, 12, 85, 32, 8)"
          : "Please enter at least 4 numbers (e.g. 45, 12, 85, 32, 8)"
      );
      return;
    }
    if (nums.length > 36) {
      setInputError(
        lang === "uz"
          ? "Maksimal 36 ta son kiritish mumkin"
          : "Maximum 36 numbers allowed for clean canvas rendering"
      );
      return;
    }

    const clamped = nums.map((n) => Math.max(5, Math.min(100, n)));
    stopInterval();
    setIsPlaying(false);
    setStepIdx(0);
    setSourceArray(clamped);
    setSelectedPreset("custom");
    setCustomInput("");
  };

  // Presets selector
  const handlePresetSelect = (preset: "random" | "reversed" | "nearly" | "few") => {
    stopInterval();
    setIsPlaying(false);
    setStepIdx(0);
    setInputError(null);
    setSelectedPreset(preset);
    const n = sourceArray.length || 20;

    if (preset === "random") setSourceArray(generateRandom(n));
    else if (preset === "reversed") setSourceArray(generateReversed(n));
    else if (preset === "nearly") setSourceArray(generateNearlySorted(n));
    else if (preset === "few") setSourceArray(generateFewUnique(n));
  };

  const activeHighlightedLine = codeTemplate.mapLine(currentStep.codeLine);
  const MAX_VALUE = 100;

  return (
    <div
      suppressHydrationWarning
      className="w-full flex flex-col gap-6"
    >
      {/* ── Top Header Bar: Algorithm Selector & Code Panel Toggle ──────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono font-semibold uppercase text-slate-300">
              AlgoUZ CS Lab
            </span>
          </div>

          <div className="inline-flex rounded-xl bg-zinc-900 border border-zinc-800 p-1">
            {(["bubble", "merge"] as AlgoId[]).map((id) => (
              <button
                key={id}
                onClick={() => handleAlgoChange(id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                  algo === id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                    : "text-slate-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {id === "bubble" ? "Bubble Sort" : "Merge Sort"}
              </button>
            ))}
          </div>
        </div>

        {/* Code Panel Toggle Button */}
        <button
          onClick={() => setIsCodePanelOpen((o) => !o)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all ${
            isCodePanelOpen
              ? "bg-zinc-900 border-zinc-700 text-indigo-300 hover:text-white"
              : "bg-indigo-600/20 border-indigo-500/50 text-indigo-200 hover:bg-indigo-600/30"
          }`}
        >
          <Code2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            {isCodePanelOpen
              ? lang === "uz" ? "Kodni yashirish" : "Hide Code Panel"
              : lang === "uz" ? "Kodni ko'rsatish" : "Show Code Panel"}
          </span>
          {isCodePanelOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>
      </div>

      {/* ── Two-Column Engineering Layout ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN (60% / col-span-7 or full if collapsed) ──────── */}
        <div
          className={`${
            isCodePanelOpen
              ? "lg:col-span-7 xl:col-span-7"
              : "lg:col-span-12 xl:col-span-12"
          } flex flex-col gap-4 transition-all duration-300`}
        >
          {/* 1. Monospaced Telemetry Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                {lang === "uz" ? "Taqqoslar" : "Comparisons"}
              </span>
              <span className="text-lg font-bold font-mono text-amber-400 tabular-nums">
                {currentStep.comparisonsCount}
              </span>
            </div>

            <div className="px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                {algo === "bubble"
                  ? lang === "uz" ? "Almashtirishlar" : "Swaps"
                  : lang === "uz" ? "Yozishlar" : "Array Writes"}
              </span>
              <span className="text-lg font-bold font-mono text-rose-400 tabular-nums">
                {currentStep.swapsCount}
              </span>
            </div>

            <div className="px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                {lang === "uz" ? "Elementlar Soni" : "Array Size"}
              </span>
              <span className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
                N = {currentStep.array.length}
              </span>
            </div>

            <div className="px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                {lang === "uz" ? "Ijro Qadami" : "Active Step"}
              </span>
              <span className="text-lg font-bold font-mono text-indigo-300 tabular-nums">
                {stepIdx + 1} / {steps.length}
              </span>
            </div>
          </div>

          {/* 2. Interactive Canvas */}
          <div
            suppressHydrationWarning
            className="relative w-full rounded-2xl border border-zinc-800 bg-slate-900/70 p-4 shadow-xl overflow-hidden"
            style={{ height: "340px" }}
            role="img"
            aria-label="Algorithm visualization canvas"
          >
            {/* Engineering Grid Pattern */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.035]"
              style={{
                backgroundImage:
                  "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(to right, #6366f1 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />

            {/* Vertical Sorting Bars */}
            <div
              suppressHydrationWarning
              className="absolute inset-0 flex items-end px-4 pb-4 gap-[3px] sm:gap-[4px]"
            >
              {currentStep.array.map((value, idx) => {
                const heightPct = (value / MAX_VALUE) * 100;
                const colour = barColour(idx, currentStep, isDone);

                return (
                  <div
                    key={idx}
                    className={`flex-1 flex flex-col items-center justify-end rounded-t-sm border-t ${colour} shadow-sm transition-all duration-150`}
                    style={{
                      height: `${heightPct}%`,
                      minWidth: 0,
                    }}
                    aria-hidden="true"
                  >
                    {currentStep.array.length <= 25 && (
                      <span
                        suppressHydrationWarning
                        className="text-[9px] font-bold font-mono pb-0.5 leading-none select-none drop-shadow"
                      >
                        {value}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Done Overlay */}
            {isDone && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/65 backdrop-blur-[2px]">
                <div className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 shadow-2xl animate-in fade-in">
                  <span className="text-emerald-400 font-bold text-xl">✓</span>
                  <div>
                    <p className="text-sm font-bold text-emerald-300">
                      {lang === "uz" ? "Saralash yakunlandi!" : "Sorted Successfully!"}
                    </p>
                    <p className="text-xs font-mono text-emerald-400/80">
                      {currentStep.comparisonsCount} comparisons · {currentStep.swapsCount} ops
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Color Legend */}
          <div className="flex flex-wrap items-center justify-between gap-y-2 text-[11px] text-slate-400 px-1">
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
                <span>{lang === "uz" ? "Boshlang'ich" : "Unsorted"}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                <span>{lang === "uz" ? "Taqqoslanmoqda" : "Comparing"}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span>{lang === "uz" ? "Almashuv / Yozish" : "Swap / Write"}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>{lang === "uz" ? "Saralangan" : "Sorted"}</span>
              </span>
            </div>
          </div>

          {/* 4. Real-time Bilingual Explanation Banner */}
          <div
            suppressHydrationWarning
            className="flex items-start gap-3 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/80"
          >
            <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p
              suppressHydrationWarning
              className="text-xs sm:text-sm text-slate-200 leading-snug font-mono"
            >
              {lang === "uz"
                ? currentStep.explanationUz
                : currentStep.explanationEn}
            </p>
          </div>

          {/* 5. Playback Controls Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            {/* Playback Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePresetSelect("random")}
                title={lang === "uz" ? "Yangi tasodifiy massiv" : "New random array"}
                className="p-2.5 rounded-xl border border-zinc-700 bg-zinc-800/80 text-slate-300 hover:text-white hover:border-zinc-600 transition-colors"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={handleReset}
                disabled={isFirst && !isPlaying}
                title={lang === "uz" ? "Qayta boshlash" : "Reset"}
                className="p-2.5 rounded-xl border border-zinc-700 bg-zinc-800/80 text-slate-300 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-40"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handlePrev}
                disabled={isFirst || isPlaying}
                title={lang === "uz" ? "Oldingi qadam" : "Previous step"}
                className="p-2.5 rounded-xl border border-zinc-700 bg-zinc-800/80 text-slate-300 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-40"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={handlePlayPause}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold transition-all shadow-lg shadow-indigo-900/40"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>{lang === "uz" ? "To'xtat" : "Pause"}</span>
                  </>
                ) : isDone ? (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>{lang === "uz" ? "Qayta" : "Replay"}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>{lang === "uz" ? "Ijro" : "Play"}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleNext}
                disabled={isDone || isPlaying}
                title={lang === "uz" ? "Keyingi qadam" : "Next step"}
                className="p-2.5 rounded-xl border border-zinc-700 bg-zinc-800/80 text-slate-300 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-40"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Speed Slider */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">
                {lang === "uz" ? "Tezlik:" : "Speed:"}
              </span>
              <input
                type="range"
                min={0}
                max={SPEED_OPTIONS.length - 1}
                step={1}
                value={speedIdx}
                onChange={(e) => setSpeedIdx(Number(e.target.value))}
                className="w-24 sm:w-28 accent-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-indigo-400 w-8 tabular-nums">
                {SPEED_OPTIONS[speedIdx].label}
              </span>
            </div>
          </div>

          {/* 6. Custom Data Injection Toolbar */}
          <div className="flex flex-col gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono font-semibold uppercase text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                {lang === "uz" ? "Ma'lumotlar In'yeksiyasi (Data Injection)" : "Data Injection Toolbar"}
              </span>

              {/* Presets dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  {lang === "uz" ? "Shablonlar:" : "Presets:"}
                </span>
                <select
                  value={selectedPreset}
                  onChange={(e) =>
                    handlePresetSelect(
                      e.target.value as "random" | "reversed" | "nearly" | "few"
                    )
                  }
                  className="px-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-950 border border-zinc-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                >
                  <option value="random">Randomized</option>
                  <option value="reversed">Worst Case (Reversed)</option>
                  <option value="nearly">Nearly Sorted</option>
                  <option value="few">Few Unique</option>
                  {selectedPreset === "custom" && (
                    <option value="custom">Custom Array</option>
                  )}
                </select>
              </div>
            </div>

            {/* Manual Array Input Box */}
            <form onSubmit={handleApplyCustom} className="flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder={
                  lang === "uz"
                    ? "Maxsus massiv (masalan: 45, 12, 85, 32, 8)"
                    : "Custom array (e.g. 45, 12, 85, 32, 8)"
                }
                className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-mono font-medium text-slate-200 hover:text-white transition-colors"
              >
                {lang === "uz" ? "Qo'llash" : "Apply"}
              </button>
            </form>

            {inputError && (
              <p className="text-xs font-mono text-rose-400 pl-1">{inputError}</p>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN (40% / col-span-5) Collapsible Code Panel ───── */}
        {isCodePanelOpen && (
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-4 animate-in fade-in duration-200">
            {/* Code Execution Viewer Terminal */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col">
              {/* Terminal Title Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 ml-2">
                    {codeTemplate.name}
                  </span>
                </div>

                {/* Language Switcher Tabs */}
                <div className="inline-flex rounded-lg bg-zinc-950 border border-zinc-800 p-0.5">
                  {(["python", "cpp", "pseudo"] as CodeLanguage[]).map((langId) => (
                    <button
                      key={langId}
                      onClick={() => setActiveLang(langId)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-medium transition-all ${
                        activeLang === langId
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white hover:bg-zinc-800"
                      }`}
                    >
                      {langId === "cpp"
                        ? "C++"
                        : langId === "python"
                        ? "Python"
                        : "Pseudo"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Line Listing with Real-Time Active Line Highlight */}
              <div className="p-3 font-mono text-xs overflow-x-auto select-none bg-zinc-950/90 max-h-[360px] overflow-y-auto">
                {codeTemplate.lines.map((codeText, index) => {
                  const lineNum = index + 1;
                  const isCurrentExecuting = lineNum === activeHighlightedLine;

                  return (
                    <div
                      key={lineNum}
                      className={`flex items-center py-0.5 px-2 rounded transition-colors duration-100 ${
                        isCurrentExecuting
                          ? "bg-indigo-950/80 border-l-2 border-indigo-400 text-indigo-200 font-semibold shadow-inner"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {/* Line Number & Execution Pointer */}
                      <span className="w-6 shrink-0 text-slate-600 text-[10px] select-none text-right pr-2">
                        {isCurrentExecuting ? "▶" : lineNum}
                      </span>
                      {/* Code Content */}
                      <pre className="font-mono text-xs whitespace-pre">
                        {codeText || " "}
                      </pre>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Big-O Complexity Card */}
            <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex flex-col gap-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-semibold uppercase text-slate-200">
                    {lang === "uz"
                      ? "Asimptotik Murakkablik (Big-O)"
                      : "Asymptotic Complexity (Big-O)"}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-indigo-300 border border-zinc-700">
                  {algo.toUpperCase()}
                </span>
              </div>

              {/* 4 Metric Badges Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    {lang === "uz" ? "Eng Yomon Holat" : "Worst Case"}
                  </span>
                  <span className="text-sm font-bold font-mono text-rose-400">
                    {complexity.worstTime}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    {lang === "uz" ? "O'rtacha Holat" : "Average Case"}
                  </span>
                  <span className="text-sm font-bold font-mono text-amber-400">
                    {complexity.avgTime}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    {lang === "uz" ? "Eng Yaxshi Holat" : "Best Case"}
                  </span>
                  <span className="text-sm font-bold font-mono text-emerald-400">
                    {complexity.bestTime}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    {lang === "uz" ? "Qo'shimcha Xotira" : "Aux Space"}
                  </span>
                  <span className="text-sm font-bold font-mono text-cyan-400">
                    {complexity.space}
                  </span>
                </div>
              </div>

              {/* Stability & Theoretical summary */}
              <div className="flex items-center justify-between text-xs font-mono pt-1 text-slate-400 border-t border-zinc-800">
                <span>{lang === "uz" ? "Barqarorlik (Stability):" : "Stability:"}</span>
                <span className="font-semibold text-emerald-400">
                  {complexity.stable
                    ? lang === "uz" ? "Barqaror (Stable) ✓" : "Stable ✓"
                    : lang === "uz" ? "No-barqaror (Unstable)" : "Unstable"}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {lang === "uz" ? complexity.descUz : complexity.descEn}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
