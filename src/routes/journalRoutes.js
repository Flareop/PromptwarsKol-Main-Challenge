const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');

router.post('/analyze', journalController.analyzeJournal);

module.exports = router;
