import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/store';
import { BookOpen, User, LogOut, BarChart, Home, Plus } from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-slate-900/80 backdrop-blur-2xl border-b border-slate-700/50 sticky top-0 z-50">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-white font-bold text-xl group">
            <BookOpen className="w-8 h-8 text-cyan-500 group-hover:text-cyan-400 transition-colors" />
            <span>Interview<span className="text-cyan-500">Prep</span></span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link
              to="/"
              className="flex items-center space-x-1 text-gray-300 hover:text-white transition"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            
            <Link
              to="/categories"
              className="text-gray-300 hover:text-white transition"
            >
              Categories
            </Link>

            <Link
              to="/add-content"
              className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Content</span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-300 hover:text-white transition"
                >
                  Dashboard
                </Link>
                
                <Link
                  to="/progress"
                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition"
                >
                  <BarChart className="w-4 h-4" />
                  <span>Progress</span>
                </Link>

                <div className="flex items-center space-x-3 pl-4 border-l border-slate-700">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-blue-500" />
                    <span className="text-white text-sm">{user?.username}</span>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-300 hover:text-red-400 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-cyan-500/20"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
