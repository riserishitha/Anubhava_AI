import {
  PROMPT_VERSIONS,
  PROMPT_CONFIG,
  GENERATION_CONFIG,
  BASELINE_CONFIG,
} from '../../constants/index.js';

/**
 * Prompt Service
 * Centralized prompt construction and versioning
 * All prompts are defined, versioned, and controlled server-side
 */
class PromptService {
  /**
   * Generate roadmap creation prompt
   */
  generateRoadmapPrompt({ learningGoal, skillLevel, duration, baselineScore = null }) {
    const context = baselineScore
      ? `The user scored ${baselineScore}% on the baseline assessment, indicating ${this.interpretSkillLevel(baselineScore)} proficiency.`
      : `The user self-assessed as ${skillLevel} level.`;

    const weeks = Number(duration) || 8;
    // Keep the JSON output bounded to avoid model truncation.
    // Roughly: 1 module ~= 2 weeks of study.
    const modulesCount = Math.min(
      8,
      Math.max(GENERATION_CONFIG.MIN_MODULES, Math.ceil(weeks / 2))
    );
    const lessonsPerModule = Math.min(
      5,
      Math.max(GENERATION_CONFIG.MIN_LESSONS_PER_MODULE, 4)
    );

    return `You are an expert learning path designer. Create a personalized learning roadmap.

LEARNING GOAL: ${learningGoal}
SKILL LEVEL: ${skillLevel}
TARGET DURATION: ${weeks} weeks
${context}

Create a structured learning roadmap with EXACTLY ${modulesCount} modules. Each module should have EXACTLY ${lessonsPerModule} lessons.
Keep all "title" fields under 80 characters and all "description" fields under 240 characters.

Return a JSON object with this EXACT structure:
{
  "title": "string",
  "description": "string",
  "difficulty": "BEGINNER|INTERMEDIATE|ADVANCED|EXPERT",
  "estimatedDuration": {
    "weeks": number,
    "hours": number
  },
  "prerequisites": ["string"],
  "learningOutcomes": ["string"],
  "modules": [
    {
      "title": "string",
      "description": "string",
      "order": number,
      "estimatedHours": number,
      "difficulty": "BEGINNER|INTERMEDIATE|ADVANCED|EXPERT",
      "learningObjectives": ["string"],
      "lessons": [
        {
          "title": "string",
          "description": "string",
          "order": number,
          "contentType": "VIDEO|ARTICLE|INTERACTIVE|QUIZ|PROJECT|EXERCISE",
          "estimatedMinutes": number,
          "difficulty": "BEGINNER|INTERMEDIATE|ADVANCED|EXPERT",
          "learningObjectives": ["string"],
          "keyTakeaways": ["string"]
        }
      ]
    }
  ]
}

IMPORTANT RULES:
- Modules must progress from basics to advanced
- Each module should build on previous ones
- Estimate realistic time commitments
- Include practical, hands-on lessons
- Focus on ${learningGoal}
- Consider ${skillLevel} starting level

Version: ${PROMPT_VERSIONS.ROADMAP_GENERATION}`;
  }

  /**
   * Generate baseline assessment prompt based on user's learning goal
   */
  generateBaselineAssessmentPrompt({ learningGoal, skillLevel = 'BEGINNER' }) {
    return `You are an expert assessment designer. Create a baseline assessment to evaluate the user's current knowledge based on their learning goal.

LEARNING GOAL: ${learningGoal}
SELF-ASSESSED LEVEL: ${skillLevel}

Create EXACTLY 10 questions that assess the user's current knowledge related to their learning goal.
The questions should:
- Be directly relevant to "${learningGoal}"
- Cover fundamental to intermediate concepts
- Mix 3 BEGINNER level, 4 INTERMEDIATE level, and 3 ADVANCED level questions
- Include both theoretical understanding and practical application

Return a JSON object with this EXACT structure:
{
  "title": "Baseline Assessment for ${learningGoal}",
  "description": "Answer these questions to help us determine your current knowledge level and personalize your learning path.",
  "timeLimit": 20,
  "passingScore": 50,
  "totalMarks": 10,
  "questions": [
    {
      "questionId": "baseline-q1",
      "question": "string",
      "type": "MULTIPLE_CHOICE",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": "exact matching option string",
      "points": 1,
      "difficulty": "BEGINNER|INTERMEDIATE|ADVANCED",
      "topic": "string",
      "explanation": "string"
    }
  ]
}

CRITICAL RULES:
- Create EXACTLY 10 questions (no more, no less)
- All questions must be MULTIPLE_CHOICE type with exactly 4 options
- correctAnswer must be the EXACT string from one of the options array
- Each question is worth 1 point
- questionId format: "baseline-q1", "baseline-q2", etc.
- Questions should be specific to the learning goal: "${learningGoal}"
- Mix difficulty levels: 3 BEGINNER, 4 INTERMEDIATE, 3 ADVANCED
- Ensure questions are clear, unambiguous, and have one correct answer
- Provide detailed explanations for each answer

Version: ${PROMPT_VERSIONS.ASSESSMENT_CREATION}`;
  }

  /**
   * Generate module assessment prompt
   */
  generateModuleAssessmentPrompt({ moduleTitle, learningObjectives, difficulty }) {
    return `Create a module assessment for: ${moduleTitle}

LEARNING OBJECTIVES:
${learningObjectives.map((obj) => `- ${obj}`).join('\n')}

DIFFICULTY: ${difficulty}

Create 8-12 questions covering all learning objectives.

Return JSON with structure:
{
  "title": "string",
  "description": "string",
  "timeLimit": 20,
  "passingScore": 70,
  "questions": [
    {
      "questionId": "unique-id",
      "question": "string",
      "type": "MULTIPLE_CHOICE|TRUE_FALSE",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": "string or index",
      "points": 1,
      "difficulty": "${difficulty}",
      "topic": "string",
      "explanation": "string"
    }
  ]
}

Version: ${PROMPT_VERSIONS.ASSESSMENT_CREATION}`;
  }

  /**
   * Generate explanation prompt with RAG context
   */
  generateExplanationPrompt({ question, context, userLevel }) {
    return `You are a patient, expert tutor. Explain this concept clearly.

USER QUESTION: ${question}
USER LEVEL: ${userLevel}

RELEVANT CONTENT:
${context}

Provide a clear, detailed explanation appropriate for ${userLevel} level learner.

Return JSON:
{
  "explanation": "detailed explanation string",
  "examples": ["example1", "example2"],
  "relatedConcepts": ["concept1", "concept2"],
  "furtherReading": ["resource1", "resource2"]
}

Version: ${PROMPT_VERSIONS.EXPLANATION_GENERATION}`;
  }

  /**
   * Generate doubt resolution prompt with RAG
   */
  generateDoubtResolutionPrompt({ doubt, lessonContext, retrievedContent }) {
    return `You are helping a student understand a concept.

STUDENT'S DOUBT: ${doubt}

CURRENT LESSON CONTEXT:
${lessonContext}

RELEVANT INFORMATION:
${retrievedContent}

Provide a clear, helpful response that:
1. Directly answers the question
2. Provides examples
3. Relates to the current lesson
4. Encourages further learning

Return JSON:
{
  "answer": "string",
  "examples": ["string"],
  "tips": ["string"],
  "nextSteps": ["string"]
}

Version: ${PROMPT_VERSIONS.DOUBT_RESOLUTION}`;
  }

  /**
   * Generate remediation content prompt
   */
  generateRemediationPrompt({ failedTopics, originalContent, userScore }) {
    return `Create remediation content for topics the user struggled with.

FAILED TOPICS:
${failedTopics.map((t) => `- ${t}`).join('\n')}

USER SCORE: ${userScore}%

ORIGINAL CONTENT:
${originalContent}

Create simplified, focused content to help the user master these topics.

Return JSON:
{
  "title": "Remediation: [Topic]",
  "description": "string",
  "focusAreas": ["string"],
  "simplifiedLessons": [
    {
      "title": "string",
      "content": "string",
      "exercises": ["string"],
      "checkpoints": ["string"]
    }
  ],
  "practiceQuestions": [
    {
      "question": "string",
      "answer": "string",
      "hint": "string"
    }
  ]
}

Version: ${PROMPT_VERSIONS.REMEDIATION}`;
  }

  /**
   * Interpret skill level from score
   */
  interpretSkillLevel(score) {
    if (score >= 90) return 'EXPERT';
    if (score >= 70) return 'ADVANCED';
    if (score >= 40) return 'INTERMEDIATE';
    return 'BEGINNER';
  }

  /**
   * Truncate context to fit token limit
   */
  truncateContext(text, maxLength = PROMPT_CONFIG.MAX_CONTEXT_LENGTH) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Get prompt version
   */
  getPromptVersion(type) {
    return PROMPT_VERSIONS[type] || 'v1.0';
  }
}

export default new PromptService();