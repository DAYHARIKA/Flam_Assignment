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
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold">{title || 'Flashcards'}</h2>
          <p className="text-xs text-gray-400">
            Card {activeCards.length > 0 ? currentIndex + 1 : 0} of {activeCards.length}
            {filterUnmastered && ' (Filtered: Unmastered Only)'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setFilterUnmastered(!filterUnmastered)}
            className={`btn py-1 px-3 text-xs ${filterUnmastered ? 'border-purple-500 bg-purple-500/10 text-purple-400' : ''}`}
            disabled={cards.length === 0}
          >
            Review Wrong/Unmastered ({remainingCount})
          </button>
          <button onClick={resetProgress} className="btn py-1 px-3 text-xs flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Progress
          </button>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="glass-panel p-2.5 rounded-xl">
          <div className="text-xs text-gray-400 mb-0.5">Mastered</div>
          <div className="text-lg font-bold text-emerald-400">{masteredCount}</div>
        </div>
        <div className="glass-panel p-2.5 rounded-xl">
          <div className="text-xs text-gray-400 mb-0.5">Need Review</div>
          <div className="text-lg font-bold text-amber-400">{reviewCount}</div>
        </div>
        <div className="glass-panel p-2.5 rounded-xl">
          <div className="text-xs text-gray-400 mb-0.5">Unseen</div>
          <div className="text-lg font-bold text-gray-400">{totalCards - masteredCount - reviewCount}</div>
        </div>
      </div>

      {/* Main Flashcard Scene */}
      {activeCards.length === 0 ? (
        <div className="glass-panel p-12 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">Deck Completed!</h3>
            <p className="text-sm text-gray-400">You've mastered all the flashcards in this deck.</p>
          </div>
          <button onClick={resetProgress} className="btn btn-primary px-6">
            Review Deck Again
          </button>
        </div>
      ) : (
        currentCard && (
          <div className="space-y-6">
            <div className="card-scene">
              <div 
                className={`flashcard-3d ${isFlipped ? 'flipped' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front Face */}
                <div className="card-face card-face-front">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>Front</span>
                    <span className="uppercase tracking-wider font-semibold text-purple-400">Question</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center text-center px-4">
                    <h3 className="text-xl md:text-2xl font-semibold leading-relaxed">
                      {currentCard.front}
                    </h3>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>Click card to reveal answer</span>
                    {currentCard.hint && (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowHint(!showHint);
                        }}
                        className="text-purple-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        {showHint ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showHint ? 'Hide Hint' : 'Show Hint'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Back Face */}
                <div className="card-face card-face-back">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>Back</span>
                    <span className="uppercase tracking-wider font-semibold text-pink-400">Explanation</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center text-center px-4 overflow-y-auto">
                    <p className="text-base md:text-lg leading-relaxed text-gray-200">
                      {currentCard.back}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 text-center">
                    Click card to return to question
                  </div>
                </div>
              </div>
            </div>

            {/* Hint Box */}
            {showHint && currentCard.hint && (
              <div className="glass-panel p-4 bg-purple-500/5 border-purple-500/20 text-sm text-gray-300 flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-purple-400">Hint:</span> {currentCard.hint}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex justify-between items-center gap-4">
              <button onClick={handlePrev} className="btn py-3 px-4">
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex gap-3">
                <button 
                  onClick={() => markMastery(currentCard.id, 'review')}
                  className={`btn py-3 px-6 flex items-center gap-2 border-amber-500/30 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 ${
                    mastery[currentCard.id] === 'review' ? 'ring-2 ring-amber-500' : ''
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  Still Reviewing
                </button>
                <button 
                  onClick={() => markMastery(currentCard.id, 'mastered')}
                  className={`btn py-3 px-6 flex items-center gap-2 border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 ${
                    mastery[currentCard.id] === 'mastered' ? 'ring-2 ring-emerald-500' : ''
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mastered
                </button>
              </div>

              <button onClick={handleNext} className="btn py-3 px-4">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Helper Tips */}
            <div className="text-center text-xs text-gray-500 space-x-4">
              <span>⌨️ [Space]: Flip</span>
              <span>[← / →]: Nav</span>
              <span>[↑]: Master</span>
              <span>[↓]: Review</span>
            </div>
          </div>
        )
      )}
    </div>
  );
}
