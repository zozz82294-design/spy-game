// لا نقوم بمسح الذاكرة بالكامل لضمان عودة الضيف إذا قام بعمل Refresh
const socket = io();

const screens = {
    welcome: document.getElementById('welcomeScreen'),
    waiting: document.getElementById('waitingScreen'),
    modeSelection: document.getElementById('modeSelectionScreen'),
    game: document.getElementById('gameScreen')
};

const mainContainer = document.getElementById('mainContainer');
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

const hostSettingsModal = document.getElementById('hostSettingsModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalPlayersList = document.getElementById('modalPlayersList');
const restartGameBtn = document.getElementById('restartGameBtn');
const hostLeftModal = document.getElementById('hostLeftModal');
const kickedModal = document.getElementById('kickedModal');

const selectRandomModeBtn = document.getElementById('selectRandomModeBtn');
const startVotingBtn = document.getElementById('startVotingBtn');

let isPcMode = false;
let isHost = false; 

const urlParams = new URLSearchParams(window.location.search);
const roomFromUrl = urlParams.get('room');

const wasHostOfRoom = sessionStorage.getItem('hostRoomId');
const guestName = sessionStorage.getItem('guestName');

// معالجة الريفريش القوي
if (roomFromUrl) {
    if (wasHostOfRoom === roomFromUrl) {
        // الهوست عمل ريفريش -> يرجع للرئيسية فوراً ويمسح الروم
        sessionStorage.removeItem('hostRoomId');
        window.location.href = '/';
    } else {
        // الضيف عمل ريفريش -> يدخل الروم تلقائي بنفس اسمه لو متسجل
        if(goToWaitingBtn) goToWaitingBtn.classList.add('hidden'); 
        if(playerNameInput) playerNameInput.classList.remove('hidden'); 
        if(joinRoomBtn) joinRoomBtn.classList.remove('hidden'); 
        
        if (guestName) {
            isHost = false;
            playerNameInput.value = guestName;
            socket.emit('joinRoom', { roomId: roomFromUrl, name: guestName });
            showScreen('waiting');
            leaveRoomBtn.classList.remove('hidden');
        }
    }
} else {
    sessionStorage.clear();
}

// 👑 الهوست ينشئ الغرفة
if(goToWaitingBtn) goToWaitingBtn.addEventListener('click', () => {
    isHost = true;
    if(hostSettingsBtn) hostSettingsBtn.classList.remove('hidden'); 
    
    const newRoomId = Math.random().toString(36).substring(2, 8);
    sessionStorage.setItem('hostRoomId', newRoomId);
    window.history.pushState({}, '', `?room=${newRoomId}`);
    
    socket.emit('createRoom', { roomId: newRoomId }); 
    showScreen('waiting');
});

// 👤 الضيف ينضم
if(joinRoomBtn) joinRoomBtn.addEventListener('click', () => {
    const enteredName = playerNameInput.value.trim();
    if(!enteredName) { alert("اكتب اسمك الأول يا بطل!"); return; }

    isHost = false;
    sessionStorage.setItem('guestName', enteredName);
    socket.emit('joinRoom', { roomId: roomFromUrl, name: enteredName });
    showScreen('waiting');
    leaveRoomBtn.classList.remove('hidden');
});

// 🚪 مغادرة الضيف إرادياً
if(leaveRoomBtn) leaveRoomBtn.addEventListener('click', () => {
    if(confirm('هل أنت متأكد من مغادرة الغرفة؟')) {
        socket.emit('leaveRoom');
        sessionStorage.clear();
        window.location.href = '/';
    }
});

socket.on('errorMsg', (msg) => {
    alert(msg);
    window.location.href = '/'; 
});

socket.on('hostDisconnected', () => {
    if(hostLeftModal) hostLeftModal.classList.remove('hidden');
    sessionStorage.clear();
});

// 🚫 طرد الضيف (رسالة ثابتة)
socket.on('youAreKickedPermanently', () => {
    if(kickedModal) kickedModal.classList.remove('hidden');
});

socket.on('updatePlayers', (playersArray) => {
    if (!playersArray) return;
    if (playerCountSpan) playerCountSpan.innerText = playersArray.length;

    if (playersListDiv) {
        let playersHTML = '';
        playersArray.forEach(player => {
            const isMe = player.id === socket.id;
            const crown = player.isHost ? '<span class="player-crown">👑</span>' : '';
            const hostClass = player.isHost ? 'host' : '';
            const meText = isMe ? ' <span style="color:#64748b; font-size:0.9rem;">(أنت)</span>' : '';

            playersHTML += `
                <div class="player-slot ${hostClass}">
                    <div class="player-name-wrapper">
                        <span class="player-name-text">${player.name}</span>
                        ${crown} ${meText}
                    </div>
                    <span class="status-dot online"></span>
                </div>`;
        });
        playersListDiv.innerHTML = playersHTML;
    }

    if (isHost && actualStartBtn && startGameBtn) {
        if (playersArray.length >= 3) { // يفضل 3 لاعبين للعبة الجاسوس
            startGameBtn.classList.add('hidden');
            actualStartBtn.classList.remove('hidden');
        } else {
            startGameBtn.classList.remove('hidden');
            actualStartBtn.classList.add('hidden');
        }
    }

    if (isHost && modalPlayersList) {
        let modalHTML = '';
        playersArray.forEach(player => {
            const actionButtons = player.isHost ? `<span style="color:#64748b;">أنت الهوست</span>` : `
                <button class="btn-action edit" onclick="editPlayerName('${player.id}')">✏️</button>
                <button class="btn-action kick" onclick="kickPlayer('${player.id}')">❌</button>`;

            modalHTML += `
                <div class="modal-player-item">
                    <span class="player-name-text">${player.name}</span>
                    <div class="modal-player-actions">${actionButtons}</div>
                </div>`;
        });
        modalPlayersList.innerHTML = modalHTML;
    }
});

// 🎮 بدء اللعبة -> اختيار المود (للهوست) أو انتظار (للضيوف)
if(actualStartBtn) actualStartBtn.addEventListener('click', () => {
    socket.emit('goToModeSelection');
});

socket.on('showModeSelection', () => {
    if(isHost) {
        showScreen('modeSelection');
    } else {
        // الضيوف يفضلوا في شاشة الانتظار مع رسالة
        showScreen('waiting');
        if(actualStartBtn) actualStartBtn.classList.add('hidden');
        if(startGameBtn) {
            startGameBtn.classList.remove('hidden');
            startGameBtn.innerText = "الهوست يختار تصنيف اللعبة... ⏳";
        }
    }
});

// 🎲 الهوست يختار عشوائي
if(selectRandomModeBtn) selectRandomModeBtn.addEventListener('click', () => {
    socket.emit('startRandomMode');
});

// 🎭 استقبال الدور (جاسوس أم لاعب عادي)
socket.on('assignRole', (data) => {
    const roleIcon = document.getElementById('roleIcon');
    const roleTitle = document.getElementById('roleTitle');
    const roleCategory = document.getElementById('roleCategory');

    if(data.isSpy) {
        roleIcon.innerText = "🕵️‍♂️";
        roleTitle.innerText = "أنت الجاسوس!";
        roleTitle.style.color = "var(--neon-red)";
    } else {
        roleIcon.innerText = "🎯";
        roleTitle.innerText = data.word;
        roleTitle.style.color = "var(--neon-blue)";
    }
    
    roleCategory.innerText = `التصنيف: ${data.category}`;
});

socket.on('gameStarted', () => {
    showScreen('game');
    if (isHost && restartGameBtn) restartGameBtn.disabled = false;
    if (isHost && startVotingBtn) startVotingBtn.classList.remove('hidden');
});

socket.on('gameRestarted', () => {
    showScreen('waiting');
    if (isHost && restartGameBtn && hostSettingsModal) {
        restartGameBtn.disabled = true;
        hostSettingsModal.classList.add('hidden');
        startVotingBtn.classList.add('hidden');
    }
});

window.editPlayerName = function(targetId) {
    const newName = prompt('أدخل الاسم الجديد:');
    if (newName && newName.trim() !== '') {
        socket.emit('changePlayerName', { targetId: targetId, newName: newName.trim() });
    }
};

window.kickPlayer = function(targetId) {
    if (confirm('طرد نهائي لهذا اللاعب؟')) {
        socket.emit('kickPlayer', targetId);
    }
};

function showScreen(screenName) {
    Object.values(screens).forEach(s => {
        if(s) { s.classList.remove('active'); s.classList.add('hidden'); }
    });
    if(screens[screenName]) {
        screens[screenName].classList.remove('hidden');
        screens[screenName].classList.add('active');
    }
}

// 🖱️ التحكم في العرض (موبايل/كمبيوتر)
const setupView = (btn, isPc) => {
    if(btn) btn.addEventListener('click', () => {
        isPcMode = isPc;
        document.body.className = isPc ? 'pc-mode' : 'mobile-mode';
        [customCursor, follow1, follow2].forEach(el => {
            if(el) isPc ? el.classList.remove('hidden') : el.classList.add('hidden');
        });
        isPc ? mainContainer.classList.add('container-pc') : mainContainer.classList.remove('container-pc');
        btn.classList.add('active-view');
        const otherBtn = isPc ? mobileViewBtn : pcViewBtn;
        if(otherBtn) otherBtn.classList.remove('active-view');
    });
};
setupView(pcViewBtn, true);
setupView(mobileViewBtn, false);

if(hostSettingsBtn) hostSettingsBtn.addEventListener('click', () => hostSettingsModal.classList.remove('hidden'));
if(closeModalBtn) closeModalBtn.addEventListener('click', () => hostSettingsModal.classList.add('hidden'));

if(restartGameBtn) restartGameBtn.addEventListener('click', () => {
    if(confirm('إعادة اللعب وإرجاع الجميع لغرفة الانتظار؟')) socket.emit('restartGame');
});

if(copyInviteBtn) copyInviteBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
        if(notificationToast) {
            notificationToast.classList.remove('hidden');
            setTimeout(() => notificationToast.classList.add('hidden'), 2500);
        }
    });
});

document.addEventListener('mousemove', (e) => {
    if (!isPcMode) return;
    const x = e.clientX + 'px', y = e.clientY + 'px';
    if(customCursor) { customCursor.style.left = x; customCursor.style.top = y; }
    if(follow1) { follow1.style.left = x; follow1.style.top = y; }
    if(follow2) { follow2.style.left = x; follow2.style.top = y; }
});
document.addEventListener('mouseover', (e) => { if (isPcMode && e.target.closest('button') && customCursor) customCursor.classList.add('hovering'); });
document.addEventListener('mouseout', (e) => { if (isPcMode && e.target.closest('button') && customCursor) customCursor.classList.remove('hovering'); });