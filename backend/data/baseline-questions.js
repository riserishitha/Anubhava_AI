/**
 * Baseline Assessment Questions for JavaScript
 * 10 questions ranging from basic to advanced
 * Used to assess user's current skill level
 */

export const JAVASCRIPT_BASELINE_QUESTIONS = [
  // BEGINNER LEVEL (Questions 1-3)
  {
    questionId: 'js-baseline-001',
    question: 'What is the correct way to declare a variable in JavaScript that can be reassigned?',
    type: 'MULTIPLE_CHOICE',
    options: [
      'const x = 5;',
      'let x = 5;',
      'var x = 5;',
      'Both B and C are correct'
    ],
    correctAnswer: 'Both B and C are correct',
    points: 1,
    difficulty: 'BEGINNER',
    topic: 'Variables and Data Types',
    explanation: 'Both "let" and "var" allow reassignment. "let" is block-scoped (modern), while "var" is function-scoped (legacy). "const" creates constants that cannot be reassigned.'
  },
  {
    questionId: 'js-baseline-002',
    question: 'What will be the output of: console.log(typeof null);',
    type: 'MULTIPLE_CHOICE',
    options: [
      'null',
      'undefined',
      'object',
      'number'
    ],
    correctAnswer: 'object',
    points: 1,
    difficulty: 'BEGINNER',
    topic: 'Data Types',
    explanation: 'This is a known quirk in JavaScript. typeof null returns "object" due to a bug in the original implementation that was never fixed for backward compatibility.'
  },
  {
    questionId: 'js-baseline-003',
    question: 'Which method is used to add an element to the end of an array?',
    type: 'MULTIPLE_CHOICE',
    options: [
      'array.add()',
      'array.push()',
      'array.append()',
      'array.insert()'
    ],
    correctAnswer: 'array.push()',
    points: 1,
    difficulty: 'BEGINNER',
    topic: 'Arrays',
    explanation: 'The push() method adds one or more elements to the end of an array and returns the new length of the array.'
  },

  // INTERMEDIATE LEVEL (Questions 4-6)
  {
    questionId: 'js-baseline-004',
    question: 'What is the output of: console.log(1 + "2" + 3);',
    type: 'MULTIPLE_CHOICE',
    options: [
      '6',
      '123',
      '15',
      'NaN'
    ],
    correctAnswer: '123',
    points: 1,
    difficulty: 'INTERMEDIATE',
    topic: 'Type Coercion',
    explanation: 'JavaScript performs type coercion. 1 + "2" results in "12" (number is coerced to string), then "12" + 3 results in "123".'
  },
  {
    questionId: 'js-baseline-005',
    question: 'What is a closure in JavaScript?',
    type: 'MULTIPLE_CHOICE',
    options: [
      'A way to close browser windows',
      'A function that has access to variables in its outer scope',
      'A method to end JavaScript execution',
      'A type of loop structure'
    ],
    correctAnswer: 'A function that has access to variables in its outer scope',
    points: 1,
    difficulty: 'INTERMEDIATE',
    topic: 'Closures and Scope',
    explanation: 'A closure is a function that remembers and can access variables from its outer (enclosing) scope, even after the outer function has returned.'
  },
  {
    questionId: 'js-baseline-006',
    question: 'What does the "this" keyword refer to in a regular function?',
    type: 'MULTIPLE_CHOICE',
    options: [
      'Always refers to the global object',
      'Always refers to the function itself',
      'Depends on how the function is called',
      'Always refers to the parent object'
    ],
    correctAnswer: 'Depends on how the function is called',
    points: 1,
    difficulty: 'INTERMEDIATE',
    topic: 'Context and "this"',
    explanation: 'The value of "this" is determined by how a function is called. It can be the global object, the calling object, or explicitly bound using call/apply/bind.'
  },

  // ADVANCED LEVEL (Questions 7-10)
  {
    questionId: 'js-baseline-007',
    question: 'What is the purpose of Promise.all()?',
    type: 'MULTIPLE_CHOICE',
    options: [
      'Executes promises one after another in sequence',
      'Waits for all promises to resolve and returns an array of results',
      'Returns the first promise that resolves',
      'Cancels all pending promises'
    ],
    correctAnswer: 'Waits for all promises to resolve and returns an array of results',
    points: 1,
    difficulty: 'ADVANCED',
    topic: 'Promises and Async',
    explanation: 'Promise.all() takes an iterable of promises and returns a single Promise that resolves when all promises have resolved, or rejects if any promise rejects.'
  },
  {
    questionId: 'js-baseline-008',
    question: 'What is the difference between "==" and "===" in JavaScript?',
    type: 'MULTIPLE_CHOICE',
    options: [
      'No difference, they are the same',
      '"==" checks value only, "===" checks value and type',
      '"==" is faster than "==="',
      '"===" can only compare numbers'
    ],
    correctAnswer: '"==" checks value only, "===" checks value and type',
    points: 1,
    difficulty: 'ADVANCED',
    topic: 'Operators and Comparison',
    explanation: '"==" performs type coercion before comparison, while "===" (strict equality) checks both value and type without coercion. Always prefer "===" for predictable behavior.'
  },
  {
    questionId: 'js-baseline-009',
    question: 'What is event delegation in JavaScript?',
    type: 'MULTIPLE_CHOICE',
    options: [
      'Passing events from child to parent elements',
      'Attaching a single event listener to a parent to handle events on child elements',
      'Preventing default event behavior',
      'Creating custom events'
    ],
    correctAnswer: 'Attaching a single event listener to a parent to handle events on child elements',
    points: 1,
    difficulty: 'ADVANCED',
    topic: 'DOM and Events',
    explanation: 'Event delegation uses event bubbling to handle events at a higher level in the DOM. Instead of adding listeners to many elements, you add one to a parent and use event.target to determine which child triggered it.'
  },
  {
    questionId: 'js-baseline-010',
    question: 'What will be logged: const arr = [1, 2, 3]; arr.map(x => x * 2); console.log(arr);',
    type: 'MULTIPLE_CHOICE',
    options: [
      '[2, 4, 6]',
      '[1, 2, 3]',
      'undefined',
      'Error'
    ],
    correctAnswer: '[1, 2, 3]',
    points: 1,
    difficulty: 'ADVANCED',
    topic: 'Array Methods and Immutability',
    explanation: 'Array.map() returns a NEW array with transformed elements. It does not mutate the original array. The result of map() is not assigned to anything, so arr remains unchanged.'
  }
];

/**
 * Calculate skill level based on score percentage
 */
export const calculateSkillLevel = (percentage) => {
  if (percentage >= 90) return 'EXPERT';
  if (percentage >= 75) return 'ADVANCED';
  if (percentage >= 50) return 'INTERMEDIATE';
  return 'BEGINNER';
};

/**
 * Generate recommendations based on assessment results
 */
export const generateRecommendations = (results) => {
  const { percentage, wrongTopics, skillLevel } = results;

  const recommendations = {
    skillLevel,
    score: percentage,
    strengths: [],
    weaknesses: wrongTopics.slice(0, 3),
    nextSteps: [],
    suggestedModules: []
  };

  // Determine strengths and next steps based on skill level
  if (skillLevel === 'BEGINNER') {
    recommendations.nextSteps = [
      'Master JavaScript fundamentals (variables, data types, operators)',
      'Learn control structures (if/else, loops, switch)',
      'Practice with basic array and object manipulation',
      'Build simple interactive web pages'
    ];
    recommendations.suggestedModules = [
      'JavaScript Fundamentals',
      'Working with Arrays and Objects',
      'DOM Manipulation Basics'
    ];
  } else if (skillLevel === 'INTERMEDIATE') {
    recommendations.nextSteps = [
      'Deep dive into functions, closures, and scope',
      'Master asynchronous JavaScript (Promises, async/await)',
      'Learn modern ES6+ features',
      'Build projects using APIs'
    ];
    recommendations.suggestedModules = [
      'Advanced Functions and Closures',
      'Asynchronous JavaScript',
      'ES6+ Features',
      'Working with APIs'
    ];
  } else if (skillLevel === 'ADVANCED') {
    recommendations.nextSteps = [
      'Master design patterns in JavaScript',
      'Learn advanced async patterns and error handling',
      'Explore performance optimization techniques',
      'Build complex applications with frameworks'
    ];
    recommendations.suggestedModules = [
      'JavaScript Design Patterns',
      'Performance Optimization',
      'Testing and Debugging',
      'React/Vue/Angular Framework'
    ];
  } else { // EXPERT
    recommendations.nextSteps = [
      'Contribute to open-source JavaScript projects',
      'Learn TypeScript for type safety',
      'Master Node.js and backend development',
      'Explore advanced topics (Web Workers, Service Workers, WebAssembly)'
    ];
    recommendations.suggestedModules = [
      'TypeScript Mastery',
      'Node.js Backend Development',
      'Advanced Web APIs',
      'System Design for Web Applications'
    ];
  }

  return recommendations;
};

export default {
  JAVASCRIPT_BASELINE_QUESTIONS,
  calculateSkillLevel,
  generateRecommendations
};