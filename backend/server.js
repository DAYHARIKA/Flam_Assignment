import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health Check / API check
app.get('/api/status', (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';
  res.json({
    status: 'ok',
    mode: hasKey ? 'production' : 'mock',
    message: hasKey ? 'Connected to Gemini API' : 'Running in Mock Mode. Set GEMINI_API_KEY in backend/.env for real AI generation.'
  });
});

// Mock generator data dictionary for simulation
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
          id: "step-1",
          title: "1. Understanding Component State",
          description: "Learn how React manages local memory.",
          details: "React components are pure functions, but they need to remember things. `useState` allows you to declare state variables. Every state change schedules a re-render of the component and its children.",
          checklist: ["Understand the state updater function syntax", "Learn why you should never mutate state directly", "Implement a simple toggle and text input state"],
          miniQuiz: {
            question: "Why should we avoid mutating state directly (e.g. state.count = 5)?",
            options: ["It will crash the browser", "React won't know the state changed and won't re-render", "It is deprecated in Javascript", "It makes code harder to compile"],
            answerIndex: 1,
            explanation: "React relies on shallow comparison of state references. Mutating state in-place keeps the same reference, so React skips re-rendering."
          }
        },
        {
          id: "step-2",
          title: "2. Master Side Effects (useEffect)",
          description: "Sync your UI with external systems.",
          details: "Effects let you run code after rendering to synchronize with network, subscription, or DOM systems. Cleaning up after effects is crucial to prevent memory leaks.",
          checklist: ["Learn when to clean up subscriptions", "Understand the dependency array rules", "Avoid infinite loop pitfalls when updating state in effects"],
          miniQuiz: {
            question: "What does an empty dependency array `[]` signify in useEffect?",
            options: ["The effect runs on every render", "The effect runs once after the initial render (mount)", "The effect never runs", "The effect runs before rendering"],
            answerIndex: 1,
            explanation: "An empty dependency array tells React that the effect doesn't depend on any props or state, so it only needs to run once when the component mounts."
          }
        },
        {
          id: "step-3",
          title: "3. Performance Tuning (Memoization)",
          description: "Optimize render trees using useMemo and useCallback.",
          details: "Optimization hooks should be used selectively. `useMemo` caches values, and `useCallback` caches function definitions. Use them when rendering children is heavy or dependency checks fail.",
          checklist: ["Profile rendering bottlenecks", "Apply useMemo for heavy calculations", "Apply useCallback for callbacks passed to memoized children"],
          miniQuiz: {
            question: "Does useMemo make your initial mount faster?",
            options: ["Yes, significantly", "No, it adds a tiny overhead on mount to save time on subsequent updates", "Only on mobile devices", "Only in production builds"],
            answerIndex: 1,
            explanation: "useMemo does not speed up the first render. It actually runs the computation then and stores it, adding a minor overhead to save computation on subsequent renders."
          }
        }
      ]
    },
    default: {
      type: "roadmap",
      title: "Concept Learning Path",
      steps: [
        {
          id: "step-1",
          title: "1. Core Introduction",
          description: "A solid introduction to the foundational concepts.",
          details: "This step sets up the basic definitions and terminologies. Understanding this is key to proceeding with the remainder of the study track.",
          checklist: ["Define core terms", "Establish historical context", "Identify primary use cases"],
          miniQuiz: {
            question: "What is the primary starting point?",
            options: ["Beginning with fundamentals", "Skipping to advanced chapters", "Analyzing statistics", "Writing code immediately"],
            answerIndex: 0,
            explanation: "Fundamentals lay the groundwork for all subsequent learning paths."
          }
        },
        {
          id: "step-2",
          title: "2. Intermediate Application",
          description: "Transitioning from theory to active practice.",
          details: "Now that the fundamentals are established, we look at how they connect and resolve practical problem scenarios.",
          checklist: ["Examine case studies", "Solve basic exercises", "Compare different approaches"],
          miniQuiz: {
            question: "How should you practice intermediate steps?",
            options: ["By reading only", "Through active problem solving", "By asking others to do it", "By waiting"],
            answerIndex: 1,
            explanation: "Active practice establishes neural paths for long-term memory retrieval."
          }
        }
      ]
    }
  }
};

// SSE Generator stream helper
function streamData(res, data) {
  const jsonString = JSON.stringify(data);
  const chunkSize = 15; // smaller chunks for realism
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
  }, 40); // 40ms interval streams realistic typing speed
}

// Prompt compilation utility
function getSystemPrompt(mode) {
  let schemaDescription = '';
  if (mode === 'flashcards') {
    schemaDescription = `
    {
      "type": "flashcards",
      "title": "Short title of the topic",
      "cards": [
        {
          "id": "card-1",
          "front": "The question or term",
          "back": "The answer or definition",
          "hint": "Optional short hint to prompt the memory"
        }
      ]
    }`;
  } else if (mode === 'quiz') {
    schemaDescription = `
    {
      "type": "quiz",
      "title": "Short title of the quiz",
      "questions": [
        {
          "id": "q-1",
          "question": "The question statement",
          "options": ["Option 0", "Option 1", "Option 2", "Option 3"],
          "answerIndex": 0, // 0-based index of correct option
          "explanation": "Brief explanation of why this answer is correct"
        }
      ]
    }`;
  } else if (mode === 'roadmap') {
    schemaDescription = `
    {
      "type": "roadmap",
      "title": "Title of the learning path",
      "steps": [
        {
          "id": "step-1",
          "title": "Step Name",
          "description": "Short summary of this step",
          "details": "Thorough markdown explanation of this concept",
          "checklist": ["Sub-task 1 to complete", "Sub-task 2 to complete"],
          "miniQuiz": {
            "question": "Quick validation question",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answerIndex": 0,
            "explanation": "Why Option A is correct"
          }
        }
      ]
    }`;
  }

  return `You are an expert study assistant. Your goal is to generate high-quality learning material for the topic provided.
  You MUST return ONLY a single JSON object. No other text, no markdown code block fences (like \`\`\`json ... \`\`\`).
  The JSON structure must exactly match the schema below:
  ${schemaDescription}

  Ensure explanations are clear, educational, and accurate. Do not include duplicate items. Keep ids formatted cleanly (e.g. card-1, q-1, step-1).
  Difficulty context: Make questions align with the specified difficulty.
  Depth context: Return more detailed steps or cards if the depth is "detailed", or fewer if "quick".`;
}

// Generate SSE endpoint
app.post('/api/generate', async (req, res) => {
  const { topic, mode, difficulty, depth, previousState, prompt } = req.body;
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';

  // 1. Handling Mock Mode
  if (!hasKey) {
    console.log(`[MOCK MODE] Generating ${mode} for topic "${topic || 'Default'}"`);
    
    // Simulate error generation if explicitly requested
    if (topic && topic.toLowerCase() === 'simulate-error') {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to generate study materials: Simulated Server Error' }));
      return;
    }
    if (topic && topic.toLowerCase() === 'simulate-malformed') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      res.write(`data: {"type": "${mode}", "title": "Malformed Topic", "cards": [{"id": 1, "front": "broken JSON due to unexpected EOF\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    }

    // Determine mock content
    let finalData;
    const normalizedTopic = (topic || '').toLowerCase();
    
    if (previousState && prompt) {
      // Refinement request simulation
      finalData = JSON.parse(JSON.stringify(previousState));
      finalData.title = `${previousState.title} (Refined)`;
      
      if (mode === 'flashcards') {
        finalData.cards.push({
          id: `card-${finalData.cards.length + 1}`,
          front: `Refined Question about: ${prompt}`,
          back: `Refined detailed explanation matching your request.`,
          hint: "New card added via refinement."
        });
      } else if (mode === 'quiz') {
        finalData.questions.push({
          id: `q-${finalData.questions.length + 1}`,
          question: `Refined Question: How does "${prompt}" impact this topic?`,
          options: ["It optimizes it", "It degrades it", "It has no effect", "It completely replaces it"],
          answerIndex: 0,
          explanation: `This question was dynamically added to test your knowledge about: ${prompt}`
        });
      } else if (mode === 'roadmap') {
        finalData.steps.push({
          id: `step-${finalData.steps.length + 1}`,
          title: `Refined Step: Deep Dive into ${prompt}`,
          description: `An added exploration step requested by prompt.`,
          details: `Detailed notes concerning: **${prompt}**. This step covers custom practical applications and advanced debugging.`,
          checklist: [`Review concepts related to ${prompt}`, `Practice writing code blocks`],
          miniQuiz: {
            question: `Is ${prompt} essential to advanced architectures?`,
            options: ["Yes", "No"],
            answerIndex: 0,
            explanation: "Yes, integration of refined subjects is central to real-world performance."
          }
        });
      }
    } else {
      // Standard generation simulation
      const searchKey = normalizedTopic.includes('react') ? 'react-hooks' : 'default';
      finalData = MOCK_DATA[mode]?.[searchKey] || MOCK_DATA[mode]?.default;
      
      // Override title based on user topic
      if (topic) {
        finalData = JSON.parse(JSON.stringify(finalData)); // deep clone
        finalData.title = `${topic.charAt(0).toUpperCase() + topic.slice(1)} Study Deck`;
      }
    }

    // Send mock data as SSE stream
    streamData(res, finalData);
    return;
  }

  // 2. Production Mode: Calling Gemini API
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const systemPrompt = getSystemPrompt(mode);

    let userPromptText = '';
    if (previousState && prompt) {
      userPromptText = `We are revising the existing study session data for "${topic}".
      Here is the current state of the generated study tools in JSON format:
      ${JSON.stringify(previousState)}
      
      The user wants to make this modification:
      "${prompt}"
      
      Please return a fully updated and merged JSON object satisfying this request. Maintain the same schema structure.
      Change title if appropriate or append "(Refined)". Make sure the JSON remains valid.`;
    } else {
      userPromptText = `Generate study tools for the topic: "${topic}".
      Mode: ${mode}
      Difficulty Level: ${difficulty}
      Depth: ${depth}`;
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    console.log(`[GEMINI API] Calling gemini-2.5-flash for topic "${topic}" (mode: ${mode})`);
    
    // Set headers for Event Stream (SSE)
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Call API with stream
    const result = await model.generateContentStream({
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser request:\n${userPromptText}` }] }
      ]
    });

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      res.write(`data: ${chunkText}\n\n`);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error) {
    console.error('[GEMINI API ERROR]', error);
    // SSE error reporting format
    res.write(`data: [ERROR] ${error.message || 'Unknown API Error'}\n\n`);
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
