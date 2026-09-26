"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sparkles,
  ChevronRight,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useI18n } from "@/lib/I18nProvider";

// ─────────────────────────────────────────────────────────────────────────────
// Loss Function Definitions
// ─────────────────────────────────────────────────────────────────────────────

type FunctionType = "convex" | "non-convex";

interface FunctionConfig {
  id: FunctionType;
  nameEn: string;
  nameUz: string;
  formula: string;
  f: (x: number) => number;
  df: (x: number) => number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  defaultX: number;
}

const FUNCTIONS: Record<FunctionType, FunctionConfig> = {
  convex: {
    id: "convex",
    nameEn: "Convex Bowl (Single Min)",
    nameUz: "Qavariq Botiqlik (Yagona Min)",
    formula: "f(x) = x²",
    f: (x: number) => x * x,
    df: (x: number) => 2 * x,
    xMin: -4.5,
    xMax: 4.5,
    yMin: -1.0,
    yMax: 20.0,
    defaultX: -3.6,
  },
  "non-convex": {
    id: "non-convex",
    nameEn: "Non-Convex Waves (Local Minima)",
    nameUz: "Noqavariq To'lqinlar (Lokal Minima)",
    formula: "f(x) = 0.5x² + 2.5·sin(2x)",
    f: (x: number) => 0.5 * x * x + 2.5 * Math.sin(2 * x),
    df: (x: number) => x + 5.0 * Math.cos(2 * x),
    xMin: -4.5,
    xMax: 4.5,
    yMin: -4.0,
    yMax: 16.0,
    defaultX: 3.8,
  },
};

interface TrajectoryPoint {
  x: number;
  y: number;
  grad: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function GradientDescentVisualizer() {
  const { lang } = useI18n();

  // ── Hyperparameters & State ───────────────────────────────────────────────
  const [funcId, setFuncId] = useState<FunctionType>("convex");
  const [learningRate, setLearningRate] = useState<number>(0.15);
  const [momentum, setMomentum] = useState<number>(0.0);
  const [startX, setStartX] = useState<number>(FUNCTIONS.convex.defaultX);

  const [currentX, setCurrentX] = useState<number>(FUNCTIONS.convex.defaultX);
  const [velocity, setVelocity] = useState<number>(0);
  const [history, setHistory] = useState<TrajectoryPoint[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [diverged, setDiverged] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastStepTimeRef = useRef<number>(0);

  const fnConfig = FUNCTIONS[funcId];

  // Current metrics
  const currentLoss = useMemo(() => fnConfig.f(currentX), [fnConfig, currentX]);
  const currentGrad = useMemo(() => fnConfig.df(currentX), [fnConfig, currentX]);
  const isConverged = Math.abs(currentGrad) < 0.005 && !diverged;

  // ── Reset state ───────────────────────────────────────────────────────────
  const handleReset = useCallback(
    (newStartX?: number, newFuncId?: FunctionType) => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      setIsRunning(false);
      setDiverged(false);

      const targetFunc = FUNCTIONS[newFuncId ?? funcId];
      const initialX = newStartX ?? startX;
      setCurrentX(initialX);
      setVelocity(0);
      setHistory([
        {
          x: initialX,
          y: targetFunc.f(initialX),
          grad: targetFunc.df(initialX),
        },
      ]);
    },
    [funcId, startX]
  );

  // Initialize history on mount or when function / start point changes
  useEffect(() => {
    handleReset(startX, funcId);
  }, [funcId, startX, handleReset]);

  // ── Single Optimization Step ──────────────────────────────────────────────
  const stepOptimization = useCallback(() => {
    if (diverged) return;

    setCurrentX((prevX) => {
      const grad = fnConfig.df(prevX);
      const newV = momentum * velocity + learningRate * grad;
      const nextX = prevX - newV;

      setVelocity(newV);

      // Check divergence
      if (Math.abs(nextX) > 15 || isNaN(nextX)) {
        setDiverged(true);
        setIsRunning(false);
        return prevX;
      }

      setHistory((prev) => [
        ...prev,
        { x: nextX, y: fnConfig.f(nextX), grad: fnConfig.df(nextX) },
      ]);

      return nextX;
    });
  }, [diverged, fnConfig, momentum, velocity, learningRate]);

  // ── Animation Loop ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const loop = (timestamp: number) => {
      // Step roughly every 65ms for smooth and readable motion
      if (timestamp - lastStepTimeRef.current >= 65) {
        lastStepTimeRef.current = timestamp;
        stepOptimization();
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isRunning, stepOptimization]);

  // ── Switch Loss Function ──────────────────────────────────────────────────
  const handleSelectFunction = (id: FunctionType) => {
    setFuncId(id);
    setStartX(FUNCTIONS[id].defaultX);
    handleReset(FUNCTIONS[id].defaultX, id);
  };

  // ── Canvas Rendering ──────────────────────────────────────────────────────
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const { xMin, xMax, yMin, yMax } = fnConfig;

    // Coordinate mapping functions
    const toCanvasX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
    const toCanvasY = (y: number) =>
      height - ((y - yMin) / (yMax - yMin)) * height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // 1. Grid Lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(51, 65, 85, 0.4)"; // slate-700 with opacity

    // Vertical grid lines
    const xStep = 1;
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += xStep) {
      const cx = toCanvasX(x);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();

      // Axis label
      ctx.fillStyle = "rgba(100, 116, 139, 0.6)";
      ctx.font = "10px monospace";
      ctx.fillText(`${x}`, cx + 3, height - 6);
    }

    // Horizontal grid lines
    const yStep = 5;
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += yStep) {
      const cy = toCanvasY(y);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();

      // Axis label
      ctx.fillStyle = "rgba(100, 116, 139, 0.6)";
      ctx.font = "10px monospace";
      ctx.fillText(`${y}`, 6, cy - 4);
    }

    // Zero axes
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(99, 102, 241, 0.3)"; // subtle indigo
    if (xMin <= 0 && xMax >= 0) {
      const zeroX = toCanvasX(0);
      ctx.beginPath();
      ctx.moveTo(zeroX, 0);
      ctx.lineTo(zeroX, height);
      ctx.stroke();
    }
    if (yMin <= 0 && yMax >= 0) {
      const zeroY = toCanvasY(0);
      ctx.beginPath();
      ctx.moveTo(0, zeroY);
      ctx.lineTo(width, zeroY);
      ctx.stroke();
    }

    // 2. Function Curve Fill (Subtle Area Glow)
    const curvePoints: [number, number][] = [];
    const numSamples = 240;
    for (let i = 0; i <= numSamples; i++) {
      const x = xMin + (i / numSamples) * (xMax - xMin);
      const y = fnConfig.f(x);
      curvePoints.push([toCanvasX(x), toCanvasY(y)]);
    }

    if (curvePoints.length > 0) {
      ctx.beginPath();
      ctx.moveTo(curvePoints[0][0], curvePoints[0][1]);
      for (let i = 1; i < curvePoints.length; i++) {
        ctx.lineTo(curvePoints[i][0], curvePoints[i][1]);
      }
      ctx.lineTo(curvePoints[curvePoints.length - 1][0], height);
      ctx.lineTo(curvePoints[0][0], height);
      ctx.closePath();

      const fillGrad = ctx.createLinearGradient(0, 0, 0, height);
      fillGrad.addColorStop(0, "rgba(6, 182, 212, 0.12)"); // cyan
      fillGrad.addColorStop(0.5, "rgba(99, 102, 241, 0.08)"); // indigo
      fillGrad.addColorStop(1, "rgba(15, 23, 42, 0.0)"); // transparent slate
      ctx.fillStyle = fillGrad;
      ctx.fill();
    }

    // 3. Function Curve Stroke
    ctx.beginPath();
    ctx.moveTo(curvePoints[0][0], curvePoints[0][1]);
    for (let i = 1; i < curvePoints.length; i++) {
      ctx.lineTo(curvePoints[i][0], curvePoints[i][1]);
    }
    const strokeGrad = ctx.createLinearGradient(0, 0, width, 0);
    strokeGrad.addColorStop(0, "#06b6d4"); // cyan-500
    strokeGrad.addColorStop(0.5, "#6366f1"); // indigo-500
    strokeGrad.addColorStop(1, "#38bdf8"); // sky-400
    ctx.strokeStyle = strokeGrad;
    ctx.lineWidth = 3;
    ctx.stroke();

    // 4. Trace Path / Trajectory
    if (history.length > 1) {
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(251, 191, 36, 0.75)"; // amber-400

      ctx.beginPath();
      const first = history[0];
      ctx.moveTo(toCanvasX(first.x), toCanvasY(first.y));
      for (let i = 1; i < history.length; i++) {
        const pt = history[i];
        ctx.lineTo(toCanvasX(pt.x), toCanvasY(pt.y));
      }
      ctx.stroke();
      ctx.restore();

      // Draw small trail dots
      history.forEach((pt, i) => {
        if (i === history.length - 1) return; // skip latest ball position
        const alpha = Math.max(0.2, (i / history.length) * 0.8);
        ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
        ctx.beginPath();
        ctx.arc(toCanvasX(pt.x), toCanvasY(pt.y), 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 5. Tangent Line & Gradient Direction Vector at Current Point
    const ballCanvasX = toCanvasX(currentX);
    const ballCanvasY = toCanvasY(currentLoss);

    // Tangent line segment
    const slope = currentGrad;
    // Scale slope for aspect ratio
    const dxUnit = 0.5;
    const dyUnit = slope * dxUnit;
    const tX1 = toCanvasX(currentX - dxUnit);
    const tY1 = toCanvasY(currentLoss - dyUnit);
    const tX2 = toCanvasX(currentX + dxUnit);
    const tY2 = toCanvasY(currentLoss + dyUnit);

    ctx.save();
    ctx.strokeStyle = "rgba(244, 63, 94, 0.4)"; // rose-500
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tX1, tY1);
    ctx.lineTo(tX2, tY2);
    ctx.stroke();
    ctx.restore();

    // 6. Glowing Particle / Ball representing Model Weights
    // Outer radial glow
    const glowGrad = ctx.createRadialGradient(
      ballCanvasX,
      ballCanvasY,
      2,
      ballCanvasX,
      ballCanvasY,
      22
    );
    glowGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    glowGrad.addColorStop(0.25, "rgba(6, 182, 212, 0.85)"); // cyan-400
    glowGrad.addColorStop(0.65, "rgba(99, 102, 241, 0.45)"); // indigo-500
    glowGrad.addColorStop(1, "rgba(99, 102, 241, 0)");

    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(ballCanvasX, ballCanvasY, 22, 0, Math.PI * 2);
    ctx.fill();

    // Core solid ball
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ballCanvasX, ballCanvasY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }, [fnConfig, history, currentX, currentLoss, currentGrad]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Responsive canvas size adjustment
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect && rect.width) {
        // Set internal canvas width to match display width
        canvas.width = Math.min(rect.width, 920);
        canvas.height = 360;
        drawCanvas();
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawCanvas]);

  return (
    <div
      suppressHydrationWarning
      className="w-full max-w-5xl mx-auto flex flex-col gap-6"
    >
      {/* ── Top Bar: Function Selection & Badges ──────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {lang === "uz" ? "Funksiya:" : "Function:"}
          </span>
          <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-1">
            {(["convex", "non-convex"] as FunctionType[]).map((id) => {
              const active = funcId === id;
              const meta = FUNCTIONS[id];
              return (
                <button
                  key={id}
                  onClick={() => handleSelectFunction(id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                    active
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {lang === "uz" ? meta.nameUz : meta.nameEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Function Formula Tag */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-indigo-300">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>{fnConfig.formula}</span>
        </div>
      </div>

      {/* ── Metrics Readout Dashboard ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            {lang === "uz" ? "Qadam #" : "Step #"}
          </span>
          <span className="text-lg font-bold font-mono text-white tabular-nums">
            {Math.max(0, history.length - 1)}
          </span>
        </div>

        <div className="px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            {lang === "uz" ? "Vazn (w)" : "Weight (w)"}
          </span>
          <span className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
            {currentX.toFixed(3)}
          </span>
        </div>

        <div className="px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            {lang === "uz" ? "Yo'qotish (Loss)" : "Loss / Cost"}
          </span>
          <span className="text-lg font-bold font-mono text-indigo-300 tabular-nums">
            {isNaN(currentLoss) ? "∞" : currentLoss.toFixed(3)}
          </span>
        </div>

        <div className="px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            {lang === "uz" ? "Gradient (dL/dw)" : "Gradient (dL/dw)"}
          </span>
          <div className="flex items-center gap-1.5">
            <TrendingDown
              className={`w-4 h-4 ${
                Math.abs(currentGrad) < 0.05
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            />
            <span className="text-lg font-bold font-mono text-amber-400 tabular-nums">
              {currentGrad.toFixed(3)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Canvas Visualization Area ───────────────────────────────────── */}
      <div className="relative w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-xl overflow-hidden flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={860}
          height={360}
          className="w-full h-[320px] sm:h-[360px] rounded-xl block"
        />

        {/* Status Alert Overlay if Diverged or Converged */}
        {diverged && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
            <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-red-950/80 border border-red-500/50 shadow-2xl">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <p className="text-sm font-bold text-red-200">
                  {lang === "uz" ? "Divergensiya yuz berdi!" : "Divergence Detected!"}
                </p>
                <p className="text-xs text-red-300">
                  {lang === "uz"
                    ? "O'rganish tezligi (alpha) juda katta. Uni kamaytirib, qayta urining."
                    : "Learning rate is too high, causing the weights to explode. Decrease alpha and reset."}
                </p>
              </div>
            </div>
          </div>
        )}

        {isConverged && history.length > 2 && (
          <div className="absolute top-6 right-6 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-300">
              {lang === "uz" ? "Konvergensiya (Minimum)" : "Converged to Minimum"}
            </span>
          </div>
        )}
      </div>

      {/* ── Interactive Controls & Sliders ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
        {/* Learning Rate Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">
              {lang === "uz"
                ? "O'rganish tezligi (α)"
                : "Learning Rate (α)"}
            </span>
            <span
              className={`font-mono font-bold ${
                learningRate > 0.8
                  ? "text-red-400"
                  : learningRate > 0.4
                  ? "text-amber-400"
                  : "text-indigo-400"
              }`}
            >
              {learningRate.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0.01}
            max={1.1}
            step={0.01}
            value={learningRate}
            onChange={(e) => setLearningRate(parseFloat(e.target.value))}
            className="accent-indigo-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0.01 (Slow)</span>
            <span>1.10 (Overshoot)</span>
          </div>
        </div>

        {/* Momentum Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">
              {lang === "uz" ? "Momentum (β)" : "Momentum (β)"}
            </span>
            <span className="font-mono font-bold text-cyan-400">
              {momentum.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0.0}
            max={0.9}
            step={0.05}
            value={momentum}
            onChange={(e) => setMomentum(parseFloat(e.target.value))}
            className="accent-cyan-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0.0 (None)</span>
            <span>0.9 (High Inertia)</span>
          </div>
        </div>

        {/* Starting Point (x0) Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">
              {lang === "uz"
                ? "Boshlang'ich nuqta (x₀)"
                : "Initial Position (x₀)"}
            </span>
            <span className="font-mono font-bold text-amber-400">
              {startX.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={-4.0}
            max={4.0}
            step={0.1}
            value={startX}
            disabled={isRunning}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setStartX(val);
              handleReset(val);
            }}
            className="accent-amber-500 cursor-pointer disabled:opacity-40"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>-4.0</span>
            <span>+4.0</span>
          </div>
        </div>
      </div>

      {/* ── Action Buttons Bar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
        <div className="flex items-center gap-2.5">
          {/* Play/Pause */}
          <button
            onClick={() => setIsRunning((r) => !r)}
            disabled={diverged}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
              isRunning
                ? "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                {lang === "uz" ? "To'xtatish" : "Pause"}
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {lang === "uz" ? "Optimizatsiyani boshlash" : "Run Optimization"}
              </>
            )}
          </button>

          {/* Step Button */}
          <button
            onClick={stepOptimization}
            disabled={isRunning || diverged}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <SkipForward className="w-4 h-4" />
            {lang === "uz" ? "1 Qadam" : "Step"}
          </button>

          {/* Reset Ball Button */}
          <button
            onClick={() => handleReset()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <RotateCcw className="w-4 h-4" />
            {lang === "uz" ? "To'pni qaytarish" : "Reset Ball"}
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>{lang === "uz" ? "Hozirgi Vazn (w)" : "Current Weight (w)"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-amber-400" />
            <span>{lang === "uz" ? "Traektoriya" : "Trace Path"}</span>
          </div>
        </div>
      </div>

      {/* ── Bilingual Educational Explanation Banner ─────────────────────── */}
      <div
        suppressHydrationWarning
        className="flex items-start gap-3.5 px-5 py-4 rounded-2xl border border-slate-700 bg-slate-900/80 shadow-lg"
      >
        <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            {lang === "uz"
              ? "Gradient funksiyaning o'sish yo'nalishini ko'rsatadi; optimizator o'rganish tezligi (learning rate) bo'yicha teskari qadam tashlaydi."
              : "Gradient points uphill; the optimizer takes steps in the negative gradient direction scaled by the learning rate."}
          </p>
          <p className="text-xs text-slate-400 leading-normal">
            {lang === "uz"
              ? "Kichik alfa (α) asta-sekin yaqinlashadi, katta alfa sakrash yoki divergensiyaga olib keladi. Momentum (β) esa lokal minimumlardan sakrab o'tishga yordam beradi."
              : "Small learning rate converges steadily, while high values cause oscillations or divergence. Momentum helps escape shallow local minima."}
          </p>
        </div>
      </div>
    </div>
  );
}
