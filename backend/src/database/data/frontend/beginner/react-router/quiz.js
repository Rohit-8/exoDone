const quiz = {
  "router-setup-basics": [
    {
      question_text:
        "Which component must wrap your React application to enable client-side routing with React Router v6?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "RouterProvider",
        "BrowserRouter",
        "Routes",
        "Switch",
      ]),
      correct_answer: "BrowserRouter",
      explanation:
        "BrowserRouter provides the routing context to all child components using the HTML5 History API. It must wrap the top-level component tree. RouterProvider is used with createBrowserRouter (data router pattern), Routes defines the route mappings, and Switch was used in React Router v5 but has been removed in v6.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text:
        "What is the key difference between Link and NavLink in React Router v6?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Link supports the 'to' prop while NavLink does not",
        "NavLink provides an isActive property for applying active styles",
        "Link triggers a full page reload while NavLink does not",
        "NavLink can only be used inside a Routes component",
      ]),
      correct_answer:
        "NavLink provides an isActive property for applying active styles",
      explanation:
        "Both Link and NavLink render anchor tags and perform client-side navigation without page reloads. The distinction is that NavLink exposes an isActive boolean (and isPending) through its className and style callback props, making it ideal for navigation menus where the active link needs visual emphasis.",
      difficulty: "easy",
      order_index: 2,
    },
    {
      question_text:
        "What does the Outlet component do in a nested route setup?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "It redirects undefined routes to a default page",
        "It renders the matched child route's element inside the parent layout",
        "It provides access to route parameters via context",
        "It wraps child components with an error boundary",
      ]),
      correct_answer:
        "It renders the matched child route's element inside the parent layout",
      explanation:
        "Outlet acts as a placeholder within a parent route's element. When a child route matches, its element is rendered in place of the Outlet. This enables nested layouts where a parent provides persistent UI (header, sidebar) and the child content changes based on the URL.",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text:
        "How do you navigate programmatically to '/dashboard' after a form submission and prevent the user from pressing Back to return to the form?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "navigate('/dashboard')",
        "navigate('/dashboard', { replace: true })",
        "redirect('/dashboard')",
        "useLocation('/dashboard')",
      ]),
      correct_answer: "navigate('/dashboard', { replace: true })",
      explanation:
        "The useNavigate hook returns a navigate function. Passing { replace: true } replaces the current entry in the history stack instead of pushing a new one, so the user cannot press Back to return to the previous page (e.g., a login form). Without replace, the form page would remain in the history stack.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text:
        "Which route path should you use to create a catch-all 404 page in React Router v6?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        'path="/"',
        'path="404"',
        'path="*"',
        'path="not-found"',
      ]),
      correct_answer: 'path="*"',
      explanation:
        "The wildcard path='*' matches any URL that hasn't been matched by a more specific route. React Router v6 uses ranked route matching, so the wildcard will always have the lowest priority regardless of where it appears in the route list. This makes it the standard pattern for 404 pages.",
      difficulty: "easy",
      order_index: 5,
    },
  ],
  "dynamic-routes-protected": [
    {
      question_text:
        "Given the route <Route path='/users/:userId' element={<UserProfile />} />, how do you access the userId value inside UserProfile?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "const { userId } = useLocation()",
        "const { userId } = useParams()",
        "const userId = useSearchParams().get('userId')",
        "const { userId } = useRouteMatch()",
      ]),
      correct_answer: "const { userId } = useParams()",
      explanation:
        "The useParams hook returns an object of key-value pairs from the dynamic segments of the current URL. For the path '/users/:userId', useParams() returns { userId: '42' } when the URL is /users/42. Note that all URL params are strings. useLocation provides the location object, useSearchParams reads query strings, and useRouteMatch was a v5 API removed in v6.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text:
        "What is the correct way to update a single search parameter without losing other existing parameters?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "setSearchParams({ page: '2' })",
        "setSearchParams((prev) => { prev.set('page', '2'); return prev; })",
        "searchParams.set('page', '2')",
        "useNavigate('?page=2')",
      ]),
      correct_answer:
        "setSearchParams((prev) => { prev.set('page', '2'); return prev; })",
      explanation:
        "Using the callback form of setSearchParams gives you access to the previous URLSearchParams object. Calling prev.set('page', '2') modifies only the 'page' param while preserving all other existing params. Passing a plain object like { page: '2' } would replace ALL existing search params, losing any others. Directly mutating searchParams without calling setSearchParams would not trigger a re-render or URL update.",
      difficulty: "medium",
      order_index: 2,
    },
    {
      question_text:
        "In a protected route implementation, what should the guard component return when the user is NOT authenticated?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "null",
        "<Outlet />",
        "<Navigate to='/login' state={{ from: location }} replace />",
        "throw new Error('Unauthorized')",
      ]),
      correct_answer:
        "<Navigate to='/login' state={{ from: location }} replace />",
      explanation:
        "The Navigate component performs a declarative redirect. Passing the current location in state allows the login page to redirect the user back to their originally intended destination after authentication. Using replace prevents the protected URL from appearing in the history stack. Returning null would show a blank page, Outlet would render child routes (defeating the purpose), and throwing an error would crash the app without a proper error boundary.",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text:
        "What is the primary advantage of using route loaders (v6.4+) over fetching data with useEffect inside a component?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Loaders automatically cache data in localStorage",
        "Loaders run before the component renders, eliminating render-then-fetch waterfalls",
        "Loaders do not require async/await syntax",
        "Loaders bypass CORS restrictions on API calls",
      ]),
      correct_answer:
        "Loaders run before the component renders, eliminating render-then-fetch waterfalls",
      explanation:
        "Route loaders execute in parallel before any component renders, so the data is immediately available via useLoaderData — no loading spinners needed within the component. With useEffect, the component first renders (often showing a loading state), then fires the fetch, then re-renders with data. For nested routes, loaders run in parallel, while useEffect calls create sequential waterfalls as each parent must render before the child can fire its request.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text:
        "How does the errorElement property in a route configuration handle errors from nested child routes?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "It only catches errors thrown in its own loader, not from children",
        "Errors bubble up to the nearest parent route that has an errorElement defined",
        "Each route must define its own errorElement or the app will crash",
        "errorElement only works with class-based error boundaries",
      ]),
      correct_answer:
        "Errors bubble up to the nearest parent route that has an errorElement defined",
      explanation:
        "React Router's error handling follows a bubbling pattern similar to JavaScript event propagation. If a child route throws an error (in its loader, action, or component) and does not have its own errorElement, the error propagates upward to the nearest ancestor route with an errorElement. The root route's errorElement serves as the global fallback. This means you don't need to define errorElement on every route — strategic placement at layout boundaries is sufficient.",
      difficulty: "medium",
      order_index: 5,
    },
  ],
};

export default quiz;
