import pool from '../config/database.js';

async function seedReactRouter() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Adding React Router lesson...');

    const topicsResult = await client.query("SELECT id FROM topics WHERE slug = 'react-router'");
    
    if (topicsResult.rows.length === 0) {
      console.log('❌ Topic not found: react-router');
      await client.query('ROLLBACK');
      return;
    }
    
    const topicId = topicsResult.rows[0].id;

    const existingLesson = await client.query(
      "SELECT id FROM lessons WHERE topic_id = $1 AND slug = 'react-router-v6-complete'",
      [topicId]
    );

    if (existingLesson.rows.length > 0) {
      console.log('⚠️  Lesson already exists: react-router-v6-complete');
      await client.query('ROLLBACK');
      return;
    }

    const lesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'React Router v6: Complete Guide', 'react-router-v6-complete', $2, 'Master React Router v6 with nested routes, protected routes, URL parameters, navigation guards, and advanced routing patterns.', 'beginner', 50, 1, $3)
      RETURNING id
    `, [
      topicId,
      `# React Router v6: Complete Guide

## Introduction to React Router

**React Router** is the standard routing library for React applications. It enables navigation between views, maintains browser history, and syncs UI with the URL.

### Why Use React Router?

✅ **Single Page Application (SPA)**: Navigate without page reloads
✅ **URL Management**: Bookmarkable URLs for different views
✅ **Nested Routing**: Build complex layouts with child routes
✅ **Code Splitting**: Lazy load components for better performance
✅ **Navigation Guards**: Protect routes based on authentication
✅ **URL Parameters**: Dynamic routing with params and query strings

### React Router v6 Key Changes

🔹 **Routes instead of Switch**: New \\\`<Routes>\\\` component
🔹 **element instead of component**: Pass JSX directly
🔹 **useNavigate instead of useHistory**: Simplified navigation API
🔹 **Nested routes without Route nesting**: Cleaner syntax
🔹 **No exact prop**: All routes are exact by default
🔹 **Relative paths**: Child routes use relative paths

## Installation

\\\`\\\`\\\`bash
npm install react-router-dom
# or
yarn add react-router-dom
\\\`\\\`\\\`

## Basic Setup

### App.jsx with BrowserRouter

\\\`\\\`\\\`jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

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

export default App;
\\\`\\\`\\\`

### Navigation with Link

\\\`\\\`\\\`jsx
import { Link, NavLink } from 'react-router-dom';

function Navbar() {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
        <li>
          <Link to="/contact">Contact</Link>
        </li>
      </ul>
    </nav>
  );
}

// NavLink adds "active" class when route is active
function NavbarWithActive() {
  return (
    <nav>
      <NavLink 
        to="/" 
        className={({ isActive }) => isActive ? 'active' : ''}
      >
        Home
      </NavLink>
      <NavLink 
        to="/about"
        style={({ isActive }) => ({
          fontWeight: isActive ? 'bold' : 'normal'
        })}
      >
        About
      </NavLink>
    </nav>
  );
}
\\\`\\\`\\\`

## URL Parameters

### Dynamic Routes

\\\`\\\`\\\`jsx
import { Routes, Route } from 'react-router-dom';
import UserProfile from './pages/UserProfile';
import PostDetail from './pages/PostDetail';

function App() {
  return (
    <Routes>
      <Route path="/users/:userId" element={<UserProfile />} />
      <Route path="/posts/:postId" element={<PostDetail />} />
      <Route path="/blog/:year/:month/:slug" element={<BlogPost />} />
    </Routes>
  );
}
\\\`\\\`\\\`

### Using useParams Hook

\\\`\\\`\\\`jsx
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

function UserProfile() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const response = await fetch(\\\`/api/users/\\\${userId}\\\`);
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
      <p>Bio: {user.bio}</p>
    </div>
  );
}
\\\`\\\`\\\`

### Query Parameters with useSearchParams

\\\`\\\`\\\`jsx
import { useSearchParams } from 'react-router-dom';

function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const category = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'name';
  const page = parseInt(searchParams.get('page') || '1');

  const handleFilterChange = (newCategory) => {
    setSearchParams({ category: newCategory, sort, page: '1' });
  };

  const handleSortChange = (newSort) => {
    setSearchParams({ category, sort: newSort, page: '1' });
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ category, sort, page: newPage.toString() });
  };

  return (
    <div>
      <h1>Products</h1>
      
      <div>
        <select value={category} onChange={(e) => handleFilterChange(e.target.value)}>
          <option value="all">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="books">Books</option>
        </select>
        
        <select value={sort} onChange={(e) => handleSortChange(e.target.value)}>
          <option value="name">Name</option>
          <option value="price">Price</option>
          <option value="date">Date</option>
        </select>
      </div>

      {/* Product list here */}
      
      <div>
        <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
          Previous
        </button>
        <span>Page {page}</span>
        <button onClick={() => handlePageChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
\\\`\\\`\\\`

## Nested Routes

### Layout with Outlet

\\\`\\\`\\\`jsx
import { Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Layout component
function Layout() {
  return (
    <div>
      <Navbar />
      <main>
        <Outlet /> {/* Child routes render here */}
      </main>
      <Footer />
    </div>
  );
}

// Dashboard Layout
function DashboardLayout() {
  return (
    <div className="dashboard">
      <aside>
        <nav>
          <Link to="/dashboard">Overview</Link>
          <Link to="/dashboard/profile">Profile</Link>
          <Link to="/dashboard/settings">Settings</Link>
        </nav>
      </aside>
      <div className="dashboard-content">
        <Outlet />
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        
        <Route path="dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
\\\`\\\`\\\`

### Index Routes

\\\`\\\`\\\`jsx
// Index route renders when parent path matches exactly
<Routes>
  <Route path="/dashboard" element={<DashboardLayout />}>
    <Route index element={<DashboardHome />} /> {/* /dashboard */}
    <Route path="stats" element={<Stats />} /> {/* /dashboard/stats */}
    <Route path="reports" element={<Reports />} /> {/* /dashboard/reports */}
  </Route>
</Routes>
\\\`\\\`\\\`

## Programmatic Navigation

### useNavigate Hook

\\\`\\\`\\\`jsx
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        
        // Navigate to dashboard after successful login
        navigate('/dashboard');
        
        // Navigate with replace (removes current page from history)
        // navigate('/dashboard', { replace: true });
        
        // Navigate with state
        // navigate('/dashboard', { state: { from: '/login' } });
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input 
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
      
      <button type="button" onClick={() => navigate(-1)}>
        Go Back
      </button>
      <button type="button" onClick={() => navigate('/')}>
        Go Home
      </button>
    </form>
  );
}
\\\`\\\`\\\`

### useLocation Hook

\\\`\\\`\\\`jsx
import { useLocation } from 'react-router-dom';

function CurrentPage() {
  const location = useLocation();

  // location.pathname - current path
  // location.search - query string
  // location.hash - URL hash
  // location.state - state passed via navigate

  return (
    <div>
      <p>Current path: {location.pathname}</p>
      <p>Query string: {location.search}</p>
      {location.state && <p>State: {JSON.stringify(location.state)}</p>}
    </div>
  );
}

// Accessing state from navigation
function SuccessPage() {
  const location = useLocation();
  const message = location.state?.message || 'Success!';

  return <div>{message}</div>;
}
\\\`\\\`\\\`

## Protected Routes

### Authentication Guard

\\\`\\\`\\\`jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';

// Simple auth check
function PrivateRoute() {
  const isAuthenticated = !!localStorage.getItem('token');
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login, save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

// Usage in routes
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected routes */}
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
\\\`\\\`\\\`

### Role-Based Access Control

\\\`\\\`\\\`jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

function PrivateRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

// Usage
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Admin only routes */}
      <Route element={<PrivateRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
      </Route>
      
      {/* Admin and moderator routes */}
      <Route element={<PrivateRoute allowedRoles={['admin', 'moderator']} />}>
        <Route path="/moderation" element={<Moderation />} />
      </Route>
      
      {/* Any authenticated user */}
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
\\\`\\\`\\\`

### Redirect After Login

\\\`\\\`\\\`jsx
import { useNavigate, useLocation } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the page they were trying to visit
  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (credentials) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        
        // Redirect to the page they were trying to visit
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return <LoginForm onSubmit={handleLogin} />;
}
\\\`\\\`\\\`

## Lazy Loading Routes

### Code Splitting with React.lazy

\\\`\\\`\\\`jsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load components
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserProfile = lazy(() => import('./pages/UserProfile'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users/:id" element={<UserProfile />} />
      </Routes>
    </Suspense>
  );
}

function LoadingSpinner() {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
}
\\\`\\\`\\\`

## Advanced Patterns

### Route Configuration

\\\`\\\`\\\`jsx
import { useRoutes } from 'react-router-dom';

function App() {
  const routes = useRoutes([
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'about', element: <About /> },
        {
          path: 'dashboard',
          element: <PrivateRoute />,
          children: [
            { index: true, element: <DashboardHome /> },
            { path: 'profile', element: <Profile /> },
            { path: 'settings', element: <Settings /> },
          ],
        },
      ],
    },
    { path: '/login', element: <Login /> },
    { path: '*', element: <NotFound /> },
  ]);

  return routes;
}
\\\`\\\`\\\`

### Custom Hook for Route Matching

\\\`\\\`\\\`jsx
import { useMatch } from 'react-router-dom';

function useActiveRoute(path) {
  const match = useMatch(path);
  return !!match;
}

// Usage
function NavItem({ to, children }) {
  const isActive = useActiveRoute(to);
  
  return (
    <Link 
      to={to}
      className={isActive ? 'active' : ''}
    >
      {children}
    </Link>
  );
}
\\\`\\\`\\\`

## Best Practices

### 1. Use Nested Routes for Layouts

\\\`\\\`\\\`jsx
// ✅ Good: Shared layout with nested routes
<Route path="/" element={<Layout />}>
  <Route index element={<Home />} />
  <Route path="about" element={<About />} />
</Route>

// ❌ Bad: Duplicate layout in each component
<Route path="/" element={<><Layout /><Home /></>} />
<Route path="/about" element={<><Layout /><About /></>} />
\\\`\\\`\\\`

### 2. Always Handle 404 Routes

\\\`\\\`\\\`jsx
<Routes>
  {/* Other routes */}
  <Route path="*" element={<NotFound />} />
</Routes>
\\\`\\\`\\\`

### 3. Use Index Routes for Default Content

\\\`\\\`\\\`jsx
<Route path="/dashboard" element={<DashboardLayout />}>
  <Route index element={<DashboardHome />} />
  <Route path="stats" element={<Stats />} />
</Route>
\\\`\\\`\\\`

### 4. Lazy Load Heavy Components

Only lazy load components that are large or infrequently accessed:

\\\`\\\`\\\`jsx
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Reports = lazy(() => import('./pages/Reports'));
\\\`\\\`\\\`

### 5. Use Relative Paths in Nested Routes

\\\`\\\`\\\`jsx
// In nested routes, paths are relative to parent
<Route path="dashboard">
  <Route path="profile" /> {/* Matches /dashboard/profile */}
  <Route path="settings" /> {/* Matches /dashboard/settings */}
</Route>
\\\`\\\`\\\`

## Summary

React Router v6 provides a powerful and intuitive API for building navigation in React applications:

- **Simple Setup**: BrowserRouter and Routes make setup easy
- **Dynamic Routing**: URL parameters and query strings
- **Nested Routes**: Build complex layouts with Outlet
- **Protected Routes**: Authentication and authorization guards
- **Programmatic Navigation**: useNavigate for redirects
- **Code Splitting**: Lazy load routes for better performance
- **Clean API**: Simplified from v5 with better TypeScript support`,
      [
        'React Router v6 uses Routes instead of Switch and element instead of component',
        'useParams extracts URL parameters, useSearchParams handles query strings',
        'Nested routes use Outlet to render child routes within parent layouts',
        'Protected routes use Navigate component to redirect unauthorized users',
        'useNavigate provides programmatic navigation with history management',
        'Lazy loading routes with React.lazy improves initial load performance'
      ]
    ]);

    const lessonId = lesson.rows[0].id;

    const codeExamples = [
      {
        title: 'Complete Router Setup with Nested Routes',
        code: `import { BrowserRouter, Routes, Route, Outlet, Link } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Lazy loaded pages
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));

// Layout component with navigation
function Layout() {
  return (
    <div className="app">
      <nav className="navbar">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>
      <main className="content">
        <Suspense fallback={<div>Loading...</div>}>
          <Outlet />
        </Suspense>
      </main>
      <footer>© 2026 My App</footer>
    </div>
  );
}

// Dashboard layout with sidebar
function DashboardLayout() {
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <Link to="/dashboard">Overview</Link>
        <Link to="/dashboard/profile">Profile</Link>
        <Link to="/dashboard/settings">Settings</Link>
      </aside>
      <div className="dashboard-content">
        <Outlet />
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          
          <Route path="dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;`,
        language: 'jsx',
        explanation: 'Complete router setup with nested layouts, lazy loading, and proper code organization using Outlet for child routes.'
      },
      {
        title: 'Dynamic Routes with URL Parameters',
        code: `import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const tab = searchParams.get('tab') || 'posts';

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(\\\`/api/users/\\\${userId}\\\`);
        if (!response.ok) {
          navigate('/404');
          return;
        }
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId, navigate]);

  if (loading) return <div>Loading user...</div>;
  if (!user) return null;

  return (
    <div className="user-profile">
      <div className="user-header">
        <img src={user.avatar} alt={user.name} />
        <h1>{user.name}</h1>
        <p>{user.bio}</p>
      </div>

      <div className="tabs">
        <Link to={\\\`/users/\\\${userId}?tab=posts\\\`}>Posts</Link>
        <Link to={\\\`/users/\\\${userId}?tab=followers\\\`}>Followers</Link>
        <Link to={\\\`/users/\\\${userId}?tab=following\\\`}>Following</Link>
      </div>

      <div className="tab-content">
        {tab === 'posts' && <UserPosts userId={userId} />}
        {tab === 'followers' && <UserFollowers userId={userId} />}
        {tab === 'following' && <UserFollowing userId={userId} />}
      </div>
    </div>
  );
}

// Product listing with filters
function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const category = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'name';
  const page = parseInt(searchParams.get('page') || '1');

  const updateFilters = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  return (
    <div>
      <select 
        value={category} 
        onChange={(e) => updateFilters({ category: e.target.value, page: '1' })}
      >
        <option value="all">All</option>
        <option value="electronics">Electronics</option>
        <option value="books">Books</option>
      </select>

      <select 
        value={sort}
        onChange={(e) => updateFilters({ sort: e.target.value })}
      >
        <option value="name">Name</option>
        <option value="price">Price</option>
      </select>

      {/* Product list */}
      
      <Pagination 
        page={page} 
        onPageChange={(p) => updateFilters({ page: p.toString() })}
      />
    </div>
  );
}`,
        language: 'jsx',
        explanation: 'Dynamic routing with useParams for URL parameters and useSearchParams for query strings, including error handling and filter management.'
      },
      {
        title: 'Protected Routes with Authentication',
        code: `import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { createContext, useContext, useState, useEffect } from 'react';

// Auth Context
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('/api/me', {
            headers: { Authorization: \\\`Bearer \\\${token}\\\` },
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
        }
      }
      setLoading(false);
    }

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Protected Route Component
function PrivateRoute({ allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

// App with protected routes
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected routes - any authenticated user */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Admin only routes */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
          </Route>

          {/* Admin and moderator routes */}
          <Route element={<PrivateRoute allowedRoles={['admin', 'moderator']} />}>
            <Route path="/moderate" element={<Moderation />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Login component
function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const success = await login(email, password);
    if (success) {
      navigate(from, { replace: true });
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Login</h1>
      {error && <div className="error">{error}</div>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}`,
        language: 'jsx',
        explanation: 'Complete authentication system with protected routes, role-based access control, and redirects to originally requested pages after login.'
      },
      {
        title: 'Advanced Navigation Patterns',
        code: `import { useNavigate, useLocation, useBlocker } from 'react-router-dom';
import { useState } from 'react';

// Form with unsaved changes warning
function EditProfile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', bio: '' });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Block navigation if there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setIsDirty(false);
      navigate('/profile', { 
        state: { message: 'Profile updated successfully!' } 
      });
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setIsDirty(false);
    navigate(-1);
  };

  return (
    <div className="edit-profile">
      <h1>Edit Profile</h1>
      
      <input
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="Name"
      />
      <input
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        placeholder="Email"
      />
      <textarea
        value={formData.bio}
        onChange={(e) => handleChange('bio', e.target.value)}
        placeholder="Bio"
      />

      <div className="actions">
        <button onClick={handleSave} disabled={isSaving || !isDirty}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        <button onClick={handleDiscard} disabled={isSaving}>
          Discard Changes
        </button>
      </div>

      {/* Unsaved changes warning */}
      {blocker.state === 'blocked' && (
        <div className="modal">
          <div className="modal-content">
            <h2>Unsaved Changes</h2>
            <p>You have unsaved changes. Are you sure you want to leave?</p>
            <button onClick={() => blocker.proceed()}>Leave</button>
            <button onClick={() => blocker.reset()}>Stay</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Breadcrumb navigation
function Breadcrumbs() {
  const location = useLocation();
  
  const pathSegments = location.pathname
    .split('/')
    .filter(Boolean)
    .map((segment, index, array) => ({
      label: segment.charAt(0).toUpperCase() + segment.slice(1),
      path: '/' + array.slice(0, index + 1).join('/'),
    }));

  return (
    <nav className="breadcrumbs">
      <Link to="/">Home</Link>
      {pathSegments.map((segment, index) => (
        <span key={segment.path}>
          <span className="separator">/</span>
          {index === pathSegments.length - 1 ? (
            <span className="current">{segment.label}</span>
          ) : (
            <Link to={segment.path}>{segment.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}

// Search with history
function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [searchHistory, setSearchHistory] = useState(() => {
    const stored = localStorage.getItem('searchHistory');
    return stored ? JSON.parse(stored) : [];
  });

  const handleSearch = (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    // Update URL
    setSearchParams({ q: searchQuery });
    
    // Add to history
    const newHistory = [searchQuery, ...searchHistory.filter(q => q !== searchQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const handleHistoryClick = (historyQuery) => {
    setQuery(historyQuery);
    handleSearch(historyQuery);
  };

  return (
    <div className="search-page">
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSearch(query);
      }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
        />
        <button type="submit">Search</button>
      </form>

      {searchHistory.length > 0 && !searchParams.get('q') && (
        <div className="search-history">
          <h3>Recent Searches</h3>
          {searchHistory.map((item, index) => (
            <button
              key={index}
              onClick={() => handleHistoryClick(item)}
              className="history-item"
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {searchParams.get('q') && <SearchResults query={searchParams.get('q')} />}
    </div>
  );
}

// Multi-step form with route state
function MultiStepCheckout() {
  const navigate = useNavigate();
  const location = useLocation();
  const step = location.state?.step || 1;
  const formData = location.state?.formData || {};

  const goToStep = (nextStep, data) => {
    navigate('/checkout', {
      state: {
        step: nextStep,
        formData: { ...formData, ...data },
      },
      replace: true,
    });
  };

  const handleStepOneComplete = (data) => {
    goToStep(2, { shipping: data });
  };

  const handleStepTwoComplete = (data) => {
    goToStep(3, { payment: data });
  };

  const handleFinalSubmit = async () => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const order = await response.json();
        navigate('/order-confirmation', {
          state: { orderId: order.id },
          replace: true,
        });
      }
    } catch (error) {
      console.error('Checkout failed:', error);
    }
  };

  return (
    <div className="checkout">
      <div className="progress">
        <span className={step >= 1 ? 'active' : ''}>Shipping</span>
        <span className={step >= 2 ? 'active' : ''}>Payment</span>
        <span className={step >= 3 ? 'active' : ''}>Review</span>
      </div>

      {step === 1 && <ShippingForm onComplete={handleStepOneComplete} data={formData.shipping} />}
      {step === 2 && <PaymentForm onComplete={handleStepTwoComplete} data={formData.payment} />}
      {step === 3 && <ReviewOrder data={formData} onSubmit={handleFinalSubmit} />}
    </div>
  );
}`,
        language: 'jsx',
        explanation: 'Advanced patterns including unsaved changes warnings, breadcrumb navigation, search with history, and multi-step forms using route state.'
      }
    ];

    for (const example of codeExamples) {
      await client.query(
        `INSERT INTO code_examples (lesson_id, title, code, language, explanation, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [lessonId, example.title, example.code, example.language, example.explanation, codeExamples.indexOf(example)]
      );
    }

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'What is the main difference between Link and useNavigate in React Router?', 'multiple_choice', $2, 'Link is for declarative navigation in JSX, useNavigate is for programmatic navigation', 'Link is a component used for declarative navigation in JSX, while useNavigate is a hook used for programmatic navigation in JavaScript functions.', 'easy', 10, 1),
      ($1, 'How do you extract URL parameters in React Router v6?', 'multiple_choice', $3, 'Using the useParams hook', 'The useParams hook extracts dynamic URL parameters defined in the route path (e.g., /users/:userId).', 'easy', 10, 2),
      ($1, 'What is the purpose of the Outlet component in nested routes?', 'multiple_choice', $4, 'It renders child routes within a parent route layout', 'Outlet acts as a placeholder where child routes will be rendered within parent route layouts, enabling nested routing patterns.', 'medium', 15, 3),
      ($1, 'Which approach is correct for protecting routes based on authentication?', 'multiple_choice', $5, 'Create a wrapper component that checks auth and uses Navigate to redirect', 'Protected routes use a wrapper component with Outlet that checks authentication and redirects to login using Navigate if the user is not authenticated.', 'medium', 15, 4),
      ($1, 'What is the advantage of lazy loading routes with React.lazy?', 'multiple_choice', $6, 'Reduces initial bundle size by loading components only when needed', 'Lazy loading routes with React.lazy splits code into smaller chunks that are loaded on-demand, reducing the initial bundle size and improving load times.', 'easy', 10, 5)
    `, [
      lessonId,
      JSON.stringify(['Link is for external navigation, useNavigate is for internal navigation', 'Link is for declarative navigation in JSX, useNavigate is for programmatic navigation', 'They are the same, just different names', 'useNavigate is deprecated, Link should always be used']),
      JSON.stringify(['Using the useSearchParams hook', 'Using the useParams hook', 'Using the useLocation hook', 'Accessing props.match.params']),
      JSON.stringify(['It provides routing context to child components', 'It renders child routes within a parent route layout', 'It prevents child routes from rendering', 'It is used for external links']),
      JSON.stringify(['Use a higher-order component with useAuth', 'Create a wrapper component that checks auth and uses Navigate to redirect', 'Add an auth prop to every Route component', 'Use the protected attribute on Route']),
      JSON.stringify(['Makes routes load faster', 'Reduces initial bundle size by loading components only when needed', 'Automatically caches route components', 'Prevents routes from being accessed directly'])
    ]);

    await client.query('COMMIT');
    console.log('✅ React Router lesson added successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error adding React Router lesson:', error);
    throw error;
  } finally {
    client.release();
  }
}

seedReactRouter()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
