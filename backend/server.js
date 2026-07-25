import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const hasKey = () => !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here';

// Health Check / API check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    mode: hasKey() ? 'production' : 'mock',
    message: hasKey()
      ? 'Connected to Groq API (llama-3.3-70b-versatile)'
      : 'Running in Mock Mode. Set GROQ_API_KEY in backend/.env for real AI generation.'
  });
});

// ─── Mock Data ─────────────────────────────────────────────────────────
const MOCK_DATA = {
  flashcards: {
    "react-hooks": {
      type: "flashcards",
      title: "React Hooks Fundamentals",
      cards: [
        { id: "card-1", front: "What is the primary purpose of useState?", back: "It is a React Hook that lets you add state variables to functional components.", hint: "Think about component local memory." },
        { id: "card-2", front: "When does the useEffect cleanup function run?", back: "It runs before the component unmounts, and before running the effect again on subsequent renders if dependencies change.", hint: "It cleans up subscriptions or event listeners." },
        { id: "card-3", front: "What is the difference between useMemo and useCallback?", back: "useMemo memoizes the *result* of a function calculation, while useCallback memoizes the *function instance* itself to prevent unnecessary re-renders of children.", hint: "One returns a value, the other returns a function reference." },
        { id: "card-4", front: "What rule must be followed when calling React Hooks?", back: "Hooks must only be called at the top level of your functional component (not inside loops or conditions) and only from React function components or custom Hooks.", hint: "Rules of Hooks: order of calls must remain constant." },
        { id: "card-5", front: "What does useRef return?", back: "It returns a mutable ref object with a '.current' property that persists across renders without triggering a re-render when changed.", hint: "Useful for DOM node references or instance variables." }
      ]
    },
    default: {
      type: "flashcards",
      title: "General Study Flashcards",
      cards: [
        { id: "card-1", front: "Core Concept", back: "An explanation of the first key concept of the topic.", hint: "A basic hint." },
        { id: "card-2", front: "Secondary Concept", back: "An explanation of the secondary details and relationships.", hint: "Another hint." },
        { id: "card-3", front: "Application Example", back: "How these concepts are applied in practice to solve real problems.", hint: "Practical example hint." }
      ]
    }
  },
  quiz: {
    "react-hooks": {
      type: "quiz",
      title: "React Hooks Quiz",
      questions: [
        { id: "q-1", question: "Which hook should be used to perform DOM manipulations directly after renders?", options: ["useState", "useEffect", "useRef", "useLayoutEffect"], answerIndex: 3, explanation: "useLayoutEffect fires synchronously after all DOM mutations but before the browser paints, making it ideal for measuring layout or direct DOM writes." },
        { id: "q-2", question: "What happens if you omit the dependency array in useEffect?", options: ["The effect runs only once on mount", "The effect runs on every single render", "The effect never runs", "It throws a syntax error"], answerIndex: 1, explanation: "Without a dependency array, useEffect runs after every complete render, which can lead to performance issues or infinite loops if state is updated inside." },
        { id: "q-3", question: "Does updating a useRef value trigger a component re-render?", options: ["Yes, always", "No, never", "Only if it is attached to a DOM node", "Only if state updates concurrently"], answerIndex: 1, explanation: "Updating `.current` does not cause React to re-render. It is a plain JavaScript object whose identity is preserved." },
        { id: "q-4", question: "Which hook is best suited for complex state logic involving multiple sub-values?", options: ["useState", "useRef", "useReducer", "useContext"], answerIndex: 2, explanation: "useReducer is preferred when you have complex state logic that transitions through actions, similar to Redux." }
      ]
    },
    default: {
      type: "quiz",
      title: "General Knowledge Quiz",
      questions: [
        { id: "q-1", question: "What is the primary aspect of this topic?", options: ["Option A: Primary Definition", "Option B: Secondary Detail", "Option C: Distractor Option", "Option D: None of the above"], answerIndex: 0, explanation: "Option A represents the core definition based on general learning resources." },
        { id: "q-2", question: "How does the second concept apply to the first?", options: ["It contradicts it", "It is completely unrelated", "It builds upon and refines the core concept", "It deprecates it"], answerIndex: 2, explanation: "Concepts in this area are cumulative, meaning each step builds on the preceding ones." }
      ]
    }
  },
  roadmap: {
    "react-hooks": {
      type: "roadmap",
      title: "React State & Lifecycle Roadmap",
      steps: [
        {
          id: "step-1", title: "1. Understanding Component State", description: "Learn how React manages local memory.",
          details: "React components are pure functions, but they need to remember things. `useState` allows you to declare state variables. Every state change schedules a re-render of the component and its children.",
          checklist: ["Understand the state updater function syntax", "Learn why you should never mutate state directly", "Implement a simple toggle and text input state"],
          miniQuiz: { question: "Why should we avoid mutating state directly?", options: ["It will crash the browser", "React won't know the state changed and won't re-render", "It is deprecated in Javascript", "It makes code harder to compile"], answerIndex: 1, explanation: "React relies on shallow comparison of state references. Mutating state in-place keeps the same reference, so React skips re-rendering." }
        },
        {
          id: "step-2", title: "2. Master Side Effects (useEffect)", description: "Sync your UI with external systems.",
          details: "Effects let you run code after rendering to synchronize with network, subscription, or DOM systems. Cleaning up after effects is crucial to prevent memory leaks.",
          checklist: ["Learn when to clean up subscriptions", "Understand the dependency array rules", "Avoid infinite loop pitfalls when updating state in effects"],
          miniQuiz: { question: "What does an empty dependency array [] signify in useEffect?", options: ["The effect runs on every render", "The effect runs once after the initial render (mount)", "The effect never runs", "The effect runs before rendering"], answerIndex: 1, explanation: "An empty dependency array tells React that the effect doesn't depend on any props or state, so it only needs to run once when the component mounts." }
        },
        {
          id: "step-3", title: "3. Performance Tuning (Memoization)", description: "Optimize render trees using useMemo and useCallback.",
          details: "Optimization hooks should be used selectively. `useMemo` caches values, and `useCallback` caches function definitions. Use them when rendering children is heavy or dependency checks fail.",
          checklist: ["Profile rendering bottlenecks", "Apply useMemo for heavy calculations", "Apply useCallback for callbacks passed to memoized children"],
          miniQuiz: { question: "Does useMemo make your initial mount faster?", options: ["Yes, significantly", "No, it adds a tiny overhead on mount to save time on subsequent updates", "Only on mobile devices", "Only in production builds"], answerIndex: 1, explanation: "useMemo does not speed up the first render. It actually runs the computation then and stores it, adding a minor overhead to save computation on subsequent renders." }
        }
      ]
    },
    default: {
      type: "roadmap",
      title: "Concept Learning Path",
      steps: [
        {
          id: "step-1", title: "1. Core Introduction", description: "A solid introduction to the foundational concepts.",
          details: "This step sets up the basic definitions and terminologies.",
          checklist: ["Define core terms", "Establish historical context", "Identify primary use cases"],
          miniQuiz: { question: "What is the primary starting point?", options: ["Beginning with fundamentals", "Skipping to advanced chapters", "Analyzing statistics", "Writing code immediately"], answerIndex: 0, explanation: "Fundamentals lay the groundwork for all subsequent learning paths." }
        },
        {
          id: "step-2", title: "2. Intermediate Application", description: "Transitioning from theory to active practice.",
          details: "Now that the fundamentals are established, we look at how they connect and resolve practical problem scenarios.",
          checklist: ["Examine case studies", "Solve basic exercises", "Compare different approaches"],
          miniQuiz: { question: "How should you practice intermediate steps?", options: ["By reading only", "Through active problem solving", "By asking others to do it", "By waiting"], answerIndex: 1, explanation: "Active practice establishes neural paths for long-term memory retrieval." }
        }
      ]
    }
  }
};

// ─── Mock SSE Streamer ─────────────────────────────────────────────────
function streamMockData(res, data) {
  const jsonString = JSON.stringify(data);
  const chunkSize = 15;
  let index = 0;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const timer = setInterval(() => {
    if (index >= jsonString.length) {
      res.write(`data: [DONE]\n\n`);
      res.end();
      clearInterval(timer);
      return;
    }
    const chunk = jsonString.slice(index, index + chunkSize);
    index += chunkSize;
    res.write(`data: ${chunk}\n\n`);
  }, 40);
}

// ─── Prompt Builder ────────────────────────────────────────────────────
function getSystemPrompt(mode) {
  let schema = '';
  if (mode === 'flashcards') {
    schema = `{ "type": "flashcards", "title": "...", "cards": [{ "id": "card-1", "front": "Question", "back": "Answer", "hint": "Hint" }] }`;
  } else if (mode === 'quiz') {
    schema = `{ "type": "quiz", "title": "...", "questions": [{ "id": "q-1", "question": "...", "options": ["A","B","C","D"], "answerIndex": 0, "explanation": "..." }] }`;
  } else if (mode === 'roadmap') {
    schema = `{ "type": "roadmap", "title": "...", "steps": [{ "id": "step-1", "title": "...", "description": "...", "details": "...", "checklist": ["task1","task2"], "miniQuiz": { "question": "...", "options": ["A","B","C","D"], "answerIndex": 0, "explanation": "..." } }] }`;
  }

  return `You are an expert study assistant. Generate high-quality learning material.
You MUST return ONLY a single valid JSON object matching this schema:
${schema}
No markdown fences, no extra text. Only valid JSON. Ensure all ids are unique (card-1, card-2, q-1, q-2, step-1, step-2...).`;
}

// ─── Generate Endpoint ─────────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { topic, mode, difficulty, depth, previousState, prompt } = req.body;

  // ── Mock Mode ──
  if (!hasKey()) {
    console.log(`[MOCK MODE] Generating ${mode} for "${topic || 'Default'}"`);

    if (topic && topic.toLowerCase() === 'simulate-error') {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Simulated Server Error' }));
      return;
    }

    let finalData;
    const normalizedTopic = (topic || '').toLowerCase();

    if (previousState && prompt) {
      finalData = JSON.parse(JSON.stringify(previousState));
      finalData.title = `${previousState.title} (Refined)`;
      if (mode === 'flashcards') {
        finalData.cards.push({ id: `card-${finalData.cards.length + 1}`, front: `Refined: ${prompt}`, back: `Detailed explanation about ${prompt}.`, hint: "Added via refinement." });
      } else if (mode === 'quiz') {
        finalData.questions.push({ id: `q-${finalData.questions.length + 1}`, question: `How does "${prompt}" impact this topic?`, options: ["It optimizes it", "It degrades it", "No effect", "Replaces it"], answerIndex: 0, explanation: `Dynamically added about: ${prompt}` });
      } else if (mode === 'roadmap') {
        finalData.steps.push({ id: `step-${finalData.steps.length + 1}`, title: `Deep Dive: ${prompt}`, description: "Added exploration step.", details: `Notes on ${prompt}.`, checklist: [`Review ${prompt}`, "Practice examples"], miniQuiz: { question: `Is ${prompt} essential?`, options: ["Yes", "No"], answerIndex: 0, explanation: "Yes, it is central to advanced understanding." } });
      }
    } else {
      const searchKey = normalizedTopic.includes('react') ? 'react-hooks' : 'default';
      finalData = JSON.parse(JSON.stringify(MOCK_DATA[mode]?.[searchKey] || MOCK_DATA[mode]?.default));
      if (topic) finalData.title = `${topic.charAt(0).toUpperCase() + topic.slice(1)} Study Deck`;
    }

    streamMockData(res, finalData);
    return;
  }

  // ── Production Mode: Groq API ──
  try {
    const systemPrompt = getSystemPrompt(mode);

    let userMessage = '';
    if (previousState && prompt) {
      userMessage = `Revising existing study session for "${topic}".\nCurrent state:\n${JSON.stringify(previousState)}\n\nUser request: "${prompt}"\n\nReturn a fully updated and merged JSON object. Maintain the same schema.`;
    } else {
      userMessage = `Generate study tools for: "${topic}". Mode: ${mode}. Difficulty: ${difficulty}. Depth: ${depth}.`;
    }

    console.log(`[GROQ API] Calling llama-3.3-70b-versatile for "${topic}" (mode: ${mode})`);

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
        response_format: { type: 'json_object' }
      })
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      throw new Error(`Groq API error (${groqResponse.status}): ${errText}`);
    }

    // Stream chunks from Groq to client via SSE
    const reader = groqResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process SSE lines from Groq
      let lineEnd = buffer.indexOf('\n');
      while (lineEnd !== -1) {
        const line = buffer.slice(0, lineEnd).trim();
        buffer = buffer.slice(lineEnd + 1);
        lineEnd = buffer.indexOf('\n');

        if (line.startsWith('data: ')) {
          const payload = line.slice(6).trim();

          if (payload === '[DONE]') {
            res.write(`data: [DONE]\n\n`);
            continue;
          }

          try {
            const parsed = JSON.parse(payload);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              res.write(`data: ${content}\n\n`);
            }
          } catch (e) {
            // Skip malformed chunks
          }
        }
      }
    }

    // Ensure [DONE] signal is sent
    res.write(`data: [DONE]\n\n`);
    res.end();

  } catch (error) {
    console.error('[GROQ API ERROR]', error.message);
    // If headers already sent, use SSE error format
    if (res.headersSent) {
      res.write(`data: [ERROR] ${error.message || 'Unknown API Error'}\n\n`);
      res.end();
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Failed to generate study materials' }));
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
