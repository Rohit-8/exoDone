import { Github, Linkedin, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-surface-700/40 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-semibold mb-3">Interview Prep</h3>
            <p className="text-surface-400 text-sm leading-relaxed">
              Master your interview skills with comprehensive learning paths for Architecture, Backend, and Frontend development.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/categories" className="text-surface-400 hover:text-white transition-colors">Browse Topics</a></li>
              <li><a href="/dashboard" className="text-surface-400 hover:text-white transition-colors">Dashboard</a></li>
              <li><a href="/progress" className="text-surface-400 hover:text-white transition-colors">My Progress</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white font-semibold mb-3">Connect</h3>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center text-surface-400 hover:text-white hover:bg-surface-700 transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center text-surface-400 hover:text-white hover:bg-surface-700 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center text-surface-400 hover:text-white hover:bg-surface-700 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-surface-700/40 mt-8 pt-6 text-center">
          <p className="text-surface-500 text-sm">
            &copy; {new Date().getFullYear()} Interview Prep. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
