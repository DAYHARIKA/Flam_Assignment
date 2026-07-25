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
* **AI Model**: Groq (`llama-3.3-70b-versatile`) utilizing standard JSON mode to enforce structured JSON schema formatting.

---

## 🚀 Setup & Execution

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (version 18+ recommended).

### 2. Installation & Startup
To install all dependencies across the monorepo workspace and start both the backend proxy and the frontend developer server concurrently, run:
```bash
npm install
npm start
```
Open your browser to `http://localhost:3000`.

### 3. API Key Configuration (Optional)
Create or edit `backend/.env`:
```env
PORT=3001
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
```
*Note: If no key is set, the app will automatically fall back to **Demo/Mock Mode** using the streaming simulator.*

---

## 📖 Usage

### 1. Generating Study Guides
* **Input Topic**: Enter a specific topic (e.g., *"React Hooks"*) or copy-paste lecture notes, a syllabus, or raw text directly into the dashboard textbox.
* **Select Tool Mode**:
  * **Cards**: Generates flashcards for memorization.
  * **Quiz**: Generates multiple-choice test questions.
  * **Roadmap**: Generates a step-by-step learning progression.
* **Set Options**: Choose the desired difficulty (Easy/Medium/Hard) and depth (Quick/Standard/Detailed).
* **Generate**: Click **Generate Study Guide**. The AI will start streaming the structured content in real-time.

### 2. Interacting with the Study Tools
* **Flashcards**: Click any card to trigger a 3D flip and reveal the answer. Click **Mastered** (or press Up arrow) if you know it, or **Review Again** (or press Down arrow) if you need more practice. Use the **Review Wrong** filter to only cycle through unmastered cards.
* **Quiz**: Click any option to submit your answer. The app will immediately color-code your choice (green for correct, red for incorrect) and open the explanation drawer. When finished, you can click **Re-test Wrong Answers** to start a customized quiz focusing only on questions you missed.
* **Roadmap**: Click on any milestone node to expand it. Check off items in the checklist to update your progress bar, and take the quick **Knowledge Check** mini-quiz at the bottom of the step to validate your understanding.

### 3. Modifying in Real-time (Refinement Console)
* Scroll below your active study material to find the Refinement Console.
* Type changes like *"add 3 harder flashcards"* or *"make explanations simpler"*, then click **Refine**.
* The page will update your current guide in-place using real-time streams, preserving your checklist and mastery progress.

### 4. Managing History
* Use the sidebar to switch between previous sessions.
* Click **New** in the sidebar (or **Back to Dashboard** on the workspace) to start a new topic.
* Click the trash icon next to any saved item to delete it from LocalStorage.

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
