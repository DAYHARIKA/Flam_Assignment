import React from 'react';
import { BookOpen, HelpCircle, Map, Trash2, Plus, Calendar, Clock } from 'lucide-react';

export default function HistorySidebar({ sessions, activeSessionId, onSelect, onDelete, onNew }) {
  const getIcon = (type) => {
    if (type === 'flashcards') return <BookOpen className="w-4 h-4 text-purple-400" />;
    if (type === 'quiz') return <HelpCircle className="w-4 h-4 text-pink-400" />;
    return <Map className="w-4 h-4 text-blue-400" />;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recent';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-300 text-sm tracking-wider uppercase">Saved Sessions</h3>
        <button
          onClick={onNew}
          className="btn py-1.5 px-3 text-xs bg-purple-500/10 hover:bg-purple-500/25 border-purple-500/20 text-purple-400 flex items-center gap-1 font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px] md:max-h-[calc(100vh-220px)] pr-1">
        {sessions.length === 0 ? (
          <div className="text-center p-6 border border-dashed border-white/5 rounded-xl text-gray-500 text-xs">
            No saved sessions yet. Generate a guide to save it here.
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = activeSessionId === session.id;
            return (
              <div
                key={session.id}
                onClick={() => onSelect(session.id)}
                className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all select-none ${
                  isActive
                    ? 'border-purple-500/40 bg-purple-500/5 text-white'
                    : 'border-white/5 bg-white/2 text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="shrink-0 p-1.5 bg-black/40 rounded-lg border border-white/5">
                    {getIcon(session.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs md:text-sm font-semibold truncate leading-tight">
                      {session.title || 'Untitled Session'}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(session.timestamp)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(session.id);
                  }}
                  className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  title="Delete Session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
