import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Code, Layers, CheckCircle } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: <Layers className="w-8 h-8" />,
      title: 'Software Architecture',
      description: 'Master system design from URL shorteners to distributed systems',
      color: 'blue'
    },
    {
      icon: <Code className="w-8 h-8" />,
      title: 'Backend Development',
      description: 'Learn OOP, design patterns, and advanced backend concepts in C#, Java, Python, or Node.js',
      color: 'green'
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: 'React & Frontend',
      description: 'Build modern UIs with React, hooks, state management, and advanced patterns',
      color: 'purple'
    }
  ];

  const levels = [
    { name: 'Beginner', color: 'green', description: 'Junior Developer' },
    { name: 'Intermediate', color: 'yellow', description: 'Mid-Level Developer' },
    { name: 'Advanced', color: 'orange', description: 'Senior Developer' },
    { name: 'Expert', color: 'red', description: 'Lead Developer' }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Master Your <span className="text-blue-500">Interview Skills</span>
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Comprehensive learning paths for Software Architecture, Backend Development, and Frontend with React. 
          Progress from Junior to Lead level with hands-on lessons, code examples, and quizzes.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/categories"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 transition"
          >
            <span>Start Learning</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/register"
            className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            Sign Up Free
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          What You'll Learn
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 transition"
            >
              <div className={`text-${feature.color}-500 mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Learning Levels */}
      <section className="bg-slate-800 rounded-xl p-8 border border-slate-700">
        <h2 className="text-3xl font-bold text-white text-center mb-8">
          Progress Through All Levels
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          {levels.map((level, index) => (
            <div
              key={index}
              className="text-center"
            >
              <div className={`w-16 h-16 rounded-full bg-${level.color}-500/20 flex items-center justify-center mx-auto mb-4`}>
                <div className={`w-12 h-12 rounded-full bg-${level.color}-500 flex items-center justify-center text-white font-bold`}>
                  {index + 1}
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{level.name}</h3>
              <p className="text-sm text-gray-400">{level.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features List */}
      <section>
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Everything You Need to Succeed
        </h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            'Interactive code examples with live editor',
            'Progress tracking and personalized dashboard',
            'Quiz questions to test your knowledge',
            'Comprehensive lessons from basic to advanced',
            'Real-world case studies and system design',
            'Track your learning journey'
          ].map((item, index) => (
            <div key={index} className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-12 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to Start Your Journey?
        </h2>
        <p className="text-xl text-blue-100 mb-8">
          Join thousands of developers preparing for their next interview
        </p>
        <Link
          to="/register"
          className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-3 rounded-lg font-semibold inline-flex items-center space-x-2 transition"
        >
          <span>Get Started Free</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>
    </div>
  );
}
