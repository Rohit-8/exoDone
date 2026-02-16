import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/store';
import { BookOpen, User, LogOut, BarChart, Home, Plus, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navLink = (to, label, icon) => {
    const Icon = icon;
    const active = isActive(to);
    return (
      <Link
        to={to}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
          active
            ? 'text-white bg-surface-800'
            : 'text-surface-400 hover:text-surface-100 hover:bg-surface-800/50'
        }`}
      >
        {Icon && <Icon className="w-4 h-4" />}
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <nav className="bg-surface-950/90 backdrop-blur-md border-b border-surface-700/50 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-white font-semibold text-lg">
            <div className="w-7 h-7 rounded-lg bg-accent-500 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span>ExoDone</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLink('/', 'Home', Home)}
            {navLink('/categories', 'Categories', null)}
            {navLink('/add-content', 'Add Content', Plus)}

            {isAuthenticated ? (
              <>
                {navLink('/dashboard', 'Dashboard', null)}
                {navLink('/progress', 'Progress', BarChart)}

                <div className="flex items-center gap-2 ml-3 pl-3 border-l border-surface-700/50">
                  <div className="flex items-center gap-2 px-2 py-1">
                    <div className="w-6 h-6 rounded-full bg-accent-500/20 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-accent-400" />
                    </div>
                    <span className="text-surface-200 text-sm">{user?.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-surface-500 hover:text-red-400 transition-colors text-sm px-2 py-1 rounded-lg hover:bg-surface-800/50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-3 pl-3 border-l border-surface-700/50">
                <Link
                  to="/login"
                  className="text-surface-400 hover:text-white transition-colors text-sm px-3 py-1.5"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-surface-400 hover:text-white p-1.5 rounded-lg hover:bg-surface-800"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-surface-700/50 space-y-1 animate-fade-in">
            {navLink('/', 'Home', Home)}
            {navLink('/categories', 'Categories', null)}
            {navLink('/add-content', 'Add Content', Plus)}
            {isAuthenticated && (
              <>
                {navLink('/dashboard', 'Dashboard', null)}
                {navLink('/progress', 'Progress', BarChart)}
                <div className="pt-2 mt-2 border-t border-surface-700/50 flex items-center justify-between px-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-accent-400" />
                    <span className="text-surface-200 text-sm">{user?.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-surface-500 hover:text-red-400 transition-colors text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
            {!isAuthenticated && (
              <div className="pt-2 mt-2 border-t border-surface-700/50 flex gap-2 px-3">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-surface-400 hover:text-white text-sm py-1.5">
                  Log in
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="bg-accent-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
