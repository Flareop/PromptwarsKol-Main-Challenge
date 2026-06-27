const app = require('./src/app');
const config = require('./src/config/env');

app.listen(config.PORT, () => {
  console.log(`Server is running on port ${config.PORT}`);
  if (config.isMockMode) {
    console.log('WARNING: Running in offline MOCK mode (No GEMINI_API_KEY set).');
  } else {
    console.log('Gemini AI integrations connected.');
  }
});
