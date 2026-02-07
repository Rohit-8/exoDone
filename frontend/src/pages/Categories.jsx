import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoryAPI } from '../services/api';
import { Layers, Code, BookOpen, ArrowRight } from 'lucide-react';

const icons = {
  architecture: Layers,
  backend: Code,
  frontend: BookOpen
};

const colors = {
  architecture: 'blue',
  backend: 'green',
  frontend: 'purple'
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
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Learning Categories</h1>
        <p className="text-xl text-gray-400">
          Choose a category to start your interview preparation journey
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {categories.map((category) => {
          const Icon = icons[category.slug] || BookOpen;
          const color = colors[category.slug] || 'blue';

          return (
            <Link
              key={category.id}
              to={`/topic/${category.slug}`}
              className="group bg-slate-800 rounded-xl p-8 border border-slate-700 hover:border-blue-500 transition-all hover:transform hover:scale-105"
            >
              <div className={`w-16 h-16 rounded-full bg-${color}-500/20 flex items-center justify-center mb-6 group-hover:bg-${color}-500/30 transition`}>
                <Icon className={`w-8 h-8 text-${color}-500`} />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3">{category.name}</h2>
              <p className="text-gray-400 mb-6">{category.description}</p>
              
              <div className="flex items-center text-blue-500 font-semibold group-hover:text-blue-400">
                <span>Explore Topics</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
