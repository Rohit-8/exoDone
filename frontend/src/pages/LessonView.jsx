import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { lessonAPI, topicAPI, categoryAPI, progressAPI, quizAPI } from '../services/api';
import { useAuthStore } from '../store/store';
import {
  Clock, BookOpen, Code, CheckCircle, ChevronLeft, ChevronRight,
  Hash, Menu, X, Zap, ArrowRight, Target,
} from 'lucide-react';

const difficultyStyles = {
  beginner: {
    badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    dot: 'bg-emerald-400',
    label: 'Beginner',
    sectionColor: 'text-emerald-500/60',
  },
  intermediate: {
    badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    dot: 'bg-amber-400',
    label: 'Intermediate',
    sectionColor: 'text-amber-500/60',
  },
  advanced: {
    badge: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    dot: 'bg-orange-400',
    label: 'Advanced',
    sectionColor: 'text-orange-500/60',
  },
  expert: {
    badge: 'bg-red-500/15 text-red-400 border border-red-500/30',
    dot: 'bg-red-400',
    label: 'Expert',
    sectionColor: 'text-red-500/60',
  },
};

const difficultyOrder = ['beginner', 'intermediate', 'advanced', 'expert'];

export default function LessonView() {
  const { slug } = useParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Lesson data
  const [lesson, setLesson] = useState(null);
  const [codeExamples, setCodeExamples] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [navigation, setNavigation] = useState({});
  const [activeTab, setActiveTab] = useState('content');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState({});

  // Sidebar data
  const [category, setCategory] = useState(null);
  const [topics, setTopics] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  // ── Fetch lesson + sidebar data ───────────────────────────────────────
  useEffect(() => {
    fetchLesson();
  }, [slug]);

  useEffect(() => {
    if (lesson && isAuthenticated) {
      updateProgress('in_progress', 50);
    }
  }, [lesson]);

  const fetchLesson = async () => {
    setLoading(true);
    try {
      const response = await lessonAPI.getBySlug(slug);
      const fetchedLesson = response.data.lesson;
      setLesson(fetchedLesson);
      setCodeExamples(response.data.codeExamples || []);
      setQuizQuestions(response.data.quizQuestions || []);
      setNavigation(response.data.navigation || {});

      // Fetch the sidebar data (topics for the same category)
      if (fetchedLesson.category_slug) {
        const [catRes, topicsRes] = await Promise.all([
          categoryAPI.getAll(),
          topicAPI.getAll({ category: fetchedLesson.category_slug }),
        ]);
        const foundCat = catRes.data.categories.find(
          (c) => c.slug === fetchedLesson.category_slug
        );
        setCategory(foundCat || null);
        setTopics(topicsRes.data.topics || []);
      }
    } catch (error) {
      console.error('Failed to fetch lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (status, percentage) => {
    if (!isAuthenticated || !lesson) return;
    try {
      await progressAPI.updateLesson(lesson.id, {
        status,
        progressPercentage: percentage,
        timeSpent: 5,
      });
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleQuizSubmit = async (questionId) => {
    const userAnswer = quizAnswers[questionId];
    if (!userAnswer) return;
    if (!isAuthenticated) {
      alert('Please login to submit quiz answers and track your progress!');
      return;
    }
    try {
      const response = await quizAPI.submit({ questionId, userAnswer });
      setQuizResults({ ...quizResults, [questionId]: response.data });
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      alert(error.response?.data?.error || 'Failed to submit quiz');
    }
  };

  const markAsComplete = async () => {
    await updateProgress('completed', 100);
    fetchLesson();
  };

  // ── Loading state ─────────────────────────────────────────────────────
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

  if (!lesson) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-800/50 flex items-center justify-center">
          <Target className="w-10 h-10 text-slate-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Lesson Not Found</h2>
        <p className="text-slate-400 mb-6">The lesson you&apos;re looking for doesn&apos;t exist.</p>
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

  const totalLessons = topics.reduce(
    (sum, t) => sum + (parseInt(t.lesson_count) || 0),
    0
  );

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="flex -mx-4 -my-8 h-[calc(100vh-4rem)]">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-cyan-500 text-white rounded-2xl shadow-lg shadow-cyan-500/25 flex items-center justify-center hover:bg-cyan-400 transition-colors"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Left Sidebar ─────────────────────────────────────────────── */}
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
        {category && (
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
        )}

        {/* Topic + Lesson Navigation */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll p-2.5">
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
                  <div key={level} className="mb-3">
                    <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${diff.sectionColor}`}>
                        {diff.label}
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono">
                        ({groupTopics.length})
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      {groupTopics.map((topic) => {
                        globalIndex++;
                        const idx = globalIndex;
                        const isActiveTopic = topic.slug === lesson.topic_slug;
                        const topicLessons = topic.lessons || [];

                        return (
                          <div key={topic.id}>
                            {/* Topic row — links back to the category/topic view */}
                            <Link
                              to={`/topic/${lesson.category_slug}`}
                              onClick={() => setSidebarOpen(false)}
                              className={`
                                w-full text-left px-3 py-3 rounded-xl transition-all duration-200 group relative block
                                ${isActiveTopic
                                  ? 'bg-cyan-500/[0.08] ring-1 ring-cyan-500/25'
                                  : 'hover:bg-slate-800/60'
                                }
                              `}
                            >
                              {isActiveTopic && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-cyan-400 rounded-r-full" />
                              )}
                              <div className="flex items-start gap-3">
                                <span className={`text-[11px] font-mono mt-0.5 tabular-nums ${isActiveTopic ? 'text-cyan-400' : 'text-slate-600'}`}>
                                  {String(idx).padStart(2, '0')}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-[13px] font-medium leading-snug ${isActiveTopic ? 'text-cyan-300' : 'text-slate-300 group-hover:text-white'} transition-colors`}>
                                    {topic.name}
                                  </p>
                                </div>
                              </div>
                            </Link>

                            {/* Show lessons for the active topic */}
                            {isActiveTopic && topicLessons.length > 0 && (
                              <div className="ml-8 mt-1 mb-2 space-y-0.5">
                                {topicLessons.map((l) => {
                                  const isCurrent = l.slug === slug;
                                  return (
                                    <Link
                                      key={l.id}
                                      to={`/lesson/${l.slug}`}
                                      onClick={() => setSidebarOpen(false)}
                                      className={`
                                        block px-3 py-2 rounded-lg text-[12px] transition-all duration-200
                                        ${isCurrent
                                          ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                        }
                                      `}
                                    >
                                      <div className="flex items-center gap-2">
                                        <BookOpen className={`w-3 h-3 flex-shrink-0 ${isCurrent ? 'text-cyan-400' : 'text-slate-600'}`} />
                                        <span className="truncate">{l.title}</span>
                                      </div>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
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

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto sidebar-scroll">
        <div className="p-6 lg:p-10 max-w-4xl animate-fade-in">
          {/* Breadcrumb */}
          <div className="text-sm text-slate-400 mb-6 flex items-center flex-wrap gap-1">
            <Link to="/categories" className="hover:text-cyan-400 transition-colors">Categories</Link>
            <span className="mx-1 text-slate-600">/</span>
            <Link to={`/topic/${lesson.category_slug}`} className="hover:text-cyan-400 transition-colors">
              {lesson.category_name}
            </Link>
            <span className="mx-1 text-slate-600">/</span>
            <Link to={`/topic/${lesson.category_slug}`} className="hover:text-cyan-400 transition-colors">
              {lesson.topic_name}
            </Link>
            <span className="mx-1 text-slate-600">/</span>
            <span className="text-white">{lesson.title}</span>
          </div>

          {/* Lesson Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight mb-3">
              {lesson.title}
            </h1>
            {lesson.summary && (
              <p className="text-slate-400 leading-relaxed mb-4">{lesson.summary}</p>
            )}
            <div className="flex items-center gap-4 text-sm">
              {lesson.difficulty_level && (
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${difficultyStyles[lesson.difficulty_level]?.badge || ''}`}>
                  {difficultyStyles[lesson.difficulty_level]?.label || lesson.difficulty_level}
                </span>
              )}
              {lesson.estimated_time && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span>{lesson.estimated_time} mins</span>
                </div>
              )}
              {lesson.userProgress && (
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                  lesson.userProgress.status === 'completed'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : lesson.userProgress.status === 'in_progress'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                }`}>
                  {lesson.userProgress.status.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="flex border-b border-slate-700/50">
              <button
                onClick={() => setActiveTab('content')}
                className={`flex-1 px-6 py-4 font-semibold transition ${
                  activeTab === 'content'
                    ? 'bg-slate-700 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-5 h-5 inline mr-2" />
                Content
              </button>
              {codeExamples.length > 0 && (
                <button
                  onClick={() => setActiveTab('code')}
                  className={`flex-1 px-6 py-4 font-semibold transition ${
                    activeTab === 'code'
                      ? 'bg-slate-700 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Code className="w-5 h-5 inline mr-2" />
                  Code Examples ({codeExamples.length})
                </button>
              )}
              {quizQuestions.length > 0 && (
                <button
                  onClick={() => setActiveTab('quiz')}
                  className={`flex-1 px-6 py-4 font-semibold transition ${
                    activeTab === 'quiz'
                      ? 'bg-slate-700 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <CheckCircle className="w-5 h-5 inline mr-2" />
                  Quiz ({quizQuestions.length})
                </button>
              )}
            </div>

            <div className="p-8">
              {/* Content Tab */}
              {activeTab === 'content' && (
                <div className="markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-slate-700 px-2 py-1 rounded text-sm" {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {lesson.content}
                  </ReactMarkdown>

                  {lesson.key_points && lesson.key_points.length > 0 && (
                    <div className="mt-8 p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                      <h3 className="text-xl font-bold text-white mb-4">Key Takeaways</h3>
                      <ul className="space-y-2">
                        {lesson.key_points.map((point, index) => (
                          <li key={index} className="flex items-start text-slate-300">
                            <CheckCircle className="w-5 h-5 text-cyan-400 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Code Examples Tab */}
              {activeTab === 'code' && (
                <div className="space-y-8">
                  {codeExamples.map((example) => (
                    <div key={example.id} className="bg-slate-700/60 rounded-xl overflow-hidden border border-slate-600/30">
                      <div className="p-4 border-b border-slate-600/40">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white">{example.title}</h3>
                          <span className="text-xs text-slate-400 font-mono bg-slate-600/40 px-2 py-1 rounded">{example.language}</span>
                        </div>
                        {example.description && (
                          <p className="text-slate-400 mt-2 text-sm">{example.description}</p>
                        )}
                      </div>
                      <SyntaxHighlighter
                        language={example.language}
                        style={vscDarkPlus}
                        customStyle={{ margin: 0, borderRadius: 0 }}
                      >
                        {example.code}
                      </SyntaxHighlighter>
                      {example.explanation && (
                        <div className="p-4 bg-slate-800/60 border-t border-slate-600/40">
                          <p className="text-slate-300 text-sm">{example.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Quiz Tab */}
              {activeTab === 'quiz' && (
                <div className="space-y-6">
                  {quizQuestions.map((question, index) => (
                    <div key={question.id} className="bg-slate-700/60 p-6 rounded-xl border border-slate-600/30">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">
                          Question {index + 1}: {question.question_text}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ml-3 ${
                          question.difficulty === 'easy'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : question.difficulty === 'medium'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}>
                          {question.difficulty}
                        </span>
                      </div>

                      {question.question_type === 'multiple_choice' && question.options && (
                        <div className="space-y-2 mb-4">
                          {question.options.map((option, optIndex) => (
                            <label
                              key={optIndex}
                              className="flex items-center p-3 bg-slate-600/40 rounded-lg cursor-pointer hover:bg-slate-600/60 transition border border-slate-600/30"
                            >
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={option}
                                checked={quizAnswers[question.id] === option}
                                onChange={(e) =>
                                  setQuizAnswers({ ...quizAnswers, [question.id]: e.target.value })
                                }
                                className="mr-3"
                              />
                              <span className="text-white">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {!quizResults[question.id] ? (
                        <div>
                          <button
                            onClick={() => handleQuizSubmit(question.id)}
                            disabled={!quizAnswers[question.id]}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Submit Answer
                          </button>
                          {!isAuthenticated && (
                            <p className="text-amber-400 text-sm mt-2">
                              Login to track your quiz progress!
                            </p>
                          )}
                        </div>
                      ) : (
                        <div
                          className={`p-4 rounded-xl ${
                            quizResults[question.id].isCorrect
                              ? 'bg-emerald-500/10 border border-emerald-500/30'
                              : 'bg-red-500/10 border border-red-500/30'
                          }`}
                        >
                          <p
                            className={`font-semibold mb-2 ${
                              quizResults[question.id].isCorrect ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {quizResults[question.id].isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                          </p>
                          {!quizResults[question.id].isCorrect && (
                            <p className="text-white mb-2">
                              Correct answer: {quizResults[question.id].correctAnswer}
                            </p>
                          )}
                          <p className="text-slate-300 text-sm">{quizResults[question.id].explanation}</p>
                          <p className="text-sm text-slate-400 mt-2">
                            Points earned: {quizResults[question.id].pointsEarned}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mark Complete */}
          {isAuthenticated && lesson.userProgress?.status !== 'completed' && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={markAsComplete}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Mark as Complete</span>
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 pb-8 flex justify-between">
            {navigation.previous ? (
              <Link
                to={`/lesson/${navigation.previous.slug}`}
                className="flex items-center space-x-2 px-6 py-3 bg-slate-800/50 hover:bg-slate-800 text-white rounded-xl transition border border-slate-700/50 hover:border-slate-600"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Previous: {navigation.previous.title}</span>
              </Link>
            ) : (
              <div />
            )}
            {navigation.next && (
              <Link
                to={`/lesson/${navigation.next.slug}`}
                className="flex items-center space-x-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-all hover:shadow-lg hover:shadow-cyan-500/20"
              >
                <span>Next: {navigation.next.title}</span>
                <ChevronRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
