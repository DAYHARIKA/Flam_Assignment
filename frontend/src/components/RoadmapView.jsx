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
    <div style={{ maxWidth: '650px', margin: '0 auto' }}>
      {/* Roadmap Header */}
      <div className="study-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
        <div className="flex-row-between">
          <div className="study-title-box">
            <h2>{title || 'Learning Roadmap'}</h2>
            <p className="study-subtitle">{steps.length} Milestones on this path</p>
          </div>
        </div>
        
        <div className="progress-bar-row">
          <div className="progress-bar-label">Progress: {progressPercent}%</div>
          <div className="progress-track">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Roadmap Path */}
      <div className="roadmap-timeline">
        {steps.map((step, idx) => {
          const isExpanded = expandedIndex === idx;
          const stepTasks = completedTasks[step.id] || {};
          const totalTasksCount = step.checklist?.length || 0;
          const completedTasksCount = Object.values(stepTasks).filter(Boolean).length;
          
          const isQuizCorrect = step.miniQuiz && quizAnswers[step.id] === step.miniQuiz.answerIndex;
          const isStepCompleted = (totalTasksCount > 0 && completedTasksCount === totalTasksCount) && 
                                  (!step.miniQuiz || isQuizCorrect);

          let nodeClass = '';
          if (isStepCompleted) nodeClass = 'completed';
          else if (isExpanded) nodeClass = 'active';

          return (
            <div key={step.id} style={{ position: 'relative' }}>
              {/* Vertical timeline node indicator */}
              <div 
                onClick={() => toggleExpand(idx)}
                className={`roadmap-node-point ${nodeClass}`}
              >
                {isStepCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <span style={{ fontSize: '10px', fontWeight: 700 }}>{idx + 1}</span>
                )}
              </div>

              {/* Milestone Box */}
              <div className={`milestone-container ${isExpanded ? 'active' : ''}`}>
                {/* Header/Summary Clickable */}
                <div 
                  onClick={() => toggleExpand(idx)}
                  className="milestone-header"
                >
                  <div className="milestone-header-left">
                    <h3 className="milestone-title">{step.title}</h3>
                    <p className="milestone-desc">{step.description}</p>
                    
                    {/* Tag badges */}
                    <div className="badge-row">
                      {totalTasksCount > 0 && (
                        <span className="badge-tag">
                          Tasks: {completedTasksCount}/{totalTasksCount}
                        </span>
                      )}
                      {step.miniQuiz && (
                        <span 
                          className={`badge-tag ${
                            quizAnswers[step.id] === undefined 
                              ? 'quiz-pending' 
                              : isQuizCorrect 
                              ? 'quiz-passed' 
                              : 'quiz-failed'
                          }`}
                        >
                          {quizAnswers[step.id] === undefined 
                            ? 'Quiz Pending' 
                            : isQuizCorrect 
                            ? 'Quiz Passed' 
                            : 'Quiz Failed'}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="btn" style={{ border: 'none', background: 'transparent', padding: '4px' }}>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="milestone-content">
                    {/* Step Notes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="content-section-title" style={{ color: '#a78bfa' }}>
                        <PlayCircle className="w-4 h-4" /> Learning Guide
                      </div>
                      <p className="milestone-details-text">{step.details}</p>
                    </div>

                    {/* Task Checklist */}
                    {step.checklist && step.checklist.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div className="content-section-title" style={{ color: '#f472b6' }}>
                          <CheckSquare className="w-4 h-4" /> Milestones Checklist
                        </div>
                        <div className="checklist-box">
                          {step.checklist.map((task, taskIdx) => {
                            const isChecked = !!stepTasks[taskIdx];
                            return (
                              <div 
                                key={taskIdx}
                                onClick={() => toggleTask(step.id, taskIdx)}
                                className={`checklist-item ${isChecked ? 'checked' : ''}`}
                              >
                                <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>
                                <span className="checklist-label">
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
                      <div className="checkpoint-quiz-box">
                        <div className="content-section-title" style={{ color: '#60a5fa' }}>
                          <Award className="w-4 h-4" /> Knowledge Check
                        </div>
                        <div className="checkpoint-question">
                          {step.miniQuiz.question}
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {step.miniQuiz.options.map((option, oIdx) => {
                            const chosenIdx = quizAnswers[step.id];
                            const answered = chosenIdx !== undefined;
                            const chosen = chosenIdx === oIdx;
                            const correct = step.miniQuiz.answerIndex === oIdx;

                            let optionClass = '';
                            if (answered) {
                              if (correct) optionClass = 'correct';
                              else if (chosen) optionClass = 'incorrect';
                              else optionClass = 'disabled';
                            }

                            return (
                              <button
                                key={oIdx}
                                onClick={() => selectMiniQuizOption(step.id, oIdx)}
                                className={`checkpoint-option-btn ${optionClass}`}
                                disabled={answered}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>

                        {quizAnswers[step.id] !== undefined && (
                          <div 
                            style={{ 
                              fontSize: '0.75rem', 
                              color: 'var(--text-muted)', 
                              lineHeight: 1.5,
                              paddingTop: '10px',
                              borderTop: '1px solid var(--border-color)' 
                            }}
                          >
                            <strong style={{ color: '#a78bfa' }}>Explanation:</strong>{' '}
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
