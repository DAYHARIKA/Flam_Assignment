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
    <div className="glass-panel p-4 max-w-2xl mx-auto border-purple-500/10 bg-purple-500/2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 text-xs md:text-sm"
            placeholder={getPlaceholderText()}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary px-4 py-2 shrink-0 flex items-center justify-center gap-1.5 text-xs md:text-sm font-semibold"
          disabled={isLoading || !prompt.trim()}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Refine</span>
        </button>
      </form>
    </div>
  );
}
