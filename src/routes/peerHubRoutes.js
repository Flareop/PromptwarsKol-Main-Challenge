const express = require('express');
const router = express.Router();
const peerHubController = require('../controllers/peerHubController');
const moderationMiddleware = require('../middlewares/moderation');

router.get('/posts', peerHubController.getPosts);
router.post('/posts', moderationMiddleware, peerHubController.createPost);

module.exports = router;
