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

  const stats = [
    {
      icon: BookOpen,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
      label: 'Total Lessons',
      value: overview?.categoryProgress?.reduce((sum, cat) => sum + parseInt(cat.total_lessons), 0) || 0,
    },
    {
      icon: Trophy,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      label: 'Completed',
      value: overview?.categoryProgress?.reduce((sum, cat) => sum + parseInt(cat.completed_lessons), 0) || 0,
    },
    {
      icon: Clock,
      iconColor: 'text-sky-400',
      iconBg: 'bg-sky-500/10',
      label: 'In Progress',
      value: overview?.recentActivity?.filter(a => a.status === 'in_progress').length || 0,
    },
    {
      icon: TrendingUp,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
      label: 'Overall Progress',
      value: `${Math.round(overview?.categoryProgress?.reduce((sum, cat) => sum + parseFloat(cat.progress_percentage), 0) / (overview?.categoryProgress?.length || 1))}%`,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white mb-1">
          Welcome back, {user?.username}
        </h1>
        <p className="text-surface-400 text-sm">Track your learning progress and continue where you left off</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {stats.map((stat, i) => (
          <div key={i} className="bg-surface-900 p-5 rounded-xl border border-surface-700/50">
            <div className={`w-9 h-9 rounded-lg ${stat.iconBg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
            </div>
            <p className="text-surface-400 text-xs mb-1">{stat.label}</p>
            <p className="text-2xl font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Category Progress */}
      <div className="bg-surface-900 rounded-xl p-6 border border-surface-700/50 mb-8">
        <h2 className="text-lg font-semibold text-white mb-5">Category Progress</h2>
        <div className="space-y-5">
          {overview?.categoryProgress?.map((category) => (
            <div key={category.category_slug}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-surface-200">{category.category_name}</h3>
                <span className="text-xs text-surface-400">
                  {category.completed_lessons}/{category.total_lessons} lessons
                </span>
              </div>
              <div className="w-full bg-surface-800 rounded-full h-2">
                <div
                  className="bg-accent-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${category.progress_percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-surface-900 rounded-xl p-6 border border-surface-700/50">
        <h2 className="text-lg font-semibold text-white mb-5">Recent Activity</h2>
        {overview?.recentActivity && overview.recentActivity.length > 0 ? (
          <div className="space-y-2">
            {overview.recentActivity.map((activity) => (
              <Link
                key={activity.id}
                to={`/lesson/${activity.lesson_slug}`}
                className="block p-4 rounded-lg bg-surface-800/50 hover:bg-surface-800 border border-surface-700/30 hover:border-surface-700/60 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-white mb-1">{activity.lesson_title}</h3>
                    <p className="text-xs text-surface-400">
                      {activity.category_name} &middot; {activity.topic_name}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    activity.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                    activity.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-surface-700 text-surface-400'
                  }`}>
                    {activity.status.replace('_', ' ')}
                  </span>
                </div>
                {activity.progress_percentage > 0 && (
                  <div className="mt-3 w-full bg-surface-700 rounded-full h-1">
                    <div
                      className="bg-accent-500 h-1 rounded-full"
                      style={{ width: `${activity.progress_percentage}%` }}
                    />
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-surface-400 text-sm">No recent activity. Start learning to see your progress here!</p>
        )}
      </div>
    </div>
  );
}
