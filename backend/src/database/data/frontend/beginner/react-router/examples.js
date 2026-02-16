const examples = {
  "router-setup-basics": [
    {
      title: "Full Application Routing Setup",
      description:
        "A complete React Router v6 setup with BrowserRouter, multiple routes, a shared navbar with NavLink, and a 404 catch-all page.",
      language: "javascript",
      code: `import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
} from "react-router-dom";

// ---------- Page components ----------
function Home() {
  return <h1>Home Page</h1>;
}

function About() {
  return <h1>About Us</h1>;
}

function Contact() {
  return <h1>Contact</h1>;
}

function NotFound() {
  return (
    <div>
      <h1>404 — Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <NavLink to="/">Go Home</NavLink>
    </div>
  );
}

// ---------- Navbar with NavLink ----------
function Navbar() {
  const linkClass = ({ isActive }) =>
    isActive
      ? "text-blue-600 font-bold border-b-2 border-blue-600 pb-1"
      : "text-gray-600 hover:text-blue-500";

  return (
    <nav className="flex gap-6 p-4 bg-gray-100">
      <NavLink to="/" end className={linkClass}>
        Home
      </NavLink>
      <NavLink to="/about" className={linkClass}>
        About
      </NavLink>
      <NavLink to="/contact" className={linkClass}>
        Contact
      </NavLink>
    </nav>
  );
}

// ---------- App with routing ----------
function App() {
  return (
    <>
      <Navbar />
      <main className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}

// ---------- Entry point ----------
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);`,
      explanation:
        "This example demonstrates the foundational React Router v6 pattern. BrowserRouter wraps the entire app to enable routing. The Navbar uses NavLink components that automatically receive an 'isActive' prop, letting you apply active styling without manual route comparison. Routes defines the set of possible paths, and Route maps each path to a component via the element prop. The path='*' catch-all route renders a 404 page for any unmatched URL. Note that NavLink's 'end' prop on the home link prevents it from matching every path that starts with '/'.",
      order_index: 1,
    },
    {
      title: "Nested Layout with Outlet & Index Route",
      description:
        "Build a dashboard layout with a sidebar, nested child routes, and an index route that acts as the default view — a pattern frequently tested in interviews.",
      language: "javascript",
      code: `import {
  Routes,
  Route,
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

// ---------- Dashboard Layout ----------
function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear auth token, then redirect
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Dashboard</h2>
        <nav className="flex flex-col gap-2">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              isActive ? "bg-gray-600 p-2 rounded" : "p-2 hover:bg-gray-700 rounded"
            }
          >
            Overview
          </NavLink>
          <NavLink
            to="/dashboard/analytics"
            className={({ isActive }) =>
              isActive ? "bg-gray-600 p-2 rounded" : "p-2 hover:bg-gray-700 rounded"
            }
          >
            Analytics
          </NavLink>
          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) =>
              isActive ? "bg-gray-600 p-2 rounded" : "p-2 hover:bg-gray-700 rounded"
            }
          >
            Settings
          </NavLink>
        </nav>
        <button
          onClick={handleLogout}
          className="mt-auto bg-red-600 p-2 rounded w-full"
        >
          Logout
        </button>
      </aside>

      {/* Main content — child routes render here */}
      <main className="flex-1 p-8 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}

// ---------- Child page components ----------
function Overview() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Overview</h1>
      <p>Welcome to your dashboard. Here is a summary of your activity.</p>
    </div>
  );
}

function Analytics() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Analytics</h1>
      <p>Charts and metrics will go here.</p>
    </div>
  );
}

function Settings() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <p>Manage your preferences.</p>
    </div>
  );
}

// ---------- Route configuration ----------
function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardLayout />}>
        {/* Index route — renders at /dashboard */}
        <Route index element={<Overview />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;`,
      explanation:
        "This example shows the nested routing pattern that interviewers love to ask about. DashboardLayout is the parent route's element — it renders a persistent sidebar and uses the Outlet component as a placeholder where matched child routes appear. The 'index' route renders the Overview component when the URL is exactly '/dashboard' with no additional path segment. Child route paths are relative to the parent (e.g., 'analytics' resolves to '/dashboard/analytics'). The useNavigate hook is used for the logout button to programmatically redirect to the login page with replace: true, which removes the dashboard from the browser history stack so the user cannot press Back to return.",
      order_index: 2,
    },
    {
      title: "Programmatic Navigation & useLocation State",
      description:
        "Demonstrates useNavigate for redirecting after a form action and useLocation for reading navigation state passed between routes.",
      language: "javascript",
      code: `import { useState } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";

// ---------- Product list ----------
function ProductList() {
  const products = [
    { id: 1, name: "Laptop", price: 999 },
    { id: 2, name: "Phone", price: 699 },
    { id: 3, name: "Tablet", price: 499 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      <ul>
        {products.map((p) => (
          <li key={p.id} className="mb-2">
            {/* Pass product data via location state */}
            <Link
              to={\`/products/\${p.id}\`}
              state={{ productName: p.name, price: p.price }}
              className="text-blue-600 underline"
            >
              {p.name} — \${p.price}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Product detail (reads location state) ----------
function ProductDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { productName, price } = location.state || {};

  const handleAddToCart = () => {
    // Simulate adding to cart, then redirect
    alert(\`Added \${productName} to cart!\`);
    navigate("/cart", {
      state: { lastAdded: productName },
      replace: false,
    });
  };

  if (!productName) {
    return (
      <div>
        <p>No product data. Please go back.</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{productName}</h1>
      <p className="text-lg">\${price}</p>
      <button
        onClick={handleAddToCart}
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
      >
        Add to Cart
      </button>
      <button
        onClick={() => navigate(-1)}
        className="mt-4 ml-2 bg-gray-300 px-4 py-2 rounded"
      >
        Back
      </button>
    </div>
  );
}

// ---------- Cart (reads state from redirect) ----------
function Cart() {
  const location = useLocation();
  const lastAdded = location.state?.lastAdded;

  return (
    <div>
      <h1 className="text-2xl font-bold">Cart</h1>
      {lastAdded && (
        <p className="text-green-600">
          ✓ {lastAdded} was just added to your cart!
        </p>
      )}
    </div>
  );
}

// ---------- App ----------
function App() {
  return (
    <Routes>
      <Route path="/products" element={<ProductList />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
    </Routes>
  );
}

export default App;`,
      explanation:
        "This example highlights two critical hooks: useNavigate and useLocation. The ProductList component passes data to the detail page via the Link's state prop — this data is tucked into location.state and never appears in the URL, making it useful for transient data. The ProductDetail component reads that state with useLocation and uses useNavigate to redirect to the cart after adding an item. The navigate(-1) call simulates the browser's Back button. In interviews, be ready to explain that location.state is lost if the user directly enters the URL or refreshes the page — so for critical data, prefer URL params or a global store.",
      order_index: 3,
    },
  ],
  "dynamic-routes-protected": [
    {
      title: "Dynamic Product Page with useParams & useSearchParams",
      description:
        "A product catalog that combines dynamic route segments for category/product identification with search params for filtering and pagination.",
      language: "javascript",
      code: `import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Link,
  useParams,
  useSearchParams,
} from "react-router-dom";

// ---------- Fake data ----------
const allProducts = [
  { id: 1, name: "Running Shoes", category: "shoes", price: 120 },
  { id: 2, name: "Leather Boots", category: "shoes", price: 200 },
  { id: 3, name: "Denim Jacket", category: "clothing", price: 80 },
  { id: 4, name: "Wool Sweater", category: "clothing", price: 65 },
  { id: 5, name: "Baseball Cap", category: "accessories", price: 25 },
  { id: 6, name: "Sunglasses", category: "accessories", price: 150 },
];

// ---------- Product list with search params ----------
function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "all";
  const sort = searchParams.get("sort") || "name";

  const filtered = allProducts
    .filter((p) => category === "all" || p.category === category)
    .sort((a, b) =>
      sort === "price" ? a.price - b.price : a.name.localeCompare(b.name)
    );

  const updateFilter = (key, value) => {
    setSearchParams((prev) => {
      prev.set(key, value);
      return prev;
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Products</h1>

      {/* Filter controls */}
      <div className="flex gap-4 mb-4">
        <select
          value={category}
          onChange={(e) => updateFilter("category", e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="shoes">Shoes</option>
          <option value="clothing">Clothing</option>
          <option value="accessories">Accessories</option>
        </select>

        <select
          value={sort}
          onChange={(e) => updateFilter("sort", e.target.value)}
        >
          <option value="name">Sort by Name</option>
          <option value="price">Sort by Price</option>
        </select>
      </div>

      {/* Product grid */}
      <ul>
        {filtered.map((p) => (
          <li key={p.id} className="mb-2">
            <Link to={\`/products/\${p.id}\`} className="text-blue-600 underline">
              {p.name} — \${p.price}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Product detail with useParams ----------
function ProductDetail() {
  const { productId } = useParams();
  const product = allProducts.find((p) => p.id === Number(productId));

  if (!product) return <p>Product not found.</p>;

  return (
    <div>
      <Link to="/products" className="text-blue-600 underline">
        ← Back to Products
      </Link>
      <h1 className="text-2xl font-bold mt-4">{product.name}</h1>
      <p>Category: {product.category}</p>
      <p>Price: \${product.price}</p>
    </div>
  );
}

// ---------- Routes ----------
function App() {
  return (
    <Routes>
      <Route path="/products" element={<ProductList />} />
      <Route path="/products/:productId" element={<ProductDetail />} />
    </Routes>
  );
}

export default App;`,
      explanation:
        "This example illustrates the distinction between route params and search params — a very common interview question. The product list uses useSearchParams to manage category filtering and sort order; these values appear as query strings (/products?category=shoes&sort=price) and are ideal for optional, non-identifying data. The product detail page uses useParams to extract the productId from the URL path (/products/3), which uniquely identifies the resource. Note how Number(productId) converts the string param to a number for comparison. The setSearchParams callback form (accepting prev) lets you update individual params without losing others.",
      order_index: 1,
    },
    {
      title: "Auth Guard with Protected Layout Route",
      description:
        "A reusable authentication guard using the layout route pattern, complete with redirect-back-after-login logic and role-based access control.",
      language: "javascript",
      code: `import { createContext, useContext, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";

// ========== Auth Context ==========
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (username, role = "user") => {
    setUser({ username, role });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

// ========== Guard Components ==========

// General auth guard — ensures user is logged in
function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

// Role-based guard — checks for a specific role
function RequireRole({ role }) {
  const { user } = useAuth();

  if (user?.role !== role) {
    return (
      <div>
        <h1>403 — Access Denied</h1>
        <p>You do not have the required permissions.</p>
        <Link to="/">Go Home</Link>
      </div>
    );
  }

  return <Outlet />;
}

// ========== Page Components ==========
function Home() {
  return (
    <div>
      <h1>Home (Public)</h1>
      <Link to="/dashboard">Go to Dashboard</Link>
    </div>
  );
}

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const handleLogin = (role) => {
    login("demoUser", role);
    navigate(from, { replace: true });
  };

  return (
    <div>
      <h1>Login</h1>
      <button onClick={() => handleLogin("user")}>
        Login as User
      </button>
      <button onClick={() => handleLogin("admin")}>
        Login as Admin
      </button>
    </div>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <h1>Dashboard (Protected)</h1>
      <p>Welcome, {user.username}! Role: {user.role}</p>
      <button
        onClick={() => {
          logout();
          navigate("/login", { replace: true });
        }}
      >
        Logout
      </button>
    </div>
  );
}

function AdminPanel() {
  return <h1>Admin Panel (Admin Only)</h1>;
}

// ========== App ==========
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Protected routes — any logged-in user */}
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* Admin-only routes */}
          <Route element={<RequireAuth />}>
            <Route element={<RequireRole role="admin" />}>
              <Route path="/admin" element={<AdminPanel />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;`,
      explanation:
        "This example demonstrates the production-grade pattern for protected routes in React Router v6. The RequireAuth component is a pathless layout route that checks if the user is authenticated; if not, it redirects to /login while preserving the originally requested URL in location.state. After successful login, the user is sent back to where they came from. The RequireRole component adds a second layer of authorization by checking the user's role. By nesting RequireAuth and RequireRole as layout routes, you avoid repeating guard logic on every individual route. This composable, declarative approach is what interviewers expect to see — it scales cleanly to applications with dozens of protected routes and multiple user roles.",
      order_index: 2,
    },
    {
      title: "Data Router with Loader, Lazy Loading & Error Boundary",
      description:
        "Uses createBrowserRouter to define routes with data loaders, lazy-loaded components, and route-level error boundaries — the modern v6.4+ architecture.",
      language: "javascript",
      code: `import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Link,
  useLoaderData,
  useRouteError,
  isRouteErrorResponse,
  useNavigation,
} from "react-router-dom";

// ========== Root Layout ==========
function RootLayout() {
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  return (
    <div>
      <nav className="flex gap-4 p-4 bg-gray-100">
        <Link to="/">Home</Link>
        <Link to="/users">Users</Link>
      </nav>
      {isLoading && (
        <div className="bg-blue-100 text-blue-800 p-2 text-center">
          Loading...
        </div>
      )}
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}

// ========== Page Components ==========
function Home() {
  return <h1>Home</h1>;
}

function UserList() {
  const users = useLoaderData();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id} className="mb-2">
            <Link
              to={\`/users/\${user.id}\`}
              className="text-blue-600 underline"
            >
              {user.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UserDetail() {
  const user = useLoaderData();

  return (
    <div>
      <Link to="/users">← Back</Link>
      <h1 className="text-2xl font-bold mt-4">{user.name}</h1>
      <p>Email: {user.email}</p>
      <p>Phone: {user.phone}</p>
    </div>
  );
}

// ========== Error Boundary ==========
function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">
          {error.status} — {error.statusText}
        </h1>
        <p>{error.data}</p>
        <Link to="/" className="text-blue-600 underline">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-red-600">
        Unexpected Error
      </h1>
      <p>{error?.message || "Something went wrong."}</p>
      <Link to="/" className="text-blue-600 underline">
        Go Home
      </Link>
    </div>
  );
}

// ========== Loaders ==========
async function usersLoader() {
  const res = await fetch(
    "https://jsonplaceholder.typicode.com/users"
  );
  if (!res.ok) {
    throw new Response("Failed to load users", { status: res.status });
  }
  return res.json();
}

async function userDetailLoader({ params }) {
  const res = await fetch(
    \`https://jsonplaceholder.typicode.com/users/\${params.userId}\`
  );
  if (!res.ok) {
    throw new Response("User not found", { status: 404 });
  }
  return res.json();
}

// ========== Router Config ==========
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <Home /> },
      {
        path: "users",
        element: <UserList />,
        loader: usersLoader,
        errorElement: <ErrorBoundary />,
      },
      {
        path: "users/:userId",
        element: <UserDetail />,
        loader: userDetailLoader,
        errorElement: <ErrorBoundary />,
      },
      {
        path: "settings",
        lazy: async () => {
          // Code-split: Settings is only loaded when visited
          const { Settings } = await import("./pages/Settings");
          return { Component: Settings };
        },
      },
    ],
  },
]);

// ========== Entry Point ==========
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);`,
      explanation:
        "This example showcases the data router architecture introduced in React Router v6.4. Instead of BrowserRouter, we use createBrowserRouter to define routes as a plain object array and pass it to RouterProvider. Each route can have a loader function that fetches data before the component renders — the component then accesses this data synchronously via useLoaderData, eliminating the need for useEffect + loading state. The useNavigation hook provides a global loading indicator during transitions. Route-level errorElement components catch errors thrown by loaders (including Response objects with status codes), with isRouteErrorResponse distinguishing HTTP errors from unexpected exceptions. The settings route uses the lazy() property to code-split its bundle — the component JavaScript is only downloaded when the user navigates to /settings. This pattern eliminates render-then-fetch waterfalls, centralizes error handling, and is the architecture React Router recommends for new projects.",
      order_index: 3,
    },
  ],
};

export default examples;
