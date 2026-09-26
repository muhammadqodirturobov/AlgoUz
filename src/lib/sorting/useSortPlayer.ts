import { useRef, useCallback, useState } from "react";
import { SortFrame, AlgorithmMeta } from "@/lib/sorting/algorithms";

export type PlayState = "idle" | "playing" | "paused" | "done";

const SPEED_MS: Record<number, number> = {
  1: 600,
  2: 300,
  3: 150,
  4: 60,
  5: 16,
};

interface UseSortPlayerOptions {
  algorithm: AlgorithmMeta;
  array: number[];
  onFrame: (frame: SortFrame) => void;
  onDone: () => void;
}

export function useSortPlayer({ algorithm, array, onFrame, onDone }: UseSortPlayerOptions) {
  const generatorRef = useRef<Generator<SortFrame> | null>(null);
  const rafRef = useRef<number | null>(null);
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [stepCount, setStepCount] = useState(0);
  const speedRef = useRef(3);
  const [speed, setSpeedState] = useState(3);

  const setSpeed = useCallback((s: number) => {
    speedRef.current = s;
    setSpeedState(s);
  }, []);

  // Cancel any ongoing animation loop
  const cancelLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Step forward by one frame
  const stepOnce = useCallback(() => {
    if (!generatorRef.current) {
      generatorRef.current = algorithm.generator([...array]);
    }
    const result = generatorRef.current.next();
    if (!result.done && result.value) {
      onFrame(result.value);
      setStepCount((c) => c + 1);
      if (result.value.type === "done") {
        setPlayState("done");
        onDone();
        return false;
      }
      return true;
    }
    setPlayState("done");
    onDone();
    return false;
  }, [algorithm, array, onFrame, onDone]);

  // Timed animation loop
  const play = useCallback(() => {
    if (!generatorRef.current) {
      generatorRef.current = algorithm.generator([...array]);
    }
    setPlayState("playing");

    let last = performance.now();

    const tick = (now: number) => {
      const delay = SPEED_MS[speedRef.current] ?? 150;
      if (now - last >= delay) {
        last = now;
        const result = generatorRef.current!.next();
        if (!result.done && result.value) {
          onFrame(result.value);
          setStepCount((c) => c + 1);
          if (result.value.type === "done") {
            setPlayState("done");
            onDone();
            return;
          }
        } else {
          setPlayState("done");
          onDone();
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [algorithm, array, onFrame, onDone]);

  const pause = useCallback(() => {
    cancelLoop();
    setPlayState("paused");
  }, [cancelLoop]);

  const reset = useCallback(() => {
    cancelLoop();
    generatorRef.current = null;
    setPlayState("idle");
    setStepCount(0);
  }, [cancelLoop]);

  return { playState, stepCount, speed, setSpeed, play, pause, reset, stepOnce };
}
