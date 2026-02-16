import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryAPI, topicAPI, lessonAPI } from '../services/api';
import {
  Plus, ArrowLeft, CheckCircle, AlertCircle,
  Layers, FileText, X, ChevronDown
} from 'lucide-react';

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { value: 'intermediate', label: 'Intermediate', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { value: 'advanced', label: 'Advanced', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { value: 'expert', label: 'Expert', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
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
        <div className="spinner" />
      </div>
    );
  }

  const inputClass = 'w-full bg-surface-900 border border-surface-700/50 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder:text-surface-600 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-colors';
  const selectClass = inputClass + ' appearance-none cursor-pointer';
  const labelClass = 'block text-sm font-medium text-surface-300 mb-1.5';

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300 mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Go Back
        </button>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-500/10 flex items-center justify-center">
            <Plus className="w-4.5 h-4.5 text-accent-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Add New Content</h1>
            <p className="text-surface-400 text-xs mt-0.5">Contribute a new topic or lesson</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setActiveTab('topic'); setError(null); setSuccess(null); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'topic'
              ? 'bg-accent-500/10 text-accent-400 border border-accent-500/20'
              : 'bg-surface-900 text-surface-400 border border-surface-700/50 hover:text-surface-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Add Topic
        </button>
        <button
          onClick={() => { setActiveTab('lesson'); setError(null); setSuccess(null); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'lesson'
              ? 'bg-accent-500/10 text-accent-400 border border-accent-500/20'
              : 'bg-surface-900 text-surface-400 border border-surface-700/50 hover:text-surface-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Add Lesson
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="mb-5 p-3.5 rounded-lg bg-emerald-500/8 border border-emerald-500/20 flex items-start gap-2.5 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-emerald-300 text-sm flex-1">{success}</p>
          <button onClick={() => setSuccess(null)} className="text-emerald-400/50 hover:text-emerald-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3.5 rounded-lg bg-red-500/8 border border-red-500/20 flex items-start gap-2.5 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Topic Form */}
      {activeTab === 'topic' && (
        <form onSubmit={handleTopicSubmit} className="space-y-5 animate-fade-in">
          <div className="bg-surface-900 rounded-xl border border-surface-700/50 p-5 lg:p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white mb-1">Topic Details</h2>

            <div>
              <label className={labelClass}>Category <span className="text-red-400">*</span></label>
              <div className="relative">
                <select
                  value={topicForm.category_id}
                  onChange={(e) => setTopicForm(prev => ({ ...prev, category_id: e.target.value }))}
                  required
                  className={selectClass}
                >
                  <option value="">Select a category...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Topic Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={topicForm.name}
                onChange={(e) => setTopicForm(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="e.g., React Performance Optimization"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={topicForm.description}
                onChange={(e) => setTopicForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Brief description of what this topic covers..."
                className={inputClass + ' resize-none'}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Difficulty Level</label>
                <div className="flex flex-wrap gap-1.5">
                  {difficultyOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTopicForm(prev => ({ ...prev, difficulty_level: opt.value }))}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                        topicForm.difficulty_level === opt.value
                          ? opt.color
                          : 'bg-surface-800 text-surface-500 border-surface-700/50 hover:text-surface-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Estimated Time (min)</label>
                <input
                  type="number"
                  value={topicForm.estimated_time}
                  onChange={(e) => setTopicForm(prev => ({ ...prev, estimated_time: e.target.value }))}
                  placeholder="e.g., 60"
                  min="1"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
        <form onSubmit={handleLessonSubmit} className="space-y-5 animate-fade-in">
          <div className="bg-surface-900 rounded-xl border border-surface-700/50 p-5 lg:p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white mb-1">Lesson Details</h2>

            <div>
              <label className={labelClass}>Category <span className="text-red-400">*</span></label>
              <div className="relative">
                <select
                  onChange={(e) => handleLessonCategoryChange(e.target.value)}
                  required
                  className={selectClass}
                >
                  <option value="">Select a category first...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Topic <span className="text-red-400">*</span></label>
              <div className="relative">
                <select
                  value={lessonForm.topic_id}
                  onChange={(e) => setLessonForm(prev => ({ ...prev, topic_id: e.target.value }))}
                  required
                  disabled={topicsLoading || topics.length === 0}
                  className={selectClass + ' disabled:opacity-50 disabled:cursor-not-allowed'}
                >
                  <option value="">
                    {topicsLoading ? 'Loading topics...' : topics.length === 0 ? 'Select a category first' : 'Select a topic...'}
                  </option>
                  {topics.map(topic => (
                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Lesson Title <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={lessonForm.title}
                onChange={(e) => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
                required
                placeholder="e.g., Understanding React.memo and useMemo"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Summary</label>
              <input
                type="text"
                value={lessonForm.summary}
                onChange={(e) => setLessonForm(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="One-line summary of this lesson"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Content <span className="text-red-400">*</span>
                <span className="text-surface-500 font-normal ml-1.5">(Markdown supported)</span>
              </label>
              <textarea
                value={lessonForm.content}
                onChange={(e) => setLessonForm(prev => ({ ...prev, content: e.target.value }))}
                required
                rows={10}
                placeholder="Write the lesson content here. Markdown is supported..."
                className={inputClass + ' resize-y font-mono'}
              />
            </div>

            <div>
              <label className={labelClass}>
                Key Points
                <span className="text-surface-500 font-normal ml-1.5">(one per line)</span>
              </label>
              <textarea
                value={lessonForm.key_points}
                onChange={(e) => setLessonForm(prev => ({ ...prev, key_points: e.target.value }))}
                rows={4}
                placeholder={"Key takeaway point 1\nKey takeaway point 2\nKey takeaway point 3"}
                className={inputClass + ' resize-none'}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Difficulty Level</label>
                <div className="flex flex-wrap gap-1.5">
                  {difficultyOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLessonForm(prev => ({ ...prev, difficulty_level: opt.value }))}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                        lessonForm.difficulty_level === opt.value
                          ? opt.color
                          : 'bg-surface-800 text-surface-500 border-surface-700/50 hover:text-surface-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Estimated Time (min)</label>
                <input
                  type="number"
                  value={lessonForm.estimated_time}
                  onChange={(e) => setLessonForm(prev => ({ ...prev, estimated_time: e.target.value }))}
                  placeholder="e.g., 15"
                  min="1"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
