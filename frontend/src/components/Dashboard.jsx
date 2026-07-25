import React, { useState, useEffect } from 'react';
import { Sparkles, HelpCircle, BookOpen, Map, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function Dashboard({ onSubmit, isLoading }) {
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState('flashcards');
  const [difficulty, setDifficulty] = useState('medium');
  const [depth, setDepth] = useState('standard');
  const [status, setStatus] = useState({ status: 'loading', mode: 'mock', message: 'Checking server status...' });

  useEffect(() => {
    fetch(`${API_BASE}/api/status`)
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
    <div className="glass-panel dashboard-card pulse-glow">
      <div className="dashboard-header-row">
        <div className="dashboard-icon-box">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div className="dashboard-title-box">
          <h2>Create Study Materials</h2>
          <p>Enter notes, topics, or outlines to generate interactive study tools.</p>
        </div>
      </div>

      {status.status === 'error' ? (
        <div className="notice-banner error">
          <AlertCircle className="w-5 h-5" style={{ flexShrink: 0 }} />
          <div>
            <strong>Backend Offline:</strong> {status.message}
          </div>
        </div>
      ) : status.mode === 'mock' ? (
        <div className="notice-banner mock">
          <AlertCircle className="w-5 h-5" style={{ flexShrink: 0 }} />
          <div>
            <strong>Running in Demo (Mock) Mode:</strong> {status.message}
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="topic-input" className="form-label">
            Paste Notes or Describe Topic
          </label>
          <textarea
            id="topic-input"
            rows="6"
            className="textarea-input"
            placeholder={getPlaceholderText()}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="settings-grid">
          <div className="form-group">
            <label className="form-label">Study Tool Mode</label>
            <div className="toggle-group-3">
              <button
                type="button"
                className={`toggle-btn ${mode === 'flashcards' ? 'active' : ''}`}
                onClick={() => setMode('flashcards')}
                disabled={isLoading}
              >
                <BookOpen className="w-4 h-4" />
                Cards
              </button>
              <button
                type="button"
                className={`toggle-btn ${mode === 'quiz' ? 'active' : ''}`}
                onClick={() => setMode('quiz')}
                disabled={isLoading}
              >
                <HelpCircle className="w-4 h-4" />
                Quiz
              </button>
              <button
                type="button"
                className={`toggle-btn ${mode === 'roadmap' ? 'active' : ''}`}
                onClick={() => setMode('roadmap')}
                disabled={isLoading}
              >
                <Map className="w-4 h-4" />
                Roadmap
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Difficulty</label>
            <div className="toggle-group-3">
              {['easy', 'medium', 'hard'].map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`toggle-btn ${difficulty === level ? 'active' : ''}`}
                  onClick={() => setDifficulty(level)}
                  disabled={isLoading}
                  style={{ textTransform: 'capitalize', padding: '10px 4px' }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Depth / Quantity</label>
            <div className="toggle-group-3">
              {['quick', 'standard', 'detailed'].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`toggle-btn ${depth === d ? 'active' : ''}`}
                  onClick={() => setDepth(d)}
                  disabled={isLoading}
                  style={{ textTransform: 'capitalize', padding: '10px 4px' }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px 20px', fontSize: '1rem' }}
          disabled={isLoading || !topic.trim()}
        >
          <Sparkles className="w-5 h-5" />
          {isLoading ? 'Streaming from AI...' : 'Generate Study Guide'}
        </button>
      </form>
    </div>
  );
}
