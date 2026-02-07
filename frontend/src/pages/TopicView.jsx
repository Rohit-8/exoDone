import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { topicAPI, categoryAPI } from '../services/api';
import { Clock, BookOpen, CheckCircle, Circle, ArrowRight } from 'lucide-react';

const difficultyColors = {
  beginner: 'green',
  intermediate: 'yellow',
  advanced: 'orange',
  expert: 'red'
};

export default function TopicView() {
  const { slug } = useParams();
  const [topics, setTopics] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCategory, setIsCategory] = useState(false);

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    try {
      // First, try to fetch as a topic
      try {
        const response = await topicAPI.getBySlug(slug);
        if (response.data.topic) {
          setTopics([]);
          setCategory(null);
          setIsCategory(false);
          // If we successfully get a topic, we need to show its lessons
          // But since this component was meant for topics, let's handle this
          window.location.href = `/topic-detail/${slug}`;
          return;
        }
      } catch (topicError) {
        // Not a topic, might be a category
      }

      // Try to fetch as a category and get its topics
      const categoriesResponse = await categoryAPI.getAll();
      const foundCategory = categoriesResponse.data.categories.find(c => c.slug === slug);
      
      if (foundCategory) {
        setCategory(foundCategory);
        setIsCategory(true);
        
        // Fetch topics for this category
        const topicsResponse = await topicAPI.getAll({ category: slug });
        setTopics(topicsResponse.data.topics || []);
      } else {
        setCategory(null);
        setTopics([]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setCategory(null);
      setTopics([]);
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

  if (!category && topics.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Topic not found</h2>
        <Link to="/categories" className="text-blue-500 hover:text-blue-400">
          Go back to categories
        </Link>
      </div>
    );
  }

  // If showing topics in a category
  if (isCategory && category) {
    return (
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="text-sm text-gray-400 mb-4">
            <Link to="/categories" className="hover:text-white">Categories</Link>
            <span className="mx-2">/</span>
            <span>{category.name}</span>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">{category.name}</h1>
          <p className="text-xl text-gray-400">{category.description}</p>
        </div>

        {/* Topics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => {
            const color = difficultyColors[topic.difficulty_level] || 'blue';
            const progress = topic.userProgress?.progress_percentage || 0;

            return (
              <div
                key={topic.id}
                className="bg-slate-800 rounded-xl p-6 border border-slate-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white">
                    {topic.name}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${color}-500/20 text-${color}-500`}>
                    {topic.difficulty_level}
                  </span>
                </div>

                <p className="text-gray-400 mb-4">{topic.description}</p>

                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{topic.lesson_count || 0} lessons</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{topic.estimated_time || 0} min</span>
                  </div>
                </div>

                {progress > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-blue-400">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Lessons List */}
                {topic.lessons && topic.lessons.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-400 mb-3">Lessons:</h4>
                    {topic.lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        to={`/lesson/${lesson.slug}`}
                        className="block p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {lesson.userProgress?.status === 'completed' ? (
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium group-hover:text-blue-400 transition truncate">
                                {lesson.title}
                              </p>
                              <p className="text-xs text-gray-400">{lesson.estimated_time} min</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition flex-shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">No lessons available yet</p>
                )}
              </div>
            );
          })}
        </div>

        {topics.length === 0 && (
          <div className="text-center py-12 bg-slate-800 rounded-xl">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No topics available in this category yet.</p>
          </div>
        )}
      </div>
    );
  }

  // Old single topic view (keep for now, but we should create a separate route)
  const topic = topics[0];
  if (!topic) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Topic not found</h2>
        <Link to="/categories" className="text-blue-500 hover:text-blue-400">
          Go back to categories
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="text-sm text-gray-400 mb-2">
          <Link to="/categories" className="hover:text-white">Categories</Link>
          <span className="mx-2">/</span>
          <span>{topic.category_name}</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">{topic.name}</h1>
        <p className="text-xl text-gray-400 mb-4">{topic.description}</p>
        
        <div className="flex items-center space-x-4 text-sm">
          <span className={`px-3 py-1 rounded-full bg-${difficultyColors[topic.difficulty_level]}-500/20 text-${difficultyColors[topic.difficulty_level]}-500 font-semibold`}>
            {topic.difficulty_level}
          </span>
          {topic.estimated_time && (
            <div className="flex items-center text-gray-400">
              <Clock className="w-4 h-4 mr-1" />
              <span>{topic.estimated_time} mins</span>
            </div>
          )}
        </div>
      </div>

      {/* Lessons */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <BookOpen className="w-6 h-6 mr-2" />
          Lessons ({topic.lessons?.length || 0})
        </h2>

        {topic.lessons && topic.lessons.length > 0 ? (
          <div className="space-y-4">
            {topic.lessons.map((lesson, index) => (
              <Link
                key={lesson.id}
                to={`/lesson/${lesson.slug}`}
                className="block p-6 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl font-bold text-gray-500">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-xl font-semibold text-white">{lesson.title}</h3>
                    </div>
                    
                    {lesson.summary && (
                      <p className="text-gray-400 mb-3 ml-11">{lesson.summary}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm ml-11">
                      <span className={`px-2 py-1 rounded bg-${difficultyColors[lesson.difficulty_level]}-500/20 text-${difficultyColors[lesson.difficulty_level]}-500`}>
                        {lesson.difficulty_level}
                      </span>
                      {lesson.estimated_time && (
                        <span className="text-gray-400 flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {lesson.estimated_time} min
                        </span>
                      )}
                      {lesson.code_example_count > 0 && (
                        <span className="text-gray-400">
                          {lesson.code_example_count} code examples
                        </span>
                      )}
                      {lesson.quiz_count > 0 && (
                        <span className="text-gray-400">
                          {lesson.quiz_count} quiz questions
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
                    {lesson.user_status === 'completed' ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : lesson.user_status === 'in_progress' ? (
                      <div className="w-6 h-6 rounded-full border-4 border-yellow-500 border-t-transparent animate-spin" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                </div>

                {lesson.progress_percentage > 0 && (
                  <div className="mt-4 ml-11">
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${lesson.progress_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No lessons available yet.</p>
        )}
      </div>
    </div>
  );
}
