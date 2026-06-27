const db = require('../models/db');

/**
 * Gets anonymous posts, optionally filtered by exam track.
 */
exports.getPosts = async (req, res) => {
  const { track } = req.query;
  
  try {
    let posts = db.getPosts();
    if (track && track !== 'ALL') {
      posts = posts.filter(p => p.examTrack.toUpperCase() === track.toUpperCase());
    }
    return res.json({ success: true, posts });
  } catch (error) {
    console.error('Error fetching hub posts:', error);
    return res.status(500).json({ success: false, error: 'Failed to load forum posts' });
  }
};

/**
 * Creates a moderated post. (AI safety check is performed in the middleware).
 */
exports.createPost = async (req, res) => {
  const { content, examTrack, vibe = 'fahhhhh' } = req.body;

  if (!content || !examTrack) {
    return res.status(400).json({ success: false, error: 'Content and exam track are required' });
  }

  try {
    const newPost = db.addPost({
      content,
      examTrack: examTrack.toUpperCase(),
      vibe
    });
    return res.status(201).json({ success: true, post: newPost });
  } catch (error) {
    console.error('Error creating post:', error);
    return res.status(500).json({ success: false, error: 'Failed to create post' });
  }
};
