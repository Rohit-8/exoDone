// ============================================================================
// React Router & Navigation — Content
// ============================================================================

export const topic = {
  "name": "React Router & Navigation",
  "slug": "react-router",
  "description": "Master client-side routing with React Router v6 — dynamic routes, nested layouts, and programmatic navigation.",
  "estimated_time": 160,
  "order_index": 2
};

export const lessons = [
  {
    title: "React Router v6 Setup & Basic Routing",
    slug: "router-setup-basics",
    summary: "Install React Router v6, configure routes, and use Link/NavLink for navigation.",
    difficulty_level: "beginner",
    estimated_time: 30,
    order_index: 1,
    key_points: [
  "BrowserRouter wraps your app to enable routing",
  "Routes replaces Switch from v5 — order does not matter",
  "Link and NavLink prevent full-page reloads",
  "NavLink automatically applies active styling",
  "Route paths are relative by default in v6"
],
    content: `# React Router v6: Setup & Basic Routing

React Router is the de-facto standard for client-side routing in React applications.

## Installation

\`\`\`bash
npm install react-router-dom
\`\`\`

## Basic Setup

\`\`\`jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
\`\`\`

## Navigation with Link & NavLink

\`\`\`jsx
import { Link, NavLink } from 'react-router-dom';

function Navbar() {
  return (
    <nav>
      {/* Basic link — no page reload */}
      <Link to="/">Home</Link>

      {/* NavLink adds "active" class automatically */}
      <NavLink
        to="/about"
        className={({ isActive }) =>
          isActive ? 'nav-link active' : 'nav-link'
        }
      >
        About
      </NavLink>
    </nav>
  );
}
\`\`\`

## Key Differences from v5
| v5 | v6 |
|---|---|
| \`<Switch>\` | \`<Routes>\` |
| \`<Route component={Comp}>\` | \`<Route element={<Comp />}>\` |
| Exact required | All routes are exact by default |
| Absolute paths only | Relative paths supported |
`,
  },
  {
    title: "Dynamic Routes, Params & Protected Routes",
    slug: "dynamic-routes-protected",
    summary: "Use URL parameters, search params, and build authentication-guarded routes.",
    difficulty_level: "beginner",
    estimated_time: 35,
    order_index: 2,
    key_points: [
  "useParams() extracts URL parameters like /users/:id",
  "useSearchParams() manages query strings (?page=2&sort=name)",
  "useNavigate() enables programmatic navigation",
  "Protected routes wrap children with an auth check",
  "Lazy loading routes improves initial bundle size"
],
    content: `# Dynamic Routes, Params & Protected Routes

## Dynamic URL Parameters

\`\`\`jsx
// Route definition
<Route path="/users/:userId" element={<UserProfile />} />

// Component — extract the param
import { useParams } from 'react-router-dom';

function UserProfile() {
  const { userId } = useParams();
  return <h1>User #{userId}</h1>;
}
\`\`\`

## Query / Search Params

\`\`\`jsx
import { useSearchParams } from 'react-router-dom';

function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;

  const goToPage = (p) => setSearchParams({ page: p });

  return (
    <div>
      <p>Page: {page}</p>
      <button onClick={() => goToPage(page + 1)}>Next</button>
    </div>
  );
}
\`\`\`

## Programmatic Navigation

\`\`\`jsx
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const navigate = useNavigate();

  const handleLogin = async (data) => {
    await api.login(data);
    navigate('/dashboard', { replace: true });
  };

  return <form onSubmit={handleLogin}>...</form>;
}
\`\`\`

## Protected Routes

\`\`\`jsx
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Usage
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
\`\`\`
`,
  },
];
