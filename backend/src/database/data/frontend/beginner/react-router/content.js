export const topic = {
  name: "React Router & Navigation",
  slug: "react-router",
  description:
    "Master client-side routing with React Router v6 — dynamic routes, nested layouts, and programmatic navigation.",
  estimated_time: 160,
  order_index: 2,
};

export const lessons = [
  {
    title: "React Router v6 Setup & Basic Routing",
    slug: "router-setup-basics",
    summary:
      "Learn how to install and configure React Router v6, define routes with BrowserRouter, Routes, and Route, navigate between pages with Link and NavLink, build nested layouts with Outlet, and handle programmatic navigation, 404 pages, and index routes.",
    difficulty_level: "beginner",
    estimated_time: 30,
    order_index: 1,
    key_points: [
      "Install React Router v6 and wrap your app with BrowserRouter to enable client-side routing",
      "Define route mappings using the Routes and Route components with element props",
      "Use Link for basic navigation and NavLink for active-state styling",
      "Build nested layouts with parent Route components and the Outlet placeholder",
      "Navigate programmatically with the useNavigate hook for redirects and form submissions",
      "Access the current URL details through useLocation for conditional rendering",
      "Define index routes to render default content inside a layout",
      "Create catch-all 404 routes with path='*' to handle unknown URLs",
    ],
    content: `## Introduction to React Router v6

React Router is the de-facto standard for client-side routing in React applications. Version 6 introduced a cleaner, more composable API that leverages React hooks and simplifies many patterns that were verbose in earlier versions. Understanding React Router is essential for any React developer and is a frequent topic in frontend interviews.

### Why Client-Side Routing?

Traditional multi-page applications (MPAs) request a new HTML document from the server for every page. Single-page applications (SPAs) load a single HTML document and dynamically update the content using JavaScript. Client-side routing intercepts browser navigation events and renders the appropriate component without a full page reload, resulting in faster transitions and a smoother user experience.

---

## Installation & BrowserRouter Setup

Install React Router v6:

\`\`\`bash
npm install react-router-dom
\`\`\`

Wrap your root component with **BrowserRouter** to provide the routing context to all child components:

\`\`\`jsx
// main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
\`\`\`

> **Interview Tip:** \`BrowserRouter\` uses the HTML5 History API (\`pushState\`, \`replaceState\`) under the hood. \`HashRouter\` uses the URL hash (\`#\`) and is useful when you cannot configure the server for catch-all routing.

---

## Defining Routes with Routes & Route

The \`Routes\` component replaces the old \`Switch\` from v5. Each \`Route\` maps a URL path to a React element:

\`\`\`jsx
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  );
}
\`\`\`

### Route Matching in v6

React Router v6 uses **ranked route matching** — it automatically picks the most specific match regardless of the order routes are defined. This eliminates the need for the \`exact\` prop that v5 required:

- \`/users/new\` will match before \`/users/:id\` because static segments rank higher than dynamic segments.
- \`/users\` will not match \`/users/123\` — each route matches only its exact path unless it has child routes.

---

## Link vs NavLink

### Link

The \`Link\` component renders an anchor tag that navigates without a full page reload:

\`\`\`jsx
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
      <Link to="/contact">Contact</Link>
    </nav>
  );
}
\`\`\`

### NavLink

\`NavLink\` extends \`Link\` with active-state awareness. It automatically applies an \`active\` class (or a custom className function) when the link's \`to\` prop matches the current URL:

\`\`\`jsx
import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav>
      <NavLink
        to="/"
        className={({ isActive }) => (isActive ? "text-blue-600 font-bold" : "text-gray-600")}
        end // "end" ensures "/" only matches exactly, not every path
      >
        Home
      </NavLink>
      <NavLink to="/about" className={({ isActive }) => (isActive ? "text-blue-600 font-bold" : "text-gray-600")}>
        About
      </NavLink>
    </nav>
  );
}
\`\`\`

> **Key Difference:** Use \`Link\` for simple navigation. Use \`NavLink\` when you need visual feedback for the currently active route (e.g., navigation menus, sidebars, tabs).

---

## Nested Routes & the Outlet Component

Nested routes let you compose layouts where a parent route renders shared UI (header, sidebar) and an \`Outlet\` renders the matched child route:

\`\`\`jsx
import { Routes, Route, Outlet, Link } from "react-router-dom";

function DashboardLayout() {
  return (
    <div className="flex">
      <aside>
        <Link to="/dashboard">Overview</Link>
        <Link to="/dashboard/settings">Settings</Link>
      </aside>
      <main>
        {/* Child route component renders here */}
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardOverview />} />
        <Route path="settings" element={<DashboardSettings />} />
        <Route path="profile" element={<DashboardProfile />} />
      </Route>
    </Routes>
  );
}
\`\`\`

### Index Routes

An **index route** (\`<Route index />\`) renders when the parent route matches exactly but no child route does. It acts as the default content for that layout. In the example above, visiting \`/dashboard\` renders \`DashboardOverview\` inside the layout.

### Layout Routes (Pathless Routes)

A layout route has no \`path\` prop — it exists solely to wrap child routes with shared UI:

\`\`\`jsx
<Routes>
  <Route element={<MainLayout />}>
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
  </Route>
</Routes>
\`\`\`

Here, both \`/\` and \`/about\` share the \`MainLayout\` wrapper without the URL being affected.

---

## Programmatic Navigation with useNavigate

The \`useNavigate\` hook returns a function you can call to navigate imperatively — useful after form submissions, login flows, or timer-based redirects:

\`\`\`jsx
import { useNavigate } from "react-router-dom";

function LoginForm() {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await loginUser(credentials);
    if (success) {
      navigate("/dashboard", { replace: true });
      // replace: true removes /login from the history stack
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
\`\`\`

You can also go back/forward in history:

\`\`\`jsx
navigate(-1); // go back one page
navigate(1);  // go forward one page
\`\`\`

---

## useLocation — Accessing Location State

\`useLocation\` returns the current location object containing \`pathname\`, \`search\`, \`hash\`, and \`state\`:

\`\`\`jsx
import { useLocation } from "react-router-dom";

function CurrentPage() {
  const location = useLocation();
  // location.pathname → "/about"
  // location.search   → "?tab=overview"
  // location.hash     → "#section-1"
  // location.state    → any state passed via navigate() or Link

  return <p>Current path: {location.pathname}</p>;
}
\`\`\`

> **Interview Tip:** \`location.state\` is invisible in the URL. You can pass data between routes without query parameters by using \`<Link to="/details" state={{ id: 42 }} />\` or \`navigate("/details", { state: { id: 42 } })\`.

---

## 404 Catch-All Routes

Use \`path="*"\` at the end of your routes to catch unmatched URLs:

\`\`\`jsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/about" element={<About />} />
  <Route path="*" element={<NotFound />} />
</Routes>
\`\`\`

Because v6 uses ranked matching, the wildcard route will only match when no other route does, regardless of where it appears in the list.

---

## Common Interview Questions

1. **What is the difference between BrowserRouter and HashRouter?**
   - BrowserRouter uses the History API and requires server configuration to serve \`index.html\` for all paths. HashRouter puts the path after a \`#\` and works without server config.

2. **Why was the \`exact\` prop removed in v6?**
   - v6 uses ranked matching by default; routes match only their exact path unless they have children. The \`exact\` prop is no longer needed.

3. **How do you pass data between routes?**
   - URL params (\`:id\`), search/query params (\`?key=value\`), or location state (\`navigate(path, { state })\`).

4. **What is the purpose of Outlet?**
   - \`Outlet\` is a placeholder in a parent route's element where matched child routes are rendered — enabling nested layouts.

---

## Summary

| Concept | Purpose |
|---------|---------|
| \`BrowserRouter\` | Provides routing context using the History API |
| \`Routes\` / \`Route\` | Declares URL-to-component mappings |
| \`Link\` / \`NavLink\` | Declarative navigation; NavLink adds active styling |
| \`Outlet\` | Renders matched child routes inside a layout |
| \`useNavigate\` | Imperative navigation (redirects, form submissions) |
| \`useLocation\` | Access current URL info and location state |
| Index route | Default child when parent path matches exactly |
| \`path="*"\` | Catch-all for 404 pages |
`,
  },
  {
    title: "Dynamic Routes & Protected Routes",
    slug: "dynamic-routes-protected",
    summary:
      "Implement dynamic route parameters with useParams, manage search params with useSearchParams, build authentication guards for protected routes, explore data routers and route loaders introduced in v6.4, and add lazy loading and route-level error boundaries.",
    difficulty_level: "beginner",
    estimated_time: 35,
    order_index: 2,
    key_points: [
      "Define dynamic segments in route paths and extract them with the useParams hook",
      "Read and update URL query strings with the useSearchParams hook",
      "Build protected/private route wrappers that redirect unauthenticated users",
      "Use createBrowserRouter and RouterProvider for the data router pattern (v6.4+)",
      "Fetch data before rendering with route loaders and access it via useLoaderData",
      "Lazy-load route components with React.lazy and the route lazy() property",
      "Add route-level error boundaries with errorElement to gracefully handle failures",
      "Combine auth guards with nested routes for scalable permission-based access control",
    ],
    content: `## Dynamic Route Parameters

Dynamic routes let a single route definition handle infinitely many URL patterns. You define a dynamic segment with a colon prefix (\`:paramName\`), and React Router extracts the value at runtime.

### Defining Dynamic Routes

\`\`\`jsx
<Routes>
  <Route path="/users/:userId" element={<UserProfile />} />
  <Route path="/products/:category/:productId" element={<ProductDetail />} />
</Routes>
\`\`\`

### Extracting Params with useParams

\`\`\`jsx
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

function UserProfile() {
  const { userId } = useParams();
  // URL: /users/42 → userId = "42"

  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then((res) => res.json())
      .then(setUser);
  }, [userId]);

  if (!user) return <p>Loading...</p>;
  return <h1>{user.name}</h1>;
}
\`\`\`

> **Important:** All URL params are strings. If you need a number, convert explicitly: \`Number(userId)\` or \`parseInt(userId, 10)\`.

### Multiple Dynamic Segments

\`\`\`jsx
function ProductDetail() {
  const { category, productId } = useParams();
  // URL: /products/electronics/99
  // category = "electronics", productId = "99"
  return <h1>{category} — Product #{productId}</h1>;
}
\`\`\`

---

## Search Params with useSearchParams

Search parameters (query strings) are key-value pairs after the \`?\` in a URL. React Router provides the \`useSearchParams\` hook to read and update them declaratively:

\`\`\`jsx
import { useSearchParams } from "react-router-dom";

function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get("category") || "all";
  const sort = searchParams.get("sort") || "name";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const handleCategoryChange = (newCategory) => {
    setSearchParams({ category: newCategory, sort, page: "1" });
    // URL becomes: /products?category=shoes&sort=name&page=1
  };

  const handleNextPage = () => {
    setSearchParams((prev) => {
      prev.set("page", String(page + 1));
      return prev;
    });
  };

  return (
    <div>
      <p>Category: {category} | Sort: {sort} | Page: {page}</p>
      <button onClick={() => handleCategoryChange("shoes")}>Shoes</button>
      <button onClick={handleNextPage}>Next Page</button>
    </div>
  );
}
\`\`\`

> **Interview Tip:** \`useSearchParams\` works like \`useState\` — calling \`setSearchParams\` triggers a re-render. The underlying value is a \`URLSearchParams\` instance, so you can use \`.get()\`, \`.getAll()\`, \`.has()\`, and \`.entries()\` on it.

### When to Use Params vs Search Params

| Use Case | Approach | Example |
|----------|----------|---------|
| Identifying a resource | URL params (\`:id\`) | \`/users/42\` |
| Filtering / sorting / pagination | Search params | \`/users?role=admin&page=2\` |
| Optional modifiers | Search params | \`/search?q=react&lang=en\` |

---

## Protected / Private Routes

Many applications require certain routes to be accessible only to authenticated users. In React Router v6, the cleanest pattern is a wrapper component that checks auth status and either renders children or redirects:

### Basic ProtectedRoute Wrapper

\`\`\`jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Redirect to login, preserving the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
\`\`\`

### Using the Guard in Routes

\`\`\`jsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />

  {/* Protected routes */}
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />
  <Route
    path="/settings"
    element={
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    }
  />
</Routes>
\`\`\`

### Redirect Back After Login

\`\`\`jsx
import { useNavigate, useLocation } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const handleLogin = async () => {
    await performLogin(credentials);
    navigate(from, { replace: true });
  };

  return <form onSubmit={handleLogin}>...</form>;
}
\`\`\`

### Layout-Level Protection (Recommended Pattern)

For apps with many protected routes, use a layout route instead of wrapping each one individually:

\`\`\`jsx
import { Outlet, Navigate, useLocation } from "react-router-dom";

function ProtectedLayout() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

// In your routes:
<Routes>
  <Route path="/login" element={<Login />} />

  <Route element={<ProtectedLayout />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/settings" element={<Settings />} />
    <Route path="/profile" element={<Profile />} />
  </Route>
</Routes>
\`\`\`

This is the scalable approach — adding a new protected route requires only one additional \`<Route>\` line.

---

## Data Router Pattern (v6.4+)

React Router v6.4 introduced **data routers** — a new architecture where data fetching is tightly integrated with route definitions. Instead of \`BrowserRouter\`, you use \`createBrowserRouter\` and \`RouterProvider\`:

\`\`\`jsx
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      {
        path: "users/:userId",
        element: <UserProfile />,
        loader: async ({ params }) => {
          const res = await fetch(\`/api/users/\${params.userId}\`);
          if (!res.ok) throw new Response("User not found", { status: 404 });
          return res.json();
        },
        errorElement: <UserError />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}
\`\`\`

### Route Loaders & useLoaderData

A **loader** function runs before the route component renders, allowing you to fetch data and handle errors at the route level:

\`\`\`jsx
import { useLoaderData } from "react-router-dom";

// The loader is defined in the route config (see above)
function UserProfile() {
  const user = useLoaderData();
  // Data is already loaded — no useEffect, no loading state!
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
\`\`\`

> **Interview Tip:** Loaders run in parallel for nested routes, eliminating request waterfalls. This is one of the key advantages over the traditional \`useEffect\` fetching pattern.

---

## Lazy Route Loading

Large applications benefit from code splitting at the route level. React Router v6.4+ supports a \`lazy()\` property on route definitions:

### Using the route lazy() property (v6.4+)

\`\`\`jsx
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      {
        path: "dashboard",
        lazy: async () => {
          const { Dashboard } = await import("./pages/Dashboard");
          return { Component: Dashboard };
        },
      },
      {
        path: "settings",
        lazy: async () => {
          const { Settings, settingsLoader } = await import("./pages/Settings");
          return { Component: Settings, loader: settingsLoader };
        },
      },
    ],
  },
]);
\`\`\`

### Traditional React.lazy Approach

If you are not using data routers, you can use \`React.lazy\` with \`Suspense\`:

\`\`\`jsx
import React, { Suspense } from "react";

const Dashboard = React.lazy(() => import("./pages/Dashboard"));

function App() {
  return (
    <Routes>
      <Route
        path="/dashboard"
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <Dashboard />
          </Suspense>
        }
      />
    </Routes>
  );
}
\`\`\`

---

## Route-Level Error Boundaries

With data routers, each route can define an \`errorElement\` that renders when the route's loader, action, or component throws an error:

\`\`\`jsx
import { useRouteError, isRouteErrorResponse } from "react-router-dom";

function RouteErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
    </div>
  );
}

// Usage in route config:
// {
//   path: "users/:userId",
//   element: <UserProfile />,
//   errorElement: <RouteErrorBoundary />,
//   loader: userLoader,
// }
\`\`\`

Error boundaries bubble up — if a child route doesn't have an \`errorElement\`, the error propagates to the nearest parent route that does. The root route's \`errorElement\` acts as the global fallback.

---

## Combining Protected Routes with Data Routers

\`\`\`jsx
const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "login", element: <Login /> },
    ],
  },
  {
    path: "/app",
    element: <ProtectedLayout />,  // checks auth, renders Outlet or redirects
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Dashboard /> },
      {
        path: "users/:userId",
        element: <UserProfile />,
        loader: userLoader,
      },
      { path: "settings", element: <Settings /> },
    ],
  },
]);
\`\`\`

---

## Common Interview Questions

1. **How do dynamic route params differ from search params?**
   - Route params (\`:id\`) are part of the path and identify a resource. Search params (\`?key=val\`) are optional key-value pairs used for filtering, sorting, and pagination.

2. **How do you protect routes in React Router v6?**
   - Create a wrapper component that checks authentication and returns either \`<Outlet />\` (or \`children\`) or \`<Navigate to="/login" />\`. Use it as a pathless layout route.

3. **What is the advantage of route loaders over useEffect for data fetching?**
   - Loaders run before the component renders, avoid render-then-fetch waterfalls, run in parallel for nested routes, and integrate with error boundaries.

4. **How does lazy route loading improve performance?**
   - It splits the JavaScript bundle per route so users only download code for the pages they visit, reducing initial load time.

---

## Summary

| Concept | Purpose |
|---------|---------|
| \`useParams\` | Extract dynamic URL segments |
| \`useSearchParams\` | Read/write query string parameters |
| Protected routes | Restrict access based on auth status |
| \`createBrowserRouter\` | Data router with loaders and error handling |
| \`useLoaderData\` | Access data fetched by the route loader |
| \`lazy()\` / \`React.lazy\` | Code-split routes for faster initial loads |
| \`errorElement\` | Route-level error boundaries |
`,
  },
];
