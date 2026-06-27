const geminiService = require('../services/geminiService');

/**
 * Middleware to moderate peer posts. Prevents cheating, toxic prep shaming, and clinical self-harm triggers.
 */
module.exports = async (req, res, next) => {
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ success: false, error: 'Post content is required' });
  }

  try {
    const moderation = await geminiService.moderateHubPost(content);
    
    if (!moderation.passed) {
      return res.status(400).json({
        success: false,
        error: 'Post failed moderation filters.',
        reason: moderation.flagReason || 'Content violates our peer community guidelines.'
      });
    }

    next();
  } catch (error) {
    console.error('Moderation middleware error, allowing with fallback:', error);
    // In case of service issues, let it pass rather than completely blocking during the hackathon
    next();
  }
};
