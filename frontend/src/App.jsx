import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Sun, Moon, RefreshCw, AlertTriangle, ArrowLeft, Menu, X } from 'lucide-react';

import Dashboard from './components/Dashboard';
import HistorySidebar from './components/HistorySidebar';
import FlashcardsView from './components/FlashcardsView';
import QuizView from './components/QuizView';
import RoadmapView from './components/RoadmapView';
import RefinementConsole from './components/RefinementConsole';
import { parsePartialJson } from './utils/partialJsonParser';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [sessions, setSessions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('study_sessions')) || [];
    } catch {
      return [];
    }
  });

  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRecoveredNotice, setIsRecoveredNotice] = useState(false);

  // Streaming State
  const [partialData, setPartialData] = useState(null);
  const [rawResponseText, setRawResponseText] = useState('');

  // Mobile sidebar visibility
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Tracking last request parameters for "Retry" capabilities
  const [lastRequest, setLastRequest] = useState(null);

  // Abort controller reference to cancel stale requests
  const abortControllerRef = useRef(null);

  // Sync theme class with DOM
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Persist sessions
  useEffect(() => {
    localStorage.setItem('study_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSelectSession = (id) => {
    setActiveSessionId(id);
    setPartialData(null);
    setError(null);
    setIsRecoveredNotice(false);
    setMobileMenuOpen(false);
  };

  const handleDeleteSession = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
    }
  };

  const handleNewSession = () => {
    setActiveSessionId(null);
    setPartialData(null);
    setError(null);
    setIsRecoveredNotice(false);
    setMobileMenuOpen(false);
  };

  const getActiveSessionData = () => {
    if (partialData && partialData.items && partialData.items.length > 0) {
      // Map streaming items to standard schema format
      const isQuiz = partialData.type === 'quiz';
      const isRoadmap = partialData.type === 'roadmap';
      return {
        title: partialData.title,
        type: partialData.type || 'flashcards',
        [isQuiz ? 'questions' : isRoadmap ? 'steps' : 'cards']: partialData.items
      };
    }
    return sessions.find(s => s.id === activeSessionId) || null;
  };

  // Perform streaming API request
  const executeGeneration = async (requestParams) => {
    // 1. Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 2. Instantiate new AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Save parameters for potential retries
    setLastRequest(requestParams);
    setIsLoading(true);
    setError(null);
    setIsRecoveredNotice(false);
    setRawResponseText('');
    
    // Clear partial streaming state
    setPartialData(null);

    const { topic, mode, difficulty, depth, isRefinement, previousState, refinementPrompt } = requestParams;

    try {
      const response = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          mode,
          difficulty,
          depth,
          previousState,
          prompt: refinementPrompt
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("SSE Stream response body is empty or unsupported by this browser.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let runningJsonStr = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split by SSE message boundary
        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          const message = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf('\n\n');

          if (message.startsWith('data: ')) {
            const dataVal = message.slice(6).trim();

            if (dataVal === '[DONE]') {
              break;
            } else if (dataVal.startsWith('[ERROR]')) {
              throw new Error(dataVal.slice(7));
            } else if (dataVal) {
              runningJsonStr += dataVal;
              setRawResponseText(runningJsonStr);

              // Parse whatever we have so far
              const parsed = parsePartialJson(runningJsonStr);
              setPartialData(parsed);
            }
          }
        }
      }

      // Finish Streaming -> Validate complete JSON object
      let parsedFinal = null;
      
      // Clean up any remaining block markers like ```json if LLM bypassed backend application/json configuration
      let cleanedJson = runningJsonStr.trim();
      if (cleanedJson.startsWith('```json')) cleanedJson = cleanedJson.slice(7);
      if (cleanedJson.endsWith('```')) cleanedJson = cleanedJson.slice(0, -3);
      cleanedJson = cleanedJson.trim();

      try {
        parsedFinal = JSON.parse(cleanedJson);
      } catch (parseErr) {
        console.warn("Complete JSON parse failed. Extracting whatever items could be recovered...", parseErr);
        
        // Recover partial items if possible
        const parsedPartial = parsePartialJson(cleanedJson);
        if (parsedPartial && parsedPartial.items && parsedPartial.items.length > 0) {
          const isQuiz = parsedPartial.type === 'quiz' || mode === 'quiz';
          const isRoadmap = parsedPartial.type === 'roadmap' || mode === 'roadmap';
          
          parsedFinal = {
            type: parsedPartial.type || mode,
            title: parsedPartial.title || topic || 'Recovered Session',
            [isQuiz ? 'questions' : isRoadmap ? 'steps' : 'cards']: parsedPartial.items
          };
          setIsRecoveredNotice(true);
        } else {
          throw new Error("Failed to parse AI output. The response was malformed. Please try again.");
        }
      }

      // Save Session
      if (parsedFinal) {
        const listKey = parsedFinal.type === 'quiz' ? 'questions' : parsedFinal.type === 'roadmap' ? 'steps' : 'cards';
        
        if (!parsedFinal[listKey] || parsedFinal[listKey].length === 0) {
          throw new Error("Generated content contains no study items. Try clarifying your topic.");
        }

        const newSession = {
          id: isRefinement && activeSessionId ? activeSessionId : `session_${Date.now()}`,
          timestamp: Date.now(),
          title: parsedFinal.title || topic || 'Study Session',
          type: parsedFinal.type || mode,
          [listKey]: parsedFinal[listKey]
        };

        setSessions(prev => {
          // If editing in place, replace. Otherwise prepend.
          const filtered = prev.filter(s => s.id !== newSession.id);
          return [newSession, ...filtered];
        });

        setActiveSessionId(newSession.id);
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log("Request aborted.");
        return; // Ignore abort exceptions
      }
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
      setPartialData(null);
    }
  };

  const handleDashboardSubmit = (data) => {
    executeGeneration({
      topic: data.topic,
      mode: data.mode,
      difficulty: data.difficulty,
      depth: data.depth,
      isRefinement: false
    });
  };

  const handleRefinementSubmit = (refinementPrompt) => {
    const currentData = getActiveSessionData();
    if (!currentData) return;

    executeGeneration({
      topic: currentData.title,
      mode: currentData.type,
      isRefinement: true,
      previousState: currentData,
      refinementPrompt
    });
  };

  const handleRetry = () => {
    if (lastRequest) {
      executeGeneration(lastRequest);
    }
  };

  const activeData = getActiveSessionData();

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-section">
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="menu-toggle-btn"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="logo-section" style={{ cursor: 'pointer' }} onClick={handleNewSession}>
            <div className="logo-icon">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="logo-text">
              StudyBuddy<span className="logo-badge">AI</span>
            </h1>
          </div>
        </div>

        <div className="header-actions">
          <button
            onClick={toggleTheme}
            className="btn"
            style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="main-layout">
        {/* Sidebar for Desktop */}
        <aside className="desktop-sidebar">
          <HistorySidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelect={handleSelectSession}
            onDelete={handleDeleteSession}
            onNew={handleNewSession}
          />
        </aside>

        {/* Sidebar for Mobile (Overlay) */}
        {mobileMenuOpen && (
          <>
            <div 
              className="mobile-overlay"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="mobile-sidebar animate-slideRight">
              <HistorySidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelect={handleSelectSession}
                onDelete={handleDeleteSession}
                onNew={handleNewSession}
              />
            </aside>
          </>
        )}

        {/* Main Work Area */}
        <main className="content-area">
          <div className="content-wrapper">
            {/* Recovered Items Banner */}
            {isRecoveredNotice && (
              <div className="notice-banner recovered">
                <AlertTriangle className="w-5 h-5" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Partial Recovery:</strong> The AI returned some malformed formatting at the end. We successfully extracted the fully completed cards/questions.
                </div>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="notice-banner error" style={{ flexDirection: 'column', gap: '12px' }}>
                <div className="align-center">
                  <AlertTriangle className="w-5 h-5" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Generation Error:</strong> {error}
                  </div>
                </div>
                <div className="notice-actions" style={{ marginLeft: '28px' }}>
                  <button 
                    onClick={handleRetry} 
                    className="btn"
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      background: 'rgba(239, 68, 68, 0.05)',
                      color: '#fca5a5'
                    }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry
                  </button>
                  <button 
                    onClick={() => setError(null)} 
                    className="btn"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* View Dispatcher */}
            {!activeSessionId && !isLoading && !error && (
              <Dashboard onSubmit={handleDashboardSubmit} isLoading={isLoading} />
            )}

            {/* Loading / Streaming State WITHOUT any items yet */}
            {isLoading && (!activeData || (activeData.cards?.length === 0 && activeData.questions?.length === 0 && activeData.steps?.length === 0)) && (
              <div className="glass-panel loader-layout pulse-glow" style={{ maxWidth: '500px', margin: '0 auto' }}>
                <div className="loader-spinner-box">
                  <div className="spinner-bg" />
                  <div className="spinner-fill" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Consulting StudyBuddy AI...</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '300px' }}>
                    Generating structured study materials. This may take up to a minute depending on prompt size.
                  </p>
                </div>
                
                {/* Shimmer items placeholders */}
                <div style={{ width: '100%', maxWidth: '360px' }}>
                  <div className="shimmer-loading shimmer-block-small" />
                  <div className="shimmer-loading shimmer-block-large" />
                </div>
              </div>
            )}

            {/* Streaming display OR final rendering */}
            {activeData && (
              <div className="content-wrapper" style={{ gap: '20px' }}>
                {/* Back Button */}
                <div>
                  <button 
                    onClick={handleNewSession}
                    className="btn"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Dashboard
                  </button>
                </div>

                {/* Streaming Overlay Notice */}
                {isLoading && (
                  <div 
                    className="notice-banner mock"
                    style={{ justifyContent: 'center', margin: 0, animation: 'pulse 2s infinite' }}
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>AI is streaming modifications... items appear below as they complete.</span>
                  </div>
                )}

                {/* Renders the selected interactive tool */}
                {activeData.type === 'flashcards' && (
                  <FlashcardsView data={activeData} onUpdateData={() => {}} />
                )}
                {activeData.type === 'quiz' && (
                  <QuizView data={activeData} />
                )}
                {activeData.type === 'roadmap' && (
                  <RoadmapView data={activeData} />
                )}

                {/* Refinement Loop Box */}
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                  <RefinementConsole 
                    onSubmit={handleRefinementSubmit} 
                    isLoading={isLoading} 
                    mode={activeData.type}
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
