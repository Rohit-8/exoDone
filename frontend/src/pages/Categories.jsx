import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoryAPI } from '../services/api';
import { Layers, Code, BookOpen, ArrowRight, Cpu } from 'lucide-react';

const categoryConfig = {
  architecture: {
    icon: Layers,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    accentColor: 'text-blue-400',
    hoverBorder: 'hover:border-blue-500/30',
    barColor: 'bg-blue-500',
  },
  backend: {
    icon: Code,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    accentColor: 'text-emerald-400',
    hoverBorder: 'hover:border-emerald-500/30',
    barColor: 'bg-emerald-500',
  },
  frontend: {
    icon: BookOpen,
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-400',
    accentColor: 'text-violet-400',
    hoverBorder: 'hover:border-violet-500/30',
    barColor: 'bg-violet-500',
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
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-semibold text-white mb-3 tracking-tight animate-fade-in-up">
          Choose Your Path
        </h1>
        <p className="text-surface-400 max-w-xl mx-auto text-sm leading-relaxed animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          Master the skills you need to ace your next interview. Each path includes progressive lessons, code examples, and quizzes.
        </p>
      </div>

      {/* Category Cards */}
      <div className="grid lg:grid-cols-3 gap-4">
        {categories.map((category, index) => {
          const config = categoryConfig[category.slug] || categoryConfig.architecture;
          const Icon = config.icon;

          return (
            <Link
              key={category.id}
              to={`/topic/${category.slug}`}
              className={`group bg-surface-900 rounded-xl border border-surface-700/50 ${config.hoverBorder} transition-all duration-200 hover:bg-surface-800/80 animate-fade-in-up`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="p-6">
                <div className={`w-10 h-10 rounded-lg ${config.iconBg} flex items-center justify-center mb-5`}>
                  <Icon className={`w-5 h-5 ${config.iconColor}`} />
                </div>

                <h2 className="text-lg font-semibold text-white mb-2">
                  {category.name}
                </h2>
                <p className="text-surface-400 text-sm leading-relaxed mb-6">
                  {category.description}
                </p>

                <div className={`flex items-center gap-2 ${config.accentColor} font-medium text-sm`}>
                  <span>Explore Topics</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Stats */}
      <div className="mt-16 grid grid-cols-3 gap-6 max-w-2xl mx-auto text-center">
        {[
          { value: '50+', label: 'Lessons', icon: BookOpen },
          { value: '150+', label: 'Code Examples', icon: Code },
          { value: '4', label: 'Difficulty Levels', icon: Cpu },
        ].map((stat, i) => (
          <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${300 + i * 80}ms` }}>
            <div className="w-9 h-9 rounded-lg bg-surface-800 border border-surface-700/50 flex items-center justify-center mx-auto mb-2">
              <stat.icon className="w-4 h-4 text-surface-400" />
            </div>
            <p className="text-xl font-semibold text-white mb-0.5">{stat.value}</p>
            <p className="text-xs text-surface-500 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
