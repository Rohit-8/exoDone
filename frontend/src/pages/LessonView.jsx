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
  Hash, Menu, X, Zap, Target,
} from 'lucide-react';

const difficultyStyles = {
  beginner: {
    badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    dot: 'bg-emerald-400',
    label: 'Beginner',
    sectionColor: 'text-emerald-500/60',
  },
  intermediate: {
    badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    dot: 'bg-amber-400',
    label: 'Intermediate',
    sectionColor: 'text-amber-500/60',
  },
  advanced: {
    badge: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    dot: 'bg-orange-400',
    label: 'Advanced',
    sectionColor: 'text-orange-500/60',
  },
  expert: {
    badge: 'bg-red-500/10 text-red-400 border border-red-500/20',
    dot: 'bg-red-400',
    label: 'Expert',
    sectionColor: 'text-red-500/60',
  },
};

const difficultyOrder = ['beginner', 'intermediate', 'advanced', 'expert'];

export default function LessonView() {
  const { slug } = useParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [lesson, setLesson] = useState(null);
  const [codeExamples, setCodeExamples] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [navigation, setNavigation] = useState({});
  const [activeTab, setActiveTab] = useState('content');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState({});

  const [category, setCategory] = useState(null);
  const [topics, setTopics] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-5 rounded-xl bg-surface-900 flex items-center justify-center">
          <Target className="w-8 h-8 text-surface-600" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Lesson Not Found</h2>
        <p className="text-surface-400 text-sm mb-5">The lesson you&apos;re looking for doesn&apos;t exist.</p>
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

  const totalLessons = topics.reduce(
    (sum, t) => sum + (parseInt(t.lesson_count) || 0),
    0
  );

  const tabClasses = (tab) =>
    `flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
      activeTab === tab
        ? 'text-white border-b-2 border-accent-500'
        : 'text-surface-400 hover:text-surface-200 border-b-2 border-transparent'
    }`;

  return (
    <div className="flex -mx-4 -my-8 h-[calc(100vh-3.5rem)]">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed bottom-5 right-5 z-50 w-12 h-12 bg-accent-500 text-white rounded-xl flex items-center justify-center hover:bg-accent-600 transition-colors"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

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
          bg-surface-950
          border-r border-surface-700/40
          transform transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col h-full lg:h-auto
        `}
      >
        {category && (
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
        )}

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
                        const isActiveTopic = topic.slug === lesson.topic_slug;
                        const topicLessons = topic.lessons || [];

                        return (
                          <div key={topic.id}>
                            <Link
                              to={`/topic/${lesson.category_slug}`}
                              onClick={() => setSidebarOpen(false)}
                              className={`
                                w-full text-left px-2.5 py-2.5 rounded-lg transition-colors duration-150 group relative block
                                ${isActiveTopic
                                  ? 'bg-accent-500/10 border border-accent-500/20'
                                  : 'hover:bg-surface-800/60 border border-transparent'
                                }
                              `}
                            >
                              {isActiveTopic && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-accent-500 rounded-r" />
                              )}
                              <div className="flex items-start gap-2.5">
                                <span className={`text-[11px] font-mono mt-0.5 ${isActiveTopic ? 'text-accent-400' : 'text-surface-600'}`}>
                                  {String(idx).padStart(2, '0')}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-[13px] font-medium leading-snug ${isActiveTopic ? 'text-accent-300' : 'text-surface-300 group-hover:text-white'} transition-colors`}>
                                    {topic.name}
                                  </p>
                                </div>
                              </div>
                            </Link>

                            {isActiveTopic && topicLessons.length > 0 && (
                              <div className="ml-7 mt-0.5 mb-1.5 space-y-0.5">
                                {topicLessons.map((l) => {
                                  const isCurrent = l.slug === slug;
                                  return (
                                    <Link
                                      key={l.id}
                                      to={`/lesson/${l.slug}`}
                                      onClick={() => setSidebarOpen(false)}
                                      className={`
                                        block px-2.5 py-1.5 rounded-md text-[12px] transition-colors duration-150
                                        ${isCurrent
                                          ? 'bg-accent-500/15 text-accent-300 font-medium'
                                          : 'text-surface-400 hover:text-white hover:bg-surface-800/50'
                                        }
                                      `}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <BookOpen className={`w-3 h-3 flex-shrink-0 ${isCurrent ? 'text-accent-400' : 'text-surface-600'}`} />
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

        <div className="p-3 border-t border-surface-700/40">
          <div className="flex items-center gap-1.5 text-[11px] text-surface-500">
            <Zap className="w-3 h-3" />
            <span>{topics.length} topics · {totalLessons} lessons</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto sidebar-scroll">
        <div className="p-6 lg:p-8 max-w-3xl animate-fade-in">
          {/* Breadcrumb */}
          <div className="text-xs text-surface-500 mb-5 flex items-center flex-wrap gap-1">
            <Link to="/categories" className="hover:text-accent-400 transition-colors">Categories</Link>
            <span className="text-surface-600">/</span>
            <Link to={`/topic/${lesson.category_slug}`} className="hover:text-accent-400 transition-colors">
              {lesson.category_name}
            </Link>
            <span className="text-surface-600">/</span>
            <Link to={`/topic/${lesson.category_slug}`} className="hover:text-accent-400 transition-colors">
              {lesson.topic_name}
            </Link>
            <span className="text-surface-600">/</span>
            <span className="text-surface-300">{lesson.title}</span>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl lg:text-2xl font-semibold text-white mb-2">
              {lesson.title}
            </h1>
            {lesson.summary && (
              <p className="text-surface-400 text-sm leading-relaxed mb-3">{lesson.summary}</p>
            )}
            <div className="flex items-center gap-3 text-sm">
              {lesson.difficulty_level && (
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${difficultyStyles[lesson.difficulty_level]?.badge || ''}`}>
                  {difficultyStyles[lesson.difficulty_level]?.label || lesson.difficulty_level}
                </span>
              )}
              {lesson.estimated_time && (
                <div className="flex items-center gap-1 text-surface-500 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{lesson.estimated_time} mins</span>
                </div>
              )}
              {lesson.userProgress && (
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  lesson.userProgress.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : lesson.userProgress.status === 'in_progress'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-surface-700 text-surface-400'
                }`}>
                  {lesson.userProgress.status.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-surface-900 rounded-xl border border-surface-700/50 overflow-hidden">
            <div className="flex border-b border-surface-700/50">
              <button onClick={() => setActiveTab('content')} className={tabClasses('content')}>
                <BookOpen className="w-4 h-4" />
                Content
              </button>
              {codeExamples.length > 0 && (
                <button onClick={() => setActiveTab('code')} className={tabClasses('code')}>
                  <Code className="w-4 h-4" />
                  Code ({codeExamples.length})
                </button>
              )}
              {quizQuestions.length > 0 && (
                <button onClick={() => setActiveTab('quiz')} className={tabClasses('quiz')}>
                  <CheckCircle className="w-4 h-4" />
                  Quiz ({quizQuestions.length})
                </button>
              )}
            </div>

            <div className="p-6">
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
                          <code className="bg-surface-800 px-1.5 py-0.5 rounded text-sm text-accent-300" {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {lesson.content}
                  </ReactMarkdown>

                  {lesson.key_points && lesson.key_points.length > 0 && (
                    <div className="mt-8 p-5 bg-accent-500/5 border border-accent-500/15 rounded-lg">
                      <h3 className="text-base font-semibold text-white mb-3">Key Takeaways</h3>
                      <ul className="space-y-2">
                        {lesson.key_points.map((point, index) => (
                          <li key={index} className="flex items-start text-surface-300 text-sm">
                            <CheckCircle className="w-4 h-4 text-accent-400 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Code Tab */}
              {activeTab === 'code' && (
                <div className="space-y-6">
                  {codeExamples.map((example) => (
                    <div key={example.id} className="bg-surface-800 rounded-lg overflow-hidden border border-surface-700/50">
                      <div className="p-4 border-b border-surface-700/50">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-white">{example.title}</h3>
                          <span className="text-[11px] text-surface-400 font-mono bg-surface-700 px-2 py-0.5 rounded">{example.language}</span>
                        </div>
                        {example.description && (
                          <p className="text-surface-400 mt-1.5 text-sm">{example.description}</p>
                        )}
                      </div>
                      <SyntaxHighlighter
                        language={example.language}
                        style={vscDarkPlus}
                        customStyle={{ margin: 0, borderRadius: 0, background: '#111119' }}
                      >
                        {example.code}
                      </SyntaxHighlighter>
                      {example.explanation && (
                        <div className="p-4 border-t border-surface-700/50">
                          <p className="text-surface-300 text-sm">{example.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Quiz Tab */}
              {activeTab === 'quiz' && (
                <div className="space-y-5">
                  {quizQuestions.map((question, index) => (
                    <div key={question.id} className="bg-surface-800 p-5 rounded-lg border border-surface-700/50">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white">
                          Q{index + 1}: {question.question_text}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium flex-shrink-0 ml-3 ${
                          question.difficulty === 'easy'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : question.difficulty === 'medium'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {question.difficulty}
                        </span>
                      </div>

                      {question.question_type === 'multiple_choice' && question.options && (
                        <div className="space-y-1.5 mb-4">
                          {question.options.map((option, optIndex) => (
                            <label
                              key={optIndex}
                              className={`flex items-center p-2.5 rounded-lg cursor-pointer transition-colors border text-sm ${
                                quizAnswers[question.id] === option
                                  ? 'bg-accent-500/10 border-accent-500/20 text-white'
                                  : 'bg-surface-900/50 border-surface-700/30 text-surface-300 hover:bg-surface-900 hover:border-surface-600/50'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={option}
                                checked={quizAnswers[question.id] === option}
                                onChange={(e) =>
                                  setQuizAnswers({ ...quizAnswers, [question.id]: e.target.value })
                                }
                                className="mr-2.5 accent-accent-500"
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {!quizResults[question.id] ? (
                        <div>
                          <button
                            onClick={() => handleQuizSubmit(question.id)}
                            disabled={!quizAnswers[question.id]}
                            className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Submit Answer
                          </button>
                          {!isAuthenticated && (
                            <p className="text-amber-400 text-xs mt-2">
                              Login to track your quiz progress!
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className={`p-4 rounded-lg ${
                          quizResults[question.id].isCorrect
                            ? 'bg-emerald-500/8 border border-emerald-500/20'
                            : 'bg-red-500/8 border border-red-500/20'
                        }`}>
                          <p className={`text-sm font-medium mb-1.5 ${
                            quizResults[question.id].isCorrect ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {quizResults[question.id].isCorrect ? 'Correct!' : 'Incorrect'}
                          </p>
                          {!quizResults[question.id].isCorrect && (
                            <p className="text-white text-sm mb-1.5">
                              Correct answer: {quizResults[question.id].correctAnswer}
                            </p>
                          )}
                          <p className="text-surface-300 text-sm">{quizResults[question.id].explanation}</p>
                          <p className="text-xs text-surface-400 mt-2">
                            Points: {quizResults[question.id].pointsEarned}
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
            <div className="mt-5 flex justify-end">
              <button
                onClick={markAsComplete}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark as Complete</span>
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 pb-6 flex justify-between gap-3">
            {navigation.previous ? (
              <Link
                to={`/lesson/${navigation.previous.slug}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-surface-900 hover:bg-surface-800 text-surface-300 hover:text-white rounded-lg transition-colors border border-surface-700/50 text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="truncate max-w-[200px]">Previous: {navigation.previous.title}</span>
              </Link>
            ) : (
              <div />
            )}
            {navigation.next && (
              <Link
                to={`/lesson/${navigation.next.slug}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition-colors text-sm"
              >
                <span className="truncate max-w-[200px]">Next: {navigation.next.title}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
