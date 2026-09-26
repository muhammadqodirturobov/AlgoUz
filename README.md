# AlgoUZ — Algorithm & ML Visualizer

An interactive algorithm and machine learning visualizer built with **Next.js 14**, **TypeScript**, and **Tailwind CSS** — available in **English** and **Uzbek**.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 3 + CSS variables |
| Icons | Lucide React |
| i18n | Custom React context (EN / UZ) |

## Project Structure

```
src/
├── app/
│   ├── globals.css        # Tailwind base + custom animations
│   ├── layout.tsx         # Root layout (Inter font, dark mode)
│   └── page.tsx           # Home page
├── components/
│   ├── Header.tsx         # Logo + category dropdown + lang switch
│   └── Workspace.tsx      # Central visualizer area
└── lib/
    ├── i18n.ts            # EN/UZ translation strings
    └── I18nProvider.tsx   # React context for language switching
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Roadmap

- [ ] Sorting visualizer (Bubble, Merge, Quick, Heap)
- [ ] Graph visualizer (BFS, DFS, Dijkstra, A*)
- [ ] Dynamic Programming step-by-step traces
- [ ] ML visualizer (KNN, Linear Regression, Decision Tree)
- [ ] Algorithm complexity comparison panel
