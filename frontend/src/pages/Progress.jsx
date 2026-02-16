import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { progressAPI } from '../services/api';
import { TrendingUp, Award, Clock, BookOpen } from 'lucide-react';

export default function Progress() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await progressAPI.getOverview();
      setOverview(response.data);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner" />
      </div>
    );
  }

  const totalLessons = overview?.categoryProgress?.reduce((sum, cat) => sum + parseInt(cat.total_lessons), 0) || 0;
  const completedLessons = overview?.categoryProgress?.reduce((sum, cat) => sum + parseInt(cat.completed_lessons), 0) || 0;
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const stats = [
    { icon: TrendingUp, label: 'Overall Progress', value: `${overallProgress}%`, iconBg: 'bg-accent-500/10', iconColor: 'text-accent-400' },
    { icon: Award, label: 'Completed', value: completedLessons, iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-400' },
    { icon: BookOpen, label: 'Total Lessons', value: totalLessons, iconBg: 'bg-blue-500/10', iconColor: 'text-blue-400' },
    { icon: Clock, label: 'In Progress', value: overview?.recentActivity?.filter(a => a.status === 'in_progress').length || 0, iconBg: 'bg-amber-500/10', iconColor: 'text-amber-400' },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-semibold text-white mb-6">Your Learning Progress</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {stats.map(({ icon: Icon, label, value, iconBg, iconColor }) => (
          <div key={label} className="bg-surface-900 border border-surface-700/50 rounded-xl p-4">
            <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <p className="text-xs text-surface-400 mb-0.5">{label}</p>
            <p className="text-2xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Category Progress */}
      <div className="bg-surface-900 rounded-xl p-6 border border-surface-700/50 mb-6">
        <h2 className="text-base font-semibold text-white mb-5">Progress by Category</h2>
        <div className="space-y-5">
          {overview?.categoryProgress?.map((category) => {
            const progressPercentage = parseFloat(category.progress_percentage) || 0;
            const completed = parseInt(category.completed_lessons) || 0;
            const total = parseInt(category.total_lessons) || 0;

            return (
              <div key={category.category_slug}>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="text-sm font-medium text-white">{category.category_name}</h3>
                    <p className="text-xs text-surface-500 mt-0.5">
                      {completed} of {total} lessons completed
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-accent-400">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <div className="w-full bg-surface-800 rounded-full h-2">
                  <div
                    className="bg-accent-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-surface-900 rounded-xl p-6 border border-surface-700/50">
        <h2 className="text-base font-semibold text-white mb-4">Recent Activity</h2>

        {overview?.recentActivity && overview.recentActivity.length > 0 ? (
          <div className="space-y-2">
            {overview.recentActivity.map((activity) => (
              <Link
                key={activity.id}
                to={`/lesson/${activity.lesson_slug}`}
                className="block p-4 bg-surface-800 rounded-lg hover:bg-surface-800/80 transition-colors border border-surface-700/30 hover:border-surface-600/50"
              >
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white mb-0.5 truncate">{activity.lesson_title}</h3>
                    <p className="text-xs text-surface-500">
                      {activity.category_name} · {activity.topic_name}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-3 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      activity.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      activity.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-surface-700 text-surface-400'
                    }`}>
                      {activity.status.replace('_', ' ')}
                    </span>
                    {activity.time_spent > 0 && (
                      <span className="text-[11px] text-surface-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {activity.time_spent} min
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-surface-700 rounded-full h-1.5">
                  <div
                    className="bg-accent-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${activity.progress_percentage}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-surface-800 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-surface-600" />
            </div>
            <p className="text-surface-400 text-sm mb-3">No activity yet. Start learning!</p>
            <Link
              to="/categories"
              className="inline-block bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Browse Categories
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
