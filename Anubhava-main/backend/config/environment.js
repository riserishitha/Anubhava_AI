import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized environment configuration
 * Single source of truth for all environment variables
 */
const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT, 10) || 4000,
    env: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI,
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Google Gemini AI Configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-pro',
    maxRetries: parseInt(process.env.AI_MAX_RETRIES, 10) || 3,
    timeout: parseInt(process.env.AI_TIMEOUT_MS, 10) || 30000,
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,

    // DEV-ONLY escape hatch for corporate proxy / local cert issues.
    // Prefer NODE_EXTRA_CA_CERTS in real environments.
    insecureTLS: process.env.GEMINI_INSECURE_TLS === 'true',
  },

  // Pinecone Configuration
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
    indexName: process.env.PINECONE_INDEX_NAME || 'learning-content',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  // CORS Configuration
  // Supports single origin via FRONTEND_URL or multiple origins via FRONTEND_URLS (comma-separated)
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
};

/**
 * Validate required environment variables
 */
export const validateConfig = () => {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'GEMINI_API_KEY',
    'PINECONE_API_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please copy .env.example to .env and fill in the values.`
    );
  }
};

export default config;
