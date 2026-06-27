document.addEventListener('DOMContentLoaded', () => {
  // --- Global State ---
  let userVibe = 'fahhhhh';
  let userTrack = 'JEE';
  let userPersona = 'empathetic_peer';
  let vibeCheckCount = 0;
  
  // Audio state
  let currentAudioUrl = null;
  let audioCtx = null;

  // --- Tab Selection Logic ---
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      const targetPane = document.getElementById(targetTab);
      if (targetPane) targetPane.classList.add('active');

      // Refresh content if switching to specific tabs
      if (targetTab === 'tab-hub') {
        fetchHubPosts();
      }
    });
  });

  // --- System clock in Footer ---
  const systemTimeSpan = document.getElementById('system-time');
  function updateTime() {
    const now = new Date();
    systemTimeSpan.textContent = now.toLocaleTimeString([], { hour12: false });
  }
  setInterval(updateTime, 1000);
  updateTime();

  // Auto-resume AudioContext on first page interaction to prevent suspended state issues
  document.addEventListener('click', () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
    } catch (e) {}
  }, { once: true });

  // --- Web Audio API Synth Fallbacks ---
  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSynthVibe(vibe) {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);

      if (vibe === 'fahhhhh') {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(100, now + 1.0);
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        osc.connect(gainNode);
        osc.start();
        osc.stop(now + 1.0);
      } else if (vibe === 'emotional_damage') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(520, now);
        osc1.frequency.setValueAtTime(180, now + 0.15);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(183, now + 0.15);
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.setValueAtTime(0.12, now + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        osc1.start();
        osc2.start();
        osc1.stop(now + 0.9);
        osc2.stop(now + 0.9);
      } else if (vibe === 'bruh') {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.7);
        gainNode.gain.setValueAtTime(0.18, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(gainNode);
        osc.start();
        osc.stop(now + 0.7);
      } else if (vibe === 'chill') {
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          const noteGain = ctx.createGain();
          noteGain.gain.setValueAtTime(0.1, now + idx * 0.12);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.2);
          osc.connect(noteGain);
          noteGain.connect(ctx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.2);
        });
      }
    } catch (e) {
      console.warn('Audio synth failed:', e);
    }
  }

  function playVibeMedia(vibe, audioUrl) {
    playSynthVibe(vibe);
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.volume = 0.4;
      audio.play().catch(e => console.log('Static sound file play blocked/failed:', e));
    }
  }

  // --- Vibe Check Swipe Deck Module ---
  const cardStack = document.getElementById('swipe-card-stack');
  const swipeRelateCountSpan = document.getElementById('swipe-relate-count');
  const loggedVibeDisplay = document.getElementById('logged-vibe-display');
  const vibeProfileBadge = document.getElementById('vibe-profile-badge');
  const btnSwipeLeft = document.getElementById('swipe-left-btn');
  const btnSwipeRight = document.getElementById('swipe-right-btn');
  const btnRefreshDeck = document.getElementById('refresh-deck-btn');
  
  let currentDeckMemes = [];
  let swipedCardCount = 0;
  let relatableMemeTags = [];

  async function loadMemeDeck() {
    cardStack.innerHTML = '<div class="deck-card-placeholder">LOADING STACK...</div>';
    swipedCardCount = 0;
    relatableMemeTags = [];
    swipeRelateCountSpan.textContent = '0';
    
    try {
      const res = await fetch(`/api/v1/memes/deck?vibe=${userVibe}&track=${userTrack}&persona=${userPersona}`);
      const data = await res.json();
      
      if (data.success && data.deck && data.deck.length > 0) {
        currentDeckMemes = data.deck;
        renderMemeDeck();
      } else {
        cardStack.innerHTML = '<div class="deck-card-placeholder">No memes found. Run pipeline!</div>';
      }
    } catch (err) {
      console.error(err);
      cardStack.innerHTML = '<div class="deck-card-placeholder">Failed to fetch meme deck.</div>';
    }
  }

  function renderMemeDeck() {
    cardStack.innerHTML = '';
    currentDeckMemes.forEach((meme, index) => {
      const card = document.createElement('div');
      card.className = 'swipe-card';
      card.dataset.index = index;
      
      card.innerHTML = `
        <div class="swipe-card-img-box">
          <img src="${meme.imageUrl}" alt="Meme Card" draggable="false">
        </div>
        <div class="swipe-card-caption-box">
          <p><strong>Caption:</strong> ${meme.customCaption || meme.description}</p>
        </div>
        <div class="swipe-card-tags">
          ${meme.tags.join(' ')}
        </div>
      `;
      
      // Simple Dragging Mechanics for Y2K Curated Chaos Feel
      let startX = 0;
      let currentX = 0;
      let isDragging = false;

      card.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        isDragging = true;
        card.style.transition = 'none';
        card.style.cursor = 'grabbing';
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        currentX = e.clientX - startX;
        // Limit rotation/translation slightly
        const rotation = currentX / 15;
        card.style.transform = `translate(${currentX}px, ${Math.abs(currentX)/10}px) rotate(${rotation}deg)`;
      });

      window.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        card.style.cursor = 'grab';
        card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

        if (currentX > 100) {
          swipeCardAction(card, 'right');
        } else if (currentX < -100) {
          swipeCardAction(card, 'left');
        } else {
          // Snap back
          card.style.transform = '';
        }
        currentX = 0;
      });

      cardStack.appendChild(card);
    });
  }

  function swipeCardAction(cardElement, direction) {
    const idx = parseInt(cardElement.dataset.index);
    const meme = currentDeckMemes[idx];

    if (direction === 'right') {
      cardElement.classList.add('swiped-right');
      relatableMemeTags.push(...meme.tags);
      swipeRelateCountSpan.textContent = parseInt(swipeRelateCountSpan.textContent) + 1;
      playSynthVibe('chill');
    } else {
      cardElement.classList.add('swiped-left');
      playSynthVibe('bruh');
    }

    swipedCardCount++;
    
    // Evaluate stack when finished
    if (swipedCardCount >= currentDeckMemes.length) {
      calculateLoggedVibe();
    }
  }

  function calculateLoggedVibe() {
    // Map swiped tags to profiles
    let scoreFah = 0;
    let scoreDmg = 0;
    let scoreBruh = 0;
    let scoreChill = 0;

    relatableMemeTags.forEach(tag => {
      const t = tag.toLowerCase();
      if (t.includes('panic') || t.includes('burn') || t.includes('stress')) scoreFah++;
      if (t.includes('pressure') || t.includes('compare') || t.includes('damage')) scoreDmg++;
      if (t.includes('procrastinate') || t.includes('time') || t.includes('wasted')) scoreBruh++;
      if (t.includes('win') || t.includes('chill') || t.includes('done')) scoreChill++;
    });

    // Default to largest category
    const maxScore = Math.max(scoreFah, scoreDmg, scoreBruh, scoreChill);
    
    if (maxScore === 0) {
      userVibe = 'chill';
    } else if (maxScore === scoreFah) {
      userVibe = 'fahhhhh';
    } else if (maxScore === scoreDmg) {
      userVibe = 'emotional_damage';
    } else if (maxScore === scoreBruh) {
      userVibe = 'bruh';
    } else {
      userVibe = 'chill';
    }

    const readable = userVibe.toUpperCase().replace('_', ' ');
    loggedVibeDisplay.textContent = readable;
    vibeProfileBadge.textContent = `PROFILE: ${readable}`;
    vibeProfileBadge.style.color = userVibe === 'chill' ? 'var(--neon-green)' : (userVibe === 'fahhhhh' ? 'var(--neon-pink)' : 'var(--neon-cyan)');
    
    // Injects a mock/AI response automatically framed into the text journal
    journalInput.placeholder = `Logged vibe check: ${userVibe}. Type to describe further...`;
  }

  btnSwipeLeft.addEventListener('click', () => {
    const cards = cardStack.querySelectorAll('.swipe-card:not(.swiped-left):not(.swiped-right)');
    if (cards.length > 0) {
      const topCard = cards[cards.length - 1];
      swipeCardAction(topCard, 'left');
    }
  });

  btnSwipeRight.addEventListener('click', () => {
    const cards = cardStack.querySelectorAll('.swipe-card:not(.swiped-left):not(.swiped-right)');
    if (cards.length > 0) {
      const topCard = cards[cards.length - 1];
      swipeCardAction(topCard, 'right');
    }
  });

  btnRefreshDeck.addEventListener('click', loadMemeDeck);

  // --- Trauma Dump Journaling Module ---
  const journalForm = document.getElementById('journal-form');
  const journalInput = document.getElementById('journal-input');
  const charCountSpan = document.getElementById('char-count');
  const submitBtn = document.getElementById('submit-btn');
  
  const consoleIdle = document.getElementById('console-idle');
  const consoleLoading = document.getElementById('console-loading');
  const consoleResult = document.getElementById('console-result');
  
  const resultVibeTag = document.getElementById('result-vibe-tag');
  const resultMeme = document.getElementById('result-meme');
  const resultEmpathy = document.getElementById('result-empathy');
  const metaTriggers = document.getElementById('meta-triggers');
  const metaDistortions = document.getElementById('meta-distortions');
  const responsePersonaLabel = document.getElementById('response-persona-label');
  const replaySoundBtn = document.getElementById('replay-sound-btn');
  
  const selectTrack = document.getElementById('exam-track');
  const selectPersona = document.getElementById('ai-persona');
  const vibeCountSpan = document.getElementById('vibe-count');
  
  // Grounding states
  const scriptDisplayBox = document.getElementById('script-display-box');
  const speakScriptBtn = document.getElementById('speak-script-btn');

  // Input Character Limiter
  journalInput.addEventListener('input', () => {
    const len = journalInput.value.length;
    charCountSpan.textContent = len;
    charCountSpan.style.color = len >= 1400 ? 'var(--neon-pink)' : 'var(--text-muted)';
  });

  // Submit vent form
  journalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = journalInput.value.trim();
    if (!text) return;

    userTrack = selectTrack.value;
    userPersona = selectPersona.value;

    submitBtn.disabled = true;
    consoleIdle.classList.add('hidden');
    consoleResult.classList.add('hidden');
    consoleLoading.classList.remove('hidden');

    try {
      const response = await fetch('/api/v1/journal/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, examTrack: userTrack, persona: userPersona })
      });
      const data = await response.json();

      submitBtn.disabled = false;
      consoleLoading.classList.add('hidden');

      if (data.safetyTriggered) {
        consoleIdle.classList.remove('hidden');
        openSafetyModal(data.empathyResponse);
        return;
      }

      // Display console outputs
      userVibe = data.vibe;
      currentAudioUrl = data.assets.audio;
      
      resultVibeTag.textContent = `VIBE: ${data.vibe.toUpperCase().replace('_', ' ')}`;
      resultMeme.src = data.assets.image;
      resultEmpathy.textContent = `"${data.empathyResponse}"`;
      responsePersonaLabel.textContent = `${userPersona.toUpperCase().replace('_', ' ')}:`;
      
      metaTriggers.textContent = data.triggers.join(', ') || 'General stress';
      metaDistortions.textContent = data.cognitiveDistortions.join(', ') || 'None analyzed';

      consoleResult.classList.remove('hidden');

      // Play Sound
      playVibeMedia(data.vibe, data.assets.audio);

      // Increment Counter
      vibeCheckCount++;
      vibeCountSpan.textContent = vibeCheckCount;

      // Automatically generate a customized exam grounding script based on distortions
      generateGroundingScript(data.vibe, data.triggers, data.cognitiveDistortions);

    } catch (err) {
      console.error(err);
      submitBtn.disabled = false;
      consoleLoading.classList.add('hidden');
      consoleIdle.classList.remove('hidden');
      alert('VIBE CHECK ERROR. CONNECTIVITY FAILURE.');
    }
  });

  replaySoundBtn.addEventListener('click', () => {
    if (userVibe) {
      playVibeMedia(userVibe, currentAudioUrl);
    }
  });

  // Support Ctrl+Enter / Enter to submit
  journalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      journalForm.dispatchEvent(new Event('submit'));
    }
  });

  // --- Grounding Script Generator (Tab 3) ---
  function generateGroundingScript(vibe, triggers, distortions) {
    const triggerStr = triggers.length > 0 ? triggers[0] : 'exam anxiety';
    const distortionStr = distortions.length > 0 ? `noticing a tendency to use ${distortions[0]}` : 'academic pressure';

    let scriptText = '';
    if (vibe === 'fahhhhh') {
      scriptText = `Relax your shoulders. You are preparing for the ${userTrack} exam. Right now, your syllabus backlog of ${triggerStr} is creating an illusion that you are falling behind. This is a classic cognitive distortion, specifically catastrophizing. Your worth is not determined by the number of pages you have left. Let go of the need to understand everything in this instant. Take a deep breath. Focus on just the next 15 minutes. One problem at a time.`;
    } else if (vibe === 'emotional_damage') {
      scriptText = `Breathe in. Feel the floor supporting you. You are carrying stress about ${triggerStr} and feeling the weight of peer comparisons. Remember, the mock test scores or parent opinions are separate from your capability. It is all-or-nothing thinking to assume a poor score means failure on the actual ${userTrack} exam. Give yourself permission to be imperfect. You are running your own race.`;
    } else if (vibe === 'bruh') {
      scriptText = `Bring your attention to this moment. You spent time procrastinating, and you are feeling guilt. That is okay. Procrastination is a response to stress, not a character defect. Let go of the self-blame. You do not need to study for 12 hours straight. You just need to take one small action. Lock in for five minutes, release the fear of failing, and begin.`;
    } else {
      scriptText = `You are doing well. Capitalize on this optimistic vibe. Close your eyes, feel the win of understanding this concept. Let this confidence anchor you for the rest of your prep session. Breathe in the success, breathe out the stress.`;
    }

    scriptDisplayBox.value = scriptText;
    speakScriptBtn.disabled = false;
  }

  // Native Web Text-To-Speech
  speakScriptBtn.addEventListener('click', () => {
    const text = scriptDisplayBox.value;
    if (!text) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    
    speakScriptBtn.textContent = '🔊 READING...';
    
    utterance.onend = () => {
      speakScriptBtn.textContent = '🔊 READ ALOUD (TTS)';
    };
    
    window.speechSynthesis.speak(utterance);
  });

  // --- 90-Second Reset (Breathing Bubble) ---
  const breathingBubble = document.getElementById('breathing-bubble');
  const breathingInstruction = document.getElementById('breathing-instruction');
  const startBreathBtn = document.getElementById('start-breath-btn');
  const stopBreathBtn = document.getElementById('stop-breath-btn');
  
  let breathingInterval = null;
  let breathingCountdown = null;
  let secondsLeft = 90;
  let breathPhase = 0; // 0 = In, 1 = Hold, 2 = Out, 3 = Hold

  function updateBreathingLabel(label) {
    breathingInstruction.textContent = `${label} (${secondsLeft}s)`;
  }

  function runBreathingCycle() {
    if (secondsLeft <= 0) return;
    
    if (breathPhase === 0) {
      updateBreathingLabel('Breathe In...');
      breathingBubble.classList.add('expand');
      playTone(220, 330, 4); // Rise tone
      breathPhase = 1;
      breathingInterval = setTimeout(runBreathingCycle, 4000);
    } else if (breathPhase === 1) {
      updateBreathingLabel('Hold...');
      breathPhase = 2;
      breathingInterval = setTimeout(runBreathingCycle, 2000);
    } else if (breathPhase === 2) {
      updateBreathingLabel('Breathe Out...');
      breathingBubble.classList.remove('expand');
      playTone(330, 220, 4); // Fall tone
      breathPhase = 3;
      breathingInterval = setTimeout(runBreathingCycle, 4000);
    } else if (breathPhase === 3) {
      updateBreathingLabel('Hold...');
      breathPhase = 0;
      breathingInterval = setTimeout(runBreathingCycle, 2000);
    }
  }

  function playTone(fromFreq, toFreq, duration) {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(fromFreq, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(toFreq, ctx.currentTime + duration);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch(e){}
  }

  function stopBreathing(completed = false) {
    clearTimeout(breathingInterval);
    clearInterval(breathingCountdown);
    
    startBreathBtn.classList.remove('hidden');
    stopBreathBtn.classList.add('hidden');
    breathingBubble.classList.remove('expand');
    
    if (completed) {
      breathingInstruction.textContent = 'Reset complete! 🌟';
      // Synth a short happy victory chime
      playTone(523.25, 659.25, 0.4);
    } else {
      breathingInstruction.textContent = 'Breathe In...';
    }
  }

  startBreathBtn.addEventListener('click', () => {
    startBreathBtn.classList.add('hidden');
    stopBreathBtn.classList.remove('hidden');
    
    secondsLeft = 90;
    breathPhase = 0;
    
    // Start countdown timer
    breathingCountdown = setInterval(() => {
      secondsLeft--;
      // Update label with current phase text
      const currentText = breathingInstruction.textContent.split(' (')[0];
      breathingInstruction.textContent = `${currentText} (${secondsLeft}s)`;
      
      if (secondsLeft <= 0) {
        stopBreathing(true);
      }
    }, 1000);
    
    runBreathingCycle();
  });

  stopBreathBtn.addEventListener('click', () => {
    stopBreathing(false);
  });

  // --- Cooked Hub Forum Module ---
  const hubForm = document.getElementById('hub-post-form');
  const postContent = document.getElementById('post-content');
  const postTrack = document.getElementById('post-track');
  const hubFeedContainer = document.getElementById('hub-feed-container');
  const filterTrackSelect = document.getElementById('hub-filter-track');

  async function fetchHubPosts() {
    const track = filterTrackSelect.value;
    hubFeedContainer.innerHTML = '<div class="feed-placeholder">LOADING RECENT PANICS...</div>';
    
    try {
      const res = await fetch(`/api/v1/hub/posts?track=${track}`);
      const data = await res.json();
      
      if (data.success && data.posts && data.posts.length > 0) {
        renderHubPosts(data.posts);
      } else {
        hubFeedContainer.innerHTML = '<div class="feed-placeholder">No panic logs logged here yet. You are the first!</div>';
      }
    } catch (err) {
      console.error(err);
      hubFeedContainer.innerHTML = '<div class="feed-placeholder">Failed to fetch forum log.</div>';
    }
  }

  function renderHubPosts(posts) {
    hubFeedContainer.innerHTML = '';
    posts.forEach(post => {
      const card = document.createElement('div');
      card.className = 'hub-post-card';
      
      // Dynamic vibe border accent
      if (post.vibe === 'fahhhhh') card.style.borderLeftColor = 'var(--neon-pink)';
      else if (post.vibe === 'emotional_damage') card.style.borderLeftColor = '#ff6b00';
      else if (post.vibe === 'chill') card.style.borderLeftColor = 'var(--neon-green)';
      else card.style.borderLeftColor = 'var(--neon-cyan)';

      const dateStr = new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      card.innerHTML = `
        <div class="post-meta">
          <span class="post-track-badge">#${post.examTrack}</span>
          <span>Logged: ${dateStr}</span>
        </div>
        <p class="post-content-text">${escapeHtml(post.content)}</p>
      `;
      hubFeedContainer.appendChild(card);
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  hubForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = postContent.value.trim();
    const track = postTrack.value;
    
    if (!content) return;
    
    const postBtn = document.getElementById('post-submit-btn');
    postBtn.disabled = true;

    try {
      const res = await fetch('/api/v1/hub/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, examTrack: track, vibe: userVibe })
      });
      const data = await res.json();
      
      postBtn.disabled = false;

      if (!res.ok || !data.success) {
        // Render moderation error dynamically
        alert(`POST MODERATED:\n${data.reason || 'Content rejected due to community guidelines.'}`);
        return;
      }

      // Success
      postContent.value = '';
      fetchHubPosts();
    } catch (err) {
      console.error(err);
      postBtn.disabled = false;
      alert('Post submission failed. Server connectivity issue.');
    }
  });

  filterTrackSelect.addEventListener('change', fetchHubPosts);

  // --- Clinical Safety Modal Overlay ---
  const safetyModal = document.getElementById('safety-modal');
  const safetyCloseBtn = document.getElementById('safety-close-btn');
  const closeBtnX = document.getElementById('close-modal-btn');
  const modalIntro = document.querySelector('.modal-intro');

  function openSafetyModal(customMessage) {
    if (customMessage) {
      modalIntro.innerHTML = `<strong>AI Intervention Notice:</strong> ${customMessage}<br><br>We noticed things are feeling extremely heavy and hopeless right now. Exam stress can make it feel like your options are closing in, but please remember: **no exam score, result, or percentile is worth your health, peace, or life.**`;
    }
    safetyModal.classList.remove('hidden');
    // Sound warning alarm
    playTone(180, 180, 0.4);
  }

  safetyCloseBtn.addEventListener('click', () => safetyModal.classList.add('hidden'));
  closeBtnX.addEventListener('click', () => safetyModal.classList.add('hidden'));

  // Load initial card deck on start
  loadMemeDeck();
});
