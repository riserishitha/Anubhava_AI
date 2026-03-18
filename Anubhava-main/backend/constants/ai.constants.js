/**
 * AI Service Constants
 * Configuration for AI model behavior and prompt management
 */

// Prompt versions for tracking and A/B testing
export const PROMPT_VERSIONS = {
  ROADMAP_GENERATION: 'v2.1',
  ASSESSMENT_CREATION: 'v1.5',
  EXPLANATION_GENERATION: 'v1.8',
  DOUBT_RESOLUTION: 'v1.3',
  REMEDIATION: 'v1.6',
};

// AI response formats
export const RESPONSE_FORMATS = {
  JSON: 'JSON',
  TEXT: 'TEXT',
  STRUCTURED: 'STRUCTURED',
};

// Prompt templates configuration
export const PROMPT_CONFIG = {
  MAX_CONTEXT_LENGTH: 4000,
  MAX_RESPONSE_TOKENS: 2048,
  TEMPERATURE_CREATIVE: 0.9,
  TEMPERATURE_FACTUAL: 0.3,
  TEMPERATURE_BALANCED: 0.7,
};

// AI service types
export const AI_SERVICE_TYPES = {
  ROADMAP_GENERATOR: 'ROADMAP_GENERATOR',
  ASSESSMENT_GENERATOR: 'ASSESSMENT_GENERATOR',
  EXPLANATION_GENERATOR: 'EXPLANATION_GENERATOR',
  DOUBT_RESOLVER: 'DOUBT_RESOLVER',
  CONTENT_RECOMMENDER: 'CONTENT_RECOMMENDER',
};

// RAG (Retrieval-Augmented Generation) configuration
export const RAG_CONFIG = {
  TOP_K_RESULTS: 5,
  SIMILARITY_THRESHOLD: 0.7,
  CONTEXT_WINDOW_CHUNKS: 3,
  EMBEDDING_DIMENSION: 768,
  CHUNK_SIZE: 500,
  CHUNK_OVERLAP: 50,
};

// AI fallback strategies
export const FALLBACK_STRATEGIES = {
  USE_CACHE: 'USE_CACHE',
  USE_DEFAULT: 'USE_DEFAULT',
  RETRY: 'RETRY',
  DEGRADE: 'DEGRADE',
  FAIL: 'FAIL',
};

// Error retry configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MS: 1000,
  BACKOFF_MULTIPLIER: 2,
  MAX_DELAY_MS: 10000,
};

// Response validation rules
export const VALIDATION_RULES = {
  ROADMAP: {
    MIN_MODULES: 3,
    MAX_MODULES: 12,
    REQUIRED_FIELDS: ['title', 'description', 'modules', 'estimatedDuration'],
  },
  ASSESSMENT: {
    MIN_QUESTIONS: 5,
    MAX_QUESTIONS: 30,
    REQUIRED_FIELDS: ['questions', 'totalMarks', 'passingScore'],
  },
  EXPLANATION: {
    MIN_LENGTH: 50,
    MAX_LENGTH: 1000,
    REQUIRED_FIELDS: ['explanation', 'examples'],
  },
};

// Content filtering
export const CONTENT_FILTERS = {
  PROFANITY: true,
  HARMFUL_CONTENT: true,
  PERSONAL_INFO: true,
  BIAS_DETECTION: true,
};

// Model-specific configurations
export const MODEL_CONFIGS = {
  GEMINI_PRO: {
    name: 'gemini-pro',
    maxTokens: 2048,
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
  },
  GEMINI_PRO_VISION: {
    name: 'gemini-pro-vision',
    maxTokens: 2048,
    temperature: 0.4,
  },
};

// Caching strategy
export const CACHE_CONFIG = {
  ROADMAP_TTL_HOURS: 24,
  ASSESSMENT_TTL_HOURS: 12,
  EXPLANATION_TTL_HOURS: 48,
  MAX_CACHE_SIZE_MB: 100,
};

export default {
  PROMPT_VERSIONS,
  RESPONSE_FORMATS,
  PROMPT_CONFIG,
  AI_SERVICE_TYPES,
  RAG_CONFIG,
  FALLBACK_STRATEGIES,
  RETRY_CONFIG,
  VALIDATION_RULES,
  CONTENT_FILTERS,
  MODEL_CONFIGS,
  CACHE_CONFIG,
};