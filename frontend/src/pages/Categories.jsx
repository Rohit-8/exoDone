import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoryAPI } from '../services/api';
import {
  Layers, Code, BookOpen, ArrowRight,
  Sparkles, Cpu
} from 'lucide-react';

const categoryConfig = {
  architecture: {
    icon: Layers,
    gradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
    border: 'hover:border-blue-500/40',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    accentColor: 'text-blue-400',
    glowColor: 'hover:shadow-blue-500/5',
    barColor: 'bg-blue-500',
  },
  backend: {
    icon: Code,
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    border: 'hover:border-emerald-500/40',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    accentColor: 'text-emerald-400',
    glowColor: 'hover:shadow-emerald-500/5',
    barColor: 'bg-emerald-500',
  },
  frontend: {
    icon: BookOpen,
    gradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
    border: 'hover:border-purple-500/40',
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
    accentColor: 'text-purple-400',
    glowColor: 'hover:shadow-purple-500/5',
    barColor: 'bg-purple-500',
  },
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-cyan-500/20 rounded-full" />
          <div className="w-16 h-16 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin absolute inset-0" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-6 animate-fade-in-up">
          <Sparkles className="w-4 h-4" />
          Learning Paths
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          Choose Your <span className="gradient-text">Path</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '160ms' }}>
          Master the skills you need to ace your next interview. Each path is carefully
          crafted with progressive lessons, code examples, and quizzes.
        </p>
      </div>

      {/* Category Cards */}
      <div className="grid lg:grid-cols-3 gap-6">
        {categories.map((category, index) => {
          const config = categoryConfig[category.slug] || categoryConfig.architecture;
          const Icon = config.icon;

          return (
            <Link
              key={category.id}
              to={`/topic/${category.slug}`}
              className={`
                group relative bg-slate-800/50 rounded-2xl border border-slate-700/50
                ${config.border} ${config.glowColor}
                hover:shadow-2xl transition-all duration-500
                hover:-translate-y-1 overflow-hidden
                animate-fade-in-up
              `}
              style={{ animationDelay: `${index * 120}ms` }}
            >
              {/* Top accent line */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] ${config.barColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              {/* Corner glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="relative p-8">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl ${config.iconBg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-7 h-7 ${config.iconColor}`} />
                </div>

                {/* Content */}
                <h2 className="text-xl font-bold text-white mb-2 group-hover:text-white transition-colors">
                  {category.name}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  {category.description}
                </p>

                {/* Footer */}
                <div className={`flex items-center ${config.accentColor} font-medium text-sm group-hover:gap-3 gap-2 transition-all`}>
                  <span>Explore Topics</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Stats Section */}
      <div className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
        {[
          { value: '50+', label: 'Lessons', icon: BookOpen },
          { value: '150+', label: 'Code Examples', icon: Code },
          { value: '4', label: 'Difficulty Levels', icon: Cpu },
        ].map((stat, i) => (
          <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${400 + i * 100}ms` }}>
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mx-auto mb-3">
              <stat.icon className="w-5 h-5 text-cyan-500/60" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
