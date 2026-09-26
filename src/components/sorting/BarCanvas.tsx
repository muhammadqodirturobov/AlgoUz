"use client";

import React, { memo } from "react";
import { SortFrame } from "@/lib/sorting/algorithms";

interface BarCanvasProps {
  frame: SortFrame;
  maxValue: number;
}

// Colour per frame state
const BAR_COLORS: Record<string, { bg: string; border: string }> = {
  compare:   { bg: "bg-yellow-400",  border: "border-yellow-300" },
  swap:      { bg: "bg-red-500",     border: "border-red-400" },
  sorted:    { bg: "bg-emerald-500", border: "border-emerald-400" },
  pivot:     { bg: "bg-purple-500",  border: "border-purple-400" },
  overwrite: { bg: "bg-sky-400",     border: "border-sky-300" },
  done:      { bg: "bg-emerald-500", border: "border-emerald-400" },
  default:   { bg: "bg-indigo-500",  border: "border-indigo-400" },
};

function getBarColor(
  idx: number,
  frame: SortFrame
): { bg: string; border: string } {
  if (frame.sortedIndices.includes(idx) || frame.type === "done") {
    return BAR_COLORS.sorted;
  }
  if (frame.activeIndices.includes(idx)) {
    return BAR_COLORS[frame.type] ?? BAR_COLORS.default;
  }
  return BAR_COLORS.default;
}

const BarCanvas = memo(function BarCanvas({ frame, maxValue }: BarCanvasProps) {
  const { array } = frame;
  const count = array.length;

  // Dynamic bar sizing: thinner bars for larger arrays
  const gap = count > 60 ? 1 : count > 30 ? 2 : 3;

  return (
    <div
      className="w-full h-full flex items-end px-2 pb-2"
      style={{ gap: `${gap}px` }}
      role="img"
      aria-label="Sorting visualization bar chart"
    >
      {array.map((value, idx) => {
        const heightPct = (value / maxValue) * 100;
        const { bg, border } = getBarColor(idx, frame);

        return (
          <div
            key={idx}
            className={`flex-1 rounded-t-sm border-t ${bg} ${border} transition-none`}
            style={{ height: `${heightPct}%` }}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
});

export default BarCanvas;
