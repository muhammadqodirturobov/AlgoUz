"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { CheckCircle2, Info } from "lucide-react";

import {
  SORTING_ALGORITHMS,
  AlgorithmMeta,
  SortFrame,
} from "@/lib/sorting/algorithms";
import { useSortPlayer } from "@/lib/sorting/useSortPlayer";
import { useI18n } from "@/lib/I18nProvider";
import BarCanvas from "@/components/sorting/BarCanvas";
import SortControls from "@/components/sorting/SortControls";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function generateArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 95) + 5);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SortingVisualizer() {
  const { lang } = useI18n();

  const [arraySize, setArraySize] = useState(40);
  const [sourceArray, setSourceArray] = useState<number[]>(() => generateArray(40));
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmMeta>(SORTING_ALGORITHMS[0]);
  const [currentFrame, setCurrentFrame] = useState<SortFrame>(() => {
    const arr = generateArray(40);
    return { array: arr, type: "compare", activeIndices: [], sortedIndices: [] };
  });
  const maxValue = useRef(100); // updated on every shuffle/resize

  // Shuffle produces a fresh array and resets everything
  const handleShuffle = useCallback(() => {
    const arr = generateArray(arraySize);
    maxValue.current = Math.max(...arr);
    setSourceArray(arr);
    setCurrentFrame({
      array: arr,
      type: "compare",
      activeIndices: [],
      sortedIndices: [],
    });
  }, [arraySize]);

  // When size slider changes, generate a new array (only when idle)
  const handleArraySizeChange = useCallback((n: number) => {
    setArraySize(n);
    const arr = generateArray(n);
    maxValue.current = Math.max(...arr);
    setSourceArray(arr);
    setCurrentFrame({
      array: arr,
      type: "compare",
      activeIndices: [],
      sortedIndices: [],
    });
  }, []);

  const handleFrame = useCallback((frame: SortFrame) => {
    setCurrentFrame(frame);
  }, []);

  const handleDone = useCallback(() => {
    // playState transitions handled inside useSortPlayer
  }, []);

  const { playState, stepCount, speed, setSpeed, play, pause, reset, stepOnce } =
    useSortPlayer({
      algorithm: selectedAlgo,
      array: sourceArray,
      onFrame: handleFrame,
      onDone: handleDone,
    });

  // When algorithm changes, reset
  const handleAlgoChange = useCallback(
    (algo: AlgorithmMeta) => {
      reset();
      setSelectedAlgo(algo);
      setCurrentFrame({
        array: sourceArray,
        type: "compare",
        activeIndices: [],
        sortedIndices: [],
      });
    },
    [reset, sourceArray]
  );

  // Expose reset + shuffle combo
  const handleReset = useCallback(() => {
    reset();
    setCurrentFrame({
      array: sourceArray,
      type: "compare",
      activeIndices: [],
      sortedIndices: [],
    });
  }, [reset, sourceArray]);

  // Keep frame in sync when source array is replaced while idle
  useEffect(() => {
    if (playState === "idle") {
      setCurrentFrame({
        array: sourceArray,
        type: "compare",
        activeIndices: [],
        sortedIndices: [],
      });
    }
  }, [sourceArray, playState]);

  const isDone = playState === "done";

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
      {/* ── Algorithm Picker ───────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {SORTING_ALGORITHMS.map((algo) => {
          const isActive = algo.id === selectedAlgo.id;
          return (
            <button
              key={algo.id}
              onClick={() => handleAlgoChange(algo)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                isActive
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/30"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
              }`}
            >
              {lang === "uz" ? algo.labelUz : algo.labelEn}
            </button>
          );
        })}
      </div>

      {/* ── Info Bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-semibold text-white">
            {lang === "uz" ? selectedAlgo.labelUz : selectedAlgo.labelEn}
          </span>
        </span>
        <span>Time: <span className="text-indigo-300 font-mono">{selectedAlgo.timeComplexity}</span></span>
        <span>Space: <span className="text-indigo-300 font-mono">{selectedAlgo.spaceComplexity}</span></span>
        <span>Stable: <span className={selectedAlgo.stable ? "text-emerald-400" : "text-red-400"}>{selectedAlgo.stable ? "Yes" : "No"}</span></span>
      </div>

      {/* ── Bar Canvas ─────────────────────────────────────────────────── */}
      <div
        className="relative w-full rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden"
        style={{ height: "340px" }}
      >
        {/* Decorative grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(to right, #6366f1 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <BarCanvas frame={currentFrame} maxValue={maxValue.current} />

        {/* Done overlay */}
        {isDone && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-300 font-semibold text-sm">
                {lang === "uz"
                  ? `Saralash tugadi — ${stepCount} qadam`
                  : `Sorted in ${stepCount} steps`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        {[
          { color: "bg-indigo-500",  label: "Unsorted" },
          { color: "bg-yellow-400",  label: "Comparing" },
          { color: "bg-red-500",     label: "Swapping" },
          { color: "bg-sky-400",     label: "Writing" },
          { color: "bg-purple-500",  label: "Pivot" },
          { color: "bg-emerald-500", label: "Sorted" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
            {label}
          </span>
        ))}
      </div>

      {/* ── Controls ───────────────────────────────────────────────────── */}
      <SortControls
        playState={playState}
        speed={speed}
        arraySize={arraySize}
        stepCount={stepCount}
        onPlay={play}
        onPause={pause}
        onReset={handleReset}
        onStep={stepOnce}
        onShuffle={handleShuffle}
        onSpeedChange={setSpeed}
        onArraySizeChange={handleArraySizeChange}
      />
    </div>
  );
}
