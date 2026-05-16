/* app.js
   Solo Leveling — Skill Tracker
*/
(async function initApp(){
  const STORAGE_KEY = 'solo_leveling_state_v1';

  try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (error) throw error;
      const authBtn = document.getElementById('authActionBtn');

      if (session) {
          console.log('Session active. Synchronizing cloud data...');
          if(typeof loadFromSupabase === 'function') await loadFromSupabase();
          
          syncProfileName(session.user);
          
          if (authBtn) {
              authBtn.textContent = 'Logout';
              authBtn.className = 'btn ghost';
              authBtn.onclick = async () => {
                  await supabaseClient.auth.signOut();
                  goToAppPage('index.html');
              };
          }
      } else {
          console.log('Guest mode active.');
          if (authBtn) {
              authBtn.textContent = 'Login to Sync';
              authBtn.className = 'btn primary';
              authBtn.onclick = () => goToAppPage('login.html');
          }
      }
      document.body.classList.remove('page-hidden');
  } catch (err) {
      console.error('Auth Guard Error:', err);
      document.body.classList.remove('page-hidden');
  }

  function syncProfileName(user) {
      const defaultName = 'User name';
      const googleName = user.user_metadata?.full_name || user.user_metadata?.name;
      const rawState = localStorage.getItem(STORAGE_KEY);
      if (rawState && googleName) {
          try {
              const stateObj = JSON.parse(rawState);
              if (!stateObj.userName || stateObj.userName === defaultName) {
                  stateObj.userName = googleName;
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(stateObj));
                  console.log('👤 Profile name synchronized:', googleName);
              }
          } catch (e) {}
      }
  }
  // DOM
  const xpEl = document.getElementById('xp');
  const levelEl = document.getElementById('level');
  const nextXpEl = document.getElementById('nextXp');
  const xpBar = document.getElementById('xpBar');
  const xpBarRight = document.getElementById('xpBarRight');
  const questList = document.getElementById('questList');
  const emptyNote = document.getElementById('emptyNote');
  const addQuestBtn = document.getElementById('addQuestBtn');
  const modal = document.getElementById('modal');
  const questForm = document.getElementById('questForm');
  const questTitle = document.getElementById('questTitle');
  const questXp = document.getElementById('questXp');
  const cancelModal = document.getElementById('cancelModal');
  const undoBtn = document.getElementById('undoBtn');
  const resetBtn = document.getElementById('resetBtn');
  const confettiCanvas = document.getElementById('confetti');

  // App state
  let state = {
    xp: 0,
    quests: [],
    stats: { STR: 10, AGI: 10, CHR: 10, STA: 10, INT: 10, WIL: 10 },
    statPoints: 5,
    gold: 0,
    userName: 'User name',
    dailyQuests: {
      pushups: false,
      situps: false,
      crunches: false,
      running: false,
      reading: false
    },
    dailyQuestCompletions: {
      pushups: 0,
      situps: 0,
      crunches: 0,
      running: 0,
      reading: 0
    },
    dailyQuestLevels: {
      pushups: 1,
      situps: 1,
      crunches: 1,
      running: 1,
      reading: 1
    },
    lastDailyReset: new Date().toDateString(),
    penalties: [],
    pjogStatus: 0
  };
  let lastAction = null; // {type:'xp',amount: N}
  let timerInterval = null;

  // Sample quests with stat rewards
  const defaultQuests = [
    {
      id: genId(), 
      title: 'Running — 1 KM', 
      xp: 10,
      description: 'This quest will help you last long as it will increase your stamina',
      statRewards: { STA: 5 },
      duration: 'none',
      distance: '1 km'
    },
    {
      id: genId(), 
      title: 'Strength Training — 30 min', 
      xp: 15,
      description: 'Build muscle and increase your physical power',
      statRewards: { STR: 3, STA: 2 }
    },
    {
      id: genId(), 
      title: 'Read & Study — 1 hour', 
      xp: 20,
      description: 'Expand your knowledge and sharpen your mind',
      statRewards: { INT: 5, WIL: 2 }
    }
  ];

  // Sung Jinwoo quotes (sample set)
  const quotes = [
    'Arise.',
    'The only one who knows how far I can go is me.',
    'If I have to go alone, I’ll go alone, but I will not fall behind.',
    'I will not lose to anyone.'
  ];

  // Confetti
  const confetti = confettiCanvas.getContext ? confettiCanvas.getContext('2d') : null;
  let particles = [];

  // ---------- helpers ----------
  function genId(){ return Math.random().toString(36).slice(2,9); }

  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw){ 
        const loaded = JSON.parse(raw);
        state = {
          xp: loaded.xp || 0,
          quests: loaded.quests || defaultQuests.slice(),
          stats: loaded.stats || { STR: 10, AGI: 10, CHR: 10, STA: 10, INT: 10, WIL: 10 },
          statPoints: loaded.statPoints !== undefined ? loaded.statPoints : 5,
          gold: loaded.gold || 0,
          userName: loaded.userName || 'User name',
          avatarImage: loaded.avatarImage || null,
          dailyQuestCompletions: loaded.dailyQuestCompletions || {
            pushups: 0,
            situps: 0,
            crunches: 0,
            running: 0,
            reading: 0
          },
          dailyQuestLevels: loaded.dailyQuestLevels || {
            pushups: 1,
            situps: 1,
            crunches: 1,
            running: 1,
            reading: 1
          },
          dungeons: loaded.dungeons || [],
          quoteVault: loaded.quoteVault || [],
          inventory: loaded.inventory || []
        };
      }
      if(!state.quests || !state.quests.length){ state.quests = defaultQuests.slice(); }
      if(!state.stats){ state.stats = { STR: 10, AGI: 10, CHR: 10, STA: 10, INT: 10, WIL: 10 }; }
      if(state.statPoints === undefined || state.statPoints === 0){ state.statPoints = 5; }
    }catch(e){ 
      console.warn('load failed',e); 
      state = {
        xp:0, 
        quests: defaultQuests.slice(),
        stats: { STR: 10, AGI: 10, CHR: 10, STA: 10, INT: 10, WIL: 10 },
        statPoints: 0,
        gold: 0
      };
    }
  }

  function saveState(){ 
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); 
      if (typeof syncToSupabase === 'function') {
          syncToSupabase(STORAGE_KEY, JSON.stringify(state));
      }
  }

  // XP math: cumulative thresholds using a growth curve
  function xpForLevelSingle(level){ return Math.round(100 * Math.pow(level, 1.15)); }
  function xpToReachLevel(level){ // total XP required to reach 'level' (level 1 requires 0)
    let total = 0;
    for(let i=1;i<level;i++) total += xpForLevelSingle(i);
    return total;
  }

  function levelForXp(xp){
    let level = 1;
    while(xp >= xpToReachLevel(level+1)) level++;
    return level;
  }

  function xpForLevel(level){ return xpToReachLevel(level+1); }

  function updateUI(animate=true){
  const xp = state.xp;
  const level = levelForXp(xp);
  const prevLevelStart = xpToReachLevel(level);
  const nextLevelStart = xpToReachLevel(level+1);
  const nextLevelXp = nextLevelStart;

  if(levelEl) levelEl.textContent = level;
  if(xpEl) xpEl.textContent = xp;
  if(nextXpEl) nextXpEl.textContent = nextLevelXp;
  
  // Update username
  const userNameEl = document.getElementById('userName');
  if(userNameEl && state.userName) userNameEl.textContent = state.userName;
  
  // Update avatar
  const avatarImgEl = document.getElementById('avatarImg');
  if(avatarImgEl && state.avatarImage) avatarImgEl.src = state.avatarImage;

  const percent = Math.min(100, Math.round(((xp - prevLevelStart) / Math.max(1, (nextLevelStart - prevLevelStart))) * 100));
  if(animate){ 
    if(xpBar) xpBar.style.width = percent + '%'; 
    if(xpBarRight) xpBarRight.style.width = percent + '%'; 
  } else { 
    if(xpBar) xpBar.style.width = percent + '%'; 
    if(xpBarRight) xpBarRight.style.width = percent + '%'; 
  }

  // Update stat points display
  const statPointsEl = document.getElementById('statPoints');
  if(statPointsEl) statPointsEl.textContent = state.statPoints || 0;
  
  // Update credits display
  const creditsDisplayEl = document.getElementById('creditsDisplay');
  if(creditsDisplayEl) creditsDisplayEl.textContent = state.gold || 0;
  
  // Update daily quests checkboxes
  updateDailyQuestsUI();
  
  // Update penalties display
  updatePenaltiesUI();

  renderRadarChart();
  saveState();
}

  function addXp(amount){
    if(!Number.isFinite(amount) || amount === 0) return;
    const before = state.xp;
    state.xp = Math.max(0, state.xp + Math.floor(amount));
    lastAction = {type:'xp', amount: Math.floor(amount)};
    updateUI(true);

    // check level up
    const beforeLevel = levelForXp(before);
    const afterLevel = levelForXp(state.xp);
    if(afterLevel > beforeLevel){
      // Level up: grant stat points only (for credit conversion)
      const levelsGained = afterLevel - beforeLevel;
      const points = levelsGained * 5;
      state.statPoints = (state.statPoints || 0) + points;
      
      document.getElementById('statPoints').textContent = state.statPoints;
      spawnConfetti(80);
      flashLevel();
      // show level up modal
      document.getElementById('newLevel').textContent = afterLevel;
      document.getElementById('earnedPoints').textContent = points;
      showModalElement('levelUpModal', true);
      // shop unlock check: if crossing level 15, show unlock animation
      if(beforeLevel < 15 && afterLevel >= 15){
        showModalElement('shopUnlockModal', true);
      }
    }
  }

  function undo(){
    if(!lastAction) return;
    if(lastAction.type === 'xp'){
      state.xp = Math.max(0, state.xp - lastAction.amount);
      lastAction = null;
      updateUI(true);
    }
  }

  function flashLevel(){
    if(levelEl) levelEl.parentElement.animate([{transform:'scale(1)'},{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:700,easing:'cubic-bezier(.2,.9,.3,1)'});
  }

  // Automatically increase random stats when completing quests
  function increaseRandomStats(amount){
    if(amount <= 0) return;
    
    const statKeys = ['STR', 'AGI', 'CHR', 'STA', 'INT', 'WIL'];
    const increases = {};
    
    for(let i = 0; i < amount; i++){
      const randomStat = statKeys[Math.floor(Math.random() * statKeys.length)];
      increases[randomStat] = (increases[randomStat] || 0) + 1;
      state.stats[randomStat] = (state.stats[randomStat] || 0) + 1;
    }
    
    // Show notification of stat increases
    const increaseText = Object.entries(increases)
      .map(([stat, val]) => `${stat} +${val}`)
      .join(', ');
    
    console.log('📈 Stats increased:', increaseText);
    
    // Update the display
    renderRadarChart();
    saveState();
  }

  // ---------- quests ----------
  function renderQuests(){
    questList.innerHTML = '';
    if(!state.quests || !state.quests.length){ emptyNote.style.display = 'block'; return; }
    emptyNote.style.display = 'none';

    state.quests.forEach(q => {
      const li = document.createElement('li');
      li.className = 'quest-item';
      
      // Build stat rewards display
      let statRewardsHtml = '';
      if(q.statRewards && Object.keys(q.statRewards).length > 0){
        const rewards = Object.entries(q.statRewards)
          .map(([stat, value]) => `+${value} ${stat}`)
          .join(', ');
        statRewardsHtml = `<div class="quest-stats">You will gain: ${rewards}</div>`;
      }
      
      // Build description
      let descriptionHtml = '';
      if(q.description){
        descriptionHtml = `<div class="quest-description">${escapeHtml(q.description)}</div>`;
      }
      
      // Build additional info (duration, distance, etc.)
      let additionalInfo = '';
      if(q.duration) additionalInfo += `Duration: ${q.duration} `;
      if(q.distance) additionalInfo += `Distance: ${q.distance}`;
      let additionalHtml = additionalInfo ? `<div class="quest-meta">${additionalInfo}</div>` : '';
      
      li.innerHTML = `
        <div class="quest-main">
          <div>
            <div class="quest-title">${escapeHtml(q.title)}</div>
            ${descriptionHtml}
            ${additionalHtml}
            <div class="quest-meta">Reward: ${q.xp} XP</div>
            ${statRewardsHtml}
          </div>
        </div>
        <div class="quest-actions">
          <button class="btn" data-id="${q.id}">Complete</button>
        </div>
      `;
      questList.appendChild(li);
    });

    // attach listeners
    questList.querySelectorAll('button[data-id]').forEach(b => {
      b.addEventListener('click', (e)=>{
        const id = b.dataset.id;
        const quest = state.quests.find(q => q.id === id);
        if(!quest) return;
        
        // show daily success modal with a random quote
        document.getElementById('dailyXpReward').textContent = quest.xp;
        const randomQuote = quotes[Math.floor(Math.random()*quotes.length)];
        document.getElementById('sungQuote').textContent = `"${randomQuote}"`;
        
        // store the quest data for claim button
        lastAction = {
          type:'pendingDaily', 
          xp: quest.xp, 
          questId: id, 
          quote: randomQuote,
          statRewards: quest.statRewards || {}
        };
        showModalElement('dailySuccessModal', true);
      });
    });
  }

  // Daily modal actions
  document.getElementById('claimDaily').addEventListener('click', ()=>{
    if(lastAction && lastAction.type === 'pendingDaily'){
      addXp(lastAction.xp);
      
      // Apply specific stat rewards from the quest
      if(lastAction.statRewards && Object.keys(lastAction.statRewards).length > 0){
        const statIncreases = [];
        for(const [stat, amount] of Object.entries(lastAction.statRewards)){
          state.stats[stat] = (state.stats[stat] || 0) + amount;
          statIncreases.push(`${stat} +${amount}`);
        }
        console.log('📈 Quest Stats Gained:', statIncreases.join(', '));
      }
      
      // mark the quest as completed (remove)
      state.quests = state.quests.filter(q=>q.id !== lastAction.questId);
      // record quote in vault
      state.quoteVault = state.quoteVault || [];
      state.quoteVault.push({quote: lastAction.quote, date: Date.now()});
      saveState();
      updateUI(true);
    }
    showModalElement('dailySuccessModal', false);
    lastAction = null;
  });
  document.getElementById('saveQuoteBtn').addEventListener('click', ()=>{
    if(lastAction && lastAction.type === 'pendingDaily'){
      state.quoteVault = state.quoteVault || [];
      state.quoteVault.push({quote: lastAction.quote, date: Date.now()});
      saveState();
    }
  });

  // Penalty modal behavior
  let selectedPenalty = null;
  document.querySelectorAll('#penaltyModal .penalty-choices button[data-penalty]').forEach(b=>{
    b.addEventListener('click', ()=>{ selectedPenalty = b.dataset.penalty; document.getElementById('penaltyText').textContent = 'Selected: ' + (b.textContent || selectedPenalty); });
  });
  document.getElementById('buyMercy').addEventListener('click', ()=>{
    // cost 200 gold to bypass
    const cost = 200;
    if((state.gold||0) >= cost){ state.gold -= cost; saveState(); updateUI(); alert('Mercy token used — penalty bypassed'); showModalElement('penaltyModal', false); }
    else alert('Not enough Gold');
  });
  document.getElementById('logPenalty').addEventListener('click', ()=>{
    // simple logging flow: mark penalty done and optionally give small XP
    if(!selectedPenalty) { alert('Select a penalty first'); return; }
    // give small consolation XP for completing penalty
    addXp(5);
    showModalElement('penaltyModal', false);
    selectedPenalty = null;
  });
  document.getElementById('closePenalty').addEventListener('click', ()=>{ showModalElement('penaltyModal', false); selectedPenalty = null; });

  // Quote Vault
  document.getElementById('closeVault').addEventListener('click', ()=> showModalElement('quoteVault', false));
  function openQuoteVault(){
    const vault = state.quoteVault || [];
    const ul = document.getElementById('vaultList'); ul.innerHTML = '';
    if(vault.length === 0){ ul.innerHTML = '<li class="quest-item">No saved quotes yet</li>'; }
    vault.forEach(q=>{ const li = document.createElement('li'); li.className='quest-item quote-vault'; li.innerHTML = `<div class="quest-title">${escapeHtml(q.quote)}</div><div class="quest-meta">${new Date(q.date).toLocaleString()}</div>`; ul.appendChild(li); });
    showModalElement('quoteVault', true);
  }
  // bind vault open (could be attached to a UI button)
  // Example: open with double-click on title
  document.querySelector('.title h1').addEventListener('dblclick', openQuoteVault);

  // ---------- Daily Quest Timer & Penalty System ----------
  function updateDailyTimer(){
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    
    const timeLeft = midnight - now;
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    const timerEl = document.getElementById('dailyTimer');
    if(timerEl){
      timerEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    // Check if it's a new day
    const today = now.toDateString();
    if(state.lastDailyReset !== today){
      checkDailyQuestsAndApplyPenalties();
      resetDailyQuests();
      state.lastDailyReset = today;
      saveState();
    }
  }
  
  function resetDailyQuests(){
    state.dailyQuests = {
      pushups: false,
      situps: false,
      crunches: false,
      running: false,
      reading: false
    };
    updateDailyQuestsUI();
    saveState();
  }
  
  function checkDailyQuestsAndApplyPenalties(){
    const incomplete = [];
    for(const [key, completed] of Object.entries(state.dailyQuests)){
      if(!completed){
        incomplete.push(key);
      }
    }
    
    if(incomplete.length > 0){
      // Penalty 1: Loss of Will Power by 5 if above 10
      let willLoss = 0;
      if(state.stats.WIL > 10){
        willLoss = Math.min(5, state.stats.WIL - 10); // Don't go below 10
        state.stats.WIL -= willLoss;
      }
      
      // Penalty 2: Pjog status increment (PERMANENT - can only be cleared with scroll)
      state.pjogStatus = state.pjogStatus || 0;
      state.pjogStatus += 1;
      
      // Calculate current Pjog requirement
      const baseDistance = 400; // meters
      const additionalDistance = 200 * (state.pjogStatus - 1);
      const totalDistance = baseDistance + additionalDistance;
      
      const baseTime = 3; // minutes
      const additionalTime = 2 * (state.pjogStatus - 1);
      const totalTime = baseTime + additionalTime;
      
      // Record the penalty
      const penalty = {
        date: new Date().toLocaleDateString(),
        incomplete: incomplete,
        timestamp: Date.now(),
        willPowerLost: willLoss,
        pjogLevel: state.pjogStatus,
        pjogDistance: totalDistance,
        pjogTime: totalTime
      };
      
      state.penalties = state.penalties || [];
      state.penalties.push(penalty);
      
      // Keep only last 10 penalties
      if(state.penalties.length > 10){
        state.penalties = state.penalties.slice(-10);
      }
      
      saveState();
      updatePenaltiesUI();
      
      // Show penalty notification
      let penaltyMessage = `⚠️ DAILY QUEST PENALTY! ⚠️\n\n`;
      penaltyMessage += `You failed to complete:\n${incomplete.map(q => '• ' + q).join('\n')}\n\n`;
      penaltyMessage += `PENALTIES APPLIED:\n`;
      
      if(willLoss > 0){
        penaltyMessage += `• Will Power: -${willLoss} (Now: ${state.stats.WIL})\n`;
      } else {
        penaltyMessage += `• Will Power: Already at minimum (10)\n`;
      }
      
      penaltyMessage += `\n• PENALTY JOG STATUS: x${state.pjogStatus} [PERMANENT]\n`;
      penaltyMessage += `  You must now run ${totalDistance}m in under ${totalTime} minutes\n`;
      penaltyMessage += `  every time you do running exercises!\n\n`;
      penaltyMessage += `⚠️ This status is PERMANENT and can only be\n`;
      penaltyMessage += `cleared with a "Scroll of Status Clear"!`;
      
      alert(penaltyMessage);
    }
  }
  
  function updateDailyQuestsUI(){
    const checkboxes = document.querySelectorAll('#dailyQuestList input[type="checkbox"]');
    checkboxes.forEach(cb => {
      const questKey = cb.dataset.quest;
      if(questKey && state.dailyQuests){
        cb.checked = state.dailyQuests[questKey] || false;
        
        // Update label with current level requirement
        const label = document.getElementById('label-' + questKey);
        if(label){
          const currentAmount = getDailyQuestAmount(questKey);
          const questName = getQuestDisplayName(questKey);
          const unit = getQuestUnit(questKey);
          label.textContent = `${questName}: x${currentAmount} ${unit}`;
        }
      }
    });
  }
  
  // Get current daily quest amount based on progression level
  function getDailyQuestAmount(questKey){
    const level = state.dailyQuestLevels[questKey] || 1;
    
    const progressions = {
      pushups: { start: 5, end: 100, increment: 5 },
      situps: { start: 5, end: 100, increment: 5 },
      crunches: { start: 5, end: 100, increment: 5 },
      running: { start: 1, end: 10, increment: 0.5 },
      reading: { start: 5, end: 30, increment: 1 }
    };
    
    const prog = progressions[questKey];
    if(!prog) return 1;
    
    const amount = prog.start + ((level - 1) * prog.increment);
    return Math.min(amount, prog.end);
  }
  
  // Get quest display name
  function getQuestDisplayName(questKey){
    const names = {
      pushups: 'Pushups',
      situps: 'Situps',
      crunches: 'Crunches',
      running: 'Running',
      reading: 'Book reading'
    };
    return names[questKey] || questKey;
  }
  
  // Get quest unit
  function getQuestUnit(questKey){
    const units = {
      pushups: '',
      situps: '',
      crunches: '',
      running: 'KM',
      reading: 'pages'
    };
    return units[questKey] || '';
  }
  
  // Get max level for a quest
  function getMaxQuestLevel(questKey){
    const progressions = {
      pushups: { start: 5, end: 100, increment: 5 },
      situps: { start: 5, end: 100, increment: 5 },
      crunches: { start: 5, end: 100, increment: 5 },
      running: { start: 1, end: 10, increment: 0.5 },
      reading: { start: 5, end: 30, increment: 1 }
    };
    
    const prog = progressions[questKey];
    if(!prog) return 1;
    
    return Math.ceil((prog.end - prog.start) / prog.increment) + 1;
  }
  
  function updatePenaltiesUI(){
    const penaltiesEl = document.getElementById('penaltiesDisplay');
    const clearPjogBtn = document.getElementById('clearPjogBtn');
    if(!penaltiesEl) return;
    
    // Show current Pjog status if exists
    let html = '';
    if(state.pjogStatus && state.pjogStatus > 0){
      const baseDistance = 400;
      const additionalDistance = 200 * (state.pjogStatus - 1);
      const totalDistance = baseDistance + additionalDistance;
      
      const baseTime = 3;
      const additionalTime = 2 * (state.pjogStatus - 1);
      const totalTime = baseTime + additionalTime;
      
      html += `<div style="margin-bottom: 10px; padding: 8px; background: rgba(255,68,68,0.15); border-left: 3px solid #ff4444; border-radius: 4px;">
        <strong style="color: #ff4444;">🔒 PENALTY JOG x${state.pjogStatus}</strong><br>
        <span style="font-size: 0.85em; color: #ffaa44;">Must run ${totalDistance}m in ${totalTime} min</span><br>
        <span style="font-size: 0.75em; color: #ff8888; font-style: italic;">PERMANENT - Scroll required</span>
      </div>`;
      
      // Show scroll button
      if(clearPjogBtn){
        clearPjogBtn.style.display = 'block';
        clearPjogBtn.textContent = 'Use Scroll of Status Clear';
      }
    } else {
      // Hide scroll button
      if(clearPjogBtn) clearPjogBtn.style.display = 'none';
    }
    
    if(!state.penalties || state.penalties.length === 0){
      if(!state.pjogStatus || state.pjogStatus === 0){
        penaltiesEl.innerHTML = 'None';
        penaltiesEl.style.color = '';
      } else {
        penaltiesEl.innerHTML = html;
      }
      return;
    }
    
    const recentPenalties = state.penalties.slice(-3).reverse();
    html += recentPenalties.map(p => {
      let details = `${p.date}: `;
      if(p.willPowerLost > 0){
        details += `WIL -${p.willPowerLost}, `;
      }
      details += `Pjog→x${p.pjogLevel}`;
      
      return `<div style="margin-bottom: 5px; color: #ff8888; font-size: 0.85em;">
        ${details}
      </div>`;
    }).join('');
    
    penaltiesEl.innerHTML = html;
  }
  
  function setupDailyQuestListeners(){
    const checkboxes = document.querySelectorAll('#dailyQuestList input[type="checkbox"]');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        const questKey = e.target.dataset.quest;
        if(questKey){
          const wasChecked = state.dailyQuests[questKey];
          const nowChecked = e.target.checked;
          
          state.dailyQuests[questKey] = nowChecked;
          
          // Award XP when quest is completed (not when unchecked)
          if(!wasChecked && nowChecked){
            // Calculate XP with diminishing returns based on body adaptation
            const completionCount = state.dailyQuestCompletions[questKey] || 0;
            const currentLevel = state.dailyQuestLevels[questKey] || 1;
            const currentAmount = getDailyQuestAmount(questKey);
            const baseXP = calculateDailyQuestXP(questKey, completionCount, currentLevel);
            
            // Increment completion counter
            state.dailyQuestCompletions[questKey] = completionCount + 1;
            
            // Check if should level up the quest (every 3 completions at current level)
            const maxLevel = getMaxQuestLevel(questKey);
            if((completionCount + 1) % 3 === 0 && currentLevel < maxLevel){
              state.dailyQuestLevels[questKey] = currentLevel + 1;
              const newAmount = getDailyQuestAmount(questKey);
              
              // Show level up notification
              setTimeout(() => {
                const levelUpNotif = document.createElement('div');
                levelUpNotif.style.cssText = `
                  position: fixed;
                  top: 150px;
                  right: 20px;
                  background: linear-gradient(135deg, rgba(93, 158, 110, 0.95), rgba(74, 124, 89, 0.95));
                  color: white;
                  padding: 15px 20px;
                  border-radius: 10px;
                  border: 2px solid #5d9e6e;
                  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
                  z-index: 10000;
                  font-family: Georgia, serif;
                  font-weight: 600;
                  animation: slideInRight 0.3s ease;
                `;
                levelUpNotif.innerHTML = `
                  <div style="font-size: 14px;">📈 PROGRESSIVE OVERLOAD!</div>
                  <div style="font-size: 16px; margin-top: 5px;">${getQuestDisplayName(questKey)}</div>
                  <div style="font-size: 18px; margin-top: 5px; color: #d4af37;">${currentAmount} → ${newAmount} ${getQuestUnit(questKey)}</div>
                  <div style="font-size: 11px; margin-top: 5px; opacity: 0.9;">Body adapted. Increasing difficulty!</div>
                `;
                document.body.appendChild(levelUpNotif);
                
                setTimeout(() => {
                  levelUpNotif.style.animation = 'slideOutRight 0.3s ease';
                  setTimeout(() => levelUpNotif.remove(), 300);
                }, 4000);
              }, 3500);
              
              // Update UI
              updateDailyQuestsUI();
            }
            
            // Award XP
            addXp(baseXP);
            
            // Show notification
            const adaptationPercent = Math.round((1 - (baseXP / getBaseDailyQuestXP(questKey, currentLevel))) * 100);
            
            // Show subtle alert
            setTimeout(() => {
              const notification = document.createElement('div');
              notification.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: linear-gradient(135deg, rgba(212, 175, 55, 0.95), rgba(139, 90, 43, 0.95));
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                border: 2px solid #d4af37;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
                z-index: 10000;
                font-family: Georgia, serif;
                font-weight: 600;
                animation: slideInRight 0.3s ease;
              `;
              notification.innerHTML = `
                <div style="font-size: 14px;">✅ ${questKey.toUpperCase()}</div>
                <div style="font-size: 18px; margin-top: 5px;">+${baseXP} XP</div>
                <div style="font-size: 11px; margin-top: 3px; opacity: 0.9;">${currentAmount} ${getQuestUnit(questKey)} completed</div>
                ${completionCount > 0 ? `<div style="font-size: 11px; margin-top: 5px; opacity: 0.9;">Adaptation: -${adaptationPercent}%</div>` : ''}
              `;
              document.body.appendChild(notification);
              
              setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
              }, 3000);
            }, 100);
          }
          
          saveState();
        }
      });
    });
  }
  
  // Calculate base XP for each daily quest type (scales with level)
  function getBaseDailyQuestXP(questKey, level){
    level = level || 1;
    const baseXPValues = {
      pushups: 15,   // Starting XP
      situps: 12,
      crunches: 10,
      running: 25,
      reading: 20
    };
    
    const baseXP = baseXPValues[questKey] || 10;
    
    // Scale XP with difficulty level (higher reps = more XP)
    // Each level adds 10% more XP
    const scaledXP = Math.round(baseXP * (1 + (level - 1) * 0.1));
    
    return scaledXP;
  }
  
  // Calculate XP with diminishing returns based on repetitions (body adaptation)
  function calculateDailyQuestXP(questKey, completionCount, level){
    const baseXP = getBaseDailyQuestXP(questKey, level);
    
    // Real-life adaptation formula:
    // First time: 100% XP
    // Each repetition reduces effectiveness by a decay factor
    // Formula: baseXP * (0.85^completionCount)
    
    const decayFactor = 0.85; // Body adapts, reducing gains
    const multiplier = Math.pow(decayFactor, completionCount);
    
    // Minimum XP of 2 to always reward effort
    const calculatedXP = Math.max(2, Math.round(baseXP * multiplier));
    
    return calculatedXP;
  }

  // ---------- 3D Isometric Radar Chart ----------
  function renderRadarChart(){
    const stats = state.stats;
    const statKeys = ['STR', 'AGI', 'CHR', 'STA', 'INT', 'WIL'];
    
    // Clear existing content
    const gridLines = document.getElementById('gridLines');
    const statPolygons = document.getElementById('statPolygons');
    const statLabels = document.getElementById('statLabels');
    const valueLabels = document.getElementById('valueLabels');
    
    if(!gridLines || !statPolygons || !statLabels || !valueLabels){
      console.warn('Radar chart elements not found, retrying...');
      setTimeout(()=>renderRadarChart(), 100);
      return;
    }
    
    // Find the maximum stat value to scale the chart dynamically
    const statValues = statKeys.map(key => stats[key] || 0);
    const maxStatValue = Math.max(...statValues, 50); // Minimum scale of 50
    
    // Round up to nearest nice number for scaling
    let chartMax = maxStatValue;
    if(chartMax <= 50) chartMax = 50;
    else if(chartMax <= 100) chartMax = 100;
    else if(chartMax <= 200) chartMax = 200;
    else if(chartMax <= 300) chartMax = 300;
    else if(chartMax <= 400) chartMax = 400;
    else if(chartMax <= 500) chartMax = 500;
    else chartMax = Math.ceil(maxStatValue / 100) * 100; // Round up to nearest 100
    
    console.log('Rendering radar - Max stat:', maxStatValue, 'Chart scale:', chartMax, 'Stats:', stats);
    
    gridLines.innerHTML = '';
    statPolygons.innerHTML = '';
    statLabels.innerHTML = '';
    valueLabels.innerHTML = '';
    
    // 3D isometric projection helpers
    const centerX = 250;
    const centerY = 250;
    const maxRadius = 180;
    
    // Define 6 axes in 3D isometric space (hexagon around center)
    const axes = [
      { name: 'Strength', key: 'STR', angle: -90 },
      { name: 'Agility', key: 'AGI', angle: -30 },
      { name: 'Charm', key: 'CHR', angle: 30 },
      { name: 'Stamina', key: 'STA', angle: 90 },
      { name: 'Intelligence', key: 'INT', angle: 150 },
      { name: 'Will power', key: 'WIL', angle: 210 }
    ];
    
    // Create dynamic grid levels based on chart max
    const numLevels = 5;
    const gridLevels = [];
    for(let i = 1; i <= numLevels; i++){
      gridLevels.push((chartMax / numLevels) * i);
    }
    
    // Draw grid lines dynamically
    gridLevels.forEach((level, index) => {
      const radius = (level / chartMax) * maxRadius;
      const points = [];
      
      axes.forEach((axis, i) => {
        const angle = (axis.angle - 90) * Math.PI / 180;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        points.push(`${x},${y}`);
      });
      
      const isOutermost = index === gridLevels.length - 1;
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygon.setAttribute('points', points.join(' '));
      polygon.setAttribute('fill', 'none');
      polygon.setAttribute('stroke', isOutermost ? 'rgba(200,200,200,0.4)' : 'rgba(200,200,200,0.2)');
      polygon.setAttribute('stroke-width', isOutermost ? '2.5' : '1.5');
      polygon.setAttribute('stroke-dasharray', '5,5');
      gridLines.appendChild(polygon);
    });
    
    // Draw axis lines from center to max radius
    axes.forEach(axis => {
      const angle = (axis.angle - 90) * Math.PI / 180;
      const x = centerX + Math.cos(angle) * maxRadius;
      const y = centerY + Math.sin(angle) * maxRadius;
      
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', centerX);
      line.setAttribute('y1', centerY);
      line.setAttribute('x2', x);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', 'rgba(200,200,200,0.3)');
      line.setAttribute('stroke-width', '1.5');
      gridLines.appendChild(line);
    });
    
    // Draw value labels on Strength axis
    gridLevels.forEach(level => {
      const radius = (level / chartMax) * maxRadius;
      const angle = (-90 - 90) * Math.PI / 180; // Strength axis
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y - 10);
      text.setAttribute('fill', 'rgba(200,200,200,0.7)');
      text.setAttribute('font-size', '11');
      text.setAttribute('font-weight', '500');
      text.setAttribute('text-anchor', 'middle');
      text.textContent = level;
      valueLabels.appendChild(text);
    });
    
    // Draw single unified stat polygon connecting all 6 stats
    const allPoints = [];
    axes.forEach(axis => {
      const value = Math.min(chartMax, Math.max(0, stats[axis.key] || 0));
      const radius = (value / chartMax) * maxRadius;
      const angle = (axis.angle - 90) * Math.PI / 180;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      allPoints.push(`${x},${y}`);
    });
    
    // Draw the main stat polygon (unified)
    if (allPoints.length === 6) {
      const mainPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      mainPolygon.setAttribute('points', allPoints.join(' '));
      mainPolygon.setAttribute('fill', 'rgba(124, 92, 255, 0.15)');
      mainPolygon.setAttribute('stroke', '#7c5cff');
      mainPolygon.setAttribute('stroke-width', '3');
      mainPolygon.setAttribute('stroke-linejoin', 'round');
      statPolygons.appendChild(mainPolygon);
      
      // Add vertex dots for each stat point
      axes.forEach((axis, i) => {
        const value = Math.min(chartMax, Math.max(0, stats[axis.key] || 0));
        const radius = (value / chartMax) * maxRadius;
        const angle = (axis.angle - 90) * Math.PI / 180;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '5');
        circle.setAttribute('fill', '#7c5cff');
        circle.setAttribute('stroke', '#ffffff');
        circle.setAttribute('stroke-width', '2');
        statPolygons.appendChild(circle);
      });
    }
    
    // Draw stat labels outside the hexagon
    axes.forEach(axis => {
      const angle = (axis.angle - 90) * Math.PI / 180;
      const labelRadius = maxRadius + 40;
      const x = centerX + Math.cos(angle) * labelRadius;
      const y = centerY + Math.sin(angle) * labelRadius;
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y);
      text.setAttribute('fill', 'rgba(230,230,230,0.95)');
      text.setAttribute('font-size', '14');
      text.setAttribute('font-weight', '600');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('alignment-baseline', 'middle');
      text.textContent = axis.name;
      statLabels.appendChild(text);
    });
    
    console.log('Radar chart rendered successfully! Grid lines:', gridLines.children.length, 'Polygons:', statPolygons.children.length, 'Labels:', statLabels.children.length);
  }

  // ---------- small UI helpers ----------
  function showModalElement(id, show){
    const el = document.getElementById(id);
    if(!el) return;
    el.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  // Convert stat points to credits button
  const convertToCreditsBtn = document.getElementById('convertToCredits');
  if(convertToCreditsBtn){
    convertToCreditsBtn.addEventListener('click', () => {
      const points = state.statPoints || 0;
      if(points < 35){
        alert(`Not enough stat points!\n\nYou have: ${points} points\nRequired: 35 points = 1 credit\n\nComplete more quests to earn stat points!`);
        return;
      }
      
      const creditsToGain = Math.floor(points / 35);
      const pointsToUse = creditsToGain * 35;
      const pointsRemaining = points - pointsToUse;
      
      if(confirm(`Convert ${pointsToUse} stat points to ${creditsToGain} credit(s)?\n\nRemaining points: ${pointsRemaining}`)){
        state.statPoints -= pointsToUse;
        state.gold = (state.gold || 0) + creditsToGain;
        
        alert(`✨ Conversion Complete!\n\n+${creditsToGain} Credit(s)\n\nTotal Credits: ${state.gold}\nRemaining Stat Points: ${state.statPoints}`);
        
        saveState();
        updateUI();
      }
    });
  }

  // Remove old allocation modal events (stats now increase automatically)
  const openAllocBtn = document.getElementById('openAllocate');
  if(openAllocBtn){
    // Button removed from UI, but keep reference safe
    openAllocBtn.addEventListener('click', ()=>{ 
      alert('Stats are now increased automatically by completing quests!\n\nYou can convert stat points to credits:\n35 points = 1 credit');
    });
  }
  
  const closeAllocBtn = document.getElementById('closeAlloc');
  if(closeAllocBtn) closeAllocBtn.addEventListener('click', ()=> showModalElement('allocateModal', false));
  
  const openAllocFromLevelBtn = document.getElementById('openAllocatorFromLevelUp');
  if(openAllocFromLevelBtn) openAllocFromLevelBtn.addEventListener('click', ()=>{ 
    showModalElement('levelUpModal', false);
    alert('Stats increase automatically!\n\nYour stat points can be converted to credits (35 points = 1 credit)');
  });
  
  const closeLevelUpBtn = document.getElementById('closeLevelUp');
  if(closeLevelUpBtn) closeLevelUpBtn.addEventListener('click', ()=> showModalElement('levelUpModal', false));

  function populateAllocValues(){
    const s = state.stats;
    ['STR','AGI','CHR','STA','INT','WIL'].forEach(k=>{ const el = document.getElementById(k + '_val'); if(el) el.textContent = s[k] || 0; });
    document.getElementById('statPoints').textContent = state.statPoints || 0;
  }

  // allocation buttons
  document.querySelectorAll('.alloc-controls button').forEach(b=>{
    b.addEventListener('click', ()=>{
      const stat = b.dataset.stat;
      const action = b.dataset.action;
      if(action === 'inc'){
        if((state.statPoints||0) > 0){ state.stats[stat] = (state.stats[stat]||0) + 1; state.statPoints--; document.getElementById(stat + '_val').textContent = state.stats[stat]; document.getElementById('statPoints').textContent = state.statPoints; renderRadarChart(); saveState(); }
      } else {
        if((state.stats[stat]||0) > 0){ state.stats[stat] = Math.max(0, state.stats[stat]-1); document.getElementById(stat + '_val').textContent = state.stats[stat]; renderRadarChart(); saveState(); }
      }
    });
  });
  document.getElementById('saveAlloc').addEventListener('click', ()=>{ showModalElement('allocateModal', false); updateUI(true); });

  // ---------- modal ----------
  function showModal(show=true){
    modal.setAttribute('aria-hidden', show ? 'false' : 'true');
    if(show){ questTitle.focus(); }
  }

  // ---------- confetti ----------
  function resizeCanvas(){
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }

  function spawnConfetti(count){
    if(!confetti) return;
    resizeCanvas();
    const colors = ['#ff6b6b','#ffd166','#7c5cff','#00e0a1','#66d9ff'];
    for(let i=0;i<count;i++){
      particles.push({
        x: Math.random()*confettiCanvas.width,
        y: -10 - Math.random()*200,
        vx: (Math.random()-0.5)*6,
        vy: 2 + Math.random()*6,
        size: 6 + Math.random()*8,
        color: colors[Math.floor(Math.random()*colors.length)],
        rot: Math.random()*360,
        life: 60 + Math.random()*60
      });
    }
    if(!animating) animate();
  }

  let animating = false;
  function animate(){
    if(!confetti) return;
    animating = true;
    confetti.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
    for(let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.rot += p.vx*3; p.life--;
      confetti.save();
      confetti.translate(p.x,p.y);
      confetti.rotate(p.rot * Math.PI/180);
      confetti.fillStyle = p.color;
      confetti.fillRect(-p.size/2,-p.size/2,p.size,p.size*0.6);
      confetti.restore();
      if(p.y > confettiCanvas.height + 50 || p.life <= 0){ particles.splice(i,1); }
    }
    if(particles.length>0){ requestAnimationFrame(animate); }
    else{ animating = false; confetti.clearRect(0,0,confettiCanvas.width,confettiCanvas.height); }
  }

  // ---------- events ----------
  document.querySelectorAll('button[data-xp]').forEach(b=>{
    b.addEventListener('click',()=> addXp(Number(b.dataset.xp)));
  });

  if(undoBtn) undoBtn.addEventListener('click',()=> undo());
  if(addQuestBtn) addQuestBtn.addEventListener('click',()=> showModal(true));
  if(cancelModal) cancelModal.addEventListener('click',()=> showModal(false));
  if(resetBtn) resetBtn.addEventListener('click',()=>{
    if(confirm('Reset all progress? This cannot be undone.')){
      state = {xp:0, quests: defaultQuests.slice(), stats: { STR: 10, AGI: 10, CHR: 10, STA: 10, INT: 10, WIL: 10 }, statPoints: 5, gold: 0}; saveState(); updateUI();
    }
  });

  // Clear Pjog penalty button (requires Scroll of Status Clear)
  const clearPjogBtn = document.getElementById('clearPjogBtn');
  if(clearPjogBtn){
    clearPjogBtn.addEventListener('click', () => {
      if(!state.pjogStatus || state.pjogStatus === 0){
        alert('No penalty jog status to clear!');
        return;
      }
      
      // Check if player has a Scroll of Status Clear
      state.inventory = state.inventory || {};
      const scrollCount = state.inventory['scroll_status_clear'] || 0;
      
      if(scrollCount <= 0){
        alert('🔒 PENALTY JOG STATUS: PERMANENT\n\nYou need a "Scroll of Status Clear" to remove this penalty!\n\nThese rare scrolls can be obtained from:\n• High-level dungeons\n• Special shop items\n• Quest rewards');
        return;
      }
      
      const baseDistance = 400;
      const additionalDistance = 200 * (state.pjogStatus - 1);
      const totalDistance = baseDistance + additionalDistance;
      
      const baseTime = 3;
      const additionalTime = 2 * (state.pjogStatus - 1);
      const totalTime = baseTime + additionalTime;
      
      if(confirm(`Use Scroll of Status Clear?\n\nCurrent Penalty: x${state.pjogStatus}\n(${totalDistance}m in ${totalTime} min)\n\nThis will permanently remove your Pjog status.\n\nScrolls remaining: ${scrollCount}`)){
        // Use the scroll
        state.inventory['scroll_status_clear'] -= 1;
        state.pjogStatus = 0;
        
        alert(`✨ Scroll of Status Clear used!\n\nPenalty Jog status has been cleared!\n\nScrolls remaining: ${state.inventory['scroll_status_clear']}`);
        
        saveState();
        updateUI();
      }
    });
  }

  questForm.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    const title = questTitle.value.trim();
    const description = document.getElementById('questDescription').value.trim();
    const xpVal = Math.max(1, Math.floor(Number(questXp.value) || 10));
    
    // Collect stat rewards
    const statRewards = {};
    const statKeys = ['STR', 'AGI', 'CHR', 'STA', 'INT', 'WIL'];
    statKeys.forEach(stat => {
      const value = Math.max(0, Math.floor(Number(document.getElementById(`quest${stat}`).value) || 0));
      if(value > 0){
        statRewards[stat] = value;
      }
    });
    
    if(title){
      const newQuest = {
        id: genId(), 
        title, 
        xp: xpVal,
        description: description || '',
        statRewards: statRewards
      };
      
      state.quests.unshift(newQuest);
      saveState(); updateUI(); showModal(false);
      questForm.reset();
    }
  });

  // helpers
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

  // ---------- startup ----------
  window.addEventListener('resize', resizeCanvas);
  loadState(); 
  
  // Ensure stats are initialized
  if(!state.stats || Object.keys(state.stats).length === 0){
    state.stats = { STR: 10, AGI: 10, CHR: 10, STA: 10, INT: 10, WIL: 10 };
  }
  
  // Initialize daily quests if not present
  if(!state.dailyQuests){
    state.dailyQuests = {
      pushups: false,
      situps: false,
      crunches: false,
      running: false,
      reading: false
    };
  }
  
  // Initialize last reset date if not present
  if(!state.lastDailyReset){
    state.lastDailyReset = new Date().toDateString();
  }
  
  // Initialize penalties array if not present
  if(!state.penalties){
    state.penalties = [];
  }
  
  // Initialize inventory if not present
  if(!state.inventory){
    state.inventory = {};
  }
  
  // Initialize pjogStatus if not present
  if(state.pjogStatus === undefined){
    state.pjogStatus = 0;
  }
  
  updateUI(false);
  
  // Setup daily quest listeners
  setupDailyQuestListeners();
  
  // Start daily timer
  updateDailyTimer();
  timerInterval = setInterval(updateDailyTimer, 1000);
  
  // Force multiple render attempts to ensure visibility
  renderRadarChart();
  setTimeout(()=>renderRadarChart(), 50);
  setTimeout(()=>renderRadarChart(), 200);
  setTimeout(()=>renderRadarChart(), 500);
  
  // small intro animation
  if(xpBar) xpBar.style.width = '0%'; 
  setTimeout(()=>updateUI(true),120);

  // Shop unlock modal: open shop when user confirms
  document.getElementById('enterShopAfterUnlock').addEventListener('click', ()=>{ showModalElement('shopUnlockModal', false); renderShop(); showModalElement('shopModal', true); });

  // -- Dungeon system
  const dungeonList = document.getElementById('dungeonList');
  const emptyDungeonNote = document.getElementById('emptyDungeonNote');
  document.getElementById('newDungeonBtn').addEventListener('click', ()=> showModalElement('newDungeonModal', true));
  // Add listener for bottom dungeon button
  const dungeonBtnBottom = document.getElementById('newDungeonBtnBottom');
  if(dungeonBtnBottom){ dungeonBtnBottom.addEventListener('click', ()=> showModalElement('newDungeonModal', true)); }
  document.getElementById('cancelDungeon').addEventListener('click', ()=> showModalElement('newDungeonModal', false));
  document.getElementById('createDungeon').addEventListener('click', ()=>{
    const name = document.getElementById('dName').value.trim() || 'Unnamed Dungeon';
    const goal = document.getElementById('dGoal').value.trim() || 'Complete the goal';
    const days = Math.max(1, Number(document.getElementById('dDays').value)||7);
    const xp = Math.max(10, Number(document.getElementById('dXp').value)||200);
    const gold = Math.max(0, Number(document.getElementById('dGold').value)||50);
    const id = genId();
    const deadline = Date.now() + days * 24 * 60 * 60 * 1000;
    state.dungeons = state.dungeons || [];
    state.dungeons.push({id,name,goal,deadline,xp,gold,progress:0,phases:[],created:Date.now()});
    saveState(); renderDungeons(); showModalElement('newDungeonModal', false);
  });

  function renderDungeons(){
    dungeonList.innerHTML = '';
    const ds = state.dungeons || [];
    if(ds.length === 0){ emptyDungeonNote.style.display = 'block'; return; }
    emptyDungeonNote.style.display = 'none';
    ds.forEach(d=>{
      const li = document.createElement('li'); li.className='dungeon-item';
      const remainingMs = Math.max(0, d.deadline - Date.now());
      const daysLeft = Math.ceil(remainingMs / (24*60*60*1000));
      li.innerHTML = `<div><div class="quest-title">${escapeHtml(d.name)}</div><div class="dungeon-meta">${escapeHtml(d.goal)} — ${daysLeft}d left</div></div><div class="quest-actions"><button class="btn" data-id="${d.id}">Enter</button></div>`;
      dungeonList.appendChild(li);
    });
    dungeonList.querySelectorAll('button[data-id]').forEach(b=>{ b.addEventListener('click', ()=>{
      const id = b.dataset.id; openDungeon(id);
    }); });
  }

  function openDungeon(id){
    const d = (state.dungeons||[]).find(x=>x.id===id); if(!d) return alert('Dungeon not found');
    // simple modal: prompt to start/claim
    if(confirm(`Enter ${d.name}? Goal: ${d.goal}. Time left: ${Math.ceil((d.deadline-Date.now())/(24*60*60*1000))} days.`)){
      // start tracking: create checkpoint now
      d.lastEntered = Date.now(); saveState(); renderDungeons(); alert('Dungeon entered. Track your progress externally and mark complete when done.');
    }
  }

  renderDungeons();

  // SHOP: simple item previews and buy flow
  const shopItems = [
    {id:'pdf1',name:'Mastery Guide (PDF)',levelReq:1,cost:100,type:'pdf'},
    {id:'course1',name:'Complete Course: Focus',levelReq:10,cost:800,type:'course'},
    {id:'bundle1',name:'S-Rank Bundle',levelReq:15,cost:2500,type:'bundle'}
  ];
  function renderShop(){
    const lvl = levelForXp(state.xp);
    // intro text
    const intro = lvl < 15 ? `Premium items locked. Reach Level 15 to unlock the best bundles.` : `Welcome to the Shop — premium items available.`;
    document.getElementById('shopIntro').textContent = intro;

    // preview carousel
    const previewHtml = shopItems.map(it=>{
      const locked = lvl < it.levelReq;
      return `<div class="shop-item ${locked? 'locked':''}" data-id="${it.id}"><div class="thumb"></div><div><strong>${it.name}</strong></div><div class="meta">Unlocks L${it.levelReq}</div><div class="meta">Cost: ${it.cost} Gold</div></div>`;
    }).join('');
    document.getElementById('shopPreview').innerHTML = previewHtml;

    // main shop content (list)
    const html = shopItems.map(it=>{
      const locked = lvl < it.levelReq;
      return `<div style="margin:8px;padding:8px;border-radius:8px;background:rgba(255,255,255,0.02)"><div><strong>${it.name}</strong> ${locked?'<span style="color:var(--muted)">(Unlocks at L'+it.levelReq+')</span>':''}</div><div>Cost: ${it.cost} Gold</div><div style="margin-top:6px">${locked?'<button class="btn ghost" data-id="'+it.id+'" disabled>Locked</button>':'<button class="btn" data-id="'+it.id+'">Buy</button>'}</div></div>`;
    }).join('');
    shopContent.innerHTML = html;
    shopContent.querySelectorAll('button[data-id]').forEach(b=>{ b.addEventListener('click', ()=>{ const itId=b.dataset.id; promptPurchase(itId); }); });

    // preview interactions: click a preview to open item in shop content area
    document.querySelectorAll('#shopPreview .shop-item').forEach(node=>{
      node.addEventListener('click', ()=>{
        const id = node.dataset.id; const item = shopItems.find(s=>s.id===id);
        if(!item) return;
        const lvl = levelForXp(state.xp);
        const locked = lvl < item.levelReq;
        shopContent.innerHTML = `<div style="padding:12px"><h4>${item.name} ${locked?'<small style="color:var(--muted)">(locked until L'+item.levelReq+')</small>':''}</h4><p class="muted">${item.type === 'course' ? 'A guided course to improve focus.' : 'Resource.'}</p><p>Cost: ${item.cost} Gold</p><div style="margin-top:8px">${locked?'<button class="btn ghost" disabled>Locked</button>':'<button class="btn" data-id="'+item.id+'">Buy</button>'}</div></div>`;
        shopContent.querySelectorAll('button[data-id]').forEach(b=> b.addEventListener('click', ()=> promptPurchase(b.dataset.id)));
      });
    });
  }

  // prompt purchase with confirmation modal
  let pendingPurchase = null;
  function promptPurchase(itemId){
    const it = shopItems.find(s=>s.id===itemId); if(!it) return;
    pendingPurchase = it;
    document.getElementById('purchaseText').textContent = `Buy ${it.name} for ${it.cost} Gold?`;
    showModalElement('purchaseModal', true);
  }
  document.getElementById('cancelPurchase').addEventListener('click', ()=>{ pendingPurchase=null; showModalElement('purchaseModal', false); });
  document.getElementById('confirmPurchase').addEventListener('click', ()=>{
    if(!pendingPurchase) return; buyItem(pendingPurchase.id); pendingPurchase=null; showModalElement('purchaseModal', false);
  });
  function buyItem(id){ const it = shopItems.find(s=>s.id===id); if(!it) return; if((state.gold||0) < it.cost) return alert('Not enough gold'); state.gold -= it.cost; state.inventory = state.inventory || []; state.inventory.push(it); saveState(); updateUI(); alert('Purchased '+it.name); }
  // re-render shop when modal opens
  document.getElementById('shopBtn').addEventListener('click', ()=>{ renderShop(); const lvl = levelForXp(state.xp); if(lvl < 15){ /* nothing extra now */ } showModalElement('shopModal', true); });


  // shop
  const shopBtn = document.getElementById('shopBtn');
  const shopContent = document.getElementById('shopContent');
  shopBtn.addEventListener('click', ()=>{
    const lvl = levelForXp(state.xp);
    if(lvl < 15){
      shopContent.innerHTML = `<p style="color:var(--muted)">Shop Locked — Reach Level 15 to unlock premium items.</p><p>Your progress: Level ${lvl} / 15</p>`;
      showModalElement('shopModal', true);
    } else {
      shopContent.innerHTML = `<p>Welcome to the Shop — premium items available.</p>`;
      showModalElement('shopModal', true);
    }
  });
  document.getElementById('closeShop').addEventListener('click', ()=> showModalElement('shopModal', false));

  // top shop button
  const shopTopBtn = document.getElementById('shopTopBtn');
  if(shopTopBtn){ shopTopBtn.addEventListener('click', ()=>{ renderShop(); showModalElement('shopModal', true); }); }

  // Console helper function for testing (gives scroll)
  window.giveScroll = function() {
    state.inventory = state.inventory || {};
    state.inventory['scroll_status_clear'] = (state.inventory['scroll_status_clear'] || 0) + 1;
    saveState();
    console.log(`✨ Scroll of Status Clear added! Total: ${state.inventory['scroll_status_clear']}`);
    updateUI();
  };
  
  console.log('%c💡 Dev Tip: Type "giveScroll()" in console to get a Scroll of Status Clear', 'color: #7c5cff; font-weight: bold;');

})();
