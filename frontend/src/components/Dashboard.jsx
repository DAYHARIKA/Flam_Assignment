import React, { useState, useEffect } from 'react';
import { Sparkles, HelpCircle, BookOpen, Map, AlertCircle } from 'lucide-react';

export default function Dashboard({ onSubmit, isLoading }) {
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState('flashcards');
  const [difficulty, setDifficulty] = useState('medium');
  const [depth, setDepth] = useState('standard');
  const [status, setStatus] = useState({ status: 'loading', mode: 'mock', message: 'Checking server status...' });

  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(() => setStatus({ 
        status: 'error', 
        mode: 'mock', 
        message: 'Could not connect to backend server. Make sure it is running on port 3001.' 
      }));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onSubmit({ topic, mode, difficulty, depth });
  };

  const getPlaceholderText = () => {
    if (mode === 'flashcards') return 'Paste your notes or enter a topic (e.g., "React Hooks lifecycle", "Photosynthesis explained", "WWII major events") to generate flashcards...';
    if (mode === 'quiz') return 'Paste a syllabus, lecture notes, or enter a subject (e.g., "Python data structures", "French revolution timeline") to generate an interactive quiz...';
    return 'Enter a broad skill or complex topic (e.g., "Fullstack Web Development", "How the Internet works", "Machine Learning Basics") to generate a step-by-step learning roadmap...';
  };

  return (
    <div className="glass-panel p-6 md:p-8 max-w-3xl mx-auto pulse-glow">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Create Study materials
          </h2>
          <p className="text-gray-400 text-sm">Enter notes, topics, or outlines to generate interactive study tools.</p>
        </div>
      </div>

      {status.status === 'error' ? (
        <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Backend Offline:</span> {status.message}
          </div>
        </div>
      ) : status.mode === 'mock' ? (
        <div className="mb-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Running in Demo (Mock) Mode:</span> {status.message}
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="topic-input" className="block text-sm font-semibold text-gray-300 mb-2">
            Paste Notes or Describe Topic
          </label>
          <textarea
            id="topic-input"
            rows="6"
            className="w-full p-4 rounded-xl border border-white/10 bg-black/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm resize-none"
            placeholder={getPlaceholderText()}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Study Tool Mode</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                className={`py-2 px-3 rounded-lg text-xs font-semibold border flex flex-col items-center gap-1.5 justify-center transition-all ${
                  mode === 'flashcards'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
                onClick={() => setMode('flashcards')}
                disabled={isLoading}
              >
                <BookOpen className="w-4 h-4" />
                Cards
              </button>
              <button
                type="button"
                className={`py-2 px-3 rounded-lg text-xs font-semibold border flex flex-col items-center gap-1.5 justify-center transition-all ${
                  mode === 'quiz'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
                onClick={() => setMode('quiz')}
                disabled={isLoading}
              >
                <HelpCircle className="w-4 h-4" />
                Quiz
              </button>
              <button
                type="button"
                className={`py-2 px-3 rounded-lg text-xs font-semibold border flex flex-col items-center gap-1.5 justify-center transition-all ${
                  mode === 'roadmap'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
                onClick={() => setMode('roadmap')}
                disabled={isLoading}
              >
                <Map className="w-4 h-4" />
                Roadmap
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {['easy', 'medium', 'hard'].map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`py-2.5 rounded-lg text-xs font-semibold border capitalize transition-all ${
                    difficulty === level
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                  onClick={() => setDifficulty(level)}
                  disabled={isLoading}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Depth / Quantity</label>
            <div className="grid grid-cols-3 gap-2">
              {['quick', 'standard', 'detailed'].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`py-2.5 rounded-lg text-xs font-semibold border capitalize transition-all ${
                    depth === d
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                  onClick={() => setDepth(d)}
                  disabled={isLoading}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full btn btn-primary py-3 flex items-center justify-center gap-2 text-base shadow-lg"
          disabled={isLoading || !topic.trim()}
        >
          <Sparkles className="w-5 h-5" />
          {isLoading ? 'Streaming from AI...' : 'Generate Study Guide'}
        </button>
      </form>
    </div>
  );
}
