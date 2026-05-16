const socket = io();

const screens = {
    welcome: document.getElementById('welcomeScreen'),
    waiting: document.getElementById('waitingScreen'),
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
const hostSettingsModal = document.getElementById('hostSettingsModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalPlayersList = document.getElementById('modalPlayersList');
const restartGameBtn = document.getElementById('restartGameBtn');

const customCursor = document.getElementById('customCursor');
const follow1 = document.getElementById('cursorFollow1');
const follow2 = document.getElementById('cursorFollow2');

let isPcMode = false;
let isHost = false; 

const urlParams = new URLSearchParams(window.location.search);
const roomFromUrl = urlParams.get('room');

// ==========================================
// 🚀 حل مشكلة الريفريش للهوست
// ==========================================
const wasHostOfRoom = sessionStorage.getItem('hostRoomId');

if (roomFromUrl && wasHostOfRoom === roomFromUrl) {
    // لو أنت الهوست وعملت ريفريش، نمسح اللينك ونرجعك للرئيسية فوراً
    sessionStorage.removeItem('hostRoomId');
    window.location.href = '/';
}

if (roomFromUrl && wasHostOfRoom !== roomFromUrl) {
    // لو ضيف داخل على اللينك
    if(goToWaitingBtn) goToWaitingBtn.classList.add('hidden'); 
    if(playerNameInput) playerNameInput.classList.remove('hidden'); 
    if(joinRoomBtn) joinRoomBtn.classList.remove('hidden'); 
}

// إنشاء الغرفة (الهوست)
if(goToWaitingBtn) goToWaitingBtn.addEventListener('click', () => {
    isHost = true;
    if(hostSettingsBtn) hostSettingsBtn.classList.remove('hidden'); 
    
    const newRoomId = Math.random().toString(36).substring(2, 8);
    
    // تسجيل إن المتصفح ده هو الهوست عشان لو عمل ريفريش
    sessionStorage.setItem('hostRoomId', newRoomId);
    
    window.history.pushState({}, '', `?room=${newRoomId}`);
    
    socket.emit('createRoom', { roomId: newRoomId }); 
    showScreen('waiting');
});

// انضمام للغرفة (الضيف)
if(joinRoomBtn) joinRoomBtn.addEventListener('click', () => {
    const enteredName = playerNameInput.value.trim();
    
    if(!enteredName) {
        alert("اكتب اسمك الأول يا بطل عشان تدخل الغرفة!");
        return;
    }

    isHost = false;
    socket.emit('joinRoom', { roomId: roomFromUrl, name: enteredName });
    showScreen('waiting');
});

socket.on('errorMsg', (msg) => {
    alert(msg);
    window.location.href = '/'; 
});

// تحديث اللاعبين
socket.on('updatePlayers', (playersArray) => {
    if (!playersArray) return;

    if (playerCountSpan) {
        playerCountSpan.innerText = playersArray.length;
    }

    if (playersListDiv) {
        let playersHTML = '';
        playersArray.forEach(player => {
            const isMe = player.id === socket.id;
            const nameDisplay = player.name; 
            const crown = player.isHost ? '<span class="player-crown">👑</span>' : '';
            const hostClass = player.isHost ? 'host' : '';
            const meText = isMe ? ' <span style="color:#64748b; font-size:0.9rem;">(أنت)</span>' : '';

            playersHTML += `
                <div class="player-slot ${hostClass}">
                    <div class="player-name-wrapper">
                        <span class="player-name-text">${nameDisplay}</span>
                        ${crown}
                        ${meText}
                    </div>
                    <span class="status-dot online"></span>
                </div>
            `;
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
            const nameDisplay = player.name;
            const actionButtons = player.isHost ? `<span style="color:#64748b; font-size:0.9rem;">أنت الهوست</span>` : `
                <button class="btn-action edit" onclick="editPlayerName('${player.id}')" title="تغيير الاسم">✏️</button>
                <button class="btn-action kick" onclick="kickPlayer('${player.id}')" title="طرد اللاعب">❌</button>
            `;

            modalHTML += `
                <div class="modal-player-item">
                    <span class="player-name-text" style="font-size:1rem;">${nameDisplay}</span>
                    <div class="modal-player-actions">
                        ${actionButtons}
                    </div>
                </div>
            `;
        });
        modalPlayersList.innerHTML = modalHTML;
    }
});

socket.on('youAreKicked', () => {
    alert('تم طردك من الغرفة بواسطة الهوست! ❌');
    window.location.href = '/'; 
});

socket.on('gameStarted', () => {
    showScreen('game');
    if (isHost && restartGameBtn) {
        restartGameBtn.disabled = false;
    }
});

socket.on('gameRestarted', () => {
    showScreen('waiting');
    if (isHost && restartGameBtn && hostSettingsModal) {
        restartGameBtn.disabled = true;
        hostSettingsModal.classList.add('hidden');
    }
});

window.editPlayerName = function(targetId) {
    const newName = prompt('أدخل الاسم الجديد للاعب:');
    if (newName && newName.trim() !== '') {
        socket.emit('changePlayerName', { targetId: targetId, newName: newName.trim() });
    }
};

window.kickPlayer = function(targetId) {
    if (confirm('هل أنت متأكد من طرد هذا اللاعب؟')) {
        socket.emit('kickPlayer', targetId);
    }
};

function showScreen(screenName) {
    Object.values(screens).forEach(s => {
        if(s) {
            s.classList.remove('active');
            s.classList.add('hidden');
        }
    });
    if(screens[screenName]) {
        screens[screenName].classList.remove('hidden');
        screens[screenName].classList.add('active');
    }
}

if(pcViewBtn) pcViewBtn.addEventListener('click', () => {
    isPcMode = true;
    document.body.className = 'pc-mode'; 
    if(customCursor) customCursor.classList.remove('hidden');
    if(follow1) follow1.classList.remove('hidden');
    if(follow2) follow2.classList.remove('hidden');
    if(mainContainer) mainContainer.classList.add('container-pc');
    pcViewBtn.classList.add('active-view');
    if(mobileViewBtn) mobileViewBtn.classList.remove('active-view');
});

if(mobileViewBtn) mobileViewBtn.addEventListener('click', () => {
    isPcMode = false;
    document.body.className = 'mobile-mode'; 
    if(customCursor) customCursor.classList.add('hidden');
    if(follow1) follow1.classList.add('hidden');
    if(follow2) follow2.classList.add('hidden');
    if(mainContainer) mainContainer.classList.remove('container-pc');
    mobileViewBtn.classList.add('active-view');
    if(pcViewBtn) pcViewBtn.classList.remove('active-view');
});

if(hostSettingsBtn) hostSettingsBtn.addEventListener('click', () => {
    if(hostSettingsModal) hostSettingsModal.classList.remove('hidden');
});
if(closeModalBtn) closeModalBtn.addEventListener('click', () => {
    if(hostSettingsModal) hostSettingsModal.classList.add('hidden');
});

if(actualStartBtn) actualStartBtn.addEventListener('click', () => {
    socket.emit('startGame');
});

if(restartGameBtn) restartGameBtn.addEventListener('click', () => {
    if(confirm('هل أنت متأكد من إعادة اللعب وإرجاع الجميع لغرفة الانتظار؟')) {
        socket.emit('restartGame');
    }
});

if(copyInviteBtn) copyInviteBtn.addEventListener('click', () => {
    const inviteUrl = window.location.href;
    navigator.clipboard.writeText(inviteUrl).then(() => {
        if(notificationToast) {
            notificationToast.classList.remove('hidden');
            setTimeout(() => { notificationToast.classList.add('hidden'); }, 2500);
        }
    }).catch(err => { console.error('فشل نسخ الرابط: ', err); });
});

document.addEventListener('mousemove', (e) => {
    if (!isPcMode) return;
    const x = e.clientX + 'px';
    const y = e.clientY + 'px';
    if(customCursor) { customCursor.style.left = x; customCursor.style.top = y; }
    if(follow1) { follow1.style.left = x; follow1.style.top = y; }
    if(follow2) { follow2.style.left = x; follow2.style.top = y; }
});

document.addEventListener('mouseover', (e) => {
    if (!isPcMode) return;
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        if(customCursor) customCursor.classList.add('hovering');
    }
});

document.addEventListener('mouseout', (e) => {
    if (!isPcMode) return;
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        if(customCursor) customCursor.classList.remove('hovering');
    }
});