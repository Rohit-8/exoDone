// ============================================================================
// React Router & Navigation — Code Examples
// ============================================================================

const examples = {
  'router-setup-basics': [
    {
      title: "Complete Router Setup with Layout",
      description: "Full application routing with a shared layout.",
      language: "javascript",
      code: `import { BrowserRouter, Routes, Route, NavLink, Outlet } from 'react-router-dom';

function Layout() {
  return (
    <div className="app">
      <nav className="navbar">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/products">Products</NavLink>
        <NavLink to="/about">About</NavLink>
      </nav>
      <main>
        <Outlet /> {/* Renders the matched child route */}
      </main>
      <footer>© 2026</footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}`,
      explanation: "Outlet renders whichever child Route matches. The Layout component stays mounted while child routes change — perfect for shared navigation.",
      order_index: 1,
    },
  ],
  'dynamic-routes-protected': [
    {
      title: "Protected Route with Role-Based Access",
      description: "A more advanced guard that checks user role.",
      language: "javascript",
      code: `import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children, requiredRole }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

// Routes
<Route path="/admin" element={
  <ProtectedRoute requiredRole="admin">
    <AdminPanel />
  </ProtectedRoute>
} />`,
      explanation: "This pattern saves the attempted URL in location state so the login page can redirect back after successful authentication.",
      order_index: 1,
    },
  ],
};

export default examples;
