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
        <div className="spinner"></div>
      </div>
    );
  }

  const totalLessons = overview?.categoryProgress?.reduce((sum, cat) => sum + parseInt(cat.total_lessons), 0) || 0;
  const completedLessons = overview?.categoryProgress?.reduce((sum, cat) => sum + parseInt(cat.completed_lessons), 0) || 0;
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-8">Your Learning Progress</h1>

      {/* Overall Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl text-white">
          <TrendingUp className="w-8 h-8 mb-3" />
          <p className="text-sm opacity-90 mb-1">Overall Progress</p>
          <p className="text-4xl font-bold">{overallProgress}%</p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-xl text-white">
          <Award className="w-8 h-8 mb-3" />
          <p className="text-sm opacity-90 mb-1">Completed Lessons</p>
          <p className="text-4xl font-bold">{completedLessons}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-xl text-white">
          <BookOpen className="w-8 h-8 mb-3" />
          <p className="text-sm opacity-90 mb-1">Total Lessons</p>
          <p className="text-4xl font-bold">{totalLessons}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-700 p-6 rounded-xl text-white">
          <Clock className="w-8 h-8 mb-3" />
          <p className="text-sm opacity-90 mb-1">In Progress</p>
          <p className="text-4xl font-bold">
            {overview?.recentActivity?.filter(a => a.status === 'in_progress').length || 0}
          </p>
        </div>
      </div>

      {/* Category Progress */}
      <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 mb-12">
        <h2 className="text-2xl font-bold text-white mb-8">Progress by Category</h2>
        <div className="space-y-8">
          {overview?.categoryProgress?.map((category) => {
            const progressPercentage = parseFloat(category.progress_percentage) || 0;
            const completed = parseInt(category.completed_lessons) || 0;
            const total = parseInt(category.total_lessons) || 0;

            return (
              <div key={category.category_slug}>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{category.category_name}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {completed} of {total} lessons completed
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-blue-500">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
        
        {overview?.recentActivity && overview.recentActivity.length > 0 ? (
          <div className="space-y-4">
            {overview.recentActivity.map((activity) => (
              <Link
                key={activity.id}
                to={`/lesson/${activity.lesson_slug}`}
                className="block p-6 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{activity.lesson_title}</h3>
                    <p className="text-sm text-gray-400">
                      {activity.category_name} • {activity.topic_name}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      activity.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                      activity.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-gray-500/20 text-gray-500'
                    }`}>
                      {activity.status.replace('_', ' ')}
                    </span>
                    {activity.time_spent > 0 && (
                      <span className="text-xs text-gray-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {activity.time_spent} min
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${activity.progress_percentage}%` }}
                  ></div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No activity yet. Start learning to track your progress!</p>
            <Link
              to="/categories"
              className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              Browse Categories
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
