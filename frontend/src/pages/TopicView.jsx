import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { topicAPI, categoryAPI } from '../services/api';
import {
  Clock, BookOpen, CheckCircle, ArrowRight,
  ChevronLeft, Hash, Target, Menu, X, Zap
} from 'lucide-react';

const difficultyStyles = {
  beginner: {
    badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    dot: 'bg-emerald-400',
    label: 'Beginner',
    sectionColor: 'text-emerald-500/60',
    order: 0,
  },
  intermediate: {
    badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    dot: 'bg-amber-400',
    label: 'Intermediate',
    sectionColor: 'text-amber-500/60',
    order: 1,
  },
  advanced: {
    badge: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    dot: 'bg-orange-400',
    label: 'Advanced',
    sectionColor: 'text-orange-500/60',
    order: 2,
  },
  expert: {
    badge: 'bg-red-500/10 text-red-400 border border-red-500/20',
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
        <div className="spinner" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-5 rounded-xl bg-surface-900 flex items-center justify-center">
          <Target className="w-8 h-8 text-surface-600" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Category Not Found</h2>
        <p className="text-surface-400 text-sm mb-5">The category you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          to="/categories"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-surface-800 text-surface-300 rounded-lg hover:bg-surface-700 transition-colors border border-surface-700/50"
        >
          <ChevronLeft className="w-4 h-4" />
          Browse Categories
        </Link>
      </div>
    );
  }

  const totalLessons = topics.reduce((sum, t) => sum + (parseInt(t.lesson_count) || 0), 0);

  return (
    <div className="flex -mx-4 -my-8 h-[calc(100vh-3.5rem)]">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed bottom-5 right-5 z-50 w-12 h-12 bg-accent-500 text-white rounded-xl flex items-center justify-center hover:bg-accent-600 transition-colors"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-72 flex-shrink-0
          bg-surface-950 lg:bg-surface-950/80
          border-r border-surface-700/40
          transform transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col h-full lg:h-auto
        `}
      >
        {/* Category Header */}
        <div className="p-4 border-b border-surface-700/40">
          <Link
            to="/categories"
            className="inline-flex items-center gap-1 text-xs font-medium text-accent-400 hover:text-accent-300 uppercase tracking-wider mb-2 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            Categories
          </Link>
          <h2 className="text-base font-semibold text-white leading-tight">{category.name}</h2>
          <p className="text-xs text-surface-400 mt-1 leading-relaxed line-clamp-2">
            {category.description}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-surface-500">
            <span className="flex items-center gap-1">
              <Hash className="w-3 h-3" />
              {topics.length} topics
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {totalLessons} lessons
            </span>
          </div>
        </div>

        {/* Topic Navigation */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll p-2">
          {(() => {
            const grouped = {};
            topics.forEach((topic) => {
              const level = topic.difficulty_level || 'beginner';
              if (!grouped[level]) grouped[level] = [];
              grouped[level].push(topic);
            });

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
                  <div key={level} className="mb-2">
                    <div className="flex items-center gap-2 px-2.5 pt-3 pb-1">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                      <span className={`text-[10px] font-semibold uppercase tracking-widest ${diff.sectionColor}`}>
                        {diff.label}
                      </span>
                      <span className="text-[10px] text-surface-600 font-mono">
                        ({groupTopics.length})
                      </span>
                    </div>

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
                              w-full text-left px-2.5 py-2.5 rounded-lg transition-colors duration-150 group relative
                              ${isSelected
                                ? 'bg-accent-500/10 border border-accent-500/20'
                                : 'hover:bg-surface-800/60 border border-transparent'
                              }
                            `}
                          >
                            {isSelected && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-accent-500 rounded-r" />
                            )}

                            <div className="flex items-start gap-2.5">
                              <span className={`text-[11px] font-mono mt-0.5 ${isSelected ? 'text-accent-400' : 'text-surface-600'}`}>
                                {String(idx).padStart(2, '0')}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[13px] font-medium leading-snug ${isSelected ? 'text-accent-300' : 'text-surface-300 group-hover:text-white'} transition-colors`}>
                                  {topic.name}
                                </p>
                                <span className="text-[11px] text-surface-500 mt-1 block">
                                  {lessonCount} lesson{lessonCount !== 1 ? 's' : ''}
                                  {topic.estimated_time ? ` · ${topic.estimated_time}m` : ''}
                                </span>
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
        <div className="p-3 border-t border-surface-700/40">
          <div className="flex items-center gap-1.5 text-[11px] text-surface-500">
            <Zap className="w-3 h-3" />
            <span>{topics.length} topics · {totalLessons} lessons</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto sidebar-scroll">
        {selectedTopic ? (
          <div key={selectedTopic.id} className="p-6 lg:p-8 max-w-3xl animate-fade-in">
            {/* Topic Header */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-xl lg:text-2xl font-semibold text-white">
                  {selectedTopic.name}
                </h1>
                {selectedTopic.difficulty_level && (
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${difficultyStyles[selectedTopic.difficulty_level]?.badge || ''}`}>
                    {difficultyStyles[selectedTopic.difficulty_level]?.label || selectedTopic.difficulty_level}
                  </span>
                )}
              </div>
              <p className="text-surface-400 text-sm leading-relaxed mb-4">
                {selectedTopic.description}
              </p>
              <div className="flex items-center gap-5 text-sm">
                <div className="flex items-center gap-1.5 text-surface-500">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{selectedTopic.lesson_count || 0} lessons</span>
                </div>
                <div className="flex items-center gap-1.5 text-surface-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{selectedTopic.estimated_time || 0} min</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-surface-700/40 mb-6" />

            {/* Lessons List */}
            <div className="space-y-2">
              {selectedTopic.lessons && selectedTopic.lessons.length > 0 ? (
                selectedTopic.lessons.map((lesson, index) => {
                  const isCompleted = lesson.userProgress?.status === 'completed';

                  return (
                    <Link
                      key={lesson.id}
                      to={`/lesson/${lesson.slug}`}
                      className="group block p-4 rounded-lg bg-surface-900 border border-surface-700/40 hover:border-surface-600/60 transition-colors duration-150 animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500/10'
                            : 'bg-surface-800 group-hover:bg-accent-500/10'
                        } transition-colors`}>
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <span className="text-xs font-mono text-surface-500 group-hover:text-accent-400 transition-colors">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className={`text-sm font-medium transition-colors ${
                            isCompleted ? 'text-surface-400' : 'text-surface-200 group-hover:text-white'
                          }`}>
                            {lesson.title}
                          </h3>
                          {lesson.summary && (
                            <p className="text-xs text-surface-500 mt-0.5 line-clamp-1">{lesson.summary}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {lesson.estimated_time && (
                            <span className="hidden sm:flex items-center gap-1 text-xs text-surface-500">
                              <Clock className="w-3 h-3" />
                              {lesson.estimated_time}m
                            </span>
                          )}
                          <ArrowRight className={`w-4 h-4 transition-all ${
                            isCompleted ? 'text-emerald-500/40' : 'text-surface-600 group-hover:text-accent-400 group-hover:translate-x-0.5'
                          }`} />
                        </div>
                      </div>

                      {lesson.userProgress?.progress_percentage > 0 && !isCompleted && (
                        <div className="mt-2.5 ml-11">
                          <div className="h-1 bg-surface-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent-500/60 rounded-full transition-all"
                              style={{ width: `${lesson.userProgress.progress_percentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-16 rounded-xl bg-surface-900/50 border border-surface-700/30 border-dashed">
                  <BookOpen className="w-10 h-10 text-surface-700 mx-auto mb-3" />
                  <p className="text-surface-500 text-sm font-medium">No lessons available yet</p>
                  <p className="text-surface-600 text-xs mt-1">Check back soon for new content</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Target className="w-12 h-12 text-surface-700 mx-auto mb-3" />
              <p className="text-surface-500 text-sm font-medium">Select a topic from the sidebar</p>
              <p className="text-surface-600 text-xs mt-1">Choose a topic to view its lessons</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
