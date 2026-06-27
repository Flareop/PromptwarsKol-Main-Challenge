require('dotenv').config();

module.exports = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || null,
  PORT: process.env.PORT || 3000,
  isMockMode: !process.env.GEMINI_API_KEY
};
