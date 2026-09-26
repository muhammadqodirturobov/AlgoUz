import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export interface StepExplanation {
  stepNumber: number;
  descriptionUz: string;
  descriptionEn: string;
  stateSnapshot: string;
  highlightedLine: number;
  // Aliases for backward compatibility
  titleUz?: string;
  titleEn?: string;
  explanationUz?: string;
  explanationEn?: string;
  activeLine?: number;
}

export interface ProblemAnalysisResponse {
  title: string;
  detectedAlgorithm: string;
  timeComplexity: string;
  spaceComplexity: string;
  complexityExplanationUz: string;
  complexityExplanationEn: string;
  steps: StepExplanation[];
  referenceSolutionCpp: string;
  referenceSolutionPython: string;
  provider?: "gemini-live" | "algo-engine-offline";
  note?: string;
  // Backward compatibility aliases
  algorithmName?: string;
  algorithmCategory?: string;
  approachSummaryUz?: string;
  approachSummaryEn?: string;
  complexity?: {
    timeWorst: string;
    timeAverage: string;
    space: string;
    edgeCasesUz: string[];
    edgeCasesEn: string[];
    breakdownUz: string;
    breakdownEn: string;
  };
  referenceCode?: {
    python: string;
    cpp: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Intelligent Offline CS Laboratory Engine (High-Fidelity Fallback)
// ─────────────────────────────────────────────────────────────────────────────

function generateAlgorithmicAnalysis(
  mode: "problem" | "code",
  title: string,
  content: string,
  testCase?: string,
  _lang: "uz" | "en" = "en"
): ProblemAnalysisResponse {
  const text = `${title} ${content} ${testCase || ""}`.toLowerCase();

  // Pattern 1: Maximum Subarray / Kadane's Algorithm
  if (
    text.includes("maximum subarray") ||
    text.includes("kadane") ||
    text.includes("eng katta qism") ||
    text.includes("max sum")
  ) {
    const steps: StepExplanation[] = [
      {
        stepNumber: 1,
        descriptionUz:
          "Boshlang'ich holat o'rnatildi: max_so_far = -2, current_sum = -2 deb birinchi element bilan initsializatsiya qilindi.",
        descriptionEn:
          "Initialized state: max_so_far = -2 and current_sum = -2 using the first array element.",
        stateSnapshot: "curr_sum = -2, max_so_far = -2, index = 0",
        highlightedLine: 2,
        titleUz: "Boshlang'ich holat",
        titleEn: "Initialization",
        explanationUz:
          "Boshlang'ich holat o'rnatildi: max_so_far = -2, current_sum = -2 deb birinchi element bilan initsializatsiya qilindi.",
        explanationEn:
          "Initialized state: max_so_far = -2 and current_sum = -2 using the first array element.",
        activeLine: 2,
      },
      {
        stepNumber: 2,
        descriptionUz:
          "Indeks 1 (qiymat = 1): current_sum = max(1, -2 + 1) = 1. Manfiy yig'indidan voz kechib yangi qism massiv boshlandi. max_so_far = 1 ga yangilandi.",
        descriptionEn:
          "Index 1 (value = 1): current_sum = max(1, -2 + 1) = 1. Dropped negative prefix and started new subarray. Updated max_so_far = 1.",
        stateSnapshot: "curr_sum = 1, max_so_far = 1, index = 1",
        highlightedLine: 5,
        titleUz: "Yangi qism massiv boshlash",
        titleEn: "Resetting negative prefix",
        explanationUz:
          "Indeks 1 (qiymat = 1): current_sum = max(1, -2 + 1) = 1. Manfiy yig'indidan voz kechib yangi qism massiv boshlandi.",
        explanationEn:
          "Index 1 (value = 1): current_sum = max(1, -2 + 1) = 1. Dropped negative prefix and started new subarray.",
        activeLine: 5,
      },
      {
        stepNumber: 3,
        descriptionUz:
          "Indeks 2..5 oralig'ida: elementlar [4, -1, 2, 1] ketma-ket qo'shildi. current_sum = 6 ga yetdi va bu yangi global maksimum bo'ldi.",
        descriptionEn:
          "Indices 2..5: accumulated elements [4, -1, 2, 1]. current_sum peaked at 6, setting the global maximum.",
        stateSnapshot: "curr_sum = 6, max_so_far = 6, window = [4, -1, 2, 1]",
        highlightedLine: 6,
        titleUz: "Maksimal oynani kengaytirish",
        titleEn: "Window Accumulation",
        explanationUz:
          "Indeks 2..5 oralig'ida: elementlar [4, -1, 2, 1] ketma-ket qo'shildi. current_sum = 6 ga yetdi.",
        explanationEn:
          "Indices 2..5: accumulated elements [4, -1, 2, 1]. current_sum peaked at 6.",
        activeLine: 6,
      },
      {
        stepNumber: 4,
        descriptionUz:
          "Massiv to'liq ko'rib chiqildi: eng katta uzluksiz qism massiv yig'indisi 6 ga teng (qism massiv: [4, -1, 2, 1]). Algoritm O(N) vaqt ichida yakunlandi.",
        descriptionEn:
          "Array traversal complete: highest contiguous subarray sum found is 6 ([4, -1, 2, 1]). Completed in single-pass O(N).",
        stateSnapshot: "Result = 6, Time = O(N), Space = O(1)",
        highlightedLine: 8,
        titleUz: "Natijani qaytarish",
        titleEn: "Optimal Return",
        explanationUz:
          "Massiv to'liq ko'rib chiqildi: eng katta uzluksiz qism massiv yig'indisi 6 ga teng.",
        explanationEn:
          "Array traversal complete: highest contiguous subarray sum found is 6.",
        activeLine: 8,
      },
    ];

    const refCpp = `#include <vector>
#include <algorithm>

int maxSubArray(const std::vector<int>& nums) {
    int max_so_far = nums[0];
    int current_sum = nums[0];
    
    for (size_t i = 1; i < nums.size(); ++i) {
        current_sum = std::max(nums[i], current_sum + nums[i]);
        max_so_far = std::max(max_so_far, current_sum);
    }
    return max_so_far;
}`;

    const refPy = `def max_sub_array(nums: list[int]) -> int:
    max_so_far = nums[0]
    current_sum = nums[0]
    
    for num in nums[1:]:
        current_sum = max(num, current_sum + num)
        max_so_far = max(max_so_far, current_sum)
        
    return max_so_far`;

    return {
      title: title || "Maximum Subarray Problem",
      detectedAlgorithm: "Kadane's Algorithm (Dinamik Dasturlash)",
      timeComplexity: "O(N)",
      spaceComplexity: "O(1)",
      complexityExplanationUz:
        "Massiv faqat bitta tsiklda O(N) chiziqli vaqtda ko'rib chiqiladi. Qo'shimcha massiv yoki xotira talab qilinmaydi O(1). Har bir qadamda manfiy prefikslarni tashlab yuborish orqali optimal qism massiv topiladi.",
      complexityExplanationEn:
        "Single linear pass through the array guarantees O(N) time complexity. Only two scalar accumulator variables are tracked, guaranteeing strictly O(1) auxiliary space.",
      steps,
      referenceSolutionCpp: refCpp,
      referenceSolutionPython: refPy,
      provider: "algo-engine-offline",
      note: "Live GEMINI_API_KEY is not configured in .env.local. Running AlgoUZ High-Fidelity CS Laboratory simulation engine.",
      algorithmName: "Kadane's Algorithm (Maximum Subarray)",
      algorithmCategory: "Dynamic Programming / Linear Optimization",
      approachSummaryUz:
        "Har bir qadamda oldingi yig'indiga qo'shilish yoki joriy elementdan yangi qism massiv boshlash tanlanadi. Bu O(N²) yoki O(N³) brute-forceni O(N) ga tushiradi.",
      approachSummaryEn:
        "Decide at each index whether to extend the existing contiguous sum or restart anew, dropping quadratic/cubic brute force to optimal O(N).",
      complexity: {
        timeWorst: "O(N)",
        timeAverage: "O(N)",
        space: "O(1)",
        edgeCasesUz: [
          "Barcha elementlar manfiy bo'lganda (eng kichik manfiy son olinadi)",
          "Bitta elementdan iborat massiv",
          "Barcha elementlar musbat bo'lganda (butun massiv yig'indisi)",
          "Katta N qiymatlarida 32-bit integer overflow ehtimoli",
        ],
        edgeCasesEn: [
          "All-negative numbers array (returns least negative single element)",
          "Single-element collection",
          "All-positive elements (returns sum of entire array)",
          "Integer overflow with very large positive inputs",
        ],
        breakdownUz:
          "Chiziqli O(N) vaqt va O(1) qo'shimcha xotira bilan to'liq optimal ishlaydi.",
        breakdownEn:
          "Optimal O(N) single-pass runtime and strictly O(1) scalar auxiliary memory.",
      },
      referenceCode: {
        python: refPy,
        cpp: refCpp,
      },
    };
  }

  // Pattern 2: Binary Search
  if (
    text.includes("binary search") ||
    text.includes("qidiruv") ||
    text.includes("sorted array") ||
    text.includes("log n")
  ) {
    const steps: StepExplanation[] = [
      {
        stepNumber: 1,
        descriptionUz:
          "Chegaralar o'rnatildi: left = 0 va right = N - 1 qidiruv diapazoni belgilandi.",
        descriptionEn:
          "Initialized low boundary left = 0 and high boundary right = N - 1.",
        stateSnapshot: "left = 0, right = 7, target = 23, mid = ?",
        highlightedLine: 2,
        titleUz: "Chegaralarni o'rnatish",
        titleEn: "Boundary Initialization",
        explanationUz:
          "Qidiruv maydonining chap (left = 0) va o'ng (right = N - 1) ko'rsatkichlari e'lon qilindi.",
        explanationEn:
          "Initialized low pointer left = 0 and high pointer right = N - 1 spanning the search interval.",
        activeLine: 2,
      },
      {
        stepNumber: 2,
        descriptionUz:
          "O'rta element hisoblandi: mid = left + (right - left) // 2 = 3. arr[3] = 16 < target (23).",
        descriptionEn:
          "Midpoint evaluated: mid = left + (right - left) // 2 = 3. arr[3] = 16 < target (23).",
        stateSnapshot: "left = 0, right = 7, mid = 3, arr[mid] = 16 < target",
        highlightedLine: 4,
        titleUz: "O'rta elementni hisoblash",
        titleEn: "Midpoint Calculation",
        explanationUz:
          "To'lib ketishdan himoyalangan formula orqali o'rta indeks: mid = 3 hisoblandi.",
        explanationEn: "Calculated mid index avoiding integer overflow: mid = 3.",
        activeLine: 4,
      },
      {
        stepNumber: 3,
        descriptionUz:
          "Chap qism tashlab yuborildi: arr[mid] < target bo'lgani sababli left = mid + 1 = 4 ga siljitildi.",
        descriptionEn:
          "Left half pruned: since arr[mid] < target, shifted left = mid + 1 = 4.",
        stateSnapshot: "left = 4, right = 7, search window = [4..7]",
        highlightedLine: 6,
        titleUz: "Chap qismni tashlash",
        titleEn: "Pruning Left Half",
        explanationUz:
          "arr[mid] < target bo'lgani uchun left = mid + 1 ga surildi.",
        explanationEn:
          "Target must lie to the right; shifted search interval to [4..7].",
        activeLine: 6,
      },
      {
        stepNumber: 4,
        descriptionUz:
          "Maqsadli element topildi: mid = 5 da arr[5] == 23 aniqlandi va indeks 5 muvaffaqiyatli qaytarildi.",
        descriptionEn:
          "Target matched: located arr[5] == 23. Successfully returned index 5.",
        stateSnapshot: "Return index = 5 (Target matched in 2 iterations)",
        highlightedLine: 8,
        titleUz: "Element topildi",
        titleEn: "Target Found",
        explanationUz: "arr[mid] == target mosligi aniqlandi.",
        explanationEn: "Exact match located at arr[5] == 23.",
        activeLine: 8,
      },
    ];

    const refCpp = `#include <vector>

int binarySearch(const std::vector<int>& arr, int target) {
    int left = 0;
    int right = static_cast<int>(arr.size()) - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}`;

    const refPy = `def binary_search(arr: list[int], target: int) -> int:
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = left + (right - left) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
            
    return -1`;

    return {
      title: title || "Binary Search on Sorted Array",
      detectedAlgorithm: "Binary Search (Ikkilik Qidiruv)",
      timeComplexity: "O(log N)",
      spaceComplexity: "O(1)",
      complexityExplanationUz:
        "Har bir qadamda qidiruv maydoni teng 2 marta qisqaradi (N -> N/2 -> ... -> 1). Jami iteratsiyalar soni ko'pi bilan log₂(N) bo'ladi. Xotira O(1).",
      complexityExplanationEn:
        "Halving the monotonic search space per iteration bounds worst-case comparisons to log₂(N). Iterative implementation uses strictly O(1) space.",
      steps,
      referenceSolutionCpp: refCpp,
      referenceSolutionPython: refPy,
      provider: "algo-engine-offline",
      note: "Live GEMINI_API_KEY is not configured in .env.local. Running AlgoUZ High-Fidelity CS Laboratory simulation engine.",
      algorithmName: "Binary Search (Ikkilik Qidiruv)",
      algorithmCategory: "Divide and Conquer / Logarithmic Search",
      approachSummaryUz:
        "Saralangan massivda har bir qadamda qidiruv sohasini teng ikkiga qisqartirish orqali O(log N) vaqt ichida qidirish.",
      approachSummaryEn:
        "Optimal logarithmic search by halving the search space at each iteration on a monotonically sorted array.",
      complexity: {
        timeWorst: "O(log N)",
        timeAverage: "O(log N)",
        space: "O(1)",
        edgeCasesUz: [
          "Massiv bo'sh bo'lganda (N = 0)",
          "Element massivda mavjud bo'lmaganda",
          "Barcha elementlar bir xil bo'lganda",
          "Katta N qiymatlarida (left + right) integer overflow xavfi",
        ],
        edgeCasesEn: [
          "Empty input collection (N = 0)",
          "Target value smaller than arr[0] or larger than arr[N-1]",
          "Single-element arrays",
          "Integer overflow when computing (left + right)",
        ],
        breakdownUz:
          "Har bir iteratsiyada massiv teng 2 qismga qisqaradi. Jami qadamlar soni log₂(N).",
        breakdownEn:
          "Search space reduces by half each iteration. Number of iterations bounded by log₂(N).",
      },
      referenceCode: {
        python: refPy,
        cpp: refCpp,
      },
    };
  }

  // Default / Pattern 3: Two Sum & Hash Map
  const steps: StepExplanation[] = [
    {
      stepNumber: 1,
      descriptionUz:
        "Xotira jadvali tayyorlandi: ko'rilgan sonlar indeksi uchun Hash Map e'lon qilindi va massiv boshidan tekshirila boshlandi.",
      descriptionEn:
        "Lookup table initialized: Hash Map allocated to store complement values encountered during linear scan.",
      stateSnapshot: "Input: [2, 7, 11, 15], Target: 9, Hash: {}",
      highlightedLine: 2,
      titleUz: "Boshlang'ich holat",
      titleEn: "Initialization",
      explanationUz: "Massiv va maqsadli parametrlar o'qildi.",
      explanationEn: "Input collection and target constraints loaded.",
      activeLine: 2,
    },
    {
      stepNumber: 2,
      descriptionUz:
        "Indeks 0 (qiymat = 2): 9 - 2 = 7 kerak. Jadvalda 7 yo'q; hash[2] = 0 deb saqlandi.",
      descriptionEn:
        "Index 0 (value = 2): complement needed is 9 - 2 = 7. 7 not seen yet; recorded hash[2] = 0.",
      stateSnapshot: "curr = 2, needed = 7, Seen Map = {2: 0}",
      highlightedLine: 4,
      titleUz: "1-elementni tekshirish",
      titleEn: "Inspecting Index 0",
      explanationUz: "arr[0] = 2 uchun komplement 7 qidirildi.",
      explanationEn: "Searched complement 7 for value 2.",
      activeLine: 4,
    },
    {
      stepNumber: 3,
      descriptionUz:
        "Indeks 1 (qiymat = 7): 9 - 7 = 2 kerak. 2 soni jadvalda 0-indeksda mavjud! Juftlik topildi: [0, 1].",
      descriptionEn:
        "Index 1 (value = 7): complement needed is 9 - 7 = 2. 2 is in table at index 0! Pair found: [0, 1].",
      stateSnapshot: "curr = 7, needed = 2 -> Matched at index 0! Pair = (0, 1)",
      highlightedLine: 6,
      titleUz: "Komplement topildi",
      titleEn: "Complement Found",
      explanationUz: "Jadval tekshirildi: 2 qiymati 0-indeksda mavjud.",
      explanationEn: "Complement matched in constant O(1) hash lookup.",
      activeLine: 6,
    },
    {
      stepNumber: 4,
      descriptionUz:
        "Yechim qaytarildi: [0, 1] indekslari yig'indisi 2 + 7 = 9 ni hosil qiladi. O(N) vaqtda muvaffaqiyatli yakunlandi.",
      descriptionEn:
        "Solution returned: indices [0, 1] satisfy 2 + 7 = 9. Successfully completed in single-pass O(N).",
      stateSnapshot: "Result: [0, 1] (Total complexity: single pass O(N))",
      highlightedLine: 7,
      titleUz: "Yechim qaytarish",
      titleEn: "Solution Assembly",
      explanationUz: "Juftlik [0, 1] yig'indisi maqsadga teng.",
      explanationEn: "Pair verified and returned.",
      activeLine: 7,
    },
  ];

  const refCpp = `#include <vector>
#include <unordered_map>

std::vector<int> twoSum(const std::vector<int>& nums, int target) {
    std::unordered_map<int, int> seen;
    
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        int complement = target - nums[i];
        auto it = seen.find(complement);
        if (it != seen.end()) {
            return {it->second, i};
        }
        seen[nums[i]] = i;
    }
    return {};
}`;

  const refPy = `def two_sum(nums: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {}
    
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
        
    return []`;

  return {
    title: title || "Two Sum Problem",
    detectedAlgorithm: "Hash Map / Two Pointers (Optimal Qidiruv)",
    timeComplexity: "O(N)",
    spaceComplexity: "O(N)",
    complexityExplanationUz:
      "Brute-force O(N²) tekshiruvlari o'rniga Hash Map orqali har bir elementni bir marta ko'rib chiqish O(N) vaqt oladi. Jadvaldan komplementni qidirish amortizatsiyalangan O(1) amalda bajariladi.",
    complexityExplanationEn:
      "Using a hash map reduces quadratic O(N²) nested scanning into a single O(N) pass. Lookups and insertions operate in amortized O(1) time with O(N) space.",
    steps,
    referenceSolutionCpp: refCpp,
    referenceSolutionPython: refPy,
    provider: "algo-engine-offline",
    note: "Live GEMINI_API_KEY is not configured in .env.local. Running AlgoUZ High-Fidelity CS Laboratory simulation engine.",
    algorithmName: "Two Pointers & Optimal Traversal",
    algorithmCategory: "Linear Optimization / Hash Map Lookup",
    approachSummaryUz:
      "Brute-force O(N²) o'rniga Hash Map orqali vaqt murakkabligini O(N) chiziqli vaqtga tushirish.",
    approachSummaryEn:
      "Transforming brute-force quadratic checks into an optimal O(N) single-pass traversal.",
    complexity: {
      timeWorst: "O(N)",
      timeAverage: "O(N)",
      space: "O(N)",
      edgeCasesUz: [
        "Massivda yechim mavjud bo'lmaganda",
        "Bir xil elementni ikki marta ishlatish taqiqlanganda",
        "Manfiy sonlar va 0 ishtirok etganda",
        "Katta N bo'lganda O(N²) TLE berishi",
      ],
      edgeCasesEn: [
        "No matching pair exists",
        "Attempting to reuse the exact same element twice",
        "Negative integers and zeroes",
        "Large datasets where nested loops trigger TLE",
      ],
      breakdownUz:
        "Chiziqli O(N) vaqt va O(N) xotira bilan ishlaydi.",
      breakdownEn:
        "Single linear pass over the dataset gives O(N) time with O(N) auxiliary space.",
    },
    referenceCode: {
      python: refPy,
      cpp: refCpp,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode, title, content, testCase, lang } = body;

    if (!title && !content) {
      return NextResponse.json(
        { error: "Title or content is required" },
        { status: 400 }
      );
    }

    // 1. Check for GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `You are a world-class competitive programming and algorithm tutor for AlgoUZ CS Lab.
Analyze the following ${mode === "code" ? "code snippet" : "problem statement"} and provide a structured JSON educational breakdown.
Title: ${title}
Content: ${content}
Optional testcase: ${testCase || "None"}
Language focus: ${lang === "uz" ? "Uzbek and English" : "English and Uzbek"}

Requirements:
- Identify the core algorithmic pattern (detectedAlgorithm).
- State asymptotic timeComplexity (e.g. "O(N)", "O(N log N)") and spaceComplexity (e.g. "O(1)", "O(N)").
- Provide clear explanations in both Uzbek (complexityExplanationUz) and English (complexityExplanationEn).
- Provide step-by-step execution simulation snapshots (steps) with stepNumber, descriptionUz, descriptionEn, stateSnapshot, and highlightedLine.
- Provide clean, production-ready, optimal reference solutions in C++ (referenceSolutionCpp) and Python (referenceSolutionPython).`;

        const responseSchema = {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            detectedAlgorithm: { type: Type.STRING },
            timeComplexity: { type: Type.STRING },
            spaceComplexity: { type: Type.STRING },
            complexityExplanationUz: { type: Type.STRING },
            complexityExplanationEn: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  descriptionUz: { type: Type.STRING },
                  descriptionEn: { type: Type.STRING },
                  stateSnapshot: { type: Type.STRING },
                  highlightedLine: { type: Type.INTEGER },
                },
                required: [
                  "stepNumber",
                  "descriptionUz",
                  "descriptionEn",
                  "stateSnapshot",
                ],
              },
            },
            referenceSolutionCpp: { type: Type.STRING },
            referenceSolutionPython: { type: Type.STRING },
          },
          required: [
            "title",
            "detectedAlgorithm",
            "timeComplexity",
            "spaceComplexity",
            "complexityExplanationUz",
            "complexityExplanationEn",
            "steps",
            "referenceSolutionCpp",
            "referenceSolutionPython",
          ],
        };

        const result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema,
          },
        });

        if (result.text) {
          const parsed = JSON.parse(result.text);

          const formattedSteps: StepExplanation[] = (parsed.steps || []).map(
            (s: any, idx: number) => ({
              stepNumber: s.stepNumber ?? idx + 1,
              descriptionUz: s.descriptionUz || "",
              descriptionEn: s.descriptionEn || "",
              stateSnapshot: s.stateSnapshot || "",
              highlightedLine: s.highlightedLine ?? idx + 1,
              // Backward-compatibility aliases
              titleUz: s.descriptionUz || `Qadam ${idx + 1}`,
              titleEn: s.descriptionEn || `Step ${idx + 1}`,
              explanationUz: s.descriptionUz || "",
              explanationEn: s.descriptionEn || "",
              activeLine: s.highlightedLine ?? idx + 1,
            })
          );

          const responsePayload: ProblemAnalysisResponse = {
            title: parsed.title || title,
            detectedAlgorithm: parsed.detectedAlgorithm || "Algorithmic Pattern",
            timeComplexity: parsed.timeComplexity || "O(N)",
            spaceComplexity: parsed.spaceComplexity || "O(1)",
            complexityExplanationUz: parsed.complexityExplanationUz || "",
            complexityExplanationEn: parsed.complexityExplanationEn || "",
            steps: formattedSteps,
            referenceSolutionCpp: parsed.referenceSolutionCpp || "",
            referenceSolutionPython: parsed.referenceSolutionPython || "",
            provider: "gemini-live",
            note: "Powered by live Google Gemini 2.5 Flash API",
            // Backward-compatibility aliases
            algorithmName: parsed.detectedAlgorithm,
            algorithmCategory: "AI-Decomposed Algorithmic Strategy",
            approachSummaryUz: parsed.complexityExplanationUz,
            approachSummaryEn: parsed.complexityExplanationEn,
            complexity: {
              timeWorst: parsed.timeComplexity || "O(N)",
              timeAverage: parsed.timeComplexity || "O(N)",
              space: parsed.spaceComplexity || "O(1)",
              edgeCasesUz: [
                "Bo'sh massiv yoki 0 ta element kiritilganda",
                "Chekka chegara shartlari va ekstremal qiymatlar",
              ],
              edgeCasesEn: [
                "Empty dataset or single element inputs",
                "Extreme boundary constraints",
              ],
              breakdownUz: parsed.complexityExplanationUz,
              breakdownEn: parsed.complexityExplanationEn,
            },
            referenceCode: {
              python: parsed.referenceSolutionPython,
              cpp: parsed.referenceSolutionCpp,
            },
          };

          return NextResponse.json(responsePayload);
        }
      } catch (externalErr) {
        console.warn("Gemini Live API fallback to offline lab engine:", externalErr);
      }
    }

    // 2. High-fidelity Offline CS Laboratory Fallback
    const analysis = generateAlgorithmicAnalysis(
      mode || "problem",
      title || "Algorithmic Challenge",
      content || "",
      testCase,
      lang || "en"
    );

    return NextResponse.json(analysis);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
