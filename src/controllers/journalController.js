const db = require('../models/db');
const geminiService = require('../services/geminiService');

const VIBE_ASSETS = {
  fahhhhh: {
    audio: '/audio/faahhhh.mp3',
    image: '/images/fahhhhh.png'
  },
  emotional_damage: {
    audio: '/audio/emotional_damage.mp3',
    image: '/images/emotional_damage.png'
  },
  bruh: {
    audio: '/audio/bruh.mp3',
    image: '/images/bruh.png'
  },
  chill: {
    audio: '/audio/chill.mp3',
    image: '/images/chill.png'
  }
};

/**
 * Handles text vent analysis: extracting triggers, distortions, vibes, and generating response.
 */
exports.analyzeJournal = async (req, res) => {
  const { text, examTrack = 'JEE', persona = 'empathetic_peer' } = req.body;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ success: false, error: 'Journal content is required and must be text' });
  }

  if (text.length > 2000) {
    return res.status(400).json({ success: false, error: 'Journal content too long (maximum 2000 characters)' });
  }

  const allowedTracks = ['JEE', 'NEET', 'UPSC', 'CAT'];
  if (!allowedTracks.includes(examTrack.toUpperCase())) {
    return res.status(400).json({ success: false, error: 'Invalid exam track selection' });
  }

  const allowedPersonas = ['empathetic_peer', 'strategic_coach'];
  if (!allowedPersonas.includes(persona)) {
    return res.status(400).json({ success: false, error: 'Invalid AI persona dialect' });
  }

  try {
    const analysis = await geminiService.analyzeJournal(text, examTrack, persona);

    // Save vibe logs for history & adaptive recommendation profiles
    db.addVibeLog({
      vibe: analysis.vibe,
      examTrack,
      triggers: analysis.triggers || [],
      distortions: analysis.cognitiveDistortions || [],
      safetyTriggered: analysis.safetyTriggered
    });

    if (analysis.safetyTriggered) {
      return res.json({
        success: true,
        safetyTriggered: true,
        vibe: 'fahhhhh',
        triggers: [],
        cognitiveDistortions: [],
        empathyResponse: analysis.empathyResponse,
        assets: VIBE_ASSETS.fahhhhh
      });
    }

    const vibe = VIBE_ASSETS[analysis.vibe] ? analysis.vibe : 'fahhhhh';
    return res.json({
      success: true,
      safetyTriggered: false,
      vibe,
      triggers: analysis.triggers || [],
      cognitiveDistortions: analysis.cognitiveDistortions || [],
      empathyResponse: analysis.empathyResponse,
      assets: VIBE_ASSETS[vibe]
    });

  } catch (error) {
    console.error('Error analyzing journal:', error);
    return res.status(500).json({ success: false, error: 'Failed to process journal analysis' });
  }
};
