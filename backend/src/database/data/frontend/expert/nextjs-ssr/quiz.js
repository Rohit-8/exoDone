// ============================================================================
// Next.js & SSR — Quiz Questions
// ============================================================================

const quiz = {
  'nextjs-app-router': [
    {
      question_text: "In Next.js App Router, components are _____ by default.",
      question_type: "multiple_choice",
      options: ["Client Components","Server Components","Static Components","Hybrid Components"],
      correct_answer: "Server Components",
      explanation: "In the Next.js App Router, all components are Server Components by default. You must add \"use client\" directive to make them Client Components.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text: "Which directive makes a component a Client Component in Next.js?",
      question_type: "multiple_choice",
      options: ["'use client'","'use browser'","'client-side'","export const runtime = 'client'"],
      correct_answer: "'use client'",
      explanation: "The 'use client' directive at the top of a file marks it and all its imports as Client Components that can use hooks and browser APIs.",
      difficulty: "easy",
      order_index: 2,
    },
  ],
  'nextjs-data-fetching': [
    {
      question_text: "What is Incremental Static Regeneration (ISR)?",
      question_type: "multiple_choice",
      options: ["Generating all pages at build time","Regenerating static pages at a set interval after build","Generating pages on every request","Pre-rendering only the first visit"],
      correct_answer: "Regenerating static pages at a set interval after build",
      explanation: "ISR regenerates static pages in the background after a specified revalidation period, giving you the performance of static with the freshness of dynamic.",
      difficulty: "hard",
      order_index: 1,
    },
  ],
};

export default quiz;
