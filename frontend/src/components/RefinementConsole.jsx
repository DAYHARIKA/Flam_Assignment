import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

export default function RefinementConsole({ onSubmit, isLoading, mode }) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmit(prompt);
    setPrompt('');
  };

  const getPlaceholderText = () => {
    if (mode === 'flashcards') return 'Prompt AI to refine cards (e.g. "Add 3 cards about useReducer", "Make explanations shorter")...';
    if (mode === 'quiz') return 'Prompt AI to refine quiz (e.g. "Add 2 hard questions", "Make explanations simpler")...';
    return 'Prompt AI to refine roadmap (e.g. "Add a step detailing custom hooks", "Simplify the explanation in step 2")...';
  };

  return (
    <div className="glass-panel refinement-console-box" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <form onSubmit={handleSubmit} className="refinement-form">
        <div className="refinement-input-wrapper">
          <input
            type="text"
            className="refinement-text-input"
            placeholder={getPlaceholderText()}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
          />
          <div className="refinement-icon-overlay">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}
          disabled={isLoading || !prompt.trim()}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Refine</span>
        </button>
      </form>
    </div>
  );
}
