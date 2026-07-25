import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Sun, Moon, RefreshCw, Layout, AlertTriangle, ArrowLeft, Menu, X } from 'lucide-react';

import Dashboard from './components/Dashboard';
import HistorySidebar from './components/HistorySidebar';
import FlashcardsView from './components/FlashcardsView';
import QuizView from './components/QuizView';
import RoadmapView from './components/RoadmapView';
import RefinementConsole from './components/RefinementConsole';
import { parsePartialJson } from './utils/partialJsonParser';

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
      const response = await fetch('/api/generate', {
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-app/80 backdrop-blur-md px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="md:hidden p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleNewSession}>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              StudyBuddy <span className="text-purple-400 font-medium text-sm border border-purple-500/30 px-1.5 py-0.5 rounded bg-purple-500/10 ml-1">AI</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex relative">
        {/* Sidebar for Desktop */}
        <aside className="hidden md:block w-72 border-r border-white/10 p-5 shrink-0 bg-black/10">
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed left-0 top-[73px] bottom-0 w-80 bg-bg-app border-r border-white/10 p-5 z-50 md:hidden animate-slideRight">
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
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-4xl mx-auto w-full space-y-8">
          {/* Recovered Items Banner */}
          {isRecoveredNotice && (
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400 text-xs md:text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Partial Recovery:</span> The AI returned some malformed formatting at the end. We successfully extracted the fully completed cards/questions.
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Generation Error:</span> {error}
                </div>
              </div>
              <div className="flex gap-2 pl-8">
                <button onClick={handleRetry} className="btn py-1.5 px-4 text-xs border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-300 font-semibold flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Request
                </button>
                <button onClick={() => setError(null)} className="btn py-1.5 px-4 text-xs border-white/10 hover:bg-white/5 text-gray-400">
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
            <div className="glass-panel p-12 text-center space-y-6 max-w-xl mx-auto pulse-glow">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-pink-500 animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold">Consulting StudyBuddy AI...</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Generating structured study materials. This may take up to a minute depending on prompt size.
                </p>
              </div>
              
              {/* Shimmer items placeholders */}
              <div className="space-y-3 max-w-md mx-auto pt-4">
                <div className="shimmer-loading h-10 rounded-lg" />
                <div className="shimmer-loading h-24 rounded-lg" />
              </div>
            </div>
          )}

          {/* Streaming display OR final rendering */}
          {activeData && (
            <div className="space-y-6">
              {/* Back Button */}
              <button 
                onClick={handleNewSession}
                className="btn py-1.5 px-3 text-xs flex items-center gap-1.5 border-white/10 text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Dashboard
              </button>

              {/* Streaming Overlay Notice */}
              {isLoading && (
                <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5 text-purple-400 text-xs flex items-center gap-2 justify-center animate-pulse">
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
              <div className="pt-6 border-t border-white/10">
                <RefinementConsole 
                  onSubmit={handleRefinementSubmit} 
                  isLoading={isLoading} 
                  mode={activeData.type}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
