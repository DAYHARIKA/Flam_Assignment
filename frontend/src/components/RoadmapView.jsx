import React, { useState } from 'react';
import { CheckSquare, Square, ChevronDown, ChevronUp, CheckCircle2, Award, PlayCircle } from 'lucide-react';

export default function RoadmapView({ data }) {
  const { title, steps = [] } = data;

  // Track expanded step index
  const [expandedIndex, setExpandedIndex] = useState(0);

  // Track completed checklists by stepId: { stepId: { taskIndex: boolean } }
  const [completedTasks, setCompletedTasks] = useState({});

  // Track mini-quiz scores by stepId: { stepId: { answerIndex: chosenIndex } }
  const [quizAnswers, setQuizAnswers] = useState({});

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? -1 : index);
  };

  const toggleTask = (stepId, taskIdx) => {
    setCompletedTasks((prev) => {
      const stepTasks = prev[stepId] || {};
      return {
        ...prev,
        [stepId]: {
          ...stepTasks,
          [taskIdx]: !stepTasks[taskIdx],
        },
      };
    });
  };

  const selectMiniQuizOption = (stepId, optionIdx) => {
    if (quizAnswers[stepId] !== undefined) return; // Prevent change
    setQuizAnswers((prev) => ({
      ...prev,
      [stepId]: optionIdx,
    }));
  };

  // Progress metrics calculation
  const calculateProgress = () => {
    if (steps.length === 0) return 0;
    
    let totalItems = 0;
    let completedItems = 0;

    steps.forEach((step) => {
      // Add checklist items
      if (step.checklist && step.checklist.length > 0) {
        totalItems += step.checklist.length;
        const stepTasks = completedTasks[step.id] || {};
        completedItems += Object.values(stepTasks).filter(Boolean).length;
      }
      
      // Add mini quiz item
      if (step.miniQuiz) {
        totalItems += 1;
        if (quizAnswers[step.id] === step.miniQuiz.answerIndex) {
          completedItems += 1;
        }
      }
    });

    return totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
  };

  const progressPercent = calculateProgress();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Roadmap Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold">{title || 'Learning Roadmap'}</h2>
          <p className="text-xs text-gray-400">{steps.length} Milestones on this path</p>
        </div>
        <div className="w-full sm:w-auto flex items-center gap-3">
          <div className="text-xs font-semibold text-gray-400 whitespace-nowrap">Progress: {progressPercent}%</div>
          <div className="flex-1 sm:w-32 bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Roadmap Path */}
      <div className="relative border-l-2 border-white/5 ml-4 pl-6 space-y-6">
        {steps.map((step, idx) => {
          const isExpanded = expandedIndex === idx;
          const stepTasks = completedTasks[step.id] || {};
          const totalTasksCount = step.checklist?.length || 0;
          const completedTasksCount = Object.values(stepTasks).filter(Boolean).length;
          
          const isQuizCorrect = step.miniQuiz && quizAnswers[step.id] === step.miniQuiz.answerIndex;
          const isStepCompleted = (totalTasksCount > 0 && completedTasksCount === totalTasksCount) && 
                                  (!step.miniQuiz || isQuizCorrect);

          return (
            <div key={step.id} className="relative group">
              {/* Vertical timeline node indicator */}
              <div 
                onClick={() => toggleExpand(idx)}
                className={`absolute -left-[35px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center border cursor-pointer transition-all ${
                  isStepCompleted 
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                    : isExpanded 
                    ? 'border-purple-500 bg-purple-500/15 text-purple-400 scale-110 shadow-glow' 
                    : 'border-white/10 bg-black/40 text-gray-400 group-hover:border-purple-500/50'
                }`}
              >
                {isStepCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-[10px] font-bold">{idx + 1}</span>
                )}
              </div>

              {/* Milestone Box */}
              <div className={`glass-card rounded-xl border transition-all ${
                isExpanded ? 'border-purple-500/30 shadow-md' : 'border-white/5'
              }`}>
                {/* Header/Summary Clickable */}
                <div 
                  onClick={() => toggleExpand(idx)}
                  className="p-5 flex justify-between items-start gap-4 cursor-pointer hover:bg-white/2 select-none"
                >
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-gray-100 group-hover:text-purple-400 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-400">{step.description}</p>
                    
                    {/* Tiny badges */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {totalTasksCount > 0 && (
                        <span className="text-[10px] font-semibold bg-white/5 border border-white/5 text-gray-400 px-2 py-0.5 rounded">
                          Tasks: {completedTasksCount}/{totalTasksCount}
                        </span>
                      )}
                      {step.miniQuiz && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          quizAnswers[step.id] === undefined 
                            ? 'bg-purple-500/5 border-purple-500/10 text-purple-400' 
                            : isQuizCorrect 
                            ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' 
                            : 'bg-red-500/5 border-red-500/10 text-red-400'
                        }`}>
                          {quizAnswers[step.id] === undefined 
                            ? 'Quiz Pending' 
                            : isQuizCorrect 
                            ? 'Quiz Passed' 
                            : 'Quiz Failed'}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-white p-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 border-t border-white/5 space-y-5 animate-slideDown">
                    {/* Step Notes */}
                    <div className="text-sm text-gray-300 leading-relaxed space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wide mb-1">
                        <PlayCircle className="w-4 h-4" /> Learning Guide
                      </div>
                      <p>{step.details}</p>
                    </div>

                    {/* Task Checklist */}
                    {step.checklist && step.checklist.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-pink-400 uppercase tracking-wide">
                          <CheckSquare className="w-4 h-4" /> Milestones checklist
                        </div>
                        <div className="space-y-1.5">
                          {step.checklist.map((task, taskIdx) => {
                            const isChecked = !!stepTasks[taskIdx];
                            return (
                              <div 
                                key={taskIdx}
                                onClick={() => toggleTask(step.id, taskIdx)}
                                className={`flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/2 cursor-pointer transition-all hover:bg-white/5 select-none ${
                                  isChecked ? 'opacity-70 bg-emerald-500/5 border-emerald-500/10' : ''
                                }`}
                              >
                                <button className="text-gray-400">
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>
                                <span className={`text-xs md:text-sm font-medium ${
                                  isChecked ? 'line-through text-gray-500' : 'text-gray-200'
                                }`}>
                                  {task}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Mini Quiz */}
                    {step.miniQuiz && (
                      <div className="p-4 rounded-xl border border-white/5 bg-white/2 space-y-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wide">
                          <Award className="w-4 h-4" /> Knowledge Check
                        </div>
                        <div className="text-xs md:text-sm font-semibold text-gray-100">
                          {step.miniQuiz.question}
                        </div>
                        
                        <div className="space-y-2">
                          {step.miniQuiz.options.map((option, oIdx) => {
                            const chosenIdx = quizAnswers[step.id];
                            const answered = chosenIdx !== undefined;
                            const chosen = chosenIdx === oIdx;
                            const correct = step.miniQuiz.answerIndex === oIdx;

                            let btnStyle = 'border-white/10 bg-black/20 hover:bg-black/40 text-gray-300';
                            if (answered) {
                              if (correct) {
                                btnStyle = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400';
                              } else if (chosen) {
                                btnStyle = 'border-red-500/50 bg-red-500/10 text-red-400';
                              } else {
                                btnStyle = 'border-white/5 opacity-55 text-gray-500';
                              }
                            }

                            return (
                              <button
                                key={oIdx}
                                onClick={() => selectMiniQuizOption(step.id, oIdx)}
                                className={`w-full p-2.5 rounded-lg border text-left text-xs transition-all ${btnStyle}`}
                                disabled={answered}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>

                        {quizAnswers[step.id] !== undefined && (
                          <div className="text-xs text-gray-400 leading-relaxed pt-1.5 border-t border-white/5">
                            <span className="font-semibold text-purple-400">Explanation:</span>{' '}
                            {step.miniQuiz.explanation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
