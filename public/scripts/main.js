const urlParamsSync = new URLSearchParams(window.location.search);

const navEntries = performance.getEntriesByType("navigation");
if (navEntries.length > 0 && navEntries[0].type !== "reload") {
    if (!urlParamsSync.get('room')) {
        sessionStorage.removeItem('hostRoomId');
        sessionStorage.removeItem('guestName');
    }
}

const socket = io({ transports: ['websocket'], upgrade: false });

function createStars() { 
    const container = document.getElementById('starsContainer'); container.innerHTML = ''; 
    for (let i = 0; i < 75; i++) {
        let star = document.createElement('div'); star.className = 'falling-star';
        let size = Math.random() * 3 + 1.5; star.style.width = size + 'px'; star.style.height = size + 'px';
        star.style.left = Math.random() * 100 + 'vw'; star.style.animationDuration = Math.random() * 3 + 3 + 's'; star.style.animationDelay = '-' + (Math.random() * 6) + 's'; 
        container.appendChild(star);
    } 
} 
createStars();

const audioJoin = new Audio('audio/join.mp3'); 
const audioWaiting = new Audio('audio/waiting.mp3'); 
const audioStart = new Audio('audio/start.mp3');

let audioCtx; 
function initAudio() { if (!audioCtx) audioCtx = new AudioContext(); if (audioCtx.state === 'suspended') audioCtx.resume(); } 
document.addEventListener('click', initAudio, { once: true });

function playSound(type) {
    if (!audioCtx) return; const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); 
    osc.connect(gain); gain.connect(audioCtx.destination); const now = audioCtx.currentTime;
    if (type === 'click') { osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(300, now + 0.1); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1); } 
    else if (type === 'start') { osc.type = 'triangle'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.4); gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.2, now + 0.2); gain.gain.linearRampToValueAtTime(0, now + 0.4); osc.start(now); osc.stop(now + 0.4); } 
    else if (type === 'vote') { osc.type = 'square'; osc.frequency.setValueAtTime(400, now); gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1); } 
    else if (type === 'win') { osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.setValueAtTime(600, now + 0.1); osc.frequency.setValueAtTime(800, now + 0.2); gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now + 0.5); osc.start(now); osc.stop(now + 0.5); } 
    else if (type === 'lose') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.5); gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now + 0.5); osc.start(now); osc.stop(now + 0.5); }
} 
document.addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON') playSound('click'); });

function launchConfetti() {
    const colors = ['#ff0055', '#00f3ff', '#00ff88', '#ffe600', '#b000ff'];
    for(let i=0; i<80; i++) {
        let conf = document.createElement('div');
        conf.style.position = 'fixed';
        conf.style.width = '8px'; conf.style.height = '15px';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        conf.style.zIndex = '9999999';
        let isLeft = Math.random() > 0.5;
        conf.style.left = isLeft ? '-10px' : '100vw';
        conf.style.bottom = '10vh';
        document.body.appendChild(conf);
        let angle = isLeft ? (Math.random() * 45 + 30) : (Math.random() * 45 + 105); 
        let velocity = Math.random() * 20 + 15;
        let vx = Math.cos(angle * Math.PI / 180) * velocity;
        let vy = -Math.sin(angle * Math.PI / 180) * velocity;
        let x = isLeft ? -10 : window.innerWidth;
        let y = window.innerHeight * 0.9;
        let gravity = 0.5;
        let spin = Math.random() * 360;
        let spinSpeed = Math.random() * 20 - 10;
        
        let interval = setInterval(() => {
            x += vx; vy += gravity; y += vy; spin += spinSpeed;
            conf.style.transform = `translate(${x - (isLeft ? -10 : window.innerWidth)}px, ${y - window.innerHeight * 0.9}px) rotate(${spin}deg)`;
            if(y > window.innerHeight + 100) { clearInterval(interval); conf.remove(); }
        }, 20);
    }
}

const pcViewBtn = document.getElementById('pcViewBtn');
const mobileViewBtn = document.getElementById('mobileViewBtn');

function detectDevice() {
    if (window.innerWidth > 768) { 
        document.body.className = 'pc-mode'; 
        if(pcViewBtn) pcViewBtn.classList.add('active-view'); 
        if(mobileViewBtn) mobileViewBtn.classList.remove('active-view'); 
    } else { 
        document.body.className = 'mobile-mode'; 
        if(mobileViewBtn) mobileViewBtn.classList.add('active-view'); 
        if(pcViewBtn) pcViewBtn.classList.remove('active-view'); 
    }
}
detectDevice();

if (pcViewBtn) { pcViewBtn.addEventListener('click', () => { document.body.className = 'pc-mode'; pcViewBtn.classList.add('active-view'); if (mobileViewBtn) mobileViewBtn.classList.remove('active-view'); }); }
if (mobileViewBtn) { mobileViewBtn.addEventListener('click', () => { document.body.className = 'mobile-mode'; mobileViewBtn.classList.add('active-view'); if (pcViewBtn) pcViewBtn.classList.remove('active-view'); }); }

const playerNameInput = document.getElementById('playerNameInput');

socket.on('forceNameLock', (newName) => { 
    localStorage.setItem('lockedPlayerName', newName); sessionStorage.setItem('guestName', newName); 
    if (playerNameInput) { playerNameInput.value = newName; playerNameInput.readOnly = true; playerNameInput.style.background = 'rgba(0,0,0,0.5)'; playerNameInput.style.color = '#888'; } 
});

const lockedName = localStorage.getItem('lockedPlayerName'); 
if (lockedName && playerNameInput) { playerNameInput.value = lockedName; playerNameInput.readOnly = true; playerNameInput.style.background = 'rgba(0,0,0,0.5)'; playerNameInput.style.color = '#888'; }

let myPlayerId = sessionStorage.getItem('playerId') || 'player_' + Math.random().toString(36).substr(2, 9); 
sessionStorage.setItem('playerId', myPlayerId);

window.addEventListener('beforeunload', () => { socket.emit('leaveRoom'); });

const screens = ['welcomeScreen', 'waitingScreen', 'modeSelectionScreen', 'gameScreen', 'votingScreen', 'guessingScreen', 'rebusGameScreen', 'podiumScreen'];
function showScreen(screenName) {
    document.getElementById('gameLayout').classList.remove('hidden');
    screens.forEach(s => { const el = document.getElementById(s); if(el) el.classList.add('hidden'); });
    const target = document.getElementById(screenName); if(target) target.classList.remove('hidden');
    
    if (screenName !== 'welcomeScreen') { document.getElementById('welcomeScreen').classList.add('hidden'); } 
    else { document.getElementById('welcomeScreen').classList.remove('hidden'); document.getElementById('gameLayout').classList.add('hidden'); }
}

let isHost = false; let requestedGameMode = 'spy';
const goToSpyBtn = document.getElementById('goToSpyBtn'); if (goToSpyBtn) goToSpyBtn.addEventListener('click', () => { requestedGameMode = 'spy'; document.getElementById('hostPasswordInput').value = ''; document.getElementById('hostPasswordModal').classList.remove('hidden'); });
const goToSpy2Btn = document.getElementById('goToSpy2Btn'); if (goToSpy2Btn) goToSpy2Btn.addEventListener('click', () => { requestedGameMode = 'spy2'; document.getElementById('hostPasswordInput').value = ''; document.getElementById('hostPasswordModal').classList.remove('hidden'); });
const goToRebusBtn = document.getElementById('goToRebusBtn'); if (goToRebusBtn) goToRebusBtn.addEventListener('click', () => { requestedGameMode = 'rebus'; document.getElementById('hostPasswordInput').value = ''; document.getElementById('hostPasswordModal').classList.remove('hidden'); });
const cancelHostPasswordBtn = document.getElementById('cancelHostPasswordBtn'); if (cancelHostPasswordBtn) cancelHostPasswordBtn.addEventListener('click', () => { document.getElementById('hostPasswordModal').classList.add('hidden'); });
const closeWrongPasswordBtn = document.getElementById('closeWrongPasswordBtn'); if (closeWrongPasswordBtn) closeWrongPasswordBtn.addEventListener('click', () => { document.getElementById('wrongPasswordModal').classList.add('hidden'); });

const confirmHostPasswordBtn = document.getElementById('confirmHostPasswordBtn');
if (confirmHostPasswordBtn) confirmHostPasswordBtn.addEventListener('click', () => {
    const hostPass = document.getElementById('hostPasswordInput').value.trim();
    if (hostPass !== '098') { document.getElementById('hostPasswordModal').classList.add('hidden'); document.getElementById('wrongPasswordModal').classList.remove('hidden'); return; }
    document.getElementById('hostPasswordModal').classList.add('hidden'); isHost = true;
    document.getElementById('hostSettingsBtn').classList.remove('hidden'); document.getElementById('copyInviteBtn').classList.remove('hidden'); document.getElementById('destroyRoomBtn').classList.remove('hidden');
    document.getElementById('leaveRoomBtn').classList.add('hidden');
    
    const newRoomId = Math.random().toString(36).substring(2, 8); sessionStorage.setItem('hostRoomId', newRoomId);
    const savedName = localStorage.getItem('lockedPlayerName') || '𝐒𝐀𝐒𝐔𝐊𝐄';
    socket.emit('createRoom', { roomId: newRoomId, playerId: myPlayerId, name: savedName, gameMode: requestedGameMode });
    showScreen('waitingScreen');
});

if (urlParamsSync.get('room')) {
    if (goToSpyBtn) goToSpyBtn.classList.add('hidden'); 
    if (goToSpy2Btn) goToSpy2Btn.classList.add('hidden'); 
    if (goToRebusBtn) goToRebusBtn.classList.add('hidden');
    if (playerNameInput) playerNameInput.classList.remove('hidden'); 
    const joinRoomBtn = document.getElementById('joinRoomBtn'); if (joinRoomBtn) joinRoomBtn.classList.remove('hidden');
    const playJoinAudio = () => { audioJoin.play().catch(e => {}); document.removeEventListener('click', playJoinAudio); }; document.addEventListener('click', playJoinAudio);
}

const joinRoomBtn = document.getElementById('joinRoomBtn');
if (joinRoomBtn) joinRoomBtn.addEventListener('click', () => {
    let name = playerNameInput.value.trim() || localStorage.getItem('lockedPlayerName');
    if (!name) return alert("اكتب اسمك الأول يا بطل!");
    isHost = false; 
    sessionStorage.setItem('guestName', name);
    document.getElementById('leaveRoomBtn').classList.remove('hidden'); 
    document.getElementById('destroyRoomBtn').classList.add('hidden');
    socket.emit('joinRoom', { roomId: urlParamsSync.get('room'), name: name, playerId: myPlayerId });
});

let currentGameMode = 'spy'; 
socket.on('syncState', (state, mode) => { 
    currentGameMode = mode || 'spy';
    let titleText = 'لعبة الجاسوس';
    if(currentGameMode === 'rebus') titleText = 'تخمين الكلمة';
    if(currentGameMode === 'spy2') titleText = 'لعبة الجاسوس وي بلاي';
    document.getElementById('waitingTitle').innerText = titleText;
    
    if(state === 'waiting') {
        showScreen('waitingScreen'); 
        audioWaiting.play().catch(e => {});
    }
});

socket.on('errorMsg', (msg) => { 
    const invalidModal = document.getElementById('invalidRoomModal');
    const errorText = document.getElementById('errorMsgText');
    if(invalidModal && errorText) { 
        errorText.innerText = msg; 
        invalidModal.classList.remove('hidden'); 
    } 
    sessionStorage.removeItem('hostRoomId');
    sessionStorage.removeItem('guestName');
});

const closeInvalidRoomBtn = document.getElementById('closeInvalidRoomBtn');
if(closeInvalidRoomBtn) closeInvalidRoomBtn.addEventListener('click', () => {
    window.location.reload();
});

socket.on('connect', () => { 
    const hostRoomId = sessionStorage.getItem('hostRoomId'); const guestName = sessionStorage.getItem('guestName'); const roomFromUrl = urlParamsSync.get('room');
    if (hostRoomId) { 
        isHost = true; 
        document.getElementById('hostSettingsBtn').classList.remove('hidden'); 
        document.getElementById('copyInviteBtn').classList.remove('hidden'); 
        document.getElementById('destroyRoomBtn').classList.remove('hidden');
        document.getElementById('leaveRoomBtn').classList.add('hidden');
        const savedName = localStorage.getItem('lockedPlayerName') || '𝐒𝐀𝐒𝐔𝐊𝐄';
        socket.emit('createRoom', { roomId: hostRoomId, playerId: myPlayerId, name: savedName, gameMode: requestedGameMode || 'spy' }); 
    } 
    else if (roomFromUrl && guestName) { 
        isHost = false; 
        document.getElementById('leaveRoomBtn').classList.remove('hidden'); 
        document.getElementById('destroyRoomBtn').classList.add('hidden');
        socket.emit('joinRoom', { roomId: roomFromUrl, name: guestName, playerId: myPlayerId }); 
    } 
    else { showScreen('welcomeScreen'); } 
});

let kickedPlayersGlobal = [];

socket.on('updatePlayers', (data) => {
    let playersArray = [];
    if(Array.isArray(data)) { playersArray = data; } 
    else { playersArray = data.players; kickedPlayersGlobal = data.kickedPlayers || []; }

    document.getElementById('playerCount').innerText = playersArray.length;
    let listHTML = ''; let modalHTML = '';
    
    playersArray.forEach(p => {
        const isMe = p.id === myPlayerId; 
        const hostBadge = p.isHost ? '<span style="color:#00f3ff; font-weight:bold; margin-left:5px;">👑 هوست</span>' : ''; 
        const youBadge = isMe ? '<span style="color:#00ff88; margin-left:5px;">(أنت)</span>' : '';
        const scoreBadge = currentGameMode === 'rebus' ? `<span style="background:rgba(255, 230, 0, 0.2); color:#ffe600; padding:2px 8px; border-radius:10px; font-weight:bold; font-size:0.9rem; margin-right:auto; border:1px solid #ffe600;">${p.score || 0} نقطة</span>` : '';
        const isSpectator = kickedPlayersGlobal.includes(p.id) ? '<span style="color:#ff0055; font-size:0.8rem; margin-right:5px;">(مُشاهد 👁️)</span>' : '';
        
        listHTML += `<div class="player-item ${kickedPlayersGlobal.includes(p.id) ? 'kicked' : ''}"><div class="player-avatar">👤</div><div class="player-info" style="width:100%;"><div class="player-name">${p.name}</div><div class="player-status" style="display:flex; align-items:center;">${hostBadge}${youBadge}${isSpectator}${scoreBadge}</div></div></div>`; 
        
        const actionBtn = p.isHost ? `<button class="btn-sidebar edit" style="width: auto; padding: 5px 10px; margin: 0;" onclick="editPlayerName('${p.id}')">✏️</button>` : `<button class="btn-sidebar edit" style="width: auto; padding: 5px 10px; margin: 0; margin-left: 5px;" onclick="editPlayerName('${p.id}')">✏️</button><button class="btn-sidebar btn-danger" style="width: auto; padding: 5px 10px; margin: 0;" onclick="kickPlayer('${p.id}')">❌</button>`;
        modalHTML += `<div class="modal-player-item" style="display:flex; justify-content:space-between; align-items: center; margin-bottom:10px; background:rgba(255,255,255,0.1); padding:10px; border-radius:5px;"><span style="font-weight:bold;">${p.name} ${p.isHost?'👑':''} ${isSpectator}</span><div style="display:flex;">${actionBtn}</div></div>`;
    });
    
    document.getElementById('playersList').innerHTML = listHTML; document.getElementById('modalPlayersList').innerHTML = modalHTML;
    const actualBtn = document.getElementById('actualStartBtn'); const startBtn = document.getElementById('startGameBtn');
    
    if (isHost) {
        if (playersArray.length >= 2) { 
            startBtn.classList.add('hidden'); actualBtn.classList.remove('hidden');
            actualBtn.innerText = currentGameMode === 'rebus' ? "بدء الجولة الأولى 🚀" : "اختيار التصنيف 🚀";
        } else {
            startBtn.classList.remove('hidden'); actualBtn.classList.add('hidden'); startBtn.innerText = "في انتظار باقي اللاعبين... ⏳";
        }
    } else {
        startBtn.classList.remove('hidden'); actualBtn.classList.add('hidden'); startBtn.innerText = "في انتظار الهوست ⏳";
    }
});

const leaveRoomBtn = document.getElementById('leaveRoomBtn');
if (leaveRoomBtn) leaveRoomBtn.addEventListener('click', () => { 
    if (confirm('مغادرة؟')) { 
        socket.emit('leaveRoom'); 
        sessionStorage.clear(); 
        if (isHost) { window.location.href = window.location.pathname; } 
        else { window.location.reload(); }
    } 
});

const destroyRoomBtn = document.getElementById('destroyRoomBtn');
if (destroyRoomBtn) destroyRoomBtn.addEventListener('click', () => { 
    if (confirm('إغلاق الغرفة؟')) { 
        socket.emit('destroyRoom'); 
        sessionStorage.removeItem('hostRoomId'); 
        setTimeout(() => { window.location.href = window.location.pathname; }, 300);
    } 
});

const actualStartBtn = document.getElementById('actualStartBtn');
if (actualStartBtn) actualStartBtn.addEventListener('click', (e) => { 
    e.target.disabled = true; playSound('start'); 
    const currentRoom = sessionStorage.getItem('hostRoomId');
    if (currentGameMode === 'spy' || currentGameMode === 'spy2') { socket.emit('goToModeSelection', currentRoom); } else { socket.emit('startRebusGame', currentRoom); }
    setTimeout(() => e.target.disabled = false, 1000); 
});

const availableCategories = ["حاجات جوا وبرا البيت", "أكل وشرب", "أدوات وأشياء", "أماكن ومواصلات", "حيوانات ونباتات", "مهن ووظائف", "رياضة وهوايات", "أجهزة وتكنولوجيا"];
let chosenCategory = null; let isWheelSpinning = false;

socket.on('showModeSelection', () => { showScreen('modeSelectionScreen'); renderCategories(); });

function renderCategories() {
    const grid = document.getElementById('categoriesGrid'); grid.innerHTML = '';
    availableCategories.forEach((cat, index) => {
        let d = document.createElement('div'); d.className = 'category-card'; d.id = `cat-idx-${index}`; d.innerText = cat;
        d.onclick = () => { if (!isHost || isWheelSpinning) return; playSound('click'); socket.emit('selectCategory', cat, sessionStorage.getItem('hostRoomId')); };
        grid.appendChild(d);
    });
    let r = document.createElement('div'); r.className = 'category-card random-card'; r.id = 'cat-random'; r.innerText = 'اختيار عشوائي 🎡';
    r.onclick = () => { if (!isHost || isWheelSpinning) return; playSound('start'); const targetCat = availableCategories[Math.floor(Math.random() * availableCategories.length)]; socket.emit('spinWheel', targetCat, sessionStorage.getItem('hostRoomId')); };
    grid.appendChild(r);
}

socket.on('categorySelected', (cat) => {
    const targetIdx = availableCategories.indexOf(cat); document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected', 'roulette-active'));
    const card = document.getElementById(`cat-idx-${targetIdx}`); if (card) card.classList.add('selected'); chosenCategory = cat; document.getElementById('confirmStartGameBtn').classList.remove('hidden');
});

socket.on('wheelSpinning', (targetCat) => {
    isWheelSpinning = true; document.getElementById('confirmStartGameBtn').classList.add('hidden'); document.getElementById('realWheelModal').classList.remove('hidden');
    const spinner = document.getElementById('wheelSpinnerElement'); const targetIdx = availableCategories.indexOf(targetCat);
    spinner.style.transition = 'none'; spinner.style.transform = 'rotate(0deg)'; void spinner.offsetWidth; 
    const randomOffset = Math.floor(Math.random() * 30) - 15; const targetRotation = (360 * 8) - (targetIdx * 45) + randomOffset;
    spinner.style.transition = 'transform 5s cubic-bezier(0.1, 0.7, 0.1, 1)'; spinner.style.transform = `rotate(${targetRotation}deg)`;
    
    let startTime = Date.now();
    function playTick() {
        if (!isWheelSpinning) return; let elapsed = Date.now() - startTime; if (elapsed > 4900) return; 
        playSound('vote'); let progress = elapsed / 5000; let nextDelay = 30 + (Math.pow(progress, 3) * 500); 
        setTimeout(playTick, nextDelay);
    }
    playTick();
    
    setTimeout(() => {
        isWheelSpinning = false; playSound('win'); document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected', 'roulette-active'));
        document.getElementById(`cat-idx-${targetIdx}`).classList.add('selected'); chosenCategory = targetCat;
        setTimeout(() => { document.getElementById('realWheelModal').classList.add('hidden'); if(isHost) document.getElementById('confirmStartGameBtn').classList.remove('hidden'); }, 1500);
    }, 5000); 
});

const confirmStartGameBtn = document.getElementById('confirmStartGameBtn');
if (confirmStartGameBtn) confirmStartGameBtn.addEventListener('click', (e) => { e.target.disabled = true; playSound('start'); socket.emit('startGameWithCategory', chosenCategory, sessionStorage.getItem('hostRoomId')); setTimeout(() => e.target.disabled = false, 2000); });

let myRoleData = null;
socket.on('gameStarted', (data) => {
    audioStart.play().catch(e => console.log(e)); myRoleData = data; 
    document.getElementById('roleIcon').innerText = data.isSpy ? "🕵️‍♂️" : "🎯";
    
    if (kickedPlayersGlobal.includes(myPlayerId)) {
        document.getElementById('roleTitle').innerHTML = `<span style="color:#ff0055">أنت في وضع المشاهدة 👁️</span>`;
    } else {
        document.getElementById('roleTitle').innerHTML = `<span>${data.isSpy ? "أنت الجاسوس!" : data.word}</span>`;
    }
    
    document.getElementById('categoryTitle').innerText = `التصنيف: ${data.category}`; document.getElementById('categoryTitle').classList.remove('hidden');
    showScreen('gameScreen'); 
    
    const startVotingPhaseBtn = document.getElementById('startVotingPhaseBtn'); 
    if (isHost && startVotingPhaseBtn && !kickedPlayersGlobal.includes(myPlayerId)) {
        startVotingPhaseBtn.classList.remove('hidden');
    } else if (startVotingPhaseBtn) {
        startVotingPhaseBtn.classList.add('hidden');
    }
    
    const restartGameBtn = document.getElementById('restartGameBtn'); if (isHost && restartGameBtn) restartGameBtn.disabled = false;
});

const startVotingPhaseBtn = document.getElementById('startVotingPhaseBtn');
if (startVotingPhaseBtn) startVotingPhaseBtn.addEventListener('click', (e) => { e.target.disabled = true; playSound('start'); socket.emit('startVotingPhase', sessionStorage.getItem('hostRoomId')); setTimeout(() => e.target.disabled = false, 2000); });

socket.on('votingStarted', (data) => { 
    playSound('start'); 
    showScreen('votingScreen'); 
    document.getElementById('liveVoteLog').innerHTML = ''; 
    document.getElementById('voteCounter').innerText = `0/${data.requiredVotes}`; 
    document.getElementById('voteCounter').style.color = "#00f3ff"; document.getElementById('voteCounter').style.textShadow = "none"; 
    
    let gridHTML = ''; 
    data.players.forEach(p => { 
        if (p.id !== myPlayerId) {
            let isKicked = data.kickedPlayers.includes(p.id);
            gridHTML += `<div class="vote-card ${isKicked ? 'kicked' : ''}" ${isKicked ? '' : `onclick="castVote('${p.id}', this)"`} data-player-id="${p.id}"><div style="font-size: 2rem; margin-bottom:10px;">${p.isHost ? '👑' : '👤'}</div><div style="font-weight:bold; color:#fff;">${p.name}</div></div>`; 
        }
    }); 
    
    if (data.kickedPlayers.includes(myPlayerId)) {
        document.getElementById('votingGrid').innerHTML = '<h3 style="color:#ff0055; text-align:center; width:100%;">أنت في وضع المشاهدة لا يمكنك التصويت 👁️</h3>';
    } else {
        document.getElementById('votingGrid').innerHTML = gridHTML; 
    }
});

let tieInterval;
socket.on('votingTied', (data) => { 
    playSound('lose'); document.getElementById('tiedPlayersNames').innerText = data.tiedNames; document.getElementById('tieBreakerModal').classList.remove('hidden'); let timeLeft = 12; document.getElementById('tieTimer').innerText = timeLeft; 
    if (tieInterval) clearInterval(tieInterval); tieInterval = setInterval(() => { timeLeft--; document.getElementById('tieTimer').innerText = timeLeft; if (timeLeft <= 0) { clearInterval(tieInterval); document.getElementById('tieBreakerModal').classList.add('hidden'); } }, 1000); 
});

socket.on('youAlreadyVoted', (targetId) => { const allCards = document.querySelectorAll('.vote-card'); allCards.forEach(c => { if(!c.classList.contains('kicked')) c.classList.add('disabled'); }); const myCard = document.querySelector(`.vote-card[data-player-id="${targetId}"]`); if (myCard) { myCard.classList.remove('disabled'); myCard.classList.add('voted'); } });
socket.on('playerRemovedFromVoting', (playerId) => { const card = document.querySelector(`.vote-card[data-player-id="${playerId}"]`); if (card) card.remove(); });

window.castVote = function(targetId, cardElement) { 
    if (kickedPlayersGlobal.includes(myPlayerId)) return; 
    const fRoom = sessionStorage.getItem('hostRoomId') || new URLSearchParams(window.location.search).get('room');
    socket.emit('submitVote', { targetId: targetId, fallbackRoomId: fRoom }); 
    const allCards = document.querySelectorAll('.vote-card'); allCards.forEach(c => { if(!c.classList.contains('kicked')) c.classList.add('disabled'); }); cardElement.classList.remove('disabled'); cardElement.classList.add('voted'); 
};

socket.on('voteRegistered', (data) => { 
    if (data.voterName !== "النظام") playSound('vote'); 
    document.getElementById('voteCounter').innerText = `${data.currentVotes}/${data.totalRequired}`; 
    if (data.currentVotes >= data.totalRequired) { document.getElementById('voteCounter').style.color = "#00ff88"; document.getElementById('voteCounter').style.textShadow = "0 0 10px #00ff88"; } 
    if (data.voterName !== "النظام") { const logP = document.createElement('div'); logP.className = 'log-entry'; logP.innerHTML = `${data.voterName} صوت على <span class="target-name">${data.targetName}</span>`; document.getElementById('liveVoteLog').prepend(logP); } 
});

socket.on('votingEnded', (data) => { 
    const vTitle = document.getElementById('votingResultTitle'); const vDesc1 = document.getElementById('votingResultDesc1'); const vDesc2 = document.getElementById('votingResultDesc2'); const spyProceedBtn = document.getElementById('spyProceedBtn');
    
    spyProceedBtn.classList.add('hidden');

    if (currentGameMode === 'spy2') {
        if (data.isSpyCaught) {
            playSound('win'); vTitle.innerText = "عمل جيد! 👏"; vTitle.style.color = "#00ff88"; 
            vDesc1.innerText = `لقد كان ${data.votedPlayerName} الجاسوس بالفعل.`; 
            if (myRoleData.isSpy) {
                vDesc2.innerText = "أمامك فرصة أخيرة لتخمين الكلمة!";
                spyProceedBtn.classList.remove('hidden');
                spyProceedBtn.innerText = "تخمين الكلمة";
            } else {
                vDesc2.innerText = "في انتظار الجاسوس لتخمين الكلمة...";
            }
        } else {
            playSound('lose'); vTitle.innerText = "اختيار خاطئ! ❌"; vTitle.style.color = "#ff0055"; 
            vDesc1.innerText = `لم يكن ${data.votedPlayerName} الجاسوس. تم طرد مدني!`; 
            vDesc2.innerText = "";
        }
    } else {
        if (!myRoleData.isSpy) { 
            if (data.isSpyCaught) { playSound('win'); vTitle.innerText = "عمل جيد! 👏"; vTitle.style.color = "#00ff88"; vDesc1.innerText = `لقد كان ${data.votedPlayerName} الجاسوس فعلاً، أحسنتم.`; vDesc2.innerText = "في انتظار تخمينه للكلمة..."; } 
            else { playSound('lose'); vTitle.innerText = "اختيار خاطئ! ❌"; vTitle.style.color = "#ff0055"; vDesc1.innerText = `لم يكن ${data.votedPlayerName} الجاسوس. لقد كان ${data.spyName}.`; vDesc2.innerText = "في انتظار تخمينه للكلمة..."; } 
        } else { 
            spyProceedBtn.classList.remove('hidden'); 
            if (data.isSpyCaught) { playSound('lose'); vTitle.innerText = "تم كشفك! 🚨"; vTitle.style.color = "#ff0055"; vDesc1.innerText = `لقد تم كشفك يا ${data.spyName}.`; vDesc2.innerText = "ابذل قصارى جهدك المرة القادمة!"; spyProceedBtn.innerText = "خمن الكلمة"; } 
            else { playSound('win'); vTitle.innerText = "نجاح باهر! 🕵️‍♂️"; vTitle.style.color = "#00ff88"; vDesc1.innerText = `لقد اختاروا شخصاً خاطئاً، نجحت في التخفي يا ${data.spyName}.`; vDesc2.innerText = ""; spyProceedBtn.innerText = "تخمين الكلمة"; } 
        } 
    }
    document.getElementById('votingResultModal').classList.remove('hidden'); 
});

socket.on('spyDecisionPhase', () => {
    document.getElementById('votingResultModal').classList.add('hidden');
    document.getElementById('spyDecisionModal').classList.remove('hidden');
    
    const title = document.getElementById('spyDecisionTitle');
    const text = document.getElementById('spyDecisionText');
    const buttons = document.getElementById('spyDecisionButtons');
    
    if (myRoleData.isSpy) {
        title.innerText = "في انتظار قرار الجاسوس...";
        text.innerText = "لقد طردوا مدنياً بالخطأ، هل تريد تخمين الكلمة الآن والفوز؟ أم إكمال اللعب لطرد المزيد؟";
        buttons.classList.remove('hidden');
    } else {
        title.innerText = "في انتظار قرار الجاسوس...";
        text.innerText = ""; 
        buttons.classList.add('hidden');
    }
});

const btnSpyGuess = document.getElementById('btnSpyGuess');
if(btnSpyGuess) btnSpyGuess.addEventListener('click', () => {
    document.getElementById('spyDecisionModal').classList.add('hidden');
    socket.emit('spyMadeDecision', 'guess');
});

const btnSpyContinue = document.getElementById('btnSpyContinue');
if(btnSpyContinue) btnSpyContinue.addEventListener('click', () => {
    document.getElementById('spyDecisionModal').classList.add('hidden');
    socket.emit('spyMadeDecision', 'continue');
});

socket.on('gameContinued', () => {
    playSound('start');
    document.getElementById('spyDecisionModal').classList.add('hidden');
    document.getElementById('votingResultModal').classList.add('hidden');
    showScreen('gameScreen');
});

socket.on('spyWonSurvival', (data) => {
    playSound('lose');
    document.getElementById('votingResultModal').classList.add('hidden');
    document.getElementById('spyDecisionModal').classList.add('hidden');
    
    const t1 = document.getElementById('finalResultText1'); const t2 = document.getElementById('finalResultText2'); const t3 = document.getElementById('finalResultText3'); const t4 = document.getElementById('finalResultText4');
    
    t1.innerText = "نهاية مأساوية للمدنيين! ☠️";
    t2.innerText = `لقد فاز الجاسوس ${data.spyName} بالبقاء`;
    t2.style.color = "#ff0055";
    t3.innerText = "تم طرد جميع المدنيين!";
    t3.style.color = "#ff0055";
    t4.innerText = `والكلمة الصحيحة كانت: ${data.word}`;
    
    document.getElementById('finalResultModal').classList.remove('hidden'); 
});

const spyProceedBtn = document.getElementById('spyProceedBtn');
if (spyProceedBtn) spyProceedBtn.addEventListener('click', () => { document.getElementById('votingResultModal').classList.add('hidden'); socket.emit('startGuessingPhase'); });

let guessInterval; let selectedSpyWord = null;

socket.on('guessingPhaseStarted', (data) => { 
    playSound('start'); 
    document.getElementById('votingResultModal').classList.add('hidden'); 
    document.getElementById('spyDecisionModal').classList.add('hidden'); 
    showScreen('guessingScreen'); document.getElementById('wordsGrid').style.pointerEvents = 'auto'; 
    if (!myRoleData.isSpy) { document.getElementById('guessingSubtitle').innerText = "الجاسوس يختار الكلمة الآن..."; } else { document.getElementById('guessingSubtitle').innerText = "اختر الكلمة التي تعتقد أنها صحيحة!"; } 
    let wordsHTML = ''; data.words.forEach(w => { const onClickAttr = myRoleData.isSpy ? `onclick="selectSpyWord('${w}')"` : ''; wordsHTML += `<div class="word-card" id="word-${w}" ${onClickAttr}>${w}</div>`; }); document.getElementById('wordsGrid').innerHTML = wordsHTML; 
    let timeLeft = data.duration; const spyTimerEl = document.getElementById('spyTimer'); 
    if (spyTimerEl) { spyTimerEl.innerText = timeLeft; spyTimerEl.style.color = "#00ff88"; spyTimerEl.style.textShadow = "0 0 10px #00ff88"; } 
    if (guessInterval) clearInterval(guessInterval); 
    guessInterval = setInterval(() => { timeLeft--; if (spyTimerEl) { spyTimerEl.innerText = timeLeft; if (timeLeft <= 10) { spyTimerEl.style.color = "#ff0055"; spyTimerEl.style.textShadow = "0 0 10px #ff0055"; } } if (timeLeft <= 0) clearInterval(guessInterval); }, 1000); 
});

socket.on('spyTimeOut', () => { 
    playSound('lose'); if (guessInterval) clearInterval(guessInterval); document.getElementById('wordsGrid').style.pointerEvents = 'none'; 
    document.getElementById('finalResultText1').innerText = "نفد الوقت! ⏳"; document.getElementById('finalResultText2').innerText = "لقد انتهت اللعبه لعدم اختيار الجاسوس الإجابة"; document.getElementById('finalResultText2').style.color = "#ff0055"; document.getElementById('finalResultText3').innerText = "لقد خسر الجاسوس!"; document.getElementById('finalResultText3').style.color = "#ff0055"; document.getElementById('finalResultText4').innerText = ""; document.getElementById('finalResultModal').classList.remove('hidden'); 
});

window.selectSpyWord = function(word) { if (!myRoleData.isSpy) return; selectedSpyWord = word; document.getElementById('confirmGuessBtn').classList.remove('hidden'); socket.emit('spyHoverWord', word); };

socket.on('spySelectedWord', (data) => { 
    playSound('vote'); document.querySelectorAll('.word-card').forEach(c => { c.classList.remove('spy-active'); const tag = c.querySelector('.spy-tag'); if (tag) tag.remove(); }); 
    const activeCard = document.getElementById(`word-${data.word}`); if (activeCard) { activeCard.classList.add('spy-active'); activeCard.innerHTML += `<div class="spy-tag">اختارها ${data.spyName}</div>`; } 
});

const confirmGuessBtn = document.getElementById('confirmGuessBtn');
if (confirmGuessBtn) confirmGuessBtn.addEventListener('click', (e) => { e.target.disabled = true; if (selectedSpyWord) socket.emit('spyConfirmWord', selectedSpyWord); setTimeout(() => e.target.disabled = false, 2000); });

socket.on('gameFinalResult', (data) => { 
    if (guessInterval) clearInterval(guessInterval); document.getElementById('wordsGrid').style.pointerEvents = 'none'; if (data.isCorrect) playSound('win'); else playSound('lose'); 
    document.getElementById('finalResultText1').innerText = `لقد خمن الجاسوس ${data.spyName} الكلمة`; document.getElementById('finalResultText2').innerText = data.chosenWord; 
    if (data.isCorrect) { document.getElementById('finalResultText3').innerText = "وكانت الإجابة صحيحة! ✅"; document.getElementById('finalResultText3').style.color = "#00ff88"; document.getElementById('finalResultText4').innerText = ""; } 
    else { document.getElementById('finalResultText3').innerText = "وكانت الإجابة خاطئة! ❌"; document.getElementById('finalResultText3').style.color = "#ff0055"; document.getElementById('finalResultText4').innerText = `والكلمة الصحيحة كانت: ${data.correctWord}`; } 
    document.getElementById('finalResultModal').classList.remove('hidden'); 
});

const finalOkBtn = document.getElementById('finalOkBtn');
if (finalOkBtn) finalOkBtn.addEventListener('click', () => { 
    document.getElementById('finalResultModal').classList.add('hidden'); 
    if (isHost) { document.getElementById('hostSettingsModal').classList.remove('hidden'); } else { document.getElementById('guestWaitingHostModal').classList.remove('hidden'); } 
});

let rebusTimerInterval;
socket.on('rebusRoundStarted', (data) => {
    playSound('start'); 
    showScreen('rebusGameScreen');
    document.getElementById('rebusRoundNum').innerText = data.round;
    document.getElementById('puzzleText').innerText = data.clue;
    document.getElementById('rebusCategoryDisplay').innerText = "تصنيف: " + data.category;
    document.getElementById('chatLog').innerHTML = ''; 
    document.getElementById('chatInput').value = '';
    
    let totalDuration = data.duration * 1000;
    let endTime = data.endTime;
    const tBar = document.getElementById('rebusTimerBar'); 
    
    if(rebusTimerInterval) clearInterval(rebusTimerInterval);
    rebusTimerInterval = setInterval(() => { 
        let remaining = endTime - Date.now();
        if (remaining < 0) remaining = 0;
        
        let pct = (remaining / totalDuration) * 100;
        tBar.style.width = pct + '%';
        
        let tlSec = remaining / 1000;
        if (tlSec <= 40 && tlSec > 15) tBar.style.backgroundColor = '#ffe600'; 
        else if (tlSec <= 15) tBar.style.backgroundColor = '#ff0055'; 
        else tBar.style.backgroundColor = '#00f3ff';
        
        if(remaining <= 0) clearInterval(rebusTimerInterval); 
    }, 100);
});

function sendRebusGuess() {
    const input = document.getElementById('chatInput'); 
    const txt = input.value.trim();
    if(txt) { 
        socket.emit('sendChatMsg', { msg: txt, fallbackRoomId: sessionStorage.getItem('hostRoomId') || urlParamsSync.get('room') }); 
        input.value = ''; 
    }
}
const sendChatBtn = document.getElementById('sendChatBtn');
if (sendChatBtn) sendChatBtn.addEventListener('click', sendRebusGuess);

const chatInput = document.getElementById('chatInput');
if (chatInput) chatInput.addEventListener('keypress', (e) => { 
    if(e.key === 'Enter') sendRebusGuess(); 
});

socket.on('rebusChatMsg', (data) => { 
    document.getElementById('chatLog').innerHTML = `<div class="chat-msg"><span class="sender">${data.playerName}:</span> ${data.msg}</div>` + document.getElementById('chatLog').innerHTML; 
});

socket.on('rebusCorrectGuess', (data) => { 
    playSound('vote'); 
    document.getElementById('chatLog').innerHTML = `<div class="chat-msg correct">لقد عرفها ${data.playerName}</div>` + document.getElementById('chatLog').innerHTML; 
});

socket.on('rebusCloseGuess', (data) => {
    playSound('vote');
    document.getElementById('chatLog').innerHTML = `<div class="chat-msg close-guess">⚠️ (كلمة قريبة جداً) أنت: ${data.msg}</div>` + document.getElementById('chatLog').innerHTML; 
});

socket.on('rebusRoundEnded', (data) => { 
    if (data.winners === 0) { playSound('lose'); } else { playSound('start'); }
    clearInterval(rebusTimerInterval); 
    document.getElementById('puzzleText').innerText = `الحل: ${data.answer}`; 
});

socket.on('rebusGameOver', (players) => {
    playSound('win'); 
    showScreen('podiumScreen');
    launchConfetti();
    
    const p1 = players[0], p2 = players[1], p3 = players[2];
    document.getElementById('podiumName1').innerText = p1 ? p1.name : '---'; document.getElementById('podiumScore1').innerText = p1 ? p1.score : '0';
    document.getElementById('podiumName2').innerText = p2 ? p2.name : '---'; document.getElementById('podiumScore2').innerText = p2 ? p2.score : '0';
    document.getElementById('podiumName3').innerText = p3 ? p3.name : '---'; document.getElementById('podiumScore3').innerText = p3 ? p3.score : '0';
    
    if(isHost) { 
        const btn = document.getElementById('rebusReturnBtn'); 
        btn.classList.remove('hidden'); 
        btn.onclick = () => socket.emit('restartGame'); 
    }
});

socket.on('youAreKickedPermanently', () => { 
    document.getElementById('kickedModal').classList.remove('hidden'); 
    sessionStorage.clear(); 
});

socket.on('hostLeftRoom', () => { 
    document.getElementById('hostLeftText').innerText = `الهوست غادر وأغلق الغرفة.`; 
    document.getElementById('hostLeftModal').classList.remove('hidden'); 
    sessionStorage.clear(); 
    
    const closeBtn = document.getElementById('closeHostLeftBtn');
    if (closeBtn) {
        if (!isHost) {
            closeBtn.innerText = "تحديث الصفحة";
            closeBtn.onclick = () => { window.location.reload(); };
        } else {
            closeBtn.innerText = "العودة للرئيسية";
            closeBtn.onclick = () => { window.location.href = window.location.pathname; };
        }
    }
});

window.editPlayerName = function(tid) { const n = prompt('الاسم:'); if(n) socket.emit('changePlayerName', {targetId: tid, newName: n.trim(), fallbackRoomId: sessionStorage.getItem('hostRoomId')}); };
window.kickPlayer = function(tid) { if(confirm('طرد؟')) socket.emit('kickPlayer', {targetId: tid, fallbackRoomId: sessionStorage.getItem('hostRoomId')}); };
const hostSettingsBtn = document.getElementById('hostSettingsBtn'); if (hostSettingsBtn) hostSettingsBtn.addEventListener('click', () => { document.getElementById('hostSettingsModal').classList.remove('hidden'); }); 
const closeModalBtn = document.getElementById('closeModalBtn'); if (closeModalBtn) closeModalBtn.addEventListener('click', () => { document.getElementById('hostSettingsModal').classList.add('hidden'); });

socket.on('gameRestarted', () => { 
    playSound('start'); if (guessInterval) clearInterval(guessInterval); showScreen('waitingScreen'); 
    document.getElementById('votingResultModal').classList.add('hidden'); document.getElementById('finalResultModal').classList.add('hidden'); document.getElementById('tieBreakerModal').classList.add('hidden'); document.getElementById('spyDecisionModal').classList.add('hidden');
    const startVotingPhaseBtn = document.getElementById('startVotingPhaseBtn'); if(startVotingPhaseBtn) startVotingPhaseBtn.classList.add('hidden'); 
    const confirmGuessBtn = document.getElementById('confirmGuessBtn'); if(confirmGuessBtn) confirmGuessBtn.classList.add('hidden'); 
    const restartGameBtn = document.getElementById('restartGameBtn'); const hostSettingsModal = document.getElementById('hostSettingsModal');
    if (isHost && restartGameBtn && hostSettingsModal) { restartGameBtn.disabled = true; hostSettingsModal.classList.add('hidden'); } 
    const guestWaitingHostModal = document.getElementById('guestWaitingHostModal'); if(guestWaitingHostModal) guestWaitingHostModal.classList.add('hidden'); 
    const podiumScreen = document.getElementById('podiumScreen'); if(podiumScreen) podiumScreen.classList.add('hidden');
    kickedPlayersGlobal = [];
});

const restartGameBtn = document.getElementById('restartGameBtn');
if (restartGameBtn) restartGameBtn.addEventListener('click', (e) => { e.target.disabled = true; if(confirm('إعادة اللعب؟')) socket.emit('restartGame'); setTimeout(() => e.target.disabled = false, 2000); });
const copyInviteBtn = document.getElementById('copyInviteBtn');
if (copyInviteBtn) copyInviteBtn.addEventListener('click', () => { const roomId = sessionStorage.getItem('hostRoomId'); const inviteLink = window.location.origin + window.location.pathname + '?room=' + roomId; navigator.clipboard.writeText(inviteLink).then(() => { const t = document.getElementById('notificationToast'); t.classList.remove('hidden'); setTimeout(() => t.classList.add('hidden'), 2500); }); });