import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { lessonAPI, progressAPI, quizAPI } from '../services/api';
import { useAuthStore } from '../store/store';
import { Clock, BookOpen, Code, CheckCircle, ChevronLeft, ChevronRight, Play } from 'lucide-react';

const difficultyColors = {
  beginner: 'green',
  intermediate: 'yellow',
  advanced: 'orange',
  expert: 'red'
};

export default function LessonView() {
  const { slug } = useParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [lesson, setLesson] = useState(null);
  const [codeExamples, setCodeExamples] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [navigation, setNavigation] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState({});

  useEffect(() => {
    fetchLesson();
  }, [slug]);

  useEffect(() => {
    if (lesson && isAuthenticated) {
      updateProgress('in_progress', 50);
    }
  }, [lesson]);

  const fetchLesson = async () => {
    try {
      const response = await lessonAPI.getBySlug(slug);
      setLesson(response.data.lesson);
      setCodeExamples(response.data.codeExamples || []);
      setQuizQuestions(response.data.quizQuestions || []);
      setNavigation(response.data.navigation || {});
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
        timeSpent: 5
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
      const response = await quizAPI.submit({
        questionId,
        userAnswer
      });
      
      setQuizResults({
        ...quizResults,
        [questionId]: response.data
      });
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
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Lesson not found</h2>
        <Link to="/categories" className="text-blue-500 hover:text-blue-400">
          Go back to categories
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="text-sm text-gray-400 mb-2">
          <Link to="/categories" className="hover:text-white">Categories</Link>
          <span className="mx-2">/</span>
          <Link to={`/topic/${lesson.topic_slug}`} className="hover:text-white">{lesson.topic_name}</Link>
          <span className="mx-2">/</span>
          <span>{lesson.title}</span>
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-4">{lesson.title}</h1>
        
        {lesson.summary && (
          <p className="text-xl text-gray-400 mb-4">{lesson.summary}</p>
        )}
        
        <div className="flex items-center space-x-4 text-sm">
          <span className={`px-3 py-1 rounded-full bg-${difficultyColors[lesson.difficulty_level]}-500/20 text-${difficultyColors[lesson.difficulty_level]}-500 font-semibold`}>
            {lesson.difficulty_level}
          </span>
          {lesson.estimated_time && (
            <div className="flex items-center text-gray-400">
              <Clock className="w-4 h-4 mr-1" />
              <span>{lesson.estimated_time} mins</span>
            </div>
          )}
          {lesson.userProgress && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              lesson.userProgress.status === 'completed' ? 'bg-green-500/20 text-green-500' :
              lesson.userProgress.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-500' :
              'bg-gray-500/20 text-gray-500'
            }`}>
              {lesson.userProgress.status.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="flex border-b border-slate-700">
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
                <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h3 className="text-xl font-bold text-white mb-4">Key Takeaways</h3>
                  <ul className="space-y-2">
                    {lesson.key_points.map((point, index) => (
                      <li key={index} className="flex items-start text-gray-300">
                        <CheckCircle className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
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
              {codeExamples.map((example, index) => (
                <div key={example.id} className="bg-slate-700 rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-slate-600">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">{example.title}</h3>
                      <span className="text-sm text-gray-400">{example.language}</span>
                    </div>
                    {example.description && (
                      <p className="text-gray-400 mt-2">{example.description}</p>
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
                    <div className="p-4 bg-slate-800 border-t border-slate-600">
                      <p className="text-gray-300 text-sm">{example.explanation}</p>
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
                <div key={question.id} className="bg-slate-700 p-6 rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      Question {index + 1}: {question.question_text}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      question.difficulty === 'easy' ? 'bg-green-500/20 text-green-500' :
                      question.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {question.difficulty}
                    </span>
                  </div>

                  {question.question_type === 'multiple_choice' && question.options && (
                    <div className="space-y-2 mb-4">
                      {question.options.map((option, optIndex) => (
                        <label
                          key={optIndex}
                          className="flex items-center p-3 bg-slate-600 rounded cursor-pointer hover:bg-slate-500 transition"
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            checked={quizAnswers[question.id] === option}
                            onChange={(e) => setQuizAnswers({
                              ...quizAnswers,
                              [question.id]: e.target.value
                            })}
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
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Submit Answer
                      </button>
                      {!isAuthenticated && (
                        <p className="text-yellow-400 text-sm mt-2">
                          💡 Login to track your quiz progress!
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className={`p-4 rounded-lg ${
                      quizResults[question.id].isCorrect
                        ? 'bg-green-500/20 border border-green-500'
                        : 'bg-red-500/20 border border-red-500'
                    }`}>
                      <p className={`font-semibold mb-2 ${
                        quizResults[question.id].isCorrect ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {quizResults[question.id].isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                      </p>
                      {!quizResults[question.id].isCorrect && (
                        <p className="text-white mb-2">
                          Correct answer: {quizResults[question.id].correctAnswer}
                        </p>
                      )}
                      <p className="text-gray-300 text-sm">
                        {quizResults[question.id].explanation}
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
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

      {/* Actions */}
      {isAuthenticated && lesson.userProgress?.status !== 'completed' && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={markAsComplete}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Mark as Complete</span>
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        {navigation.previous ? (
          <Link
            to={`/lesson/${navigation.previous.slug}`}
            className="flex items-center space-x-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Previous: {navigation.previous.title}</span>
          </Link>
        ) : (
          <div></div>
        )}

        {navigation.next && (
          <Link
            to={`/lesson/${navigation.next.slug}`}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <span>Next: {navigation.next.title}</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
        )}
      </div>
    </div>
  );
}
