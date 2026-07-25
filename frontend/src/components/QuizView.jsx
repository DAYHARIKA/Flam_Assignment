import React, { useState, useEffect } from 'react';
import { ChevronRight, RefreshCw, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export default function QuizView({ data }) {
  const { title, questions = [] } = data;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionId: chosenOptionIndex }
  const [quizFinished, setQuizFinished] = useState(false);
  
  // Re-testing state
  const [wrongQuestionIds, setWrongQuestionIds] = useState([]);
  const [isRetesting, setIsRetesting] = useState(false);

  // Determine active list of questions (normal vs re-test wrong)
  const getActiveQuestions = () => {
    if (!isRetesting) return questions;
    return questions.filter(q => wrongQuestionIds.includes(q.id));
  };

  const activeQuestions = getActiveQuestions();
  const currentQuestion = activeQuestions[currentIndex];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (quizFinished || !currentQuestion) return;

      const isAnswered = selectedAnswers[currentQuestion.id] !== undefined;
      const key = e.key;

      if (!isAnswered && ['1', '2', '3', '4'].includes(key)) {
        const optionIndex = parseInt(key) - 1;
        if (optionIndex < currentQuestion.options.length) {
          handleSelectOption(optionIndex);
        }
      } else if (isAnswered && (key === 'Enter' || key === ' ')) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, selectedAnswers, quizFinished, currentQuestion]);

  const handleSelectOption = (optionIndex) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    if (selectedAnswers[qId] !== undefined) return; // Prevent changing answer

    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Calculate wrong answers
      const wrongs = activeQuestions.filter(q => {
        const selected = selectedAnswers[q.id];
        return selected !== q.answerIndex;
      }).map(q => q.id);

      setWrongQuestionIds(wrongs);
      setQuizFinished(true);
    }
  };

  const handleStartRetest = () => {
    setIsRetesting(true);
    setCurrentIndex(0);
    setQuizFinished(false);
    // Clear selections only for wrong questions to let them try again
    const clearedSelected = { ...selectedAnswers };
    wrongQuestionIds.forEach(id => {
      delete clearedSelected[id];
    });
    setSelectedAnswers(clearedSelected);
  };

  const handleRestartFull = () => {
    setIsRetesting(false);
    setWrongQuestionIds([]);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setQuizFinished(false);
  };

  // Metrics
  const score = activeQuestions.reduce((acc, q) => {
    return acc + (selectedAnswers[q.id] === q.answerIndex ? 1 : 0);
  }, 0);

  if (activeQuestions.length === 0) {
    return (
      <div className="glass-panel text-center" style={{ padding: '32px', maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <AlertCircle className="w-12 h-12 text-purple-400" />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>No Questions Available</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>The quiz did not generate any valid questions.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="study-header">
        <div className="study-title-box">
          <h2>{title || 'Quiz'}</h2>
          <p className="study-subtitle">
            {quizFinished ? 'Results' : `Question ${currentIndex + 1} of ${activeQuestions.length}`}
            {isRetesting && ' (Re-testing Wrong Answers)'}
          </p>
        </div>
        <button 
          onClick={handleRestartFull} 
          className="btn" 
          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Restart
        </button>
      </div>

      {!quizFinished && currentQuestion ? (
        <div>
          {/* Question Stem */}
          <div className="quiz-question-card">
            <h3>{currentQuestion.question}</h3>
          </div>

          {/* Options Grid */}
          <div className="options-grid">
            {currentQuestion.options.map((option, idx) => {
              const selectedIdx = selectedAnswers[currentQuestion.id];
              const isAnswered = selectedIdx !== undefined;
              const isSelected = selectedIdx === idx;
              const isCorrect = currentQuestion.answerIndex === idx;

              let optionClass = '';
              let badge = null;

              if (isAnswered) {
                if (isCorrect) {
                  optionClass = 'correct';
                  badge = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
                } else if (isSelected) {
                  optionClass = 'incorrect';
                  badge = <XCircle className="w-4 h-4 text-red-400" />;
                } else {
                  optionClass = 'disabled';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`option-btn ${optionClass}`}
                  disabled={isAnswered}
                >
                  <div className="align-center" style={{ gap: '0px' }}>
                    <span 
                      className="option-index"
                      style={{
                        background: isSelected ? 'var(--accent-purple)' : '',
                        color: isSelected ? 'white' : ''
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{option}</span>
                  </div>
                  {badge}
                </button>
              );
            })}
          </div>

          {/* Answer Explanation Box */}
          {selectedAnswers[currentQuestion.id] !== undefined && (
            <div className="explanation-drawer animate-fadeIn">
              <div 
                className={`explanation-status ${
                  selectedAnswers[currentQuestion.id] === currentQuestion.answerIndex ? 'correct' : 'incorrect'
                }`}
              >
                {selectedAnswers[currentQuestion.id] === currentQuestion.answerIndex ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Correct Answer
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" /> Incorrect Answer
                  </>
                )}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Action Row */}
          <div className="flex-row-between" style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {selectedAnswers[currentQuestion.id] === undefined 
                ? '⌨️ Choose 1-4 to answer' 
                : '⌨️ Press Enter to continue'}
            </div>
            <button
              onClick={handleNext}
              disabled={selectedAnswers[currentQuestion.id] === undefined}
              className="btn btn-primary"
              style={{ padding: '10px 20px' }}
            >
              {currentIndex === activeQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Quiz Finished View */
        <div className="glass-panel score-card">
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Quiz Finished!</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              You scored <strong style={{ color: '#c084fc' }}>{score}</strong> out of{' '}
              <strong>{activeQuestions.length}</strong> (
              {Math.round((score / activeQuestions.length) * 100)}%)
            </p>
          </div>

          {/* Score Circle / Meter */}
          <div className="score-ring-box">
            <svg className="score-circle-svg" width="128" height="128">
              <circle
                cx="64"
                cy="64"
                r="54"
                className="score-circle-bg"
                strokeWidth="10"
              />
              <circle
                cx="64"
                cy="64"
                r="54"
                className="score-circle-fill"
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 54}
                strokeDashoffset={2 * Math.PI * 54 * (1 - score / activeQuestions.length)}
                strokeLinecap="round"
              />
            </svg>
            <div className="score-text-overlay">
              {Math.round((score / activeQuestions.length) * 100)}%
            </div>
          </div>

          <div className="score-actions">
            {wrongQuestionIds.length > 0 && (
              <button
                onClick={handleStartRetest}
                className="btn"
                style={{
                  borderColor: 'rgba(139, 92, 246, 0.3)',
                  background: 'rgba(139, 92, 246, 0.05)',
                  color: '#c084fc'
                }}
              >
                Re-test Wrong ({wrongQuestionIds.length})
              </button>
            )}
            <button onClick={handleRestartFull} className="btn btn-primary">
              Restart Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
