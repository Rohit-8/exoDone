import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/store';

// Layout
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import TopicView from './pages/TopicView';
import LessonView from './pages/LessonView';
import Progress from './pages/Progress';
import AddTopic from './pages/AddTopic';

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="categories" element={<Categories />} />
        <Route path="topic/:slug" element={<TopicView />} />
        <Route path="lesson/:slug" element={<LessonView />} />
        <Route path="add-content" element={<AddTopic />} />
        
        <Route
          path="dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="progress"
          element={
            <PrivateRoute>
              <Progress />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
