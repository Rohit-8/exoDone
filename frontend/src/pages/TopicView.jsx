import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { topicAPI, categoryAPI } from '../services/api';
import {
  Clock, BookOpen, CheckCircle, ArrowRight,
  ChevronLeft, Hash, Target, Menu, X, Zap
} from 'lucide-react';

const difficultyStyles = {
  beginner: {
    badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    dot: 'bg-emerald-400',
    label: 'Beginner',
    sectionColor: 'text-emerald-500/60',
    order: 0,
  },
  intermediate: {
    badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    dot: 'bg-amber-400',
    label: 'Intermediate',
    sectionColor: 'text-amber-500/60',
    order: 1,
  },
  advanced: {
    badge: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    dot: 'bg-orange-400',
    label: 'Advanced',
    sectionColor: 'text-orange-500/60',
    order: 2,
  },
  expert: {
    badge: 'bg-red-500/15 text-red-400 border border-red-500/30',
    dot: 'bg-red-400',
    label: 'Expert',
    sectionColor: 'text-red-500/60',
    order: 3,
  },
};

const difficultyOrder = ['beginner', 'intermediate', 'advanced', 'expert'];

export default function TopicView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [category, setCategory] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const categoriesResponse = await categoryAPI.getAll();
      const foundCategory = categoriesResponse.data.categories.find(c => c.slug === slug);

      if (foundCategory) {
        setCategory(foundCategory);
        const topicsResponse = await topicAPI.getAll({ category: slug });
        const fetchedTopics = topicsResponse.data.topics || [];
        setTopics(fetchedTopics);
        if (fetchedTopics.length > 0) {
          setSelectedTopic(fetchedTopics[0]);
        }
      } else {
        // Try to load as a topic slug and redirect to its category
        try {
          const topicResponse = await topicAPI.getBySlug(slug);
          if (topicResponse.data.topic?.category_slug) {
            navigate(`/topic/${topicResponse.data.topic.category_slug}`, { replace: true });
            return;
          }
        } catch {
          // Not found
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setSidebarOpen(false);
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

  if (!category) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-800/50 flex items-center justify-center">
          <Target className="w-10 h-10 text-slate-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Category Not Found</h2>
        <p className="text-slate-400 mb-6">The category you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          to="/categories"
          className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500/10 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition-all border border-cyan-500/20"
        >
          <ChevronLeft className="w-4 h-4" />
          Browse Categories
        </Link>
      </div>
    );
  }

  const totalLessons = topics.reduce((sum, t) => sum + (parseInt(t.lesson_count) || 0), 0);

  return (
    <div className="flex -mx-4 -my-8 h-[calc(100vh-4rem)]">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-cyan-500 text-white rounded-2xl shadow-lg shadow-cyan-500/25 flex items-center justify-center hover:bg-cyan-400 transition-colors"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-80 flex-shrink-0
          bg-slate-950/95 lg:bg-slate-900/60 backdrop-blur-2xl
          border-r border-slate-700/40
          transform transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col h-full lg:h-auto
        `}
      >
        {/* Category Header */}
        <div className="p-5 border-b border-slate-700/40">
          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 uppercase tracking-widest mb-3 transition-colors group"
          >
            <ChevronLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
            Categories
          </Link>
          <h2 className="text-lg font-bold text-white leading-tight">{category.name}</h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
            {category.description}
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Hash className="w-3 h-3 text-cyan-500/60" />
              {topics.length} topics
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3 h-3 text-cyan-500/60" />
              {totalLessons} lessons
            </span>
          </div>
        </div>

        {/* Topic Navigation */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll p-2.5">
          {(() => {
            // Group topics by difficulty and sort groups
            const grouped = {};
            topics.forEach((topic) => {
              const level = topic.difficulty_level || 'beginner';
              if (!grouped[level]) grouped[level] = [];
              grouped[level].push(topic);
            });

            // Sort within each group by order_index
            Object.values(grouped).forEach((group) =>
              group.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
            );

            let globalIndex = 0;

            return difficultyOrder
              .filter((level) => grouped[level]?.length > 0)
              .map((level) => {
                const diff = difficultyStyles[level];
                const groupTopics = grouped[level];

                return (
                  <div key={level} className="mb-3">
                    {/* Difficulty Section Header */}
                    <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${diff.sectionColor}`}>
                        {diff.label}
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono">
                        ({groupTopics.length})
                      </span>
                    </div>

                    {/* Topics in this difficulty group */}
                    <div className="space-y-0.5">
                      {groupTopics.map((topic) => {
                        globalIndex++;
                        const idx = globalIndex;
                        const isSelected = selectedTopic?.id === topic.id;
                        const lessonCount = parseInt(topic.lesson_count) || 0;

                        return (
                          <button
                            key={topic.id}
                            onClick={() => handleTopicSelect(topic)}
                            className={`
                              w-full text-left px-3 py-3 rounded-xl transition-all duration-200 group relative
                              ${isSelected
                                ? 'bg-cyan-500/[0.08] ring-1 ring-cyan-500/25'
                                : 'hover:bg-slate-800/60'
                              }
                            `}
                          >
                            {/* Active indicator */}
                            {isSelected && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-cyan-400 rounded-r-full glow-cyan-sm" />
                            )}

                            <div className="flex items-start gap-3">
                              <span className={`text-[11px] font-mono mt-0.5 tabular-nums ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`}>
                                {String(idx).padStart(2, '0')}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[13px] font-medium leading-snug ${isSelected ? 'text-cyan-300' : 'text-slate-300 group-hover:text-white'} transition-colors`}>
                                  {topic.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-[11px] text-slate-500 tabular-nums">
                                    {lessonCount} lesson{lessonCount !== 1 ? 's' : ''}
                                    {topic.estimated_time ? ` · ${topic.estimated_time}m` : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              });
          })()}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-700/40">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Zap className="w-3 h-3 text-cyan-500/50" />
            <span>{topics.length} topics · {totalLessons} lessons</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto sidebar-scroll">
        {selectedTopic ? (
          <div key={selectedTopic.id} className="p-6 lg:p-10 max-w-4xl animate-fade-in">
            {/* Topic Header */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                  {selectedTopic.name}
                </h1>
                {selectedTopic.difficulty_level && (
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${difficultyStyles[selectedTopic.difficulty_level]?.badge || ''}`}>
                    {difficultyStyles[selectedTopic.difficulty_level]?.label || selectedTopic.difficulty_level}
                  </span>
                )}
              </div>
              <p className="text-slate-400 leading-relaxed mb-5">
                {selectedTopic.description}
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <span>{selectedTopic.lesson_count || 0} lessons</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <span>{selectedTopic.estimated_time || 0} min</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-cyan-500/20 via-slate-700/40 to-transparent mb-8" />

            {/* Lessons List */}
            <div className="space-y-2.5">
              {selectedTopic.lessons && selectedTopic.lessons.length > 0 ? (
                selectedTopic.lessons.map((lesson, index) => {
                  const isCompleted = lesson.userProgress?.status === 'completed';

                  return (
                    <Link
                      key={lesson.id}
                      to={`/lesson/${lesson.slug}`}
                      className="group block p-4 lg:p-5 rounded-2xl bg-slate-800/40 border border-slate-700/40 hover:border-cyan-500/25 hover:bg-slate-800/70 transition-all duration-300 animate-fade-in-up"
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        {/* Lesson Number */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                          isCompleted
                            ? 'bg-emerald-500/15'
                            : 'bg-slate-700/40 group-hover:bg-cyan-500/10'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <span className="text-sm font-mono text-slate-500 group-hover:text-cyan-400 transition-colors tabular-nums">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-[15px] transition-colors ${
                            isCompleted ? 'text-slate-400' : 'text-white group-hover:text-cyan-300'
                          }`}>
                            {lesson.title}
                          </h3>
                          {lesson.summary && (
                            <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">
                              {lesson.summary}
                            </p>
                          )}
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {lesson.estimated_time && (
                            <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              {lesson.estimated_time}m
                            </span>
                          )}
                          <ArrowRight
                            className={`w-4 h-4 transition-all ${
                              isCompleted
                                ? 'text-emerald-500/50'
                                : 'text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Progress bar */}
                      {lesson.userProgress?.progress_percentage > 0 && !isCompleted && (
                        <div className="mt-3 ml-14">
                          <div className="h-1 bg-slate-700/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-500/60 rounded-full transition-all"
                              style={{ width: `${lesson.userProgress.progress_percentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-20 rounded-2xl bg-slate-800/20 border border-slate-700/30 border-dashed">
                  <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No lessons available yet</p>
                  <p className="text-slate-600 text-sm mt-1">Check back soon for new content</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Target className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Select a topic from the sidebar</p>
              <p className="text-slate-600 text-sm mt-1">Choose a topic to view its lessons</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
