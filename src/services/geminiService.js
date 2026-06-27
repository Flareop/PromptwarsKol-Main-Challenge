const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');

let model = null;

if (config.GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

// Helper to clean JSON from markdown backticks
function cleanJsonString(str) {
  return str.replace(/```json|```/gi, '').trim();
}

/**
 * Parses trauma dump journaling text for cognitive distortions, vibes, triggers, and safety flags.
 */
async function analyzeJournal(text, examTrack = 'JEE', persona = 'empathetic_peer') {
  if (!model) {
    return mockAnalyzeJournal(text, examTrack, persona);
  }

  try {
    const prompt = `
You are a Gen-Z Mental Wellness Tracker AI specialized for high-stakes exam preparation students (preparing for ${examTrack}).
Your role is to analyze a student's journal vent text and provide a helpful, humorous, and empathetic response.

Here is the student's vent:
"${text}"

Selected AI Persona/Dialect for response: "${persona}"
- "empathetic_peer": Highly reliant on shared irony, self-deprecating memes, validates exhaustion, and gently nags them to sleep/eat. Acts like a chill, supportive classmate.
- "strategic_coach": High-energy, tactical, focuses on actionable study methods (e.g., pomodoro, blocking), pushes past procrastination, acts like a hyper-supportive study coach.

CRITICAL GUARDRAIL - CLINICAL SAFETY SWITCH:
First, inspect the text for signs of severe hopelessness, clinical depression, self-harm, suicidal ideation, or psychological crisis.
- If YES (crisis detected): Set "safetyTriggered": true, vibe to "fahhhhh", and write a warm, supportive, serious, and deeply caring response in "empathyResponse" advising them to talk to a professional, reminding them they are valued. Do NOT use jokes, sarcasm, or slang.
- If NO: Set "safetyTriggered": false. Classify the main vibe into exactly one of: 'fahhhhh' (overwhelmed/burnt out), 'emotional_damage' (parental/relative comparison), 'bruh' (procrastination guilt), or 'chill' (academic win/good vibes).

Extract:
1. "triggers": What is causing the anxiety? (e.g., parental expectations, mock test scores, syllabus backlog, focus failure). Array of strings.
2. "cognitiveDistortions": Identify any cognitive distortions present. (e.g., catastrophizing like "If I fail, my life is over", all-or-nothing thinking, should-statements, emotional reasoning). Array of strings.
3. "empathyResponse": A reply in the voice of the selected persona ("${persona}") using appropriate Gen Z slang (e.g. cooked, real, basic, vibe, rent-free, no cap) but adapting to the needs of the student preparing for ${examTrack}.

Output strictly a JSON object matching this schema. Do not return markdown block quotes or text outside of the JSON:
{
  "safetyTriggered": boolean,
  "vibe": "fahhhhh" | "emotional_damage" | "bruh" | "chill",
  "triggers": ["string"],
  "cognitiveDistortions": ["string"],
  "empathyResponse": "string"
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleaned = cleanJsonString(responseText);
    return JSON.parse(cleaned);

  } catch (error) {
    console.error('Gemini analyzeJournal error:', error);
    return mockAnalyzeJournal(text, examTrack, persona);
  }
}

/**
 * Generates a comforting, low-pressure caption for a recommended meme tailored to exam track & persona.
 */
async function generateMemeCaption(memeTags, userStressProfile = 'fahhhhh', examTrack = 'JEE', persona = 'empathetic_peer') {
  if (!model) {
    return mockGenerateMemeCaption(memeTags, userStressProfile, examTrack, persona);
  }

  try {
    const prompt = `
You are a Gen-Z Mental Wellness Tracker. Generate a witty, comforting, low-pressure caption to be displayed underneath a meme image.
Context:
- Meme tags: [${memeTags.join(', ')}]
- Current user vibe/stress: "${userStressProfile}"
- Exam track: "${examTrack}"
- Selected AI Persona: "${persona}" ("empathetic_peer" is validating, sarcastic, and caring; "strategic_coach" is high-energy, actionable, and encouraging).

Write a short, single-line caption (max 120 characters) that links this meme to their mental wellness/study state. Use Gen-Z slang and keep it lighthearted. Do not include quotes.
`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim().replace(/^"|"$/g, '');
  } catch (e) {
    console.error('Gemini generateMemeCaption error:', e);
    return mockGenerateMemeCaption(memeTags, userStressProfile, examTrack, persona);
  }
}

/**
 * Moderates anonymous peer hub submissions.
 */
async function moderateHubPost(content) {
  if (!model) {
    return mockModerateHubPost(content);
  }

  try {
    const prompt = `
You are a content moderator for a student mental wellness tracker peer forum.
Analyze this post:
"${content}"

Check for:
1. Severe self-harm, suicidal ideation, or clinical crisis.
2. Toxic competition (e.g., prep shaming: "If you study less than 15 hours you are a failure").
3. Cheating discussions or exam leaks.

We WANT to allow normal venting, exam anxiety, procrastination complaints, and feeling cooked. Only reject truly harmful content.

Return strictly a JSON object:
{
  "passed": boolean,
  "flagReason": "string or null"
}
`;
    const result = await model.generateContent(prompt);
    const cleaned = cleanJsonString(result.response.text());
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Gemini moderation error:', e);
    return mockModerateHubPost(content);
  }
}

/**
 * Simulates AI image tagging (multimodal fallback).
 */
async function tagMemeImage(imageBuffer, mimeType) {
  if (!model) {
    return ['#ExamFails', '#StudyBurnout', '#SyllabusBacklog'];
  }

  try {
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType
      }
    };
    
    const prompt = `
Analyze this meme image. Return exactly 3 emotional tags relevant to student exam panic or procrastination (e.g. #SyllabusPanic, #MockTestBlues, #ProcrastinationGuilt). 
Return ONLY a JSON array of strings: ["#tag1", "#tag2", "#tag3"]
`;
    const result = await model.generateContent([prompt, imagePart]);
    const cleaned = cleanJsonString(result.response.text());
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Image tagging failed, fallback tags used:', e);
    return ['#StressRelief', '#AspirantMemes', '#StudyMode'];
  }
}

// --- MOCK FALLBACK IMPLEMENTATIONS ---

function mockAnalyzeJournal(text, examTrack, persona) {
  const lowercase = text.toLowerCase();
  let safetyTriggered = false;
  let vibe = 'fahhhhh';
  let triggers = [];
  let distortions = [];
  let empathyResponse = '';

  // Safety Switch
  if (
    lowercase.includes('die') || 
    lowercase.includes('kill myself') || 
    lowercase.includes('suicide') || 
    lowercase.includes('end my life') ||
    lowercase.includes('no reason to live')
  ) {
    safetyTriggered = true;
    empathyResponse = `Hey, we know the pressure of preparing for ${examTrack} is colossal right now, but your life is worth infinitely more than any test percentile. Please step back, breathe, and reach out to one of the helplines in the modal. You do not have to carry this alone.`;
    return { safetyTriggered, vibe, triggers, distortions, empathyResponse };
  }

  // Parse triggers
  if (lowercase.includes('parent') || lowercase.includes('father') || lowercase.includes('mother') || lowercase.includes('relative')) {
    triggers.push('parental expectations');
    vibe = 'emotional_damage';
  }
  if (lowercase.includes('mock') || lowercase.includes('marks') || lowercase.includes('score') || lowercase.includes('percentile')) {
    triggers.push('mock test drops');
    vibe = 'emotional_damage';
  }
  if (lowercase.includes('procrastinate') || lowercase.includes('phone') || lowercase.includes('youtube') || lowercase.includes('game') || lowercase.includes('wasted')) {
    triggers.push('procrastination');
    vibe = 'bruh';
  }
  if (lowercase.includes('syllabus') || lowercase.includes('backlog') || lowercase.includes('chapter') || lowercase.includes('time')) {
    triggers.push('syllabus backlog');
  }
  if (triggers.length === 0) {
    triggers.push('general exam anxiety');
  }

  // Parse distortions
  if (lowercase.includes('fail') && (lowercase.includes('life is over') || lowercase.includes('ruined') || lowercase.includes('nothing left'))) {
    distortions.push('catastrophizing');
  }
  if (lowercase.includes('never') || lowercase.includes('always') || lowercase.includes('nothing') || lowercase.includes('perfect')) {
    distortions.push('all-or-nothing thinking');
  }
  if (lowercase.includes('should') || lowercase.includes('must') || lowercase.includes('ought to')) {
    distortions.push('should-statements');
  }
  if (distortions.length === 0) {
    distortions.push('emotional reasoning');
  }

  // Check for positive vibe
  if (lowercase.includes('solved') || lowercase.includes('understand') || lowercase.includes('win') || lowercase.includes('good') || lowercase.includes('happy')) {
    vibe = 'chill';
  }

  // Empathy response depending on persona
  if (vibe === 'fahhhhh') {
    if (persona === 'strategic_coach') {
      empathyResponse = `Listen, feeling cooked by ${examTrack} backlogs is standard. Let's break the syllabus down. Put the phone in another room, set a 25-minute Pomodoro timer, and clear just one topic. You got this, let's execute!`;
    } else {
      empathyResponse = `Big mood, you are literally running on 1% battery. Syllabus is infinite, sleep is finite. Take a 20-min power nap before you fully self-combust, no cap.`;
    }
  } else if (vibe === 'emotional_damage') {
    if (persona === 'strategic_coach') {
      empathyResponse = `Comparison is a productivity killer. Your parents want you to succeed, but focus on your personal mock test errors. Track your mistakes in a log and clear them. Direct action, no noise!`;
    } else {
      empathyResponse = `Oof, parental comparison hits right in the feels. Cousin cleared ${examTrack} in first try? Good for them, but you are running your own race. Your worth isn't tied to a relative's scorecard.`;
    }
  } else if (vibe === 'bruh') {
    if (persona === 'strategic_coach') {
      empathyResponse = `This is a classic procrastination trap. Action precedes motivation! Open your book and do exactly ONE math problem. Don't think about the whole exam, just solve the next step.`;
    } else {
      empathyResponse = `Major bruh moment. Scrolling YouTube shorts for 4 hours instead of studying is peak coping mechanism. We've all been there. Put down the device, lock in for 20 mins, real talk.`;
    }
  } else if (vibe === 'chill') {
    if (persona === 'strategic_coach') {
      empathyResponse = `Excellent! Keep this momentum. Write down the method you used to solve it so you can replicate it next time. Capitalize on this win!`;
    } else {
      empathyResponse = `Huge W! You actually understood that concept? Real boss vibes. Treat yourself to a snack, you earned this dub.`;
    }
  }

  return { safetyTriggered, vibe, triggers, distortions, empathyResponse };
}

function mockGenerateMemeCaption(memeTags, userStressProfile, examTrack, persona) {
  const prefix = persona === 'strategic_coach' ? 'Coach tip: ' : 'Real talk: ';
  if (userStressProfile === 'fahhhhh') {
    return `${prefix}When the syllabus covers 3 universes but you live in this one. Take a deep breath.`;
  }
  if (userStressProfile === 'emotional_damage') {
    return `${prefix}Uncle saying 98% is 'just okay'. Stay focused on your own lane.`;
  }
  if (userStressProfile === 'bruh') {
    return `${prefix}Preparing a 4-color study calendar instead of actual studying. Bruh moment.`;
  }
  return `${prefix}Understanding the equation on the first try. Rare academic dub!`;
}

function mockModerateHubPost(content) {
  const lowercase = content.toLowerCase();
  if (lowercase.includes('suicide') || lowercase.includes('kill myself') || lowercase.includes('end my life') || lowercase.includes('hanging')) {
    return { passed: false, flagReason: 'Detected critical safety or self-harm triggers.' };
  }
  if (lowercase.includes('cheat') || lowercase.includes('leak') || lowercase.includes('copy answers')) {
    return { passed: false, flagReason: 'Academic integrity violation detected.' };
  }
  if (lowercase.includes('loser') && lowercase.includes('study')) {
    return { passed: false, flagReason: 'Toxic prep-shaming or abuse detected.' };
  }
  return { passed: true, flagReason: null };
}

module.exports = {
  analyzeJournal,
  generateMemeCaption,
  moderateHubPost,
  tagMemeImage
};
