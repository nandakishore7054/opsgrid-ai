require('dotenv').config();

const parseClientOrigins = () => {
  const envOrigin = process.env.CLIENT_ORIGIN;
  if (!envOrigin) {
    return ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
  }
  return envOrigin
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
};

const clientOrigins = parseClientOrigins();

const environment = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || '',
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || '',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || '',
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  clientOrigin: clientOrigins[0] || 'http://localhost:5173',
  clientOrigins,
  
  // AI Feature Config
  aiProvider: process.env.AI_PROVIDER || 'gemini',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  ollamaApiKey: process.env.OLLAMA_API_KEY || '',
  aiCacheTtlMinutes: Number(process.env.AI_CACHE_TTL_MINUTES) || 15,
};

function validateEnvironment() {
  const requiredFields = [
    ['MONGO_URI', environment.mongoUri],
    ['JWT_ACCESS_SECRET', environment.accessTokenSecret],
    ['JWT_REFRESH_SECRET', environment.refreshTokenSecret],
  ];

  const missingFields = requiredFields
    .filter(([, value]) => !value)
    .map(([field]) => field);

  if (missingFields.length > 0) {
    throw new Error(`Missing required environment variables: ${missingFields.join(', ')}`);
  }

  return environment;
}

module.exports = {
  environment,
  validateEnvironment,
};