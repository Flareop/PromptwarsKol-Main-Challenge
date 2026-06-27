const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'db.json');

// Initialize database with seed data if it doesn't exist
function initDb() {
  if (!fs.existsSync(DB_PATH)) {
    const defaultDb = {
      memes: [
        {
          id: 'm1',
          imageUrl: '/images/fahhhhh.png',
          tags: ['#SyllabusPanic', '#Burnout', '#ExamStress'],
          description: 'When you realize the syllabus is infinite and the time is finite.'
        },
        {
          id: 'm2',
          imageUrl: '/images/emotional_damage.png',
          tags: ['#ParentalPressure', '#PeerComparison', '#EmotionalDamage'],
          description: 'No one compares to the cousin who cleared NEET in their first attempt.'
        },
        {
          id: 'm3',
          imageUrl: '/images/bruh.png',
          tags: ['#Procrastination', '#TimeManagement', '#WastedTime'],
          description: 'Making a study schedule takes 5 hours. Studying takes 5 minutes.'
        },
        {
          id: 'm4',
          imageUrl: '/images/chill.png',
          tags: ['#AcademicWin', '#ChillVibes', '#GotItDone'],
          description: 'Solving that high-level question on the first try feels like a dub.'
        }
      ],
      posts: [
        {
          id: 'p1',
          content: 'Is anyone else studying for JEE physics and feeling completely lost? Thermodynamics is killing me.',
          examTrack: 'JEE',
          vibe: 'fahhhhh',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'p2',
          content: 'Wasted the whole afternoon watching mock exam review streams. Tomorrow\'s test is going to be a disaster.',
          examTrack: 'NEET',
          vibe: 'bruh',
          timestamp: new Date(Date.now() - 7200000).toISOString()
        }
      ],
      vibeLogs: []
    };
    
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2));
  }
}

let dbCache = null;

function loadDb() {
  if (!dbCache) {
    initDb();
    try {
      const content = fs.readFileSync(DB_PATH, 'utf8');
      dbCache = JSON.parse(content);
    } catch (e) {
      console.error('Failed to load db.json, fallback to empty structure:', e);
      dbCache = { memes: [], posts: [], vibeLogs: [] };
    }
  }
  return dbCache;
}

function saveDb() {
  if (!dbCache) return false;
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(dbCache, null, 2));
    return true;
  } catch (e) {
    console.error('Failed to write db.json:', e);
    return false;
  }
}

// Initial load
loadDb();

module.exports = {
  getMemes: () => dbCache.memes,
  saveMeme: (meme) => {
    const index = dbCache.memes.findIndex(m => m.id === meme.id);
    if (index >= 0) {
      dbCache.memes[index] = { ...dbCache.memes[index], ...meme };
    } else {
      dbCache.memes.push(meme);
    }
    saveDb();
  },
  
  getPosts: () => dbCache.posts,
  addPost: (post) => {
    const newPost = {
      id: 'post_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ...post
    };
    dbCache.posts.unshift(newPost); // Most recent first
    saveDb();
    return newPost;
  },

  getVibeLogs: () => dbCache.vibeLogs,
  addVibeLog: (log) => {
    const newLog = {
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ...log
    };
    dbCache.vibeLogs.push(newLog);
    saveDb();
    return newLog;
  }
};
