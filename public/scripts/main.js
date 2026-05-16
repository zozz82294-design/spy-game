const socket = io();

const screens = {
    welcome: document.getElementById('welcomeScreen'),
    waiting: document.getElementById('waitingScreen'),
    modeSelection: document.getElementById('modeSelectionScreen'),
    game: document.getElementById('gameScreen')
};

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

const hostSettingsModal = document.getElementById('hostSettingsModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalPlayersList = document.getElementById('modalPlayersList');
const restartGameBtn = document.getElementById('restartGameBtn');
const hostLeftModal = document.getElementById('hostLeftModal');
const kickedModal = document.getElementById('kickedModal');
const leftRoomModal = document.getElementById('leftRoomModal'); 
const invalidRoomModal = document.getElementById('invalidRoomModal'); 
const errorMsgText = document.getElementById('errorMsgText');

const selectRandomModeBtn = document.getElementById('selectRandomModeBtn');
const revokeRandomModeBtn = document.getElementById('revokeRandomModeBtn');
const confirmStartGameBtn = document.getElementById('confirmStartGameBtn');
const selectedBadge = document.getElementById('selectedBadge');
const randomModeCard = document.getElementById('randomModeCard');
const hostModeControls = document.getElementById('hostModeControls');
const startVotingBtn = document.getElementById('startVotingBtn');

const customCursor = document.getElementById('customCursor');
const follow1 = document.getElementById('cursorFollow1');
const follow2 = document.getElementById('cursorFollow2');

let isPcMode = false;
let isHost = false; 

// ==========================================
// 🚀 نظام الماوس السلس جداً
// ==========================================
let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
let f1X = mouseX, f1Y = mouseY, f2X = mouseX, f2Y = mouseY;
let activeMagneticButton = null; // متغير لحفظ الزرار اللي الماوس واقف عليه

function animateCursor() {
    if (isPcMode) {
        f1X += (mouseX - f1X) * 0.2;
        f1Y += (mouseY - f1Y) * 0.2;
        f2X += (mouseX - f2X) * 0.1;
        f2Y += (mouseY - f2Y) * 0.1;
        
        if(customCursor) customCursor.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
        if(follow1) follow1.style.transform = `translate(${f1X}px, ${f1Y}px)`;
        if(follow2) follow2.style.transform = `translate(${f2X}px, ${f2Y}px)`;
    }
    requestAnimationFrame(animateCursor);
}
requestAnimationFrame(animateCursor);

// ==========================================
// 🧲 تأثير المغناطيس الاحترافي للأزرار
// ==========================================
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    if (!isPcMode) {
        if (activeMagneticButton) {
            activeMagneticButton.style.transform = '';
            activeMagneticButton = null;
        }
        return;
    }

    const targetBtn = e.target.closest('button');
    
    // لو الماوس خرج من الزرار اللي كان عليه
    if (activeMagneticButton && activeMagneticButton !== targetBtn) {
        // إرجاع الزرار مكانه بتأثير "سوستة" مرن
        activeMagneticButton.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        activeMagneticButton.style.transform = '';
        activeMagneticButton = null;
    }

    // لو الماوس دخل على زرار
    if (targetBtn) {
        activeMagneticButton = targetBtn;
        const rect = targetBtn.getBoundingClientRect();
        
        // حساب المسافة بين الماوس ومركز الزرار
        const x = mouseX - rect.left - rect.width / 2;
        const y = mouseY - rect.top - rect.height / 2;
        
        // تحريك الزرار بنسبة بسيطة ناحية الماوس
        targetBtn.style.transition = 'transform 0.1s ease-out';
        targetBtn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px) scale(1.05)`;
    }
});

document.addEventListener('mouseover', (e) => { 
    if (isPcMode && e.target.closest('button') && customCursor) customCursor.classList.add('hovering'); 
});

document.addEventListener('mouseout', (e) => { 
    if (isPcMode) {
        const targetBtn = e.target.closest('button');
        // التأكد إن الماوس خرج بره الزرار تماماً مش جواه
        if (targetBtn && (!e.relatedTarget || !targetBtn.contains(e.relatedTarget))) {
            if (customCursor) customCursor.classList.remove('hovering');
            targetBtn.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            targetBtn.style.transform = '';
            if (activeMagneticButton === targetBtn) activeMagneticButton = null;
        }
    } 
});
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
} else {
    sessionStorage.clear();
}

if(goToWaitingBtn) goToWaitingBtn.addEventListener('click', () => {
    isHost = true;
    if(hostSettingsBtn) hostSettingsBtn.classList.remove('hidden'); 
    
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

socket.on('hostDisconnected', () => {
    if(hostLeftModal) hostLeftModal.classList.remove('hidden');
    if(leaveRoomBtn) leaveRoomBtn.classList.add('hidden');
    sessionStorage.clear();
});

socket.on('youAreKickedPermanently', () => {
    if(kickedModal) kickedModal.classList.remove('hidden');
    if(leaveRoomBtn) leaveRoomBtn.classList.add('hidden');
    sessionStorage.clear();
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
        if (playersArray.length >= 3) { 
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

if(actualStartBtn) actualStartBtn.addEventListener('click', () => {
    socket.emit('goToModeSelection');
});

socket.on('showModeSelection', () => {
    showScreen('modeSelection');
    if(isHost) {
        hostModeControls.classList.remove('hidden');
    } else {
        hostModeControls.classList.add('hidden');
        confirmStartGameBtn.classList.add('hidden');
    }
});

if(selectRandomModeBtn) selectRandomModeBtn.addEventListener('click', () => socket.emit('selectMode', 'random'));
if(revokeRandomModeBtn) revokeRandomModeBtn.addEventListener('click', () => socket.emit('deselectMode', 'random'));

socket.on('modeSelected', (mode) => {
    if(mode === 'random') {
        selectedBadge.classList.remove('hidden');
        randomModeCard.style.borderColor = 'var(--neon-green)';
        randomModeCard.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.2)';
        
        if(isHost) {
            selectRandomModeBtn.classList.add('hidden');
            revokeRandomModeBtn.classList.remove('hidden');
            confirmStartGameBtn.classList.remove('hidden');
        }
    }
});

socket.on('modeDeselected', (mode) => {
    if(mode === 'random') {
        selectedBadge.classList.add('hidden');
        randomModeCard.style.borderColor = 'rgba(0, 243, 255, 0.3)';
        randomModeCard.style.boxShadow = 'none';
        
        if(isHost) {
            selectRandomModeBtn.classList.remove('hidden');
            revokeRandomModeBtn.classList.add('hidden');
            confirmStartGameBtn.classList.add('hidden');
        }
    }
});

if(confirmStartGameBtn) confirmStartGameBtn.addEventListener('click', () => {
    socket.emit('startRandomMode');
});

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
    
    selectedBadge.classList.add('hidden');
    randomModeCard.style.borderColor = 'rgba(0, 243, 255, 0.3)';
    randomModeCard.style.boxShadow = 'none';
    selectRandomModeBtn.classList.remove('hidden');
    revokeRandomModeBtn.classList.add('hidden');
    confirmStartGameBtn.classList.add('hidden');

    if (isHost && restartGameBtn && hostSettingsModal) {
        restartGameBtn.disabled = true;
        hostSettingsModal.classList.add('hidden');
        if(startVotingBtn) startVotingBtn.classList.add('hidden');
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

if(pcViewBtn) {
    pcViewBtn.addEventListener('click', () => {
        isPcMode = true;
        document.body.className = 'pc-mode'; 
        
        if(customCursor) customCursor.classList.remove('hidden');
        if(follow1) follow1.classList.remove('hidden');
        if(follow2) follow2.classList.remove('hidden');
        if(mainContainer) mainContainer.classList.add('container-pc');
        
        pcViewBtn.classList.add('active-view');
        if(mobileViewBtn) mobileViewBtn.classList.remove('active-view');
    });
}

if(mobileViewBtn) {
    mobileViewBtn.addEventListener('click', () => {
        isPcMode = false;
        document.body.className = 'mobile-mode'; 
        if(customCursor) customCursor.classList.add('hidden');
        if(follow1) follow1.classList.add('hidden');
        if(follow2) follow2.classList.add('hidden');
        if(mainContainer) mainContainer.classList.remove('container-pc');
        
        mobileViewBtn.classList.add('active-view');
        if(pcViewBtn) pcViewBtn.classList.remove('active-view');
    });
}

if(hostSettingsBtn) hostSettingsBtn.addEventListener('click', () => {
    if(hostSettingsModal) hostSettingsModal.classList.remove('hidden');
});

if(closeModalBtn) closeModalBtn.addEventListener('click', () => {
    if(hostSettingsModal) hostSettingsModal.classList.add('hidden');
});

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