export type Lang = "en" | "uz";

export const translations = {
  en: {
    appName: "AlgoUZ",
    tagline: "Algorithm & ML Visualizer",
    categories: "Categories",
    selectCategory: "Select a category",
    cats: {
      sorting: "Sorting Algorithms",
      searching: "Searching Algorithms",
      graph: "Graph Algorithms",
      dp: "Dynamic Programming",
      ml: "Machine Learning",
      dataStructures: "Data Structures",
    },
    workspace: {
      title: "Choose an Algorithm",
      subtitle:
        "Select a category from the dropdown above to explore interactive visualizations.",
    },
    sorting: {
      sorted: "Sorted", comparing: "Comparing", swapping: "Swapping",
      pivot: "Pivot", unsorted: "Unsorted", writing: "Writing",
      steps: "steps", sortedIn: "Sorted in", stable: "Stable",
      yes: "Yes", no: "No",
    },
    langSwitch: "O'zbek",
  },
  uz: {
    appName: "AlgoUZ",
    tagline: "Algoritm va ML Vizualizatori",
    categories: "Kategoriyalar",
    selectCategory: "Kategoriya tanlang",
    cats: {
      sorting: "Saralash algoritmlari",
      searching: "Qidirish algoritmlari",
      graph: "Graf algoritmlari",
      dp: "Dinamik dasturlash",
      ml: "Mashina o'rganishi",
      dataStructures: "Ma'lumotlar tuzilmalari",
    },
    workspace: {
      title: "Algoritm tanlang",
      subtitle:
        "Interaktiv vizualizatsiyalarni ko'rish uchun yuqoridagi menyudan kategoriya tanlang.",
    },
    sorting: {
      sorted: "Saralandi", comparing: "Taqqoslanmoqda", swapping: "Almashtirilmoqda",
      pivot: "Pivot", unsorted: "Saralanmagan", writing: "Yozilmoqda",
      steps: "qadam", sortedIn: "Saralandi", stable: "Barqaror",
      yes: "Ha", no: "Yo'q",
    },
    langSwitch: "English",
  },
} satisfies Record<Lang, unknown>;

export type Translations = (typeof translations)[Lang];
