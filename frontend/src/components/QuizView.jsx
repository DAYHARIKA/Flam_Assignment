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
      <div className="glass-panel p-8 text-center space-y-4 max-w-xl mx-auto">
        <AlertCircle className="w-12 h-12 text-purple-400 mx-auto" />
        <h3 className="text-xl font-bold">No Questions Available</h3>
        <p className="text-sm text-gray-400">The quiz didn't generate any valid questions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold">{title || 'Quiz'}</h2>
          <p className="text-xs text-gray-400">
            {quizFinished ? 'Results' : `Question ${currentIndex + 1} of ${activeQuestions.length}`}
            {isRetesting && ' (Re-testing Wrong Answers)'}
          </p>
        </div>
        <button onClick={handleRestartFull} className="btn py-1 px-3 text-xs flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Restart Quiz
        </button>
      </div>

      {!quizFinished && currentQuestion ? (
        <div className="space-y-6">
          {/* Question Stem */}
          <div className="glass-panel p-6 bg-purple-500/5">
            <h3 className="text-lg md:text-xl font-semibold leading-relaxed">
              {currentQuestion.question}
            </h3>
          </div>

          {/* Options Grid */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const selectedIdx = selectedAnswers[currentQuestion.id];
              const isAnswered = selectedIdx !== undefined;
              const isSelected = selectedIdx === idx;
              const isCorrect = currentQuestion.answerIndex === idx;

              let buttonClass = 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10';
              let badge = null;

              if (isAnswered) {
                if (isCorrect) {
                  buttonClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
                  badge = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
                } else if (isSelected) {
                  buttonClass = 'border-red-500 bg-red-500/10 text-red-400';
                  badge = <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
                } else {
                  buttonClass = 'border-white/5 bg-white/2 text-gray-500 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full p-4 rounded-xl border text-left flex justify-between items-center gap-3 transition-all ${buttonClass}`}
                  disabled={isAnswered}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isSelected ? 'bg-purple-500 text-white' : 'bg-black/30 text-gray-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-sm md:text-base font-medium">{option}</span>
                  </div>
                  {badge}
                </button>
              );
            })}
          </div>

          {/* Answer Explanation Box */}
          {selectedAnswers[currentQuestion.id] !== undefined && (
            <div className="glass-panel p-5 bg-purple-500/5 border-purple-500/20 text-sm space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 font-semibold">
                {selectedAnswers[currentQuestion.id] === currentQuestion.answerIndex ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Correct
                  </span>
                ) : (
                  <span className="text-red-400 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> Incorrect
                  </span>
                )}
              </div>
              <p className="text-gray-300 leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Action Row */}
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {!selectedAnswers[currentQuestion.id] !== undefined 
                ? '⌨️ Choose 1-4 to answer' 
                : '⌨️ Press Enter to continue'}
            </div>
            <button
              onClick={handleNext}
              disabled={selectedAnswers[currentQuestion.id] === undefined}
              className="btn btn-primary px-6 flex items-center gap-1.5"
            >
              {currentIndex === activeQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Quiz Finished View */
        <div className="glass-panel p-8 text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Quiz Finished!</h3>
            <p className="text-gray-400">
              You scored <span className="text-purple-400 font-bold">{score}</span> out of{' '}
              <span className="font-semibold">{activeQuestions.length}</span> (
              {Math.round((score / activeQuestions.length) * 100)}%)
            </p>
          </div>

          {/* Score Circle / Meter */}
          <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="54"
                className="stroke-white/5 fill-none"
                strokeWidth="10"
              />
              <circle
                cx="64"
                cy="64"
                r="54"
                className="stroke-purple-500 fill-none transition-all duration-1000 ease-out"
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 54}
                strokeDashoffset={2 * Math.PI * 54 * (1 - score / activeQuestions.length)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-2xl font-bold text-white">
              {Math.round((score / activeQuestions.length) * 100)}%
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            {wrongQuestionIds.length > 0 && (
              <button
                onClick={handleStartRetest}
                className="btn border-purple-500/30 text-purple-400 bg-purple-500/5 hover:bg-purple-500/10 px-6"
              >
                Re-test Wrong Answers ({wrongQuestionIds.length})
              </button>
            )}
            <button onClick={handleRestartFull} className="btn btn-primary px-6">
              Restart Full Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
