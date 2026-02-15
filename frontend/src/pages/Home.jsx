import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Code, Layers, CheckCircle, Sparkles, Zap } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: <Layers className="w-8 h-8" />,
      title: 'Software Architecture',
      description: 'Master system design from URL shorteners to distributed systems',
      color: 'blue',
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-400',
    },
    {
      icon: <Code className="w-8 h-8" />,
      title: 'Backend Development',
      description: 'Learn OOP, design patterns, and advanced backend concepts in C#, Java, Python, or Node.js',
      color: 'green',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400',
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: 'React & Frontend',
      description: 'Build modern UIs with React, hooks, state management, and advanced patterns',
      color: 'purple',
      iconBg: 'bg-purple-500/15',
      iconColor: 'text-purple-400',
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
      <section className="text-center py-20 relative">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-8 animate-fade-in-up">
            <Sparkles className="w-4 h-4" />
            Interview Preparation Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight animate-fade-in-up" style={{ animationDelay: '80ms' }}>
            Master Your{' '}
            <span className="gradient-text">Interview Skills</span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '160ms' }}>
            Comprehensive learning paths for Software Architecture, Backend Development, and Frontend with React.
            Progress from Junior to Lead level with hands-on lessons, code examples, and quizzes.
          </p>
          <div className="flex justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
            <Link
              to="/categories"
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-0.5"
            >
              <span>Start Learning</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/register"
              className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-all border border-slate-700 hover:border-slate-600"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          What You'll Learn
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 hover:border-slate-600 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${300 + index * 100}ms` }}
            >
              <div className={`${feature.iconBg} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                <div className={feature.iconColor}>
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
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
      <section className="relative bg-slate-800/50 rounded-2xl p-12 text-center border border-slate-700/50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center mx-auto mb-6">
            <Zap className="w-6 h-6 text-cyan-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
            Join thousands of developers preparing for their next interview
          </p>
          <Link
            to="/register"
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3.5 rounded-xl font-semibold inline-flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-0.5"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
