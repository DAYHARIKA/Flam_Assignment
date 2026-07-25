import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';

export default function FlashcardsView({ data, onUpdateData }) {
  const { title, cards = [] } = data;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Tracks mastery status by card index/id. Values: 'mastered' | 'review' | null
  const [mastery, setMastery] = useState({});
  const [filterUnmastered, setFilterUnmastered] = useState(false);

  // Filtered cards list
  const getFilteredCards = () => {
    if (!filterUnmastered) return cards;
    return cards.filter(card => mastery[card.id] !== 'mastered');
  };

  const activeCards = getFilteredCards();
  const currentCard = activeCards[currentIndex];

  // Adjust index if out of bounds (e.g. after toggling filter)
  useEffect(() => {
    if (currentIndex >= activeCards.length && activeCards.length > 0) {
      setCurrentIndex(activeCards.length - 1);
    } else if (activeCards.length === 0) {
      setCurrentIndex(0);
    }
    setIsFlipped(false);
    setShowHint(false);
  }, [filterUnmastered, activeCards.length]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeCards.length === 0) return;
      
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentCard) markMastery(currentCard.id, 'mastered');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentCard) markMastery(currentCard.id, 'review');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, activeCards.length, currentCard]);

  const handleNext = () => {
    if (activeCards.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % activeCards.length);
    setIsFlipped(false);
    setShowHint(false);
  };

  const handlePrev = () => {
    if (activeCards.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + activeCards.length) % activeCards.length);
    setIsFlipped(false);
    setShowHint(false);
  };

  const markMastery = (cardId, status) => {
    setMastery(prev => ({
      ...prev,
      [cardId]: status
    }));
    
    // Automatically go to next card after selecting mastery
    setTimeout(() => {
      handleNext();
    }, 300);
  };

  const resetProgress = () => {
    setMastery({});
    setCurrentIndex(0);
    setFilterUnmastered(false);
    setIsFlipped(false);
    setShowHint(false);
  };

  // Metrics
  const totalCards = cards.length;
  const masteredCount = cards.filter(c => mastery[c.id] === 'mastered').length;
  const reviewCount = cards.filter(c => mastery[c.id] === 'review').length;
  const remainingCount = totalCards - masteredCount;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="study-header">
        <div className="study-title-box">
          <h2>{title || 'Flashcards'}</h2>
          <p className="study-subtitle">
            Card {activeCards.length > 0 ? currentIndex + 1 : 0} of {activeCards.length}
            {filterUnmastered && ' (Filtered: Unmastered Only)'}
          </p>
        </div>

        <div className="study-header-actions">
          <button 
            onClick={() => setFilterUnmastered(!filterUnmastered)}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              borderColor: filterUnmastered ? 'var(--accent-purple)' : '',
              background: filterUnmastered ? 'rgba(139, 92, 246, 0.1)' : '',
              color: filterUnmastered ? '#c084fc' : ''
            }}
            disabled={cards.length === 0}
          >
            Review Wrong ({remainingCount})
          </button>
          <button 
            onClick={resetProgress} 
            className="btn"
            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="metrics-row">
        <div className="metric-box">
          <div className="metric-label">Mastered</div>
          <div className="metric-value emerald">{masteredCount}</div>
        </div>
        <div className="metric-box">
          <div className="metric-label">Review</div>
          <div className="metric-value amber">{reviewCount}</div>
        </div>
        <div className="metric-box">
          <div className="metric-label">Unseen</div>
          <div className="metric-value muted">{totalCards - masteredCount - reviewCount}</div>
        </div>
      </div>

      {/* Main Flashcard Scene */}
      {activeCards.length === 0 ? (
        <div className="glass-panel text-center" style={{ padding: '48px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Deck Completed!</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>You've mastered all the flashcards in this deck.</p>
          </div>
          <button onClick={resetProgress} className="btn btn-primary" style={{ padding: '10px 24px' }}>
            Review Deck Again
          </button>
        </div>
      ) : (
        currentCard && (
          <div>
            <div className="card-scene">
              <div 
                className={`flashcard-3d ${isFlipped ? 'flipped' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front Face */}
                <div className="card-face card-face-front">
                  <div className="flex-row-between" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Front</span>
                    <span style={{ fontWeight: 700, textTransform: 'uppercase', color: '#a78bfa' }}>Question</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '16px 0' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.5 }}>
                      {currentCard.front}
                    </h3>
                  </div>
                  <div className="flex-row-between" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Click card to flip</span>
                    {currentCard.hint && (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowHint(!showHint);
                        }}
                        className="btn"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          fontSize: '0.75rem',
                          color: '#a78bfa',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {showHint ? 'Hide Hint' : 'Show Hint'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Back Face */}
                <div className="card-face card-face-back">
                  <div className="flex-row-between" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Back</span>
                    <span style={{ fontWeight: 700, textTransform: 'uppercase', color: '#f472b6' }}>Explanation</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '16px 0', overflowY: 'auto' }}>
                    <p style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {currentCard.back}
                    </p>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Click card to return to question
                  </div>
                </div>
              </div>
            </div>

            {/* Hint Box */}
            {showHint && currentCard.hint && (
              <div className="hint-box animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-purple-400" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#a78bfa' }}>Hint:</strong> {currentCard.hint}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="control-row">
              <button onClick={handlePrev} className="btn" style={{ padding: '12px' }}>
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="mastery-btn-group">
                <button 
                  onClick={() => markMastery(currentCard.id, 'review')}
                  className="mastery-btn review"
                  style={{
                    boxShadow: mastery[currentCard.id] === 'review' ? '0 0 0 2px #fbbf24' : ''
                  }}
                >
                  <AlertCircle className="w-4 h-4" />
                  Review Again
                </button>
                <button 
                  onClick={() => markMastery(currentCard.id, 'mastered')}
                  className="mastery-btn mastered"
                  style={{
                    boxShadow: mastery[currentCard.id] === 'mastered' ? '0 0 0 2px #34d399' : ''
                  }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mastered
                </button>
              </div>

              <button onClick={handleNext} className="btn" style={{ padding: '12px' }}>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Helper Tips */}
            <div className="shortcuts-row">
              <span>⌨️ [Space] Flip</span>
              <span>[← / →] Nav</span>
              <span>[↑] Master</span>
              <span>[↓] Review</span>
            </div>
          </div>
        )
      )}
    </div>
  );
}
