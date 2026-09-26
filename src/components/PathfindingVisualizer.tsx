"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { Play, RotateCcw, Trash2, Shuffle, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/I18nProvider";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ROWS = 15;
const COLS = 25;

/** Start node position */
const SR = 7;
const SC = 2;

/** End (target) node position */
const ER = 7;
const EC = 22;

/** Delay between each visited-node animation frame (ms) */
const VISIT_MS = 16;

/** Delay between each path-node animation frame (ms) */
const PATH_MS = 45;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type AnimStatus = "idle" | "running" | "done" | "no-path";

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Encode row/col as a string key */
const key = (r: number, c: number) => `${r}-${c}`;

/** True if (r,c) is the start or end node */
const isSpecial = (r: number, c: number) =>
  (r === SR && c === SC) || (r === ER && c === EC);

// ─────────────────────────────────────────────────────────────────────────────
// Dijkstra's algorithm
// ─────────────────────────────────────────────────────────────────────────────

interface DijkstraResult {
  visitedOrder: [number, number][];
  path: [number, number][] | null; // null → no path exists
}

function runDijkstra(walls: Set<string>): DijkstraResult {
  // Distance grid
  const dist: number[][] = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(Infinity)
  );
  // Previous-node grid for path reconstruction
  const prev: ([number, number] | null)[][] = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(null)
  );
  const seen: boolean[][] = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(false)
  );

  dist[SR][SC] = 0;

  // Simple array-based min-priority queue — fine for a 15×25 (375-node) grid
  const pq: [number, number, number][] = [[0, SR, SC]]; // [dist, row, col]
  const visitedOrder: [number, number][] = [];

  while (pq.length > 0) {
    // O(n) minimum extraction — acceptable for this grid size
    let minIdx = 0;
    for (let i = 1; i < pq.length; i++) {
      if (pq[i][0] < pq[minIdx][0]) minIdx = i;
    }
    const [d, r, c] = pq[minIdx];
    pq.splice(minIdx, 1);

    if (seen[r][c]) continue;
    seen[r][c] = true;

    // Collect for animation (skip start/end so they keep their own colours)
    if (!isSpecial(r, c)) visitedOrder.push([r, c]);

    // Reached target → reconstruct path
    if (r === ER && c === EC) {
      const path: [number, number][] = [];
      let cur: [number, number] | null = [ER, EC];
      while (cur) {
        path.unshift(cur);
        cur = prev[cur[0]][cur[1]];
      }
      return { visitedOrder, path };
    }

    // 4-directional neighbours
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as [number, number][]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      if (walls.has(key(nr, nc)) || seen[nr][nc]) continue;
      const nd = d + 1;
      if (nd < dist[nr][nc]) {
        dist[nr][nc] = nd;
        prev[nr][nc] = [r, c];
        pq.push([nd, nr, nc]);
      }
    }
  }

  return { visitedOrder, path: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// Maze generator — randomised walls, guaranteed clear zone around start/end
// ─────────────────────────────────────────────────────────────────────────────

function buildRandomMaze(): Set<string> {
  const walls = new Set<string>();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (isSpecial(r, c)) continue;
      // Keep Manhattan-distance-2 neighbourhood around start & end clear
      if (Math.abs(r - SR) + Math.abs(c - SC) <= 2) continue;
      if (Math.abs(r - ER) + Math.abs(c - EC) <= 2) continue;
      if (Math.random() < 0.31) walls.add(key(r, c));
    }
  }
  return walls;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cell appearance
// ─────────────────────────────────────────────────────────────────────────────

interface CellStyle {
  /** Tailwind bg + border classes */
  colours: string;
  /** Whether to play an entry animation */
  animClass: "animate-visit" | "animate-path" | "";
}

function getCellStyle(
  r: number,
  c: number,
  walls: Set<string>,
  visited: Set<string>,
  path: Set<string>
): CellStyle {
  const k = key(r, c);

  if (r === SR && c === SC)
    return { colours: "bg-emerald-500 border-emerald-400", animClass: "" };
  if (r === ER && c === EC)
    return { colours: "bg-red-500 border-red-400", animClass: "" };

  if (path.has(k))
    return {
      colours: "bg-yellow-400 border-yellow-300",
      animClass: "animate-path",
    };
  if (visited.has(k))
    return {
      colours: "bg-cyan-600 border-cyan-500",
      animClass: "animate-visit",
    };
  if (walls.has(k))
    return { colours: "bg-slate-950 border-slate-800", animClass: "" };

  return {
    colours: "bg-slate-800 border-slate-700 hover:bg-slate-700",
    animClass: "",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function PathfindingVisualizer() {
  const { lang } = useI18n();

  // ── Core state ─────────────────────────────────────────────────────────────
  const [walls, setWalls] = useState<Set<string>>(() => new Set());
  const [visited, setVisited] = useState<Set<string>>(() => new Set());
  const [path, setPath] = useState<Set<string>>(() => new Set());
  const [status, setStatus] = useState<AnimStatus>("idle");
  const [pathLen, setPathLen] = useState<number | null>(null);

  // ── Wall-drawing refs ──────────────────────────────────────────────────────
  const isDrawing = useRef(false);
  const tofRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ── Cancel all pending animation timeouts ─────────────────────────────────
  const cancelAll = useCallback(() => {
    tofRefs.current.forEach(clearTimeout);
    tofRefs.current = [];
  }, []);

  // ── Release draw mode on global mouseup ───────────────────────────────────
  useEffect(() => {
    const up = () => { isDrawing.current = false; };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  // ── Wall drawing ───────────────────────────────────────────────────────────
  const toggleWall = useCallback(
    (r: number, c: number) => {
      if (isSpecial(r, c) || status === "running") return;
      const k = key(r, c);
      setWalls((prev) => {
        const next = new Set(prev);
        next.has(k) ? next.delete(k) : next.add(k);
        return next;
      });
    },
    [status]
  );

  const addWall = useCallback(
    (r: number, c: number) => {
      if (isSpecial(r, c) || status === "running") return;
      const k = key(r, c);
      setWalls((prev) => {
        if (prev.has(k)) return prev;
        const next = new Set(prev);
        next.add(k);
        return next;
      });
    },
    [status]
  );

  const onMouseDown = useCallback(
    (r: number, c: number) => {
      if (status === "running") return;
      isDrawing.current = true;
      toggleWall(r, c);
    },
    [status, toggleWall]
  );

  const onMouseEnter = useCallback(
    (r: number, c: number) => {
      if (!isDrawing.current || status === "running") return;
      addWall(r, c);
    },
    [status, addWall]
  );

  // ── Visualize Dijkstra ─────────────────────────────────────────────────────
  const handleVisualize = useCallback(() => {
    if (status === "running") return;
    cancelAll();
    setVisited(new Set());
    setPath(new Set());
    setStatus("running");
    setPathLen(null);

    const { visitedOrder, path: foundPath } = runDijkstra(walls);

    // — Animate visited nodes —
    visitedOrder.forEach(([r, c], i) => {
      const t = setTimeout(() => {
        setVisited((prev) => {
          const next = new Set(prev);
          next.add(key(r, c));
          return next;
        });
      }, i * VISIT_MS);
      tofRefs.current.push(t);
    });

    const afterVisited = visitedOrder.length * VISIT_MS;

    if (!foundPath) {
      const t = setTimeout(() => setStatus("no-path"), afterVisited + 100);
      tofRefs.current.push(t);
      return;
    }

    // — Animate shortest path (exclude start and end, they keep their colours) —
    const pathMiddle = foundPath.slice(1, -1);
    pathMiddle.forEach(([r, c], i) => {
      const t = setTimeout(() => {
        setPath((prev) => {
          const next = new Set(prev);
          next.add(key(r, c));
          return next;
        });
      }, afterVisited + 100 + i * PATH_MS);
      tofRefs.current.push(t);
    });

    // — Mark done —
    const t = setTimeout(() => {
      setStatus("done");
      setPathLen(foundPath.length - 1); // edges traversed
    }, afterVisited + 100 + pathMiddle.length * PATH_MS + 50);
    tofRefs.current.push(t);
  }, [status, walls, cancelAll]);

  // ── Other controls ─────────────────────────────────────────────────────────
  const handleClearPath = useCallback(() => {
    cancelAll();
    setVisited(new Set());
    setPath(new Set());
    setStatus("idle");
    setPathLen(null);
  }, [cancelAll]);

  const handleReset = useCallback(() => {
    cancelAll();
    setWalls(new Set());
    setVisited(new Set());
    setPath(new Set());
    setStatus("idle");
    setPathLen(null);
  }, [cancelAll]);

  const handleMaze = useCallback(() => {
    if (status === "running") return;
    cancelAll();
    setVisited(new Set());
    setPath(new Set());
    setStatus("idle");
    setPathLen(null);
    setWalls(buildRandomMaze());
  }, [status, cancelAll]);

  // ── Bilingual explanation banner ───────────────────────────────────────────
  const explanation = useMemo(() => {
    switch (status) {
      case "idle":
        return {
          en: "Click or click-and-drag on the grid to draw wall barriers. Then click 'Visualize Dijkstra' to find the shortest path.",
          uz: "Devorlar chizish uchun gridga bosing yoki suring. Keyin 'Dijkstra Vizualizatsiyasi' tugmasini bosing.",
        };
      case "running":
        return {
          en: "Dijkstra's algorithm is searching for the shortest path… (cyan = visited nodes)",
          uz: "Dijkstra algoritmi eng qisqa yo'lni qidirmoqda… (moviy = ko'rilgan tugunlar)",
        };
      case "done":
        return {
          en: `Shortest path found! Distance: ${pathLen} step${pathLen !== 1 ? "s" : ""}. Yellow cells trace the optimal route from start to target.`,
          uz: `Eng qisqa yo'l topildi! Masofa: ${pathLen} qadam. Sariq kataklar boshdan maqsadga optimal yo'lni ko'rsatadi.`,
        };
      case "no-path":
        return {
          en: "No path exists! Walls completely block the route to the target. Remove some walls and try again.",
          uz: "Yo'l topilmadi! Devorlar maqsad tuguniga yo'l qoldirmadi. Ba'zi devorlarni olib, qayta urining.",
        };
    }
  }, [status, pathLen]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const bannerBorder =
    status === "done"    ? "border-emerald-700/40 bg-emerald-950/40" :
    status === "no-path" ? "border-red-700/40 bg-red-950/40" :
    status === "running" ? "border-indigo-700/40 bg-indigo-950/30" :
                           "border-slate-700 bg-slate-900/70";

  const bannerIcon =
    status === "done"    ? "text-emerald-400" :
    status === "no-path" ? "text-red-400" :
    status === "running" ? "text-indigo-400" :
                           "text-slate-400";

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-5">

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Visualize */}
        <button
          onClick={handleVisualize}
          disabled={status === "running"}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <Play className="w-4 h-4" />
          {lang === "uz" ? "Dijkstra Vizualizatsiyasi" : "Visualize Dijkstra"}
        </button>

        {/* Random maze */}
        <button
          onClick={handleMaze}
          disabled={status === "running"}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-sm hover:text-white hover:border-slate-600 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <Shuffle className="w-4 h-4" />
          {lang === "uz" ? "Tasodifiy Labirint" : "Random Maze"}
        </button>

        {/* Clear path */}
        <button
          onClick={handleClearPath}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-sm hover:text-white hover:border-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <Trash2 className="w-4 h-4" />
          {lang === "uz" ? "Yo'lni Tozalash" : "Clear Path"}
        </button>

        {/* Reset grid */}
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-sm hover:text-white hover:border-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <RotateCcw className="w-4 h-4" />
          {lang === "uz" ? "Gridni Tozalash" : "Reset Grid"}
        </button>
      </div>

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-slate-500">
        {[
          { bg: "bg-emerald-500",  label: lang === "uz" ? "Boshlang'ich" : "Start" },
          { bg: "bg-red-500",      label: lang === "uz" ? "Maqsad"       : "Target" },
          { bg: "bg-slate-950 border border-slate-700", label: lang === "uz" ? "Devor" : "Wall" },
          { bg: "bg-cyan-600",     label: lang === "uz" ? "Ko'rilgan"    : "Visited" },
          { bg: "bg-yellow-400",   label: lang === "uz" ? "Eng qisqa yo'l" : "Shortest Path" },
        ].map(({ bg, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`inline-block w-3 h-3 rounded-sm ${bg}`} />
            {label}
          </span>
        ))}
        <span className="ml-auto text-slate-600 italic">
          {lang === "uz"
            ? "Sichqonchani bosib suring = devor"
            : "Click & drag = draw wall"}
        </span>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      <div
        className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50 p-2 cursor-crosshair"
        onMouseLeave={() => { isDrawing.current = false; }}
      >
        <div
          className="inline-grid select-none"
          style={{
            gridTemplateColumns: `repeat(${COLS}, 1.75rem)`,
            gap: "1px",
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              const { colours, animClass } = getCellStyle(
                r, c, walls, visited, path
              );
              return (
                <div
                  key={key(r, c)}
                  className={`w-7 h-7 rounded-sm border ${colours} ${animClass}`}
                  onMouseDown={() => onMouseDown(r, c)}
                  onMouseEnter={() => onMouseEnter(r, c)}
                />
              );
            })
          )}
        </div>
      </div>

      {/* ── Bilingual explanation banner ──────────────────────────────────── */}
      <div
        className={`min-h-[56px] flex items-start gap-3 px-4 py-3 rounded-xl border transition-colors duration-300 ${bannerBorder}`}
      >
        <ChevronRight className={`w-4 h-4 mt-0.5 shrink-0 ${bannerIcon}`} />
        <p className="text-sm text-slate-200 leading-relaxed">
          {lang === "uz" ? explanation.uz : explanation.en}
        </p>
      </div>
    </div>
  );
}
