const express = require('express');
const router = express.Router();
const memeController = require('../controllers/memeController');

router.get('/deck', memeController.getMemeDeck);
router.post('/pipeline', memeController.runTagPipeline);

module.exports = router;
