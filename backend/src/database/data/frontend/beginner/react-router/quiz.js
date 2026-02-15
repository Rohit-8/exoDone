// ============================================================================
// React Router & Navigation — Quiz Questions
// ============================================================================

const quiz = {
  'router-setup-basics': [
    {
      question_text: "What component replaced <Switch> in React Router v6?",
      question_type: "multiple_choice",
      options: ["<Router>","<Routes>","<RouteSwitch>","<Outlet>"],
      correct_answer: "<Routes>",
      explanation: "React Router v6 replaced <Switch> with <Routes>, which also made pattern matching smarter — order no longer matters.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "What does <Outlet /> do in React Router v6?",
      question_type: "multiple_choice",
      options: ["Redirects to another route","Renders the matched child route","Handles 404 errors","Loads routes lazily"],
      correct_answer: "Renders the matched child route",
      explanation: "Outlet acts as a placeholder in parent route components, rendering whichever nested route is currently matched.",
      difficulty: "medium",
      order_index: 2,
    },
  ],
  'dynamic-routes-protected': [
    {
      question_text: "Which hook extracts URL parameters in React Router v6?",
      question_type: "multiple_choice",
      options: ["useRouter()","useParams()","useLocation()","useRoute()"],
      correct_answer: "useParams()",
      explanation: "useParams() returns an object of key-value pairs from the dynamic segments of the current URL.",
      difficulty: "easy",
      order_index: 1,
    },
  ],
};

export default quiz;
