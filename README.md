# StudyBuddy AI - Interactive Study Assistant

**StudyBuddy AI** is a premium, responsive React study assistant designed to transform notes or study topics into reliable, interactive tools. It offers **3D Flashcards**, **Interactive Quizzes**, and **Concept Roadmaps** with a real-time AI generation loop, secure backend proxy, session history, and robust error-recovery features.

---

## 🌟 Key Features

1. **Interactive Study Tools**:
   * **Flashcard Deck**: 3D card flipping, tracking for "Mastered" vs "Still Reviewing" status, and a filter to review wrong/unmastered cards. Includes full keyboard shortcuts.
   * **Interactive Quiz**: Real-time multiple-choice options with instant correct/incorrect visual states, explanation boxes, and score meters. Includes a **Re-test Wrong Answers** workflow.
   * **Concept Roadmap**: Node-based learning path. Milestone modules expand to reveal core summaries, sub-task checklists, and mini-checkpoint validation quizzes.
2. **Refinement Loop (Follow-up Prompts)**:
   * A console below active study tools lets you type commands like *"add 3 more hard cards about X"* or *"simplify explanations"*. The application feeds the active state back to the model, merging edits in place rather than starting from scratch.
3. **Robust Partial JSON Streaming Parser**:
   * Utilizes a hand-rolled bracket-balancing scanner in `frontend/src/utils/partialJsonParser.js` to parse incoming JSON tokens in real time. Flashcards, questions, or roadmaps render progressively as the AI generates them.
4. **Failure Recovery and Error Shielding**:
   * **Race Condition Shielding**: Standardizes request state tracking with `AbortController`. Rapid clicks cancel pending network requests, preventing late-arriving stale data from overwriting newer active states.
   * **Partial Data Recovery**: If the network drops or the AI returns malformed JSON at the end, the client extracts whatever completed objects were successfully generated, saves them as a recovered session, and notifies the user with a warning banner instead of crashing or discarding progress.
5. **No API Key Required (Smart Mock Mode)**:
   * The backend detects if `GEMINI_API_KEY` is missing from `backend/.env` and automatically switches to **Demo/Mock Mode**. It simulates an active AI connection by streaming realistic JSON chunks for all modes, allowing the app to run out-of-the-box.
6. **Local Persistence**:
   * All generated decks, quizzes, and roadmaps are saved to `localStorage` and accessible from the left-hand sidebar history.
7. **Premium Design**:
   * Curated HSL variables, fluid typography, dark mode by default with light mode toggle support, custom scrollbars, and full mobile optimization.

---

## 🛠️ Architecture

* **Frontend**: React (Functional Components & Hooks), Vite, Lucide Icons, and Vanilla CSS.
* **Backend**: Node/Express server acting as a secure API gateway. Streams structured responses using Server-Sent Events (SSE). Keep your API key safe in `.env`.
* **AI Model**: Google Gemini (`gemini-2.5-flash`) utilizing `responseMimeType: "application/json"` to enforce structured JSON schema formatting.

---

## 🚀 Setup & Execution

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (version 18+ recommended).

### 2. Installation
Run the root setup command to install dependencies for the root monorepo, backend, and frontend concurrently:
```bash
npm run setup
```

### 3. API Key Configuration (Optional)
Create or edit `backend/.env`:
```env
PORT=3001
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```
*Note: If no key is set, the app will run in **Demo/Mock Mode** using the streaming simulator.*

### 4. Running the Development Server
Launch both the backend and frontend concurrently:
```bash
npm run dev
```
Open your browser to `http://localhost:3000`.

---

## 🧠 AI-Usage Note

* **Pair Programming**: I paired with Gemini to plan the layout, structure the components, and format the CSS design system.
* **Hand-Coded Core Logic**: To ensure maximum reliability and prevent bugs:
  * The SSE streaming reader and chunk buffer splitting were hand-coded.
  * The custom brace-balancing partial JSON parser was designed and implemented without external library bloat.
  * The LocalStorage persistence, state merges, and mock generation systems were hand-developed to guarantee fail-safe behaviors.

---

## ⚠️ Known Limitations

* **Refinement State Size**: Sending very large roadmaps back to the model for refinements can consume larger context sizes.
* **Local Storage Limits**: Storing thousands of large roadmap sessions could hit standard browser LocalStorage limits (~5MB).

---

## ⏱️ Time Spent

* **Active Planning & Architecture Design**: 45 minutes
* **Backend SSE Proxy & Mock Generator Development**: 1 hour
* **Frontend Components, 3D CSS animations, & Theme styling**: 1.5 hours
* **Real-time Partial JSON Parser & Error Recovery systems**: 45 minutes
* **Verification & Testing**: 30 minutes
* **Total Time**: ~4.5 Hours
