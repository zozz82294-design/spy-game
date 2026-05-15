// === Main App Logic ===
var currentScreen = 'hostHomeScreen';
var displayMode = 'computer';
var joinDisplayMode = 'computer';
var isHost = false;
var roomId = null;
var playerName = '';
var selectedMode = null;
var selectedGuessWord = null;
var isSpy = false;
var currentWord = '';
var hasVoted = false;
var homeDisplaySelected = false;
var currentPlayersList = [];
var processedVoteIds = new Set();
var votingMyId = '';
var votingMyName = '';

function toBold(text) {
    var boldMap = {'A':'\u{1D400}','B':'\u{1D401}','C':'\u{1D402}','D':'\u{1D403}','E':'\u{1D404}','F':'\u{1D405}','G':'\u{1D406}','H':'\u{1D407}','I':'\u{1D408}','J':'\u{1D409}','K':'\u{1D40A}','L':'\u{1D40B}','M':'\u{1D40C}','N':'\u{1D40D}','O':'\u{1D40E}','P':'\u{1D40F}','Q':'\u{1D410}','R':'\u{1D411}','S':'\u{1D412}','T':'\u{1D413}','U':'\u{1D414}','V':'\u{1D415}','W':'\u{1D416}','X':'\u{1D417}','Y':'\u{1D418}','Z':'\u{1D419}','a':'\u{1D41A}','b':'\u{1D41B}','c':'\u{1D41C}','d':'\u{1D41D}','e':'\u{1D41E}','f':'\u{1D41F}','g':'\u{1D420}','h':'\u{1D421}','i':'\u{1D422}','j':'\u{1D423}','k':'\u{1D424}','l':'\u{1D425}','m':'\u{1D426}','n':'\u{1D427}','o':'\u{1D428}','p':'\u{1D429}','q':'\u{1D42A}','r':'\u{1D42B}','s':'\u{1D42C}','t':'\u{1D42D}','u':'\u{1D42E}','v':'\u{1D42F}','w':'\u{1D430}','x':'\u{1D431}','y':'\u{1D432}','z':'\u{1D433}'};
    return text.split('').map(function(c) { return boldMap[c] || c; }).join('');
}

function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3000);
}

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    var screen = document.getElementById(screenId);
    if (screen) { screen.classList.add('active'); currentScreen = screenId; }
}

// === Navigation ===
function backToHome() {
    initAudio(); playSound('click');
    switchScreen('hostHomeScreen');
}

function goCreateRoom() {
    initAudio(); playSound('click');
    switchScreen('createRoomScreen');
}

function goJoinRoom() {
    initAudio(); playSound('click');
    switchScreen('joinScreen');
}

// === Display Mode Selection ===
function selectHomeDisplayMode(mode) {
    initAudio(); playSound('click');
    displayMode = mode;
    homeDisplaySelected = true;
    var mobileBtn = document.getElementById('homeMobileBtn');
    var computerBtn = document.getElementById('homeComputerBtn');
    var goBtn = document.getElementById('goCreateRoomBtn2');
    if (mode === 'mobile') {
        mobileBtn.style.opacity = '1';
        mobileBtn.style.boxShadow = '0 0 20px rgba(0,212,255,0.5), inset 0 0 20px rgba(0,212,255,0.1)';
        mobileBtn.style.borderColor = 'var(--neon-cyan)';
        computerBtn.style.opacity = '0.4';
        computerBtn.style.boxShadow = 'none';
        computerBtn.style.borderColor = 'transparent';
    } else {
        computerBtn.style.opacity = '1';
        computerBtn.style.boxShadow = '0 0 20px rgba(108,92,231,0.5), inset 0 0 20px rgba(108,92,231,0.1)';
        computerBtn.style.borderColor = 'var(--neon-purple)';
        mobileBtn.style.opacity = '0.4';
        mobileBtn.style.boxShadow = 'none';
        mobileBtn.style.borderColor = 'transparent';
    }
    goBtn.style.opacity = '1';
    goBtn.style.pointerEvents = 'auto';
    goBtn.style.boxShadow = '0 0 25px rgba(0,255,136,0.4)';
    setCustomCursor(mode === 'computer');
}

function selectDisplayMode(mode) {
    initAudio(); playSound('click'); displayMode = mode;
    setCustomCursor(mode === 'computer');
    switchScreen('createRoomScreen');
}

function setJoinDisplayMode(mode) {
    initAudio(); playSound('click'); joinDisplayMode = mode;
    var mobileBtn = document.getElementById('joinMobileBtn');
    var computerBtn = document.getElementById('joinComputerBtn');
    var joinBtn = document.getElementById('joinRoomBtn');
    if (mode === 'mobile') {
        mobileBtn.style.opacity = '1';
        mobileBtn.style.boxShadow = '0 0 20px rgba(0,212,255,0.5), inset 0 0 20px rgba(0,212,255,0.1)';
        mobileBtn.style.borderColor = 'var(--neon-cyan)';
        computerBtn.style.opacity = '0.4';
        computerBtn.style.boxShadow = 'none';
        computerBtn.style.borderColor = 'transparent';
    } else {
        computerBtn.style.opacity = '1';
        computerBtn.style.boxShadow = '0 0 20px rgba(0,212,255,0.5), inset 0 0 20px rgba(0,212,255,0.1)';
        computerBtn.style.borderColor = 'var(--neon-cyan)';
        mobileBtn.style.opacity = '0.4';
        mobileBtn.style.boxShadow = 'none';
        mobileBtn.style.borderColor = 'transparent';
    }
    joinBtn.style.opacity = '1';
    joinBtn.style.pointerEvents = 'auto';
    setCustomCursor(mode === 'computer');
}

// === Room Creation ===
function createRoom() {
    var name = document.getElementById('hostNameInput').value.trim();
    if (!name) { showToast('\u0627\u0644\u0631\u062c\u0627\u0621 \u0625\u062f\u062e\u0627\u0644 \u0627\u0633\u0645\u0643', 'error'); return; }
    initAudio(); playSound('start'); isHost = true; playerName = name;
    if (socket && socketReady) {
        safeEmit('create-room', { hostName: name, displayMode: displayMode });
    } else {
        showToast('\u063a\u064a\u0631 \u0645\u062a\u0635\u0644 \u0628\u0627\u0644\u0633\u064a\u0631\u0641\u0631', 'error');
    }
}

safeOn('room-created', function(data) {
    roomId = data.roomId; myRoomId = data.roomId; myPlayerName = data.hostName; amIHost = true;
    document.getElementById('hostDisplayName').textContent = '\uD83D\uDC51 ' + toBold(data.hostName);
    updateRoomLink(); switchScreen('hostRoomScreen'); showHostSettingsFab();
});

function updateRoomLink() {
    if (!roomId) return;
    var baseUrl = window.location.origin;
    var fullLink = baseUrl + '/room/' + roomId;
    var linkEl = document.getElementById('roomLink');
    if (linkEl) { linkEl.textContent = fullLink; linkEl.href = fullLink; }
}

function copyRoomLink() {
    initAudio(); playSound('click');
    var link = document.getElementById('roomLink').textContent;
    navigator.clipboard.writeText(link).then(function() { showToast('\u062a\u0645 \u0646\u0633\u062e \u0627\u0644\u0631\u0627\u0628\u0637!', 'success'); }).catch(function() { showToast('\u0641\u0634\u0644 \u0646\u0633\u062e \u0627\u0644\u0631\u0627\u0628\u0637', 'error'); });
}

function updateHostPlayerList(players) {
    var html = '';
    players.forEach(function(p) {
        var boldName = toBold(p.name);
        if (p.isHost) {
            html += '<div class="player-item"><div style="display:flex;align-items:center;gap:10px;"><span style="font-weight:900;color:var(--neon-cyan);">\uD83D\uDC51 ' + boldName + '</span></div><span style="color:var(--text-muted);font-size:0.8rem;">\u0627\u0644\u0645\u0633\u062a\u0636\u064a\u0641</span></div>';
        } else {
            html += '<div class="player-item"><div style="display:flex;align-items:center;gap:10px;"><span style="font-weight:900;">' + boldName + '</span></div><div style="display:flex;gap:5px;"><button class="btn btn-danger btn-sm" onclick="kickPlayer(\'' + p.id + '\')">\u0637\u0631\u062f</button><button class="btn btn-primary btn-sm" onclick="promptChangeName(\'' + p.id + '\',\'' + p.name + '\')">\u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0627\u0633\u0645</button></div></div>';
        }
    });
    document.getElementById('hostPlayerList').innerHTML = html;
    var count = players.length;
    document.getElementById('playerCount').textContent = count;
    var btn = document.getElementById('startGameBtn');
    var hint = document.getElementById('startGameHint');
    if (count >= 3) { btn.disabled = false; btn.style.animation = 'glow 2s ease-in-out infinite'; hint.style.display = 'none'; }
    else { btn.disabled = true; btn.style.animation = 'none'; hint.style.display = 'block'; hint.textContent = '\u064a\u062d\u062a\u0627\u062c ' + (3 - count) + ' \u0644\u0627\u0639\u0628\u064a\u0646 \u0622\u062e\u0631\u064a\u0646'; }
}

function kickPlayer(playerId) { initAudio(); playSound('click'); if (socket) safeEmit('kick-player', { playerId: playerId }); }
function promptChangeName(playerId, currentName) { var newName = prompt('\u0623\u062f\u062e\u0644 \u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u062c\u062f\u064a\u062f \u0644\u0640 ' + currentName + ':', currentName); if (newName && newName.trim()) { if (socket) safeEmit('change-player-name', { playerId: playerId, newName: newName.trim() }); } }

safeOn('player-joined', function(data) { initAudio(); playSound('join'); showToast(data.name + ' \u0627\u0646\u0636\u0645 \u0644\u0644\u063a\u0631\u0641\u0629!', 'success'); });
safeOn('player-left', function(data) { playSound('leave'); showToast(data.name + ' \u063a\u0627\u062f\u0631 \u0627\u0644\u063a\u0631\u0641\u0629', 'info'); });
safeOn('room-update', function(data) {
    if (isHost) {
        updateHostPlayerList(data.players);
        if (document.getElementById('settingsOverlay').classList.contains('visible')) { renderGlobalSettingsPlayerList(data.players); }
    } else { updatePlayerPlayerList(data.players); }
});
safeOn('kicked', function(data) { playSound('leave'); showToast(data.message, 'error'); hideHostSettingsFab(); closeHostSettings(); switchScreen('leftScreen'); });
safeOn('name-changed', function(data) { playerName = data.newName; showToast('\u062a\u0645 \u062a\u063a\u064a\u064a\u0631 \u0627\u0633\u0645\u0643 \u0625\u0644\u0649: ' + data.newName, 'info'); });

// === Join Room ===
function joinRoom() {
    var name = document.getElementById('joinNameInput').value.trim();
    if (!name) { showToast('\u0627\u0644\u0631\u062c\u0627\u0621 \u0625\u062f\u062e\u0627\u0644 \u0627\u0633\u0645\u0643', 'error'); return; }
    initAudio(); playSound('click'); isHost = false; playerName = name;
    var pathParts = window.location.pathname.split('/');
    var joinRoomId = pathParts[pathParts.length - 1];
    if (socket && socketReady) { safeEmit('join-room', { roomId: joinRoomId, playerName: name, displayMode: joinDisplayMode }); }
    else { showToast('\u063a\u064a\u0631 \u0645\u062a\u0635\u0644 \u0628\u0627\u0644\u0633\u064a\u0631\u0641\u0631', 'error'); }
}
safeOn('join-success', function(data) { roomId = data.roomId; myRoomId = data.roomId; myPlayerName = data.playerName; amIHost = false; playSound('join'); switchScreen('playerRoomScreen'); });
safeOn('join-error', function(data) { showToast(data.message, 'error'); if (data.message === '\u0627\u0646\u062a\u0647\u062a \u0635\u0644\u0627\u062d\u064a\u0629 \u0627\u0644\u0631\u0627\u0628\u0637') { switchScreen('expiredLinkScreen'); } });

function updatePlayerPlayerList(players) {
    var html = '';
    players.forEach(function(p) {
        var boldName = toBold(p.name);
        html += '<div class="player-item">';
        if (p.isHost) { html += '<span style="font-weight:900;color:var(--neon-cyan);">\uD83D\uDC51 ' + boldName + '</span>'; }
        else if (p.name === playerName) { html += '<span style="font-weight:900;color:var(--neon-purple);">' + boldName + ' (\u0623\u0646\u062a)</span>'; }
        else { html += '<span style="font-weight:900;">' + boldName + '</span>'; }
        html += '</div>';
    });
    document.getElementById('playerPlayerList').innerHTML = html;
}

function leaveRoom() { initAudio(); playSound('leave'); hideHostSettingsFab(); closeHostSettings(); if (socket) safeEmit('leave-room'); switchScreen('leftScreen'); }

// === Game Logic ===
function startGame() { initAudio(); playSound('start'); if (socket) safeEmit('start-game'); switchScreen('modeSelectScreen'); }

function selectMode(mode) {
    initAudio(); playSound('click'); selectedMode = mode;
    if (!isHost) return;
    if (socket) safeEmit('select-mode');
    document.getElementById('randomModeCard').style.borderColor = 'var(--neon-cyan)';
    document.getElementById('randomModeCard').style.boxShadow = 'var(--glow-secondary)';
    document.getElementById('confirmModeBtn').disabled = false;
    document.getElementById('cancelModeBtn').style.display = 'block';
}

function confirmMode() { initAudio(); playSound('start'); if (!isHost) return; if (socket) safeEmit('confirm-mode'); }

function cancelMode() {
    initAudio(); playSound('click'); selectedMode = null;
    document.getElementById('randomModeCard').style.borderColor = '';
    document.getElementById('randomModeCard').style.boxShadow = '';
    document.getElementById('confirmModeBtn').disabled = true;
    document.getElementById('cancelModeBtn').style.display = 'none';
    document.getElementById('hostSelectLabel').style.display = 'none';
    if (socket) safeEmit('cancel-mode');
}

// === Host Settings ===
function openHostSettings() { initAudio(); playSound('click'); document.getElementById('settingsOverlay').classList.add('visible'); updateGlobalSettingsPlayerList(); }
function closeHostSettingsOverlay(event) { if (event.target === document.getElementById('settingsOverlay')) { document.getElementById('settingsOverlay').classList.remove('visible'); } }
function closeHostSettings() { document.getElementById('settingsOverlay').classList.remove('visible'); }
function updateGlobalSettingsPlayerList() { if (socket) safeEmit('get-room-players'); }

function renderGlobalSettingsPlayerList(players) {
    currentPlayersList = players;
    var html = '';
    players.forEach(function(p) {
        if (p.isHost) {
            html += '<div class="settings-player-row"><div style="display:flex;align-items:center;gap:8px;"><span style="font-weight:900;color:var(--neon-cyan);">\uD83D\uDC51 ' + toBold(p.name) + '</span><span style="color:var(--text-muted);font-size:0.8rem;">(\u0627\u0644\u0645\u0633\u062a\u0636\u064a\u0641)</span></div></div>';
        } else {
            html += '<div class="settings-player-row"><div style="display:flex;align-items:center;gap:8px;"><span style="font-weight:900;">' + toBold(p.name) + '</span></div><div style="display:flex;gap:6px;"><button class="btn btn-danger btn-sm" onclick="kickPlayer(\'' + p.id + '\')">\u0637\u0631\u062f</button><button class="btn btn-primary btn-sm" onclick="promptChangeName(\'' + p.id + '\',\'' + p.name + '\')">\u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0627\u0633\u0645</button></div></div>';
        }
    });
    document.getElementById('globalSettingsPlayerList').innerHTML = html;
}

safeOn('room-players-list', function(data) { renderGlobalSettingsPlayerList(data.players); });

function showHostSettingsFab() { if (isHost) { document.getElementById('hostSettingsFab').classList.add('visible'); } }
function hideHostSettingsFab() { document.getElementById('hostSettingsFab').classList.remove('visible'); }

safeOn('game-started', function(data) {
    switchScreen('modeSelectScreen');
    document.getElementById('randomModeCard').style.borderColor = '';
    document.getElementById('randomModeCard').style.boxShadow = '';
    document.getElementById('confirmModeBtn').disabled = true;
    document.getElementById('hostSelectLabel').style.display = 'none';
    document.getElementById('playerModeWaiting').style.display = 'none';
    if (isHost) {
        document.getElementById('randomModeCard').style.cursor = 'pointer';
        document.getElementById('confirmModeBtn').style.display = '';
    } else {
        document.getElementById('randomModeCard').style.cursor = 'default';
        document.getElementById('randomModeCard').onclick = null;
        document.getElementById('confirmModeBtn').style.display = 'none';
        document.getElementById('playerModeWaiting').style.display = 'block';
    }
});

safeOn('mode-selected', function(data) {
    document.getElementById('hostSelectLabel').style.display = 'block';
    document.getElementById('hostSelectName').textContent = data.hostName;
    document.getElementById('randomModeCard').style.borderColor = 'var(--neon-cyan)';
    document.getElementById('randomModeCard').style.boxShadow = 'var(--glow-secondary)';
    document.getElementById('playerModeWaiting').style.display = 'none';
    playSound('click');
});

safeOn('mode-cancelled', function() {
    document.getElementById('hostSelectLabel').style.display = 'none';
    document.getElementById('randomModeCard').style.borderColor = '';
    document.getElementById('randomModeCard').style.boxShadow = '';
    document.getElementById('playerModeWaiting').style.display = 'block';
    playSound('click');
});

safeOn('mode-confirmed', function() { playSound('start'); });

safeOn('show-word', function(data) {
    isSpy = data.isSpy; currentWord = data.word;
    switchScreen('wordScreen');
    document.getElementById('wordCategory').textContent = '\u0627\u0644\u062a\u0635\u0646\u064a\u0641: ' + data.category;
    if (data.isSpy) { document.getElementById('wordIcon').textContent = '\uD83D\uDD75\uFE0F'; document.getElementById('wordDisplay').textContent = '\u0623\u0646\u062a \u0627\u0644\u062c\u0627\u0633\u0648\u0633'; document.getElementById('wordDisplay').style.color = 'var(--neon-pink)'; playSound('spyReveal'); }
    else { document.getElementById('wordIcon').textContent = '\uD83D\uDCDD'; document.getElementById('wordDisplay').textContent = data.word; document.getElementById('wordDisplay').style.color = 'var(--neon-cyan)'; playSound('reveal'); }
    if (isHost) { document.getElementById('hostVotingSection').style.display = 'block'; document.getElementById('playerLeaveSection').style.display = 'none'; }
    else { document.getElementById('hostVotingSection').style.display = 'none'; document.getElementById('playerLeaveSection').style.display = 'block'; }
});

function startVoting() { initAudio(); playSound('countdown'); if (socket) safeEmit('start-voting'); }

safeOn('voting-started', function(data) {
    hasVoted = false; switchScreen('votingScreen');
    processedVoteIds.clear();
    document.getElementById('voteCounter').textContent = '0/' + data.voterCount;
    document.getElementById('voteLog').innerHTML = '';
    votingMyId = data.myId || socket.id;
    votingMyName = data.myName || playerName;
    if (isHost) { document.getElementById('votingLeaveSection').style.display = 'none'; }
    else { document.getElementById('votingLeaveSection').style.display = 'block'; }
    var html = '';
    data.players.forEach(function(p) {
        if (p.id === socket.id) return;
        var safeName = p.name.replace(/'/g, "\\'");
        html += '<div class="glass-card" style="padding:12px 16px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;transition:all 0.3s;" id="voteCard_' + p.id + '"><div style="display:flex;align-items:center;gap:12px;"><span style="font-weight:900;font-size:1.1rem;">' + toBold(p.name) + '</span></div><button class="btn btn-accent btn-sm" onclick="castVote(\'' + p.id + '\',\'' + safeName + '\')" id="voteBtn_' + p.id + '" style="min-width:90px;transition:all 0.3s;">\uD83D\uDDF3\uFE0F \u0635\u0648\u0651\u062a</button></div>';
    });
    document.getElementById('votingPlayersList').innerHTML = html;
});

function castVote(playerId, pName) {
    if (hasVoted) return; initAudio(); playSound('vote'); hasVoted = true;
    if (socket) safeEmit('vote', { votedFor: playerId, votedForName: pName });
    document.querySelectorAll('[id^="voteBtn_"]').forEach(function(btn) { btn.disabled = true; btn.style.opacity = '0.3'; btn.style.pointerEvents = 'none'; });
    document.querySelectorAll('[id^="voteCard_"]').forEach(function(card) { card.style.opacity = '0.5'; });
    var votedBtn = document.getElementById('voteBtn_' + playerId);
    var votedCard = document.getElementById('voteCard_' + playerId);
    if (votedBtn) { votedBtn.style.opacity = '1'; votedBtn.innerHTML = '\u2705 \u062a\u0645'; votedBtn.style.background = 'var(--success)'; votedBtn.style.borderColor = 'var(--success)'; }
    if (votedCard) { votedCard.style.opacity = '1'; votedCard.style.borderColor = 'var(--success)'; votedCard.style.boxShadow = '0 0 15px rgba(0,255,136,0.3)'; }
}

safeOn('vote-update', function(data) {
    document.getElementById('voteCounter').textContent = data.voteCount + '/' + data.totalPlayers;
    if (data.voteLog && data.voteLog.length > 0) {
        var log = document.getElementById('voteLog');
        log.innerHTML = '';
        var seenVoterIds = new Set();
        data.voteLog.forEach(function(vote) {
            if (seenVoterIds.has(vote.voterId)) return;
            seenVoterIds.add(vote.voterId);
            var entry = document.createElement('div');
            entry.className = 'vote-log-entry';
            entry.innerHTML = '<span class="voter-name">' + toBold(vote.voterName) + '</span> \u0635\u0648\u062a\u062a \u0639\u0644\u0649 <span class="voted-name">' + toBold(vote.votedForName) + '</span>';
            log.appendChild(entry);
        });
        log.scrollTop = log.scrollHeight;
    }
    playSound('vote');
});

safeOn('voting-ended', function(data) {
    switchScreen('voteResultScreen');
    if (data.isSpy) {
        document.getElementById('voteResultIcon').textContent = '\u2705';
        document.getElementById('voteResultTitle').style.color = 'var(--success)';
        document.getElementById('voteResultTitle').textContent = '\u062a\u0645 \u0643\u0634\u0641 \u0627\u0644\u062c\u0627\u0633\u0648\u0633!';
        document.getElementById('voteResultContent').innerHTML = '<p style="font-size:1.2rem;margin-bottom:10px;">\u0644\u0642\u062f \u0643\u0627\u0646 <span style="color:var(--neon-pink);font-weight:900;">' + toBold(data.spyName) + '</span> \u0627\u0644\u062c\u0627\u0633\u0648\u0633 \u0641\u0639\u0644\u0627\u064b</p>';
        playSound('win');
    } else {
        document.getElementById('voteResultIcon').textContent = '\u274C';
        document.getElementById('voteResultTitle').style.color = 'var(--danger)';
        document.getElementById('voteResultTitle').textContent = '\u062e\u0637\u0623!';
        document.getElementById('voteResultContent').innerHTML = '<p style="font-size:1.2rem;margin-bottom:10px;">\u0644\u0645 \u064a\u0643\u0646 <span style="color:var(--danger);font-weight:900;">' + toBold(data.mostVotedName) + '</span> \u0627\u0644\u062c\u0627\u0633\u0648\u0633</p><p>\u0644\u0642\u062f \u0643\u0627\u0646 <span style="color:var(--neon-pink);font-weight:900;">' + toBold(data.spyName) + '</span></p>';
        playSound('lose');
    }
    if (isSpy) { document.getElementById('spyGuessSection').style.display = 'block'; document.getElementById('normalResultSection').style.display = 'none'; }
    else { document.getElementById('spyGuessSection').style.display = 'none'; document.getElementById('normalResultSection').style.display = 'block'; }
    window._guessWords = data.guessWords; window._correctWord = data.correctWord;
});

function showGuessScreen() {
    initAudio(); playSound('guess'); selectedGuessWord = null;
    document.getElementById('confirmGuessBtn').disabled = true;
    switchScreen('guessScreen');
    var words = window._guessWords || [];
    var html = '';
    words.forEach(function(word) {
        html += '<div class="glass-card guess-word-card" id="guessWord_' + word + '" onclick="selectGuessWord(\'' + word + '\')" style="padding:15px;text-align:center;cursor:pointer;transition:all 0.3s;"><span style="font-weight:700;font-size:1.1rem;">' + word + '</span></div>';
    });
    document.getElementById('guessWordsGrid').innerHTML = html;
}

function selectGuessWord(word) {
    initAudio(); playSound('click'); selectedGuessWord = word;
    document.querySelectorAll('.guess-word-card').forEach(function(card) { card.style.borderColor = 'var(--border-glass)'; card.style.boxShadow = 'none'; });
    var selected = document.getElementById('guessWord_' + word);
    if (selected) { selected.style.borderColor = 'var(--neon-cyan)'; selected.style.boxShadow = 'var(--glow-secondary)'; }
    document.getElementById('confirmGuessBtn').disabled = false;
}

function confirmGuess() { if (!selectedGuessWord) return; initAudio(); playSound('click'); if (socket) safeEmit('spy-guess', { word: selectedGuessWord }); }

safeOn('spy-guess-result', function(data) {
    switchScreen('guessResultScreen');
    if (data.isCorrect) {
        document.getElementById('guessResultIcon').textContent = '\uD83C\uDFAF';
        document.getElementById('guessResultTitle').style.color = 'var(--success)';
        document.getElementById('guessResultTitle').textContent = '\u0625\u062c\u0627\u0628\u0629 \u0635\u062d\u064a\u062d\u0629!';
        document.getElementById('guessResultContent').innerHTML = '<p>\u0627\u0644\u062c\u0627\u0633\u0648\u0633 <span style="color:var(--neon-pink);font-weight:900;">' + toBold(data.spyName) + '</span> \u062e\u0645\u0646 \u0627\u0644\u0643\u0644\u0645\u0629 \u0635\u062d\u064a\u062d!</p>';
    } else {
        document.getElementById('guessResultIcon').textContent = '\u274C';
        document.getElementById('guessResultTitle').style.color = 'var(--danger)';
        document.getElementById('guessResultTitle').textContent = '\u0625\u062c\u0627\u0628\u0629 \u062e\u0627\u0637\u0626\u0629!';
        document.getElementById('guessResultContent').innerHTML = '<p>\u0627\u0644\u062c\u0627\u0633\u0648\u0633 <span style="color:var(--neon-pink);font-weight:900;">' + toBold(data.spyName) + '</span> \u0623\u062c\u0627\u0628 \u062e\u0637\u0623!</p><p>\u0627\u0644\u0643\u0644\u0645\u0629 \u0627\u0644\u0635\u062d\u064a\u062d\u0629: <span style="color:var(--neon-cyan);">' + data.correctWord + '</span></p>';
    }
});

function endRound() { initAudio(); playSound('click'); if (socket) safeEmit('end-round'); if (!isHost) { switchScreen('roundEndScreen'); } }
safeOn('round-ended', function() { if (!isHost) { switchScreen('roundEndScreen'); } });
safeOn('game-restarted', function() { switchScreen(isHost ? 'hostRoomScreen' : 'playerRoomScreen'); showToast('\u062a\u0645 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0644\u0639\u0628\u0629!', 'success'); showHostSettingsFab(); });
safeOn('room-closed', function() { showToast('\u062a\u0645 \u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u063a\u0631\u0641\u0629', 'error'); hideHostSettingsFab(); closeHostSettings(); switchScreen('leftScreen'); });
safeOn('host-disconnected', function() { showToast('\u0627\u0644\u0645\u0633\u062a\u0636\u064a\u0641 \u063a\u064a\u0631 \u0645\u062a\u0635\u0644', 'warning'); });

// URL routing
window.addEventListener('load', function() {
    var pathParts = window.location.pathname.split('/');
    if (pathParts.length > 2 && (pathParts[1] === 'join' || pathParts[1] === 'room')) { switchScreen('joinScreen'); }
    loadSoundSettings();
});
