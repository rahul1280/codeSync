const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const requiredEnvVars = ['JWT_SECRET'];

function validateEnv() {
  const missing = [];
  for (const varName of requiredEnvVars) {
    if (!process.env[varName] && process.env.NODE_ENV !== 'test') {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/codesync',
  JWT_SECRET: process.env.JWT_SECRET || 'test_jwt_secret_codesync_default_key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'codesync_cookie_secret',
  DOCKER_TIMEOUT_MS: parseInt(process.env.DOCKER_TIMEOUT_MS, 10) || 10000,
  DOCKER_MEMORY_LIMIT: process.env.DOCKER_MEMORY_LIMIT || '128m',
  DOCKER_CPU_LIMIT: process.env.DOCKER_CPU_LIMIT || '0.5',

  // AI — Gemini (primary, works online) or Ollama (local fallback)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  AI_TIMEOUT_MS: parseInt(process.env.AI_TIMEOUT_MS, 10) || 30000,

  // Ollama (optional local fallback)
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'codellama',
  validateEnv
};

module.exports = env;
