const socket = io();

const screens = {
    welcome: document.getElementById('welcomeScreen'),
    waiting: document.getElementById('waitingScreen'),
    modeSelection: document.getElementById('modeSelectionScreen'),
    game: document.getElementById('gameScreen'),
    voting: document.getElementById('votingScreen'),
    guessing: document.getElementById('guessingScreen')
};

// Elements
const mainContainer = document.getElementById('mainContainer');
const pcViewBtn = document.getElementById('pcViewBtn');
const mobileViewBtn = document.getElementById('mobileViewBtn');
const goToWaitingBtn = document.getElementById('goToWaitingBtn'); 
const joinRoomBtn = document.getElementById('joinRoomBtn');       
const playerNameInput = document.getElementById('playerNameInput'); 
const copyInviteBtn = document.getElementById('copyInviteBtn');
const notificationToast = document.getElementById('notificationToast');
const playerCountSpan = document.getElementById('playerCount');
const playersListDiv = document.getElementById('playersList');
const startGameBtn = document.getElementById('startGameBtn');
const actualStartBtn = document.getElementById('actualStartBtn');
const hostSettingsBtn = document.getElementById('hostSettingsBtn');
const leaveRoomBtn = document.getElementById('leaveRoomBtn');
const restartGameBtn = document.getElementById('restartGameBtn');

// Modals
const hostSettingsModal = document.getElementById('hostSettingsModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalPlayersList = document.getElementById('modalPlayersList');
const hostLeftModal = document.getElementById('hostLeftModal');
const kickedModal = document.getElementById('kickedModal');
const leftRoomModal = document.getElementById('leftRoomModal'); 
const invalidRoomModal = document.getElementById('invalidRoomModal'); 
const errorMsgText = document.getElementById('errorMsgText');

// Voting & Guessing UI
const startVotingPhaseBtn = document.getElementById('startVotingPhaseBtn');
const voteCounter = document.getElementById('voteCounter');
const liveVoteLog = document.getElementById('liveVoteLog');
const votingGrid = document.getElementById('votingGrid');
const votingResultModal = document.getElementById('votingResultModal');
const spyProceedBtn = document.getElementById('spyProceedBtn');
const wordsGrid = document.getElementById('wordsGrid');
const confirmGuessBtn = document.getElementById('confirmGuessBtn');
const finalResultModal = document.getElementById('finalResultModal');
const finalOkBtn = document.getElementById('finalOkBtn');

// Mode Selection
const selectRandomModeBtn = document.getElementById('selectRandomModeBtn');
const revokeRandomModeBtn = document.getElementById('revokeRandomModeBtn');
const confirmStartGameBtn = document.getElementById('confirmStartGameBtn');
const selectedBadge = document.getElementById('selectedBadge');
const randomModeCard = document.getElementById('randomModeCard');
const hostModeControls = document.getElementById('hostModeControls');

const customCursor = document.getElementById('customCursor');
const follow1 = document.getElementById('cursorFollow1');
const follow2 = document.getElementById('cursorFollow2');

let isPcMode = false;
let isHost = false; 
let myRoleData = null; // لحفظ بيانات الدور (جاسوس ولا لأ)
let selectedSpyWord = null;

// ==========================================
// الماوس السلس (بدون تأثير المغناطيس بناءً على طلبك)
// ==========================================
let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
let f1X = mouseX, f1Y = mouseY, f2X = mouseX, f2Y = mouseY;

document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

function animateCursor() {
    if (isPcMode) {
        f1X += (mouseX - f1X) * 0.2; f1Y += (mouseY - f1Y) * 0.2;
        f2X += (mouseX - f2X) * 0.1; f2Y += (mouseY - f2Y) * 0.1;
        if(customCursor) customCursor.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
        if(follow1) follow1.style.transform = `translate(${f1X}px, ${f1Y}px)`;
        if(follow2) follow2.style.transform = `translate(${f2X}px, ${f2Y}px)`;
    }
    requestAnimationFrame(animateCursor);
}
requestAnimationFrame(animateCursor);

document.addEventListener('mouseover', (e) => { if (isPcMode && e.target.closest('button') && customCursor) customCursor.classList.add('hovering'); });
document.addEventListener('mouseout', (e) => { if (isPcMode && e.target.closest('button') && customCursor) customCursor.classList.remove('hovering'); });

// ==========================================
// التهيئة والانضمام
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
const roomFromUrl = urlParams.get('room');
const wasHostOfRoom = sessionStorage.getItem('hostRoomId');
const guestName = sessionStorage.getItem('guestName');

if (roomFromUrl) {
    if (wasHostOfRoom === roomFromUrl) {
        sessionStorage.removeItem('hostRoomId');
        window.location.href = '/';
    } else {
        if(goToWaitingBtn) goToWaitingBtn.classList.add('hidden'); 
        if(playerNameInput) playerNameInput.classList.remove('hidden'); 
        if(joinRoomBtn) joinRoomBtn.classList.remove('hidden'); 
        if (guestName) {
            isHost = false;
            playerNameInput.value = guestName;
            socket.emit('joinRoom', { roomId: roomFromUrl, name: guestName });
            showScreen('waiting');
            if(leaveRoomBtn) leaveRoomBtn.classList.remove('hidden');
        }
    }
} else { sessionStorage.clear(); }

if(goToWaitingBtn) goToWaitingBtn.addEventListener('click', () => {
    isHost = true;
    if(hostSettingsBtn) hostSettingsBtn.classList.remove('hidden'); 
    if(copyInviteBtn) copyInviteBtn.classList.remove('hidden'); // إظهار الرابط للهوست فقط
    const newRoomId = Math.random().toString(36).substring(2, 8);
    sessionStorage.setItem('hostRoomId', newRoomId);
    window.history.pushState({}, '', `?room=${newRoomId}`);
    socket.emit('createRoom', { roomId: newRoomId }); 
    showScreen('waiting');
});

if(joinRoomBtn) joinRoomBtn.addEventListener('click', () => {
    const enteredName = playerNameInput.value.trim();
    if(!enteredName) { alert("اكتب اسمك الأول يا بطل!"); return; }
    isHost = false;
    if(copyInviteBtn) copyInviteBtn.classList.add('hidden'); // إخفاء الرابط عن الضيف
    sessionStorage.setItem('guestName', enteredName);
    socket.emit('joinRoom', { roomId: roomFromUrl, name: enteredName });
    showScreen('waiting');
    if(leaveRoomBtn) leaveRoomBtn.classList.remove('hidden');
});

if(leaveRoomBtn) leaveRoomBtn.addEventListener('click', () => {
    if(confirm('هل أنت متأكد من مغادرة الغرفة؟')) {
        socket.emit('leaveRoom');
        sessionStorage.clear();
        leaveRoomBtn.classList.add('hidden');
        if(leftRoomModal) leftRoomModal.classList.remove('hidden');
    }
});

socket.on('errorMsg', (msg) => {
    if(invalidRoomModal && errorMsgText) {
        errorMsgText.innerText = msg;
        invalidRoomModal.classList.remove('hidden');
        if (mainContainer) mainContainer.classList.add('hidden');
    }
});

socket.on('updatePlayers', (playersArray) => {
    if (!playersArray) return;
    if (playerCountSpan) playerCountSpan.innerText = playersArray.length;
    if (playersListDiv) {
        let playersHTML = '';
        playersArray.forEach(player => {
            const isMe = player.id === socket.id;
            const crown = player.isHost ? '<span class="player-crown">👑</span>' : '';
            playersHTML += `<div class="player-slot ${player.isHost ? 'host' : ''}">
                <div class="player-name-wrapper"><span class="player-name-text">${player.name}</span>${crown} ${isMe ? '<span style="color:#64748b; font-size:0.9rem;">(أنت)</span>' : ''}</div>
                <span class="status-dot online"></span></div>`;
        });
        playersListDiv.innerHTML = playersHTML;
    }
    if (isHost && actualStartBtn && startGameBtn) {
        if (playersArray.length >= 3) { 
            startGameBtn.classList.add('hidden'); actualStartBtn.classList.remove('hidden');
        } else {
            startGameBtn.classList.remove('hidden'); actualStartBtn.classList.add('hidden');
        }
    }
    if (isHost && modalPlayersList) {
        let modalHTML = '';
        playersArray.forEach(player => {
            const actionButtons = player.isHost ? `<span style="color:#64748b;">أنت الهوست</span>` : `<button class="btn-action edit" onclick="editPlayerName('${player.id}')">✏️</button><button class="btn-action kick" onclick="kickPlayer('${player.id}')">❌</button>`;
            modalHTML += `<div class="modal-player-item"><span class="player-name-text">${player.name}</span><div class="modal-player-actions">${actionButtons}</div></div>`;
        });
        modalPlayersList.innerHTML = modalHTML;
    }
});

// ==========================================
// بدء اللعبة والأدوار
// ==========================================
if(actualStartBtn) actualStartBtn.addEventListener('click', () => socket.emit('goToModeSelection'));
socket.on('showModeSelection', () => {
    showScreen('modeSelection');
    if(isHost) { hostModeControls.classList.remove('hidden'); } else { hostModeControls.classList.add('hidden'); confirmStartGameBtn.classList.add('hidden'); }
});

if(selectRandomModeBtn) selectRandomModeBtn.addEventListener('click', () => socket.emit('selectMode', 'random'));
if(revokeRandomModeBtn) revokeRandomModeBtn.addEventListener('click', () => socket.emit('deselectMode', 'random'));
if(confirmStartGameBtn) confirmStartGameBtn.addEventListener('click', () => socket.emit('startRandomMode'));

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
    myRoleData = data;
    const roleIcon = document.getElementById('roleIcon');
    const roleTitle = document.getElementById('roleTitle');
    const roleCategory = document.getElementById('roleCategory');
    if(data.isSpy) {
        roleIcon.innerText = "🕵️‍♂️"; roleTitle.innerText = "أنت الجاسوس!"; roleTitle.style.color = "var(--neon-red)";
    } else {
        roleIcon.innerText = "🎯"; roleTitle.innerText = data.word; roleTitle.style.color = "var(--neon-blue)";
    }
    roleCategory.innerText = `التصنيف: ${data.category}`;
});

socket.on('gameStarted', () => {
    showScreen('game');
    if (isHost && restartGameBtn) restartGameBtn.disabled = false;
    if (isHost && startVotingPhaseBtn) startVotingPhaseBtn.classList.remove('hidden');
});

// ==========================================
// 🗳️ مرحلة التصويت
// ==========================================
if(startVotingPhaseBtn) startVotingPhaseBtn.addEventListener('click', () => socket.emit('startVotingPhase'));

socket.on('votingStarted', (playersArray) => {
    showScreen('voting');
    liveVoteLog.innerHTML = '';
    voteCounter.innerText = `0/${playersArray.length}`;
    voteCounter.style.textShadow = "none";
    
    let gridHTML = '';
    playersArray.forEach(p => {
        // إنشاء كارت لكل لاعب ما عدا أنا
        if (p.id !== socket.id) {
            gridHTML += `
                <div class="vote-card" onclick="castVote('${p.id}', this)">
                    <div style="font-size: 2rem; margin-bottom:10px;">${p.isHost ? '👑' : '👤'}</div>
                    <div style="font-weight:bold; color:#fff;">${p.name}</div>
                </div>
            `;
        }
    });
    votingGrid.innerHTML = gridHTML;
});

window.castVote = function(targetId, cardElement) {
    socket.emit('submitVote', targetId);
    
    // تعطيل كل الكروت عشان يصوت مرة واحدة
    const allCards = document.querySelectorAll('.vote-card');
    allCards.forEach(c => c.classList.add('disabled'));
    
    cardElement.classList.remove('disabled');
    cardElement.classList.add('voted'); // تنوير الكارت
};

socket.on('voteRegistered', (data) => {
    voteCounter.innerText = `${data.currentVotes}/${data.totalRequired}`;
    if(data.currentVotes === data.totalRequired) {
        voteCounter.style.color = "var(--neon-green)";
        voteCounter.style.textShadow = "0 0 10px var(--neon-green)";
    }

    const logP = document.createElement('div');
    logP.className = 'log-entry';
    logP.innerHTML = `${data.voterName} صوت على <span class="target-name">${data.targetName}</span>`;
    liveVoteLog.prepend(logP);
});

socket.on('votingEnded', (data) => {
    const vTitle = document.getElementById('votingResultTitle');
    const vDesc1 = document.getElementById('votingResultDesc1');
    const vDesc2 = document.getElementById('votingResultDesc2');
    
    if (!myRoleData.isSpy) {
        spyProceedBtn.classList.add('hidden');
        if (data.isSpyCaught) {
            vTitle.innerText = "عمل جيد! 👏";
            vTitle.style.color = "var(--neon-green)";
            vDesc1.innerText = `لقد كان ${data.votedPlayerName} الجاسوس فعلاً، أحسنتم.`;
            vDesc2.innerText = "في انتظار تخمينه للكلمة...";
        } else {
            vTitle.innerText = "اختيار خاطئ! ❌";
            vTitle.style.color = "var(--neon-red)";
            vDesc1.innerText = `لم يكن ${data.votedPlayerName} الجاسوس. لقد كان ${data.spyName}.`;
            vDesc2.innerText = "في انتظار تخمينه للكلمة...";
        }
    } else {
        // رسائل الجاسوس
        spyProceedBtn.classList.remove('hidden');
        if (data.isSpyCaught) {
            vTitle.innerText = "تم كشفك! 🚨";
            vTitle.style.color = "var(--neon-red)";
            vDesc1.innerText = `لقد تم كشفك يا ${data.spyName}.`;
            vDesc2.innerText = "ابذل قصارى جهدك المرة القادمة!";
            spyProceedBtn.innerText = "خمن الكلمة";
        } else {
            vTitle.innerText = "نجاح باهر! 🕵️‍♂️";
            vTitle.style.color = "var(--neon-green)";
            vDesc1.innerText = `لقد اختاروا شخصاً خاطئاً، نجحت في التخفي يا ${data.spyName}.`;
            vDesc2.innerText = "";
            spyProceedBtn.innerText = "تخمين الكلمة";
        }
    }
    
    votingResultModal.classList.remove('hidden');
});

// ==========================================
// 🧠 مرحلة تخمين الكلمة
// ==========================================
if(spyProceedBtn) spyProceedBtn.addEventListener('click', () => {
    votingResultModal.classList.add('hidden');
    socket.emit('startGuessingPhase');
});

socket.on('guessingPhaseStarted', (wordsArray) => {
    votingResultModal.classList.add('hidden');
    showScreen('guessing');
    
    if(!myRoleData.isSpy) {
        document.getElementById('guessingSubtitle').innerText = "الجاسوس يختار الكلمة الآن...";
    } else {
        document.getElementById('guessingSubtitle').innerText = "اختر الكلمة التي تعتقد أنها صحيحة!";
    }

    let wordsHTML = '';
    wordsArray.forEach(w => {
        const onClickAttr = myRoleData.isSpy ? `onclick="selectSpyWord('${w}')"` : '';
        wordsHTML += `
            <div class="word-card" id="word-${w}" ${onClickAttr}>
                ${w}
            </div>
        `;
    });
    wordsGrid.innerHTML = wordsHTML;
});

window.selectSpyWord = function(word) {
    if (!myRoleData.isSpy) return;
    selectedSpyWord = word;
    confirmGuessBtn.classList.remove('hidden');
    socket.emit('spyHoverWord', word);
};

socket.on('spySelectedWord', (data) => {
    // إزالة التحديد من كل الكلمات
    document.querySelectorAll('.word-card').forEach(c => {
        c.classList.remove('spy-active');
        const tag = c.querySelector('.spy-tag');
        if(tag) tag.remove();
    });

    // إضافة التحديد للكلمة المختارة
    const activeCard = document.getElementById(`word-${data.word}`);
    if (activeCard) {
        activeCard.classList.add('spy-active');
        activeCard.innerHTML += `<div class="spy-tag">اختارها ${data.spyName}</div>`;
    }
});

if(confirmGuessBtn) confirmGuessBtn.addEventListener('click', () => {
    if(selectedSpyWord) {
        socket.emit('spyConfirmWord', selectedSpyWord);
    }
});

// ==========================================
// 🏁 النتيجة النهائية
// ==========================================
socket.on('gameFinalResult', (data) => {
    const t1 = document.getElementById('finalResultText1');
    const t2 = document.getElementById('finalResultText2');
    const t3 = document.getElementById('finalResultText3');
    const t4 = document.getElementById('finalResultText4');

    t1.innerText = `لقد خمن الجاسوس ${data.spyName} الكلمة`;
    t2.innerText = data.chosenWord;
    
    if (data.isCorrect) {
        t3.innerText = "وكانت الإجابة صحيحة! ✅";
        t3.style.color = "var(--neon-green)";
        t4.innerText = "";
    } else {
        t3.innerText = "وكانت الإجابة خاطئة! ❌";
        t3.style.color = "var(--neon-red)";
        t4.innerText = `والكلمة الصحيحة كانت: ${data.correctWord}`;
    }

    finalResultModal.classList.remove('hidden');
});

if(finalOkBtn) finalOkBtn.addEventListener('click', () => {
    finalResultModal.classList.add('hidden');
    if (isHost) {
        showScreen('waiting'); // الهوست يرجع لغرفة الانتظار عشان يقرر
    } else {
        alert("انتهت اللعبة، في انتظار قرار الهوست بإغلاق اللعبة أو إعادة اللعب");
    }
});

// ==========================================
// إعادة اللعب
// ==========================================
socket.on('gameRestarted', () => {
    showScreen('waiting');
    
    // تصفير الواجهات
    selectedBadge.classList.add('hidden');
    randomModeCard.style.borderColor = 'rgba(0, 243, 255, 0.3)';
    randomModeCard.style.boxShadow = 'none';
    selectRandomModeBtn.classList.remove('hidden');
    revokeRandomModeBtn.classList.add('hidden');
    confirmStartGameBtn.classList.add('hidden');
    votingResultModal.classList.add('hidden');
    finalResultModal.classList.add('hidden');
    if(startVotingPhaseBtn) startVotingPhaseBtn.classList.add('hidden');
    if(confirmGuessBtn) confirmGuessBtn.classList.add('hidden');

    if (isHost && restartGameBtn && hostSettingsModal) {
        restartGameBtn.disabled = true;
        hostSettingsModal.classList.add('hidden');
    }
});

window.editPlayerName = function(targetId) { const newName = prompt('أدخل الاسم الجديد:'); if (newName && newName.trim() !== '') socket.emit('changePlayerName', { targetId: targetId, newName: newName.trim() }); };
window.kickPlayer = function(targetId) { if (confirm('طرد نهائي لهذا اللاعب؟')) socket.emit('kickPlayer', targetId); };

function showScreen(screenName) {
    Object.values(screens).forEach(s => { if(s) { s.classList.remove('active'); s.classList.add('hidden'); } });
    if(screens[screenName]) { screens[screenName].classList.remove('hidden'); screens[screenName].classList.add('active'); }
}

if(pcViewBtn) pcViewBtn.addEventListener('click', () => { isPcMode = true; document.body.className = 'pc-mode'; if(customCursor) customCursor.classList.remove('hidden'); if(follow1) follow1.classList.remove('hidden'); if(follow2) follow2.classList.remove('hidden'); if(mainContainer) mainContainer.classList.add('container-pc'); pcViewBtn.classList.add('active-view'); if(mobileViewBtn) mobileViewBtn.classList.remove('active-view'); });
if(mobileViewBtn) mobileViewBtn.addEventListener('click', () => { isPcMode = false; document.body.className = 'mobile-mode'; if(customCursor) customCursor.classList.add('hidden'); if(follow1) follow1.classList.add('hidden'); if(follow2) follow2.classList.add('hidden'); if(mainContainer) mainContainer.classList.remove('container-pc'); mobileViewBtn.classList.add('active-view'); if(pcViewBtn) pcViewBtn.classList.remove('active-view'); });
if(hostSettingsBtn) hostSettingsBtn.addEventListener('click', () => { if(hostSettingsModal) hostSettingsModal.classList.remove('hidden'); });
if(closeModalBtn) closeModalBtn.addEventListener('click', () => { if(hostSettingsModal) hostSettingsModal.classList.add('hidden'); });
if(restartGameBtn) restartGameBtn.addEventListener('click', () => { if(confirm('إعادة اللعب وإرجاع الجميع لغرفة الانتظار؟')) socket.emit('restartGame'); });
if(copyInviteBtn) copyInviteBtn.addEventListener('click', () => { navigator.clipboard.writeText(window.location.href).then(() => { if(notificationToast) { notificationToast.classList.remove('hidden'); setTimeout(() => notificationToast.classList.add('hidden'), 2500); } }); });