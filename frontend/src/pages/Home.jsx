import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Code, Layers, CheckCircle, Zap } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: <Layers className="w-5 h-5" />,
      title: 'Software Architecture',
      description: 'Master system design from URL shorteners to distributed systems',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
    },
    {
      icon: <Code className="w-5 h-5" />,
      title: 'Backend Development',
      description: 'Learn OOP, design patterns, and advanced backend concepts in C#, Java, Python, or Node.js',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: 'React & Frontend',
      description: 'Build modern UIs with React, hooks, state management, and advanced patterns',
      iconBg: 'bg-sky-500/10',
      iconColor: 'text-sky-400',
    }
  ];

  const levels = [
    { name: 'Beginner', description: 'Junior Developer', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { name: 'Intermediate', description: 'Mid-Level Developer', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { name: 'Advanced', description: 'Senior Developer', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { name: 'Expert', description: 'Lead Developer', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
  ];

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="text-center pt-16 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-500/10 border border-accent-500/20 rounded-full text-accent-400 text-xs font-medium mb-6 animate-fade-in-up">
          Interview Preparation Platform
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-5 tracking-tight animate-fade-in-up" style={{ animationDelay: '60ms' }}>
          Master Your Interview Skills
        </h1>
        <p className="text-lg text-surface-400 mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          Comprehensive learning paths for Software Architecture, Backend Development, and Frontend with React.
          Progress from Junior to Lead level with hands-on lessons and quizzes.
        </p>
        <div className="flex justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '180ms' }}>
          <Link
            to="/categories"
            className="bg-accent-500 hover:bg-accent-600 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm"
          >
            <span>Start Learning</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/register"
            className="bg-surface-800 hover:bg-surface-700 text-surface-200 px-6 py-2.5 rounded-lg font-medium transition-colors border border-surface-700 text-sm"
          >
            Sign Up Free
          </Link>
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-2xl font-semibold text-white text-center mb-8">
          What You'll Learn
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-surface-900 p-6 rounded-xl border border-surface-700/50 hover:border-surface-600/80 transition-colors duration-200 animate-fade-in-up"
              style={{ animationDelay: `${200 + index * 80}ms` }}
            >
              <div className={`${feature.iconBg} w-10 h-10 rounded-lg flex items-center justify-center mb-4`}>
                <div className={feature.iconColor}>{feature.icon}</div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-surface-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Levels */}
      <section className="bg-surface-900 rounded-xl p-8 border border-surface-700/50">
        <h2 className="text-2xl font-semibold text-white text-center mb-8">
          Progress Through All Levels
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          {levels.map((level, index) => (
            <div
              key={index}
              className={`text-center p-5 rounded-lg ${level.bg} border ${level.border}`}
            >
              <div className={`text-2xl font-bold ${level.color} mb-2`}>{index + 1}</div>
              <h3 className="text-base font-semibold text-white mb-1">{level.name}</h3>
              <p className="text-xs text-surface-400">{level.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features List */}
      <section>
        <h2 className="text-2xl font-semibold text-white text-center mb-8">
          Everything You Need to Succeed
        </h2>
        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {[
            'Interactive code examples with live editor',
            'Progress tracking and personalized dashboard',
            'Quiz questions to test your knowledge',
            'Comprehensive lessons from basic to advanced',
            'Real-world case studies and system design',
            'Track your learning journey'
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-surface-900/50">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-surface-300 text-sm">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-surface-900 rounded-xl p-10 text-center border border-surface-700/50">
        <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center mx-auto mb-5">
          <Zap className="w-5 h-5 text-accent-400" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-3">
          Ready to Start Your Journey?
        </h2>
        <p className="text-surface-400 mb-6 max-w-md mx-auto text-sm">
          Join thousands of developers preparing for their next interview
        </p>
        <Link
          to="/register"
          className="bg-accent-500 hover:bg-accent-600 text-white px-6 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 transition-colors text-sm"
        >
          <span>Get Started Free</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
