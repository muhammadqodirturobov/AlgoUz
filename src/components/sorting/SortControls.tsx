"use client";

import React from "react";
import {
  Play, Pause, RotateCcw, SkipForward,
  Shuffle, ChevronRight,
} from "lucide-react";
import { PlayState } from "@/lib/sorting/useSortPlayer";

interface SortControlsProps {
  playState: PlayState;
  speed: number;
  arraySize: number;
  stepCount: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onStep: () => void;
  onShuffle: () => void;
  onSpeedChange: (s: number) => void;
  onArraySizeChange: (n: number) => void;
}

const SPEED_LABELS = ["", "0.5×", "1×", "2×", "4×", "Max"];

export default function SortControls({
  playState,
  speed,
  arraySize,
  stepCount,
  onPlay,
  onPause,
  onReset,
  onStep,
  onShuffle,
  onSpeedChange,
  onArraySizeChange,
}: SortControlsProps) {
  const isPlaying = playState === "playing";
  const isDone = playState === "done";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-slate-800">
      {/* Left — playback controls */}
      <div className="flex items-center gap-2">
        {/* Shuffle */}
        <button
          onClick={onShuffle}
          title="New random array"
          className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <Shuffle className="w-4 h-4" />
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          title="Reset"
          disabled={playState === "idle"}
          className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Step */}
        <button
          onClick={onStep}
          title="Step forward"
          disabled={isPlaying || isDone}
          className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Play / Pause */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={isDone}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          {isPlaying ? (
            <><Pause className="w-4 h-4" /> Pause</>
          ) : (
            <><Play className="w-4 h-4" /> {playState === "paused" ? "Resume" : "Play"}</>
          )}
        </button>

        {/* Step counter */}
        {stepCount > 0 && (
          <span className="text-xs text-slate-500 tabular-nums">
            {stepCount} steps
          </span>
        )}
      </div>

      {/* Right — sliders */}
      <div className="flex items-center gap-5 flex-wrap">
        {/* Speed */}
        <div className="flex items-center gap-2">
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-400 w-8">Speed</span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-24 accent-indigo-500 cursor-pointer"
          />
          <span className="text-xs text-indigo-400 w-8 tabular-nums">
            {SPEED_LABELS[speed]}
          </span>
        </div>

        {/* Array size */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-16">Array size</span>
          <input
            type="range"
            min={10}
            max={120}
            step={5}
            value={arraySize}
            onChange={(e) => onArraySizeChange(Number(e.target.value))}
            disabled={playState !== "idle"}
            className="w-24 accent-indigo-500 cursor-pointer disabled:opacity-40"
          />
          <span className="text-xs text-indigo-400 w-6 tabular-nums">
            {arraySize}
          </span>
        </div>
      </div>
    </div>
  );
}
