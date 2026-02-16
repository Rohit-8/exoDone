import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryAPI, topicAPI, lessonAPI } from '../services/api';
import {
  Plus, BookOpen, ArrowLeft, CheckCircle, AlertCircle,
  Layers, FileText, Sparkles, X, ChevronDown
} from 'lucide-react';

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  { value: 'intermediate', label: 'Intermediate', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
  { value: 'advanced', label: 'Advanced', color: 'text-orange-400 bg-orange-500/15 border-orange-500/30' },
  { value: 'expert', label: 'Expert', color: 'text-red-400 bg-red-500/15 border-red-500/30' },
];

export default function AddTopic() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('topic'); // 'topic' or 'lesson'

  // Topic form state
  const [topicForm, setTopicForm] = useState({
    category_id: '',
    name: '',
    description: '',
    difficulty_level: 'beginner',
    estimated_time: '',
  });

  // Lesson form state
  const [lessonForm, setLessonForm] = useState({
    topic_id: '',
    title: '',
    content: '',
    summary: '',
    difficulty_level: 'beginner',
    estimated_time: '',
    key_points: '',
  });

  // Topics for lesson form dropdown
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data.categories);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicsForCategory = async (categorySlug) => {
    if (!categorySlug) {
      setTopics([]);
      return;
    }
    setTopicsLoading(true);
    try {
      const response = await topicAPI.getAll({ category: categorySlug });
      setTopics(response.data.topics || []);
    } catch (err) {
      console.error('Failed to fetch topics:', err);
    } finally {
      setTopicsLoading(false);
    }
  };

  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        ...topicForm,
        category_id: parseInt(topicForm.category_id),
        estimated_time: topicForm.estimated_time ? parseInt(topicForm.estimated_time) : null,
      };

      const response = await topicAPI.create(payload);
      setSuccess(`Topic "${response.data.topic.name}" created successfully!`);
      setTopicForm({
        category_id: topicForm.category_id,
        name: '',
        description: '',
        difficulty_level: 'beginner',
        estimated_time: '',
      });

      // Refresh topics list if on lesson tab
      if (topicForm.category_id) {
        const cat = categories.find(c => c.id === parseInt(topicForm.category_id));
        if (cat) fetchTopicsForCategory(cat.slug);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create topic');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const keyPointsArray = lessonForm.key_points
        ? lessonForm.key_points.split('\n').map(p => p.trim()).filter(Boolean)
        : null;

      const payload = {
        ...lessonForm,
        topic_id: parseInt(lessonForm.topic_id),
        estimated_time: lessonForm.estimated_time ? parseInt(lessonForm.estimated_time) : null,
        key_points: keyPointsArray,
      };

      const response = await lessonAPI.create(payload);
      setSuccess(`Lesson "${response.data.lesson.title}" created successfully!`);
      setLessonForm({
        topic_id: lessonForm.topic_id,
        title: '',
        content: '',
        summary: '',
        difficulty_level: 'beginner',
        estimated_time: '',
        key_points: '',
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create lesson');
    } finally {
      setSubmitting(false);
    }
  };

  // When category changes for lesson form, load topics
  const handleLessonCategoryChange = (categoryId) => {
    const cat = categories.find(c => c.id === parseInt(categoryId));
    if (cat) {
      fetchTopicsForCategory(cat.slug);
    } else {
      setTopics([]);
    }
    setLessonForm(prev => ({ ...prev, topic_id: '' }));
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
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 mb-4 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Go Back
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 flex items-center justify-center">
            <Plus className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Add New Content
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Contribute a new topic or lesson to the platform
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => { setActiveTab('topic'); setError(null); setSuccess(null); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeTab === 'topic'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/5'
              : 'bg-slate-800/40 text-slate-400 border border-slate-700/40 hover:border-slate-600/60 hover:text-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          Add Topic
        </button>
        <button
          onClick={() => { setActiveTab('lesson'); setError(null); setSuccess(null); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeTab === 'lesson'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/5'
              : 'bg-slate-800/40 text-slate-400 border border-slate-700/40 hover:border-slate-600/60 hover:text-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          Add Lesson
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 animate-fade-in-up">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-emerald-300 text-sm font-medium">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-400/60 hover:text-emerald-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 animate-fade-in-up">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-300 text-sm font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Topic Form */}
      {activeTab === 'topic' && (
        <form onSubmit={handleTopicSubmit} className="space-y-6 animate-fade-in">
          <div className="bg-slate-800/40 rounded-2xl border border-slate-700/40 p-6 lg:p-8 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-cyan-500/60" />
              <h2 className="text-lg font-semibold text-white">Topic Details</h2>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={topicForm.category_id}
                  onChange={(e) => setTopicForm(prev => ({ ...prev, category_id: e.target.value }))}
                  required
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 appearance-none cursor-pointer transition-colors"
                >
                  <option value="">Select a category...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Topic Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={topicForm.name}
                onChange={(e) => setTopicForm(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="e.g., React Performance Optimization"
                className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <textarea
                value={topicForm.description}
                onChange={(e) => setTopicForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Brief description of what this topic covers..."
                className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors resize-none"
              />
            </div>

            {/* Difficulty & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty Level</label>
                <div className="flex flex-wrap gap-2">
                  {difficultyOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTopicForm(prev => ({ ...prev, difficulty_level: opt.value }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        topicForm.difficulty_level === opt.value
                          ? opt.color + ' ring-1 ring-current/30'
                          : 'bg-slate-800/60 text-slate-500 border-slate-700/50 hover:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Estimated Time (minutes)
                </label>
                <input
                  type="number"
                  value={topicForm.estimated_time}
                  onChange={(e) => setTopicForm(prev => ({ ...prev, estimated_time: e.target.value }))}
                  placeholder="e.g., 60"
                  min="1"
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 disabled:shadow-none"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Topic
              </>
            )}
          </button>
        </form>
      )}

      {/* Lesson Form */}
      {activeTab === 'lesson' && (
        <form onSubmit={handleLessonSubmit} className="space-y-6 animate-fade-in">
          <div className="bg-slate-800/40 rounded-2xl border border-slate-700/40 p-6 lg:p-8 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-cyan-500/60" />
              <h2 className="text-lg font-semibold text-white">Lesson Details</h2>
            </div>

            {/* Category (for filtering topics) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  onChange={(e) => handleLessonCategoryChange(e.target.value)}
                  required
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 appearance-none cursor-pointer transition-colors"
                >
                  <option value="">Select a category first...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Topic <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={lessonForm.topic_id}
                  onChange={(e) => setLessonForm(prev => ({ ...prev, topic_id: e.target.value }))}
                  required
                  disabled={topicsLoading || topics.length === 0}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 appearance-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {topicsLoading ? 'Loading topics...' : topics.length === 0 ? 'Select a category first' : 'Select a topic...'}
                  </option>
                  {topics.map(topic => (
                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Lesson Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={lessonForm.title}
                onChange={(e) => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
                required
                placeholder="e.g., Understanding React.memo and useMemo"
                className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
              />
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Summary</label>
              <input
                type="text"
                value={lessonForm.summary}
                onChange={(e) => setLessonForm(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="One-line summary of this lesson"
                className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Content <span className="text-red-400">*</span>
                <span className="text-slate-500 font-normal ml-2">(Markdown supported)</span>
              </label>
              <textarea
                value={lessonForm.content}
                onChange={(e) => setLessonForm(prev => ({ ...prev, content: e.target.value }))}
                required
                rows={10}
                placeholder="Write the lesson content here. Markdown is supported..."
                className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors resize-y font-mono"
              />
            </div>

            {/* Key Points */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Key Points
                <span className="text-slate-500 font-normal ml-2">(one per line)</span>
              </label>
              <textarea
                value={lessonForm.key_points}
                onChange={(e) => setLessonForm(prev => ({ ...prev, key_points: e.target.value }))}
                rows={4}
                placeholder={"Key takeaway point 1\nKey takeaway point 2\nKey takeaway point 3"}
                className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors resize-none"
              />
            </div>

            {/* Difficulty & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty Level</label>
                <div className="flex flex-wrap gap-2">
                  {difficultyOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLessonForm(prev => ({ ...prev, difficulty_level: opt.value }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        lessonForm.difficulty_level === opt.value
                          ? opt.color + ' ring-1 ring-current/30'
                          : 'bg-slate-800/60 text-slate-500 border-slate-700/50 hover:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Estimated Time (minutes)
                </label>
                <input
                  type="number"
                  value={lessonForm.estimated_time}
                  onChange={(e) => setLessonForm(prev => ({ ...prev, estimated_time: e.target.value }))}
                  placeholder="e.g., 15"
                  min="1"
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 disabled:shadow-none"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Lesson
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
