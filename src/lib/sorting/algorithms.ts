// ---------------------------------------------------------------------------
// Sorting Algorithm Step Generators
// Each generator yields SortFrames that drive the visualizer animation.
// All functions are pure — they receive a copy of the array and never mutate
// the caller's state directly.
// ---------------------------------------------------------------------------

export type FrameType =
  | "compare"   // two bars being compared (yellow highlight)
  | "swap"      // two bars being swapped (red highlight)
  | "sorted"    // bar is in its final position (green)
  | "pivot"     // current pivot element (purple)
  | "overwrite" // single bar value written without a "swap" (merge sort)
  | "done";     // entire array sorted

export interface SortFrame {
  array: number[];
  type: FrameType;
  /** Indices actively highlighted in this frame */
  activeIndices: number[];
  /** Indices already in their final sorted position */
  sortedIndices: number[];
}

// ---------------------------------------------------------------------------
// Bubble Sort  O(n²)
// ---------------------------------------------------------------------------
export function* bubbleSort(input: number[]): Generator<SortFrame> {
  const arr = [...input];
  const n = arr.length;
  const sorted = new Set<number>();

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      yield { array: [...arr], type: "compare", activeIndices: [j, j + 1], sortedIndices: [...sorted] };

      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        yield { array: [...arr], type: "swap", activeIndices: [j, j + 1], sortedIndices: [...sorted] };
      }
    }
    sorted.add(n - 1 - i);
    yield { array: [...arr], type: "sorted", activeIndices: [n - 1 - i], sortedIndices: [...sorted] };
  }
  sorted.add(0);
  yield { array: [...arr], type: "done", activeIndices: [], sortedIndices: [...sorted] };
}

// ---------------------------------------------------------------------------
// Selection Sort  O(n²)
// ---------------------------------------------------------------------------
export function* selectionSort(input: number[]): Generator<SortFrame> {
  const arr = [...input];
  const n = arr.length;
  const sorted = new Set<number>();

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      yield { array: [...arr], type: "compare", activeIndices: [minIdx, j], sortedIndices: [...sorted] };
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      yield { array: [...arr], type: "swap", activeIndices: [i, minIdx], sortedIndices: [...sorted] };
    }
    sorted.add(i);
    yield { array: [...arr], type: "sorted", activeIndices: [i], sortedIndices: [...sorted] };
  }
  sorted.add(n - 1);
  yield { array: [...arr], type: "done", activeIndices: [], sortedIndices: [...sorted] };
}

// ---------------------------------------------------------------------------
// Insertion Sort  O(n²)
// ---------------------------------------------------------------------------
export function* insertionSort(input: number[]): Generator<SortFrame> {
  const arr = [...input];
  const n = arr.length;
  const sorted = new Set<number>([0]);

  for (let i = 1; i < n; i++) {
    let j = i;
    while (j > 0) {
      yield { array: [...arr], type: "compare", activeIndices: [j - 1, j], sortedIndices: [...sorted] };
      if (arr[j] < arr[j - 1]) {
        [arr[j], arr[j - 1]] = [arr[j - 1], arr[j]];
        yield { array: [...arr], type: "swap", activeIndices: [j - 1, j], sortedIndices: [...sorted] };
        j--;
      } else {
        break;
      }
    }
    sorted.add(i);
    yield { array: [...arr], type: "sorted", activeIndices: [j], sortedIndices: [...sorted] };
  }
  yield { array: [...arr], type: "done", activeIndices: [], sortedIndices: [...sorted] };
}

// ---------------------------------------------------------------------------
// Merge Sort  O(n log n)
// ---------------------------------------------------------------------------
export function* mergeSort(input: number[]): Generator<SortFrame> {
  const arr = [...input];
  const sorted = new Set<number>();
  yield* _mergeSortHelper(arr, 0, arr.length - 1, sorted);
  // Mark everything sorted at the end
  for (let i = 0; i < arr.length; i++) sorted.add(i);
  yield { array: [...arr], type: "done", activeIndices: [], sortedIndices: [...sorted] };
}

function* _mergeSortHelper(
  arr: number[],
  left: number,
  right: number,
  sorted: Set<number>
): Generator<SortFrame> {
  if (left >= right) return;
  const mid = Math.floor((left + right) / 2);
  yield* _mergeSortHelper(arr, left, mid, sorted);
  yield* _mergeSortHelper(arr, mid + 1, right, sorted);
  yield* _merge(arr, left, mid, right, sorted);
}

function* _merge(
  arr: number[],
  left: number,
  mid: number,
  right: number,
  sorted: Set<number>
): Generator<SortFrame> {
  const leftPart = arr.slice(left, mid + 1);
  const rightPart = arr.slice(mid + 1, right + 1);
  let i = 0, j = 0, k = left;

  while (i < leftPart.length && j < rightPart.length) {
    yield { array: [...arr], type: "compare", activeIndices: [left + i, mid + 1 + j], sortedIndices: [...sorted] };
    if (leftPart[i] <= rightPart[j]) {
      arr[k] = leftPart[i++];
    } else {
      arr[k] = rightPart[j++];
    }
    yield { array: [...arr], type: "overwrite", activeIndices: [k], sortedIndices: [...sorted] };
    k++;
  }
  while (i < leftPart.length) {
    arr[k] = leftPart[i++];
    yield { array: [...arr], type: "overwrite", activeIndices: [k++], sortedIndices: [...sorted] };
  }
  while (j < rightPart.length) {
    arr[k] = rightPart[j++];
    yield { array: [...arr], type: "overwrite", activeIndices: [k++], sortedIndices: [...sorted] };
  }
  for (let x = left; x <= right; x++) sorted.add(x);
}

// ---------------------------------------------------------------------------
// Quick Sort  O(n log n) average
// ---------------------------------------------------------------------------
export function* quickSort(input: number[]): Generator<SortFrame> {
  const arr = [...input];
  const sorted = new Set<number>();
  yield* _quickSortHelper(arr, 0, arr.length - 1, sorted);
  for (let i = 0; i < arr.length; i++) sorted.add(i);
  yield { array: [...arr], type: "done", activeIndices: [], sortedIndices: [...sorted] };
}

function* _quickSortHelper(
  arr: number[],
  low: number,
  high: number,
  sorted: Set<number>
): Generator<SortFrame> {
  if (low >= high) {
    if (low === high) sorted.add(low);
    return;
  }
  const pivotIdx = yield* _partition(arr, low, high, sorted);
  sorted.add(pivotIdx);
  yield { array: [...arr], type: "sorted", activeIndices: [pivotIdx], sortedIndices: [...sorted] };
  yield* _quickSortHelper(arr, low, pivotIdx - 1, sorted);
  yield* _quickSortHelper(arr, pivotIdx + 1, high, sorted);
}

function* _partition(
  arr: number[],
  low: number,
  high: number,
  sorted: Set<number>
): Generator<SortFrame, number> {
  const pivot = arr[high];
  let i = low - 1;
  yield { array: [...arr], type: "pivot", activeIndices: [high], sortedIndices: [...sorted] };

  for (let j = low; j < high; j++) {
    yield { array: [...arr], type: "compare", activeIndices: [j, high], sortedIndices: [...sorted] };
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      if (i !== j) yield { array: [...arr], type: "swap", activeIndices: [i, j], sortedIndices: [...sorted] };
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  yield { array: [...arr], type: "swap", activeIndices: [i + 1, high], sortedIndices: [...sorted] };
  return i + 1;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------
export type AlgorithmId = "bubble" | "selection" | "insertion" | "merge" | "quick";

export interface AlgorithmMeta {
  id: AlgorithmId;
  labelEn: string;
  labelUz: string;
  timeComplexity: string;
  spaceComplexity: string;
  stable: boolean;
  generator: (arr: number[]) => Generator<SortFrame>;
}

export const SORTING_ALGORITHMS: AlgorithmMeta[] = [
  {
    id: "bubble",
    labelEn: "Bubble Sort",
    labelUz: "Bubble Sort",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    stable: true,
    generator: bubbleSort,
  },
  {
    id: "selection",
    labelEn: "Selection Sort",
    labelUz: "Selection Sort",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    stable: false,
    generator: selectionSort,
  },
  {
    id: "insertion",
    labelEn: "Insertion Sort",
    labelUz: "Insertion Sort",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    stable: true,
    generator: insertionSort,
  },
  {
    id: "merge",
    labelEn: "Merge Sort",
    labelUz: "Merge Sort",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(n)",
    stable: true,
    generator: mergeSort,
  },
  {
    id: "quick",
    labelEn: "Quick Sort",
    labelUz: "Quick Sort",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(log n)",
    stable: false,
    generator: quickSort,
  },
];
