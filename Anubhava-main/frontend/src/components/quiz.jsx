import React, { useState } from 'react';

const questions = [
  { q: "Which hook is used for side effects in React?", options: ["useState", "useEffect", "useContext", "useReducer"], a: "useEffect" },
  { q: "What is the correct command to create a new React app?", options: ["npx create-react-app", "npm install react", "npx start-react", "react-new-app"], a: "npx create-react-app" },
  { q: "What is JSX?", options: ["A CSS framework", "JavaScript XML", "A database type", "A browser engine"], a: "JavaScript XML" },
  { q: "How many elements can a React component return?", options: ["Only one (wrapped)", "As many as you want", "Exactly two", "None"], a: "Only one (wrapped)" },
  { q: "What is the purpose of useRef?", options: ["To style components", "To persist values without re-renders", "To handle global state", "To fetch APIs"], a: "To persist values without re-renders" },
  { q: "Which company developed React?", options: ["Google", "Microsoft", "Meta (Facebook)", "Apple"], a: "Meta (Facebook)" },
  { q: "What are 'props' in React?", options: ["Internal state", "External inputs to a component", "CSS properties", "Functions only"], a: "External inputs to a component" },
  { q: "Which hook handles complex state logic?", options: ["useState", "useMemo", "useReducer", "useLayoutEffect"], a: "useReducer" },
  { q: "What is the Virtual DOM?", options: ["A direct copy of the HTML", "A lightweight representation of the real DOM", "A server-side tool", "A Chrome extension"], a: "A lightweight representation of the real DOM" },
  { q: "What is the default port for React local dev?", options: ["3000", "8080", "5000", "4000"], a: "3000" }
];

export default function Quiz() {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const handleAnswer = (opt) => {
    if (opt === questions[current].a) setScore(score + 1);
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      setFinished(true);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-r from-green-100 via-teal-100 to-blue-100 p-6">
      {/* Main Card */}
      <div className="w-full max-w-5xl bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-200 flex flex-col md:flex-row min-h-[500px]">
        
        {/* Left Panel */}
        <div className="md:w-1/3 bg-gradient-to-b from-green-500 to-emerald-600 p-12 text-white flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-extrabold mb-2 uppercase tracking-tight">React Master</h1>
            <p className="text-green-100 text-lg">Test your knowledge</p>
          </div>
          
          <div className="space-y-4">
            <div className="text-6xl font-bold">{current + 1}<span className="text-green-200 text-2xl">/ {questions.length}</span></div>
            <div className="w-full bg-green-700 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-green-300 h-full transition-all duration-500" 
                style={{ width: `${((current + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="md:w-2/3 p-12 flex flex-col justify-center bg-white">
          {finished ? (
            <div className="text-center animate-in fade-in zoom-in duration-500">
              <h2 className="text-4xl font-bold text-slate-800 mb-2">🎉 Quiz Complete!</h2>
              <p className="text-xl text-slate-600 mb-8">You mastered {score} out of {questions.length} topics.</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg"
              >
                Restart Session
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-700 mb-8 leading-relaxed">
                {questions[current].q}
              </h2>
              
              <div className="grid grid-cols-1 gap-4">
                {questions[current].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(option)}
                    className="group flex items-center p-5 border-2 border-slate-200 rounded-2xl text-left transition-all hover:border-green-400 hover:bg-green-50 active:scale-[0.98]"
                  >
                    <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 font-bold mr-4 group-hover:bg-green-500 group-hover:text-white transition-colors">
                      {idx + 1}
                    </span>
                    <span className="text-lg font-medium text-slate-700 group-hover:text-green-700">
                      {option}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}