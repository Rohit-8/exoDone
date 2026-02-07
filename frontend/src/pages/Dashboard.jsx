import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { progressAPI } from '../services/api';
import { useAuthStore } from '../store/store';
import { BookOpen, Trophy, Clock, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await progressAPI.getOverview();
      setOverview(response.data);
    } catch (error) {
      console.error('Failed to fetch overview:', error);
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-gray-400">Track your learning progress and continue where you left off</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-gray-400 text-sm mb-1">Total Lessons</p>
          <p className="text-3xl font-bold text-white">
            {overview?.categoryProgress?.reduce((sum, cat) => sum + parseInt(cat.total_lessons), 0) || 0}
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <Trophy className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-gray-400 text-sm mb-1">Completed</p>
          <p className="text-3xl font-bold text-white">
            {overview?.categoryProgress?.reduce((sum, cat) => sum + parseInt(cat.completed_lessons), 0) || 0}
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-gray-400 text-sm mb-1">In Progress</p>
          <p className="text-3xl font-bold text-white">
            {overview?.recentActivity?.filter(a => a.status === 'in_progress').length || 0}
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-gray-400 text-sm mb-1">Overall Progress</p>
          <p className="text-3xl font-bold text-white">
            {Math.round(overview?.categoryProgress?.reduce((sum, cat) => sum + parseFloat(cat.progress_percentage), 0) / (overview?.categoryProgress?.length || 1))}%
          </p>
        </div>
      </div>

      {/* Category Progress */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Category Progress</h2>
        <div className="space-y-6">
          {overview?.categoryProgress?.map((category) => (
            <div key={category.category_slug}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-white">{category.category_name}</h3>
                <span className="text-sm text-gray-400">
                  {category.completed_lessons} / {category.total_lessons} lessons
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${category.progress_percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
        {overview?.recentActivity && overview.recentActivity.length > 0 ? (
          <div className="space-y-4">
            {overview.recentActivity.map((activity) => (
              <Link
                key={activity.id}
                to={`/lesson/${activity.lesson_slug}`}
                className="block p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-semibold mb-1">{activity.lesson_title}</h3>
                    <p className="text-sm text-gray-400">
                      {activity.category_name} • {activity.topic_name}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    activity.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                    activity.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-gray-500/20 text-gray-500'
                  }`}>
                    {activity.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-3 w-full bg-slate-600 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${activity.progress_percentage}%` }}
                  ></div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No recent activity. Start learning to see your progress here!</p>
        )}
      </div>
    </div>
  );
}
