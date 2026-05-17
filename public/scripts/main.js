const socket = io();

// توليد النجوم بالـ JS عشان متأثرش على أداء الـ HTML
function createStars() {
    const container = document.getElementById('starsContainer');
    container.innerHTML = '';
    for (let i = 0; i < 50; i++) {
        let star = document.createElement('div');
        star.className = 'falling-star';
        let size = Math.random() * 3 + 1; // 1px to 4px
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.left = Math.random() * 100 + 'vw';
        star.style.animationDuration = Math.random() * 3 + 2 + 's'; // 2s to 5s
        star.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(star);
    }
}

function applyRgbWaveToElement(element, text) {
    if (!element) return;
    element.innerHTML = '';
    for (let i = 0; i < text.length; i++) {
        const span = document.createElement('span');
        if (text[i] === ' ') span.innerHTML = '&nbsp;';
        else { span.textContent = text[i]; span.style.setProperty('--char-index', i); }
        element.appendChild(span);
    }
}
function initRgbTitles() { document.querySelectorAll('.rgb-title').forEach(el => { if (!el.querySelector('span')) applyRgbWaveToElement(el, el.textContent); }); }
initRgbTitles();

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function initAudio() { if (!audioCtx) audioCtx = new AudioContext(); if (audioCtx.state === 'suspended') audioCtx.resume(); }
document.addEventListener('click', initAudio, { once: true });

function playSound(type) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
    osc.connect(gainNode); gainNode.connect(audioCtx.destination); const now = audioCtx.currentTime;
    
    if (type === 'click') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'start') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.4);
        gainNode.gain.setValueAtTime(0, now); gainNode.gain.linearRampToValueAtTime(0.2, now + 0.2); gainNode.gain.linearRampToValueAtTime(0, now + 0.4); osc.start(now); osc.stop(now + 0.4);
    } else if (type === 'vote') {
        osc.type = 'square'; osc.frequency.setValueAtTime(400, now); gainNode.gain.setValueAtTime(0.05, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'win') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.setValueAtTime(600, now + 0.1); osc.frequency.setValueAtTime(800, now + 0.2);
        gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.linearRampToValueAtTime(0, now + 0.5); osc.start(now); osc.stop(now + 0.5);
    } else if (type === 'lose') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
        gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.linearRampToValueAtTime(0, now + 0.5); osc.start(now); osc.stop(now + 0.5);
    }
}
document.addEventListener('click', (e) => { if(e.target.tagName === 'BUTTON' || e.target.closest('button')) playSound('click'); });

window.addEventListener('beforeunload', () => { socket.emit('leaveRoom'); });

let myPlayerId = sessionStorage.getItem('playerId');
if (!myPlayerId) { myPlayerId = 'player_' + Math.random().toString(36).substr(2, 9); sessionStorage.setItem('playerId', myPlayerId); }

const generalSettingsBtn = document.getElementById('generalSettingsBtn'); const generalSettingsModal = document.getElementById('generalSettingsModal');
const closeGeneralSettingsBtn = document.getElementById('closeGeneralSettingsBtn'); const toggleLeaveBtn = document.getElementById('toggleLeaveBtn');
const leaveRoomBtn = document.getElementById('leaveRoomBtn');
let isLeaveBtnEnabled = localStorage.getItem('leaveBtnEnabled') !== 'false';

// متغيرات عشان نحفظ الأكشن قبل اختيار الخلفية
let pendingAction = null;
let tempRoomIdToJoin = null;
let tempGuestName = null;

function updateLeaveBtnState() {
    if (isLeaveBtnEnabled) {
        toggleLeaveBtn.innerText = "مفعل ✔️"; toggleLeaveBtn.className = "toggle-btn active";
        if (!isHost && !document.getElementById('welcomeScreen').classList.contains('active') && !document.getElementById('bgSelectionScreen').classList.contains('active')) leaveRoomBtn.classList.remove('hidden');
    } else {
        toggleLeaveBtn.innerText = "معطل ❌"; toggleLeaveBtn.className = "toggle-btn inactive"; leaveRoomBtn.classList.add('hidden');
    }
    // إخفاء زر الإعدادات العامة للهوست
    if (isHost) {
        generalSettingsBtn.classList.add('hidden');
    } else {
        generalSettingsBtn.classList.remove('hidden');
    }
}

if(generalSettingsBtn) generalSettingsBtn.addEventListener('click', () => generalSettingsModal.classList.remove('hidden'));
if(closeGeneralSettingsBtn) closeGeneralSettingsBtn.addEventListener('click', () => generalSettingsModal.classList.add('hidden'));
if(toggleLeaveBtn) toggleLeaveBtn.addEventListener('click', () => { isLeaveBtnEnabled = !isLeaveBtnEnabled; localStorage.setItem('leaveBtnEnabled', isLeaveBtnEnabled); updateLeaveBtnState(); });

const screens = { welcome: document.getElementById('welcomeScreen'), bgSelection: document.getElementById('bgSelectionScreen'), waiting: document.getElementById('waitingScreen'), modeSelection: document.getElementById('modeSelectionScreen'), game: document.getElementById('gameScreen'), voting: document.getElementById('votingScreen'), guessing: document.getElementById('guessingScreen') };
const mainContainer = document.getElementById('mainContainer'); const pcViewBtn = document.getElementById('pcViewBtn'); const mobileViewBtn = document.getElementById('mobileViewBtn');
const goToWaitingBtn = document.getElementById('goToWaitingBtn'); const joinRoomBtn = document.getElementById('joinRoomBtn');       
const playerNameInput = document.getElementById('playerNameInput'); const copyInviteBtn = document.getElementById('copyInviteBtn');
const playerCountSpan = document.getElementById('playerCount'); const playersListDiv = document.getElementById('playersList');
const startGameBtn = document.getElementById('startGameBtn'); const actualStartBtn = document.getElementById('actualStartBtn');
const hostSettingsBtn = document.getElementById('hostSettingsBtn'); const hostSettingsModal = document.getElementById('hostSettingsModal'); const closeModalBtn = document.getElementById('closeModalBtn');
const modalPlayersList = document.getElementById('modalPlayersList'); const restartGameBtn = document.getElementById('restartGameBtn');
const hostLeftModal = document.getElementById('hostLeftModal'); const kickedModal = document.getElementById('kickedModal');
const leftRoomModal = document.getElementById('leftRoomModal'); const invalidRoomModal = document.getElementById('invalidRoomModal'); 
const errorMsgText = document.getElementById('errorMsgText');

const selectStarsBgBtn = document.getElementById('selectStarsBgBtn'); const selectDefaultBgBtn = document.getElementById('selectDefaultBgBtn');
const starsContainer = document.getElementById('starsContainer'); const defaultBg = document.getElementById('defaultBg');
const tieBreakerModal = document.getElementById('tieBreakerModal'); const tiedPlayersNames = document.getElementById('tiedPlayersNames'); const tieTimerEl = document.getElementById('tieTimer');
let tieInterval;

const selectRandomModeBtn = document.getElementById('selectRandomModeBtn'); const revokeRandomModeBtn = document.getElementById('revokeRandomModeBtn');
const confirmStartGameBtn = document.getElementById('confirmStartGameBtn'); const selectedBadge = document.getElementById('selectedBadge');
const randomModeCard = document.getElementById('randomModeCard'); const hostModeControls = document.getElementById('hostModeControls');
const startVotingPhaseBtn = document.getElementById('startVotingPhaseBtn'); const voteCounter = document.getElementById('voteCounter'); const liveVoteLog = document.getElementById('liveVoteLog');
const votingGrid = document.getElementById('votingGrid'); const votingResultModal = document.getElementById('votingResultModal');
const spyProceedBtn = document.getElementById('spyProceedBtn'); const wordsGrid = document.getElementById('wordsGrid');
const confirmGuessBtn = document.getElementById('confirmGuessBtn'); const finalResultModal = document.getElementById('finalResultModal'); const finalOkBtn = document.getElementById('finalOkBtn');
const customCursor = document.getElementById('customCursor'); const follow1 = document.getElementById('cursorFollow1'); const follow2 = document.getElementById('cursorFollow2');

let isPcMode = false; let isHost = false; let myRoleData = null; let selectedSpyWord = null; let guessInterval;
let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2; let f1X = mouseX, f1Y = mouseY, f2X = mouseX, f2Y = mouseY;
document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

function animateCursor() {
    if (isPcMode) {
        f1X += (mouseX - f1X) * 0.2; f1Y += (mouseY - f1Y) * 0.2; f2X += (mouseX - f2X) * 0.1; f2Y += (mouseY - f2Y) * 0.1;
        if(customCursor) customCursor.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
        if(follow1) follow1.style.transform = `translate(${f1X}px, ${f1Y}px)`; if(follow2) follow2.style.transform = `translate(${f2X}px, ${f2Y}px)`;
    }
    requestAnimationFrame(animateCursor);
}
requestAnimationFrame(animateCursor);
document.addEventListener('mouseover', (e) => { if (isPcMode && e.target.closest('button') && customCursor) customCursor.classList.add('hovering'); });
document.addEventListener('mouseout', (e) => { if (isPcMode && e.target.closest('button') && customCursor) customCursor.classList.remove('hovering'); });

socket.on('connect', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    const wasHostOfRoom = sessionStorage.getItem('hostRoomId');
    const guestName = sessionStorage.getItem('guestName');

    if (roomFromUrl) {
        if (wasHostOfRoom === roomFromUrl) {
            isHost = true;
            if(hostSettingsBtn) hostSettingsBtn.classList.remove('hidden');
            if(copyInviteBtn) copyInviteBtn.classList.remove('hidden');
            socket.emit('createRoom', { roomId: roomFromUrl, playerId: myPlayerId });
        } else if (guestName) {
            isHost = false;
            if(goToWaitingBtn) goToWaitingBtn.classList.add('hidden'); 
            if(playerNameInput) playerNameInput.classList.remove('hidden'); 
            if(joinRoomBtn) joinRoomBtn.classList.remove('hidden');
            const welcomeTitle = document.querySelector('#welcomeScreen .sasuke-title');
            if (welcomeTitle) applyRgbWaveToElement(welcomeTitle, "انضمام للعبه الجاسوس");
            
            playerNameInput.value = guestName;
            socket.emit('joinRoom', { roomId: roomFromUrl, name: guestName, playerId: myPlayerId });
            updateLeaveBtnState();
        } else {
            if(goToWaitingBtn) goToWaitingBtn.classList.add('hidden'); 
            if(playerNameInput) playerNameInput.classList.remove('hidden'); 
            if(joinRoomBtn) joinRoomBtn.classList.remove('hidden');
            const welcomeTitle = document.querySelector('#welcomeScreen .sasuke-title');
            if (welcomeTitle) applyRgbWaveToElement(welcomeTitle, "انضمام للعبه الجاسوس");
        }
    } else {
        sessionStorage.removeItem('hostRoomId'); sessionStorage.removeItem('guestName');
    }
});

// 🔥 تعديل سير العمل: الذهاب لاختيار الخلفية أولاً
if(goToWaitingBtn) goToWaitingBtn.addEventListener('click', () => {
    isHost = true; 
    pendingAction = 'create';
    showScreen('bgSelection');
});

if(joinRoomBtn) joinRoomBtn.addEventListener('click', () => {
    const enteredName = playerNameInput.value.trim();
    if(!enteredName) { alert("اكتب اسمك الأول يا بطل!"); return; }
    isHost = false; 
    tempGuestName = enteredName;
    tempRoomIdToJoin = new URLSearchParams(window.location.search).get('room');
    pendingAction = 'join';
    showScreen('bgSelection');
});

// أزرار اختيار الخلفية
if(selectStarsBgBtn) selectStarsBgBtn.addEventListener('click', () => {
    createStars();
    starsContainer.classList.remove('hidden');
    defaultBg.classList.add('hidden'); // إخفاء النيون الأصلي لتركيز الأداء
    executePendingAction();
});

if(selectDefaultBgBtn) selectDefaultBgBtn.addEventListener('click', () => {
    starsContainer.classList.add('hidden');
    defaultBg.classList.remove('hidden');
    executePendingAction();
});

function executePendingAction() {
    if (pendingAction === 'create') {
        if(hostSettingsBtn) hostSettingsBtn.classList.remove('hidden'); 
        if(copyInviteBtn) copyInviteBtn.classList.remove('hidden'); 
        const newRoomId = Math.random().toString(36).substring(2, 8); 
        sessionStorage.setItem('hostRoomId', newRoomId); 
        window.history.pushState({}, '', `?room=${newRoomId}`);
        socket.emit('createRoom', { roomId: newRoomId, playerId: myPlayerId }); 
        showScreen('waiting');
    } else if (pendingAction === 'join') {
        if(copyInviteBtn) copyInviteBtn.classList.add('hidden'); 
        sessionStorage.setItem('guestName', tempGuestName);
        socket.emit('joinRoom', { roomId: tempRoomIdToJoin, name: tempGuestName, playerId: myPlayerId }); 
        showScreen('waiting'); 
        updateLeaveBtnState();
    }
    updateLeaveBtnState(); // تحديث عشان يخفي الإعدادات من الهوست
}

if(leaveRoomBtn) leaveRoomBtn.addEventListener('click', () => {
    if(confirm('هل أنت متأكد من مغادرة الغرفة؟')) { socket.emit('leaveRoom'); sessionStorage.clear(); leaveRoomBtn.classList.add('hidden'); if(leftRoomModal) leftRoomModal.classList.remove('hidden'); }
});

socket.on('errorMsg', (msg) => { if(invalidRoomModal && errorMsgText) { errorMsgText.innerText = msg; invalidRoomModal.classList.remove('hidden'); if (mainContainer) mainContainer.classList.add('hidden'); } });

socket.on('updatePlayers', (playersArray) => {
    if (!playersArray) return;
    if (playerCountSpan) playerCountSpan.innerText = playersArray.length;
    if (playersListDiv) {
        let playersHTML = '';
        playersArray.forEach(player => {
            const isMe = player.id === myPlayerId; const crown = player.isHost ? '<span class="player-crown">👑</span>' : '';
            playersHTML += `<div class="player-slot ${player.isHost ? 'host' : ''}"><div class="player-name-wrapper"><span class="player-name-text">${player.name}</span>${crown} ${isMe ? '<span style="color:#64748b; font-size:0.9rem;">(أنت)</span>' : ''}</div><span class="status-dot online"></span></div>`;
        });
        playersListDiv.innerHTML = playersHTML;
    }
    if (isHost) {
        if (playersArray.length >= 3) { 
            if(startGameBtn) startGameBtn.classList.add('hidden'); if(actualStartBtn) actualStartBtn.classList.remove('hidden');
        } else {
            if(startGameBtn) { startGameBtn.innerText = "في انتظار باقي اللاعبين... ⏳"; startGameBtn.classList.remove('hidden'); }
            if(actualStartBtn) actualStartBtn.classList.add('hidden');
        }
    } else {
        if(startGameBtn) { startGameBtn.innerText = "في انتظار الهوست لبدء اللعبة ⏳"; startGameBtn.classList.remove('hidden'); }
        if(actualStartBtn) actualStartBtn.classList.add('hidden');
    }
    if (isHost && modalPlayersList) {
        let modalHTML = '';
        playersArray.forEach(player => {
            const crown = player.isHost ? '<span class="player-crown">👑</span>' : ''; const isMe = player.id === myPlayerId;
            const actionButtons = player.isHost ? `<span style="color:#64748b; font-size:0.9rem;">أنت الهوست</span>` : `<button class="btn-action edit" onclick="editPlayerName('${player.id}')">✏️</button><button class="btn-action kick" onclick="kickPlayer('${player.id}')">❌</button>`;
            modalHTML += `<div class="modal-player-item"><div class="player-name-wrapper"><span class="player-name-text">${player.name}</span>${crown}${isMe ? '<span style="color:#64748b; font-size:0.8rem;">(أنت)</span>' : ''}</div><div class="modal-player-actions">${actionButtons}</div></div>`;
        });
        modalPlayersList.innerHTML = modalHTML;
    }
});

if(actualStartBtn) actualStartBtn.addEventListener('click', () => { playSound('start'); socket.emit('goToModeSelection'); });
socket.on('showModeSelection', () => {
    showScreen('modeSelection');
    if(isHost) { hostModeControls.classList.remove('hidden'); } else { hostModeControls.classList.add('hidden'); confirmStartGameBtn.classList.add('hidden'); }
});
if(selectRandomModeBtn) selectRandomModeBtn.addEventListener('click', () => socket.emit('selectMode', 'random'));
if(revokeRandomModeBtn) revokeRandomModeBtn.addEventListener('click', () => socket.emit('deselectMode', 'random'));
if(confirmStartGameBtn) confirmStartGameBtn.addEventListener('click', () => { playSound('start'); socket.emit('startRandomMode'); });

socket.on('modeSelected', (mode) => {
    if(mode === 'random') {
        selectedBadge.classList.remove('hidden'); randomModeCard.style.borderColor = 'var(--neon-green)'; randomModeCard.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.2)';
        if(isHost) { selectRandomModeBtn.classList.add('hidden'); revokeRandomModeBtn.classList.remove('hidden'); confirmStartGameBtn.classList.remove('hidden'); }
    }
});
socket.on('modeDeselected', (mode) => {
    if(mode === 'random') {
        selectedBadge.classList.add('hidden'); randomModeCard.style.borderColor = 'rgba(0, 243, 255, 0.3)'; randomModeCard.style.boxShadow = 'none';
        if(isHost) { selectRandomModeBtn.classList.remove('hidden'); revokeRandomModeBtn.classList.add('hidden'); confirmStartGameBtn.classList.add('hidden'); }
    }
});

socket.on('assignRole', (data) => {
    playSound('start'); myRoleData = data;
    const roleIcon = document.getElementById('roleIcon'); const roleTitle = document.getElementById('roleTitle');
    if(data.isSpy) { roleIcon.innerText = "🕵️‍♂️"; applyRgbWaveToElement(roleTitle, "أنت الجاسوس!"); } 
    else { roleIcon.innerText = "🎯"; applyRgbWaveToElement(roleTitle, data.word); }
});

socket.on('gameStarted', () => {
    showScreen('game');
    if (isHost && restartGameBtn) restartGameBtn.disabled = false;
    if (isHost && startVotingPhaseBtn) startVotingPhaseBtn.classList.remove('hidden');
});

if(startVotingPhaseBtn) startVotingPhaseBtn.addEventListener('click', () => { playSound('start'); socket.emit('startVotingPhase'); });

socket.on('votingStarted', (playersArray) => {
    playSound('start'); showScreen('voting'); liveVoteLog.innerHTML = ''; voteCounter.innerText = `0/${playersArray.length}`; voteCounter.style.textShadow = "none";
    let gridHTML = '';
    playersArray.forEach(p => {
        if (p.id !== myPlayerId) gridHTML += `<div class="vote-card" onclick="castVote('${p.id}', this)" data-player-id="${p.id}"><div style="font-size: 2rem; margin-bottom:10px;">${p.isHost ? '👑' : '👤'}</div><div style="font-weight:bold; color:#fff;">${p.name}</div></div>`;
    });
    votingGrid.innerHTML = gridHTML;
});

// 🔥 استقبال كسر التعادل
socket.on('votingTied', (data) => {
    playSound('lose');
    tiedPlayersNames.innerText = data.tiedNames;
    tieBreakerModal.classList.remove('hidden');
    
    let timeLeft = 12;
    tieTimerEl.innerText = timeLeft;
    if(tieInterval) clearInterval(tieInterval);
    
    tieInterval = setInterval(() => {
        timeLeft--;
        tieTimerEl.innerText = timeLeft;
        if(timeLeft <= 0) {
            clearInterval(tieInterval);
            tieBreakerModal.classList.add('hidden');
            // الواجهة هتستقبل votingStarted مرة تانية من السيرفر وتنظف الكروت أوتوماتيك
        }
    }, 1000);
});

socket.on('youAlreadyVoted', (targetId) => {
    const allCards = document.querySelectorAll('.vote-card'); allCards.forEach(c => c.classList.add('disabled'));
    const myCard = document.querySelector(`.vote-card[data-player-id="${targetId}"]`);
    if(myCard) { myCard.classList.remove('disabled'); myCard.classList.add('voted'); }
});

socket.on('playerRemovedFromVoting', (playerId) => {
    const card = document.querySelector(`.vote-card[data-player-id="${playerId}"]`); if (card) card.remove();
});

window.castVote = function(targetId, cardElement) {
    socket.emit('submitVote', targetId);
    const allCards = document.querySelectorAll('.vote-card'); allCards.forEach(c => c.classList.add('disabled'));
    cardElement.classList.remove('disabled'); cardElement.classList.add('voted');
};

socket.on('voteRegistered', (data) => {
    if(data.voterName !== "النظام") playSound('vote'); 
    voteCounter.innerText = `${data.currentVotes}/${data.totalRequired}`;
    if(data.currentVotes === data.totalRequired) { voteCounter.style.color = "var(--neon-green)"; voteCounter.style.textShadow = "0 0 10px var(--neon-green)"; }
    if (data.voterName !== "النظام") {
        const logP = document.createElement('div'); logP.className = 'log-entry'; logP.innerHTML = `${data.voterName} صوت على <span class="target-name">${data.targetName}</span>`;
        liveVoteLog.prepend(logP);
    }
});

socket.on('votingEnded', (data) => {
    const vTitle = document.getElementById('votingResultTitle'); const vDesc1 = document.getElementById('votingResultDesc1'); const vDesc2 = document.getElementById('votingResultDesc2');
    if (!myRoleData.isSpy) {
        spyProceedBtn.classList.add('hidden');
        if (data.isSpyCaught) { playSound('win'); vTitle.innerText = "عمل جيد! 👏"; vTitle.style.color = "var(--neon-green)"; vDesc1.innerText = `لقد كان ${data.votedPlayerName} الجاسوس فعلاً، أحسنتم.`; vDesc2.innerText = "في انتظار تخمينه للكلمة..."; } 
        else { playSound('lose'); vTitle.innerText = "اختيار خاطئ! ❌"; vTitle.style.color = "var(--neon-red)"; vDesc1.innerText = `لم يكن ${data.votedPlayerName} الجاسوس. لقد كان ${data.spyName}.`; vDesc2.innerText = "في انتظار تخمينه للكلمة..."; }
    } else {
        spyProceedBtn.classList.remove('hidden');
        if (data.isSpyCaught) { playSound('lose'); vTitle.innerText = "تم كشفك! 🚨"; vTitle.style.color = "var(--neon-red)"; vDesc1.innerText = `لقد تم كشفك يا ${data.spyName}.`; vDesc2.innerText = "ابذل قصارى جهدك المرة القادمة!"; spyProceedBtn.innerText = "خمن الكلمة"; } 
        else { playSound('win'); vTitle.innerText = "نجاح باهر! 🕵️‍♂️"; vTitle.style.color = "var(--neon-green)"; vDesc1.innerText = `لقد اختاروا شخصاً خاطئاً، نجحت في التخفي يا ${data.spyName}.`; vDesc2.innerText = ""; spyProceedBtn.innerText = "تخمين الكلمة"; }
    }
    votingResultModal.classList.remove('hidden');
});

if(spyProceedBtn) spyProceedBtn.addEventListener('click', () => { votingResultModal.classList.add('hidden'); socket.emit('startGuessingPhase'); });

socket.on('guessingPhaseStarted', (data) => {
    playSound('start'); votingResultModal.classList.add('hidden'); showScreen('guessing');
    if(!myRoleData.isSpy) { document.getElementById('guessingSubtitle').innerText = "الجاسوس يختار الكلمة الآن..."; } 
    else { document.getElementById('guessingSubtitle').innerText = "اختر الكلمة التي تعتقد أنها صحيحة!"; }

    let wordsHTML = '';
    data.words.forEach(w => {
        const onClickAttr = myRoleData.isSpy ? `onclick="selectSpyWord('${w}')"` : '';
        wordsHTML += `<div class="word-card" id="word-${w}" ${onClickAttr}>${w}</div>`;
    });
    wordsGrid.innerHTML = wordsHTML;

    let timeLeft = data.duration;
    const spyTimerEl = document.getElementById('spyTimer');
    if(spyTimerEl) { spyTimerEl.innerText = timeLeft; spyTimerEl.style.color = "var(--neon-green)"; spyTimerEl.style.textShadow = "0 0 10px var(--neon-green)"; }
    
    if(guessInterval) clearInterval(guessInterval);
    guessInterval = setInterval(() => {
        timeLeft--;
        if(spyTimerEl) {
            spyTimerEl.innerText = timeLeft;
            if(timeLeft <= 10) { spyTimerEl.style.color = "var(--neon-red)"; spyTimerEl.style.textShadow = "0 0 10px var(--neon-red)"; }
        }
        if(timeLeft <= 0) clearInterval(guessInterval);
    }, 1000);
});

socket.on('spyTimeOut', () => {
    playSound('lose'); if(guessInterval) clearInterval(guessInterval);
    const t1 = document.getElementById('finalResultText1'); const t2 = document.getElementById('finalResultText2'); const t3 = document.getElementById('finalResultText3'); const t4 = document.getElementById('finalResultText4');
    t1.innerText = "نفد الوقت! ⏳"; t2.innerText = "لقد انتهت اللعبه لعدم اختيار الجاسوس الإجابة"; t2.style.color = "var(--neon-red)"; t3.innerText = "لقد خسر الجاسوس!"; t3.style.color = "var(--neon-red)"; t4.innerText = "";
    finalResultModal.classList.remove('hidden');
});

window.selectSpyWord = function(word) {
    if (!myRoleData.isSpy) return; selectedSpyWord = word; confirmGuessBtn.classList.remove('hidden'); socket.emit('spyHoverWord', word);
};

socket.on('spySelectedWord', (data) => {
    playSound('vote');
    document.querySelectorAll('.word-card').forEach(c => { c.classList.remove('spy-active'); const tag = c.querySelector('.spy-tag'); if(tag) tag.remove(); });
    const activeCard = document.getElementById(`word-${data.word}`);
    if (activeCard) { activeCard.classList.add('spy-active'); activeCard.innerHTML += `<div class="spy-tag">اختارها ${data.spyName}</div>`; }
});

if(confirmGuessBtn) confirmGuessBtn.addEventListener('click', () => { if(selectedSpyWord) socket.emit('spyConfirmWord', selectedSpyWord); });

socket.on('gameFinalResult', (data) => {
    if(guessInterval) clearInterval(guessInterval);
    if(data.isCorrect) playSound('win'); else playSound('lose');
    
    const t1 = document.getElementById('finalResultText1'); const t2 = document.getElementById('finalResultText2'); const t3 = document.getElementById('finalResultText3'); const t4 = document.getElementById('finalResultText4');
    t1.innerText = `لقد خمن الجاسوس ${data.spyName} الكلمة`; t2.innerText = data.chosenWord;
    
    if (data.isCorrect) { t3.innerText = "وكانت الإجابة صحيحة! ✅"; t3.style.color = "var(--neon-green)"; t4.innerText = ""; } 
    else { t3.innerText = "وكانت الإجابة خاطئة! ❌"; t3.style.color = "var(--neon-red)"; t4.innerText = `والكلمة الصحيحة كانت: ${data.correctWord}`; }
    finalResultModal.classList.remove('hidden');
});

if(finalOkBtn) finalOkBtn.addEventListener('click', () => {
    finalResultModal.classList.add('hidden');
    if (isHost) { if(hostSettingsModal) hostSettingsModal.classList.remove('hidden'); }
});

socket.on('gameRestarted', () => {
    playSound('start'); if(guessInterval) clearInterval(guessInterval); showScreen('waiting');
    selectedBadge.classList.add('hidden'); randomModeCard.style.borderColor = 'rgba(0, 243, 255, 0.3)'; randomModeCard.style.boxShadow = 'none';
    selectRandomModeBtn.classList.remove('hidden'); revokeRandomModeBtn.classList.add('hidden'); confirmStartGameBtn.classList.add('hidden');
    votingResultModal.classList.add('hidden'); finalResultModal.classList.add('hidden'); tieBreakerModal.classList.add('hidden');
    if(startVotingPhaseBtn) startVotingPhaseBtn.classList.add('hidden'); if(confirmGuessBtn) confirmGuessBtn.classList.add('hidden');
    if (isHost && restartGameBtn && hostSettingsModal) { restartGameBtn.disabled = true; hostSettingsModal.classList.add('hidden'); }
});

window.editPlayerName = function(targetId) { const newName = prompt('أدخل الاسم الجديد:'); if (newName && newName.trim() !== '') socket.emit('changePlayerName', { targetId: targetId, newName: newName.trim() }); };
window.kickPlayer = function(targetId) { if (confirm('طرد نهائي لهذا اللاعب؟')) socket.emit('kickPlayer', targetId); };
function showScreen(screenName) { Object.values(screens).forEach(s => { if(s) { s.classList.remove('active'); s.classList.add('hidden'); } }); if(screens[screenName]) { screens[screenName].classList.remove('hidden'); screens[screenName].classList.add('active'); } }

// 🔥 تغيير المقاسات ديناميكياً
if(pcViewBtn) pcViewBtn.addEventListener('click', () => { isPcMode = true; document.body.className = 'pc-mode'; if(customCursor) customCursor.classList.remove('hidden'); if(follow1) follow1.classList.remove('hidden'); if(follow2) follow2.classList.remove('hidden'); pcViewBtn.classList.add('active-view'); if(mobileViewBtn) mobileViewBtn.classList.remove('active-view'); });
if(mobileViewBtn) mobileViewBtn.addEventListener('click', () => { isPcMode = false; document.body.className = 'mobile-mode'; if(customCursor) customCursor.classList.add('hidden'); if(follow1) follow1.classList.add('hidden'); if(follow2) follow2.classList.add('hidden'); mobileViewBtn.classList.add('active-view'); if(pcViewBtn) pcViewBtn.classList.remove('active-view'); });

if(hostSettingsBtn) hostSettingsBtn.addEventListener('click', () => { if(hostSettingsModal) hostSettingsModal.classList.remove('hidden'); });
if(closeModalBtn) closeModalBtn.addEventListener('click', () => { if(hostSettingsModal) hostSettingsModal.classList.add('hidden'); });
if(restartGameBtn) restartGameBtn.addEventListener('click', () => { if(confirm('إعادة اللعب وإرجاع الجميع لغرفة الانتظار؟')) socket.emit('restartGame'); });
if(copyInviteBtn) copyInviteBtn.addEventListener('click', () => { navigator.clipboard.writeText(window.location.href).then(() => { if(notificationToast) { notificationToast.classList.remove('hidden'); setTimeout(() => notificationToast.classList.add('hidden'), 2500); } }); });
socket.on('hostDisconnected', () => { if(hostLeftModal) hostLeftModal.classList.remove('hidden'); if(leaveRoomBtn) leaveRoomBtn.classList.add('hidden'); sessionStorage.clear(); });
socket.on('youAreKickedPermanently', () => { if(kickedModal) kickedModal.classList.remove('hidden'); if(leaveRoomBtn) leaveRoomBtn.classList.add('hidden'); sessionStorage.clear(); });