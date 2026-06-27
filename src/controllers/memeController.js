const fs = require('fs');
const path = require('path');
const db = require('../models/db');
const geminiService = require('../services/geminiService');

/**
 * Fetches 3 recommended memes with customized AI captions based on user vibe, track, and persona.
 */
exports.getMemeDeck = async (req, res) => {
  const { vibe = 'fahhhhh', track = 'JEE', persona = 'empathetic_peer' } = req.query;
  
  try {
    const memes = db.getMemes();
    // Grab 3 memes
    const shuffled = [...memes].sort(() => 0.5 - Math.random());
    const deck = shuffled.slice(0, 3);

    // Generate dynamic captions for each meme card in the deck
    const deckWithCaptions = await Promise.all(deck.map(async (meme) => {
      const caption = await geminiService.generateMemeCaption(meme.tags, vibe, track, persona);
      return {
        ...meme,
        customCaption: caption
      };
    }));

    return res.json({ success: true, deck: deckWithCaptions });
  } catch (error) {
    console.error('Error fetching meme deck:', error);
    return res.status(500).json({ success: false, error: 'Failed to load meme deck' });
  }
};

/**
 * Pipeline to scan meme images and auto-tag them using Gemini multimodal analysis.
 */
exports.runTagPipeline = async (req, res) => {
  try {
    const memes = db.getMemes();
    const processed = [];

    for (const meme of memes) {
      const fullPath = path.join(__dirname, '..', '..', 'public', meme.imageUrl);
      if (fs.existsSync(fullPath)) {
        const imageBuffer = fs.readFileSync(fullPath);
        // Tag image using Gemini multimodal
        const tags = await geminiService.tagMemeImage(imageBuffer, 'image/png');
        
        const updatedMeme = {
          id: meme.id,
          tags
        };
        db.saveMeme(updatedMeme);
        processed.push({ id: meme.id, tags });
      }
    }

    return res.json({
      success: true,
      message: 'Meme tagging pipeline completed successfully',
      processed
    });
  } catch (error) {
    console.error('Meme tagging pipeline error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
