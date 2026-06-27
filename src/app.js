const express = require('express');
const cors = require('cors');
const path = require('path');

const memeRoutes = require('./routes/memeRoutes');
const journalRoutes = require('./routes/journalRoutes');
const peerHubRoutes = require('./routes/peerHubRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Standard middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '..', 'public')));

// Register API Routes
app.use('/api/v1/memes', memeRoutes);
app.use('/api/v1/journal', journalRoutes);
app.use('/api/v1/hub', peerHubRoutes);

// Fallback HTML router
app.get('*', (req, res, next) => {
  // If it's an API route request, don't serve index.html, let it 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Register Global Error Handler
app.use(errorHandler);

module.exports = app;
