import React from 'react';
import { BookOpen, HelpCircle, Map, Trash2, Plus, Clock } from 'lucide-react';

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
    <div className="sidebar-wrapper">
      {/* Header */}
      <div className="sidebar-title-row">
        <h3 className="sidebar-heading">Saved Sessions</h3>
        <button
          onClick={onNew}
          className="btn"
          style={{
            padding: '6px 12px',
            fontSize: '0.75rem',
            background: 'rgba(139, 92, 246, 0.1)',
            borderColor: 'rgba(139, 92, 246, 0.2)',
            color: '#c084fc'
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="sessions-list">
        {sessions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '24px',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            fontSize: '0.75rem'
          }}>
            No saved sessions yet. Generate a guide to save it.
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = activeSessionId === session.id;
            return (
              <div
                key={session.id}
                onClick={() => onSelect(session.id)}
                className={`session-item ${isActive ? 'active' : ''}`}
              >
                <div className="session-item-left">
                  <div className="session-icon-box">
                    {getIcon(session.type)}
                  </div>
                  <div className="session-details">
                    <h4 className="session-title">
                      {session.title || 'Untitled Session'}
                    </h4>
                    <div className="session-time">
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
                  className="session-delete-btn"
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
