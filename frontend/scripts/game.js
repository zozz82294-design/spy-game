// === Game Logic - Voting, Guessing, Results ===

// === Host Settings ===
function openHostSettings() {
    initAudio(); playSound('click');
    document.getElementById('settingsOverlay').classList.add('visible');
    updateGlobalSettingsPlayerList();
}

function closeHostSettingsOverlay(event) {
    if (event.target === document.getElementById('settingsOverlay')) {
        document.getElementById('settingsOverlay').classList.remove('visible');
    }
}

function closeHostSettings() {
    document.getElementById('settingsOverlay').classList.remove('visible');
}

function updateGlobalSettingsPlayerList() {
    if (socket) safeEmit('get-room-players');
}

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

safeOn('room-players-list', function(data) {
    renderGlobalSettingsPlayerList(data.players);
});

function showHostSettingsFab() {
    if (isHost) { document.getElementById('hostSettingsFab').classList.add('visible'); }
}

function hideHostSettingsFab() {
    document.getElementById('hostSettingsFab').classList.remove('visible');
}

// === Game Events ===
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
    if (data.isSpy) {
        document.getElementById('wordIcon').textContent = '\uD83D\uDD75\uFE0F';
        document.getElementById('wordDisplay').textContent = '\u0623\u0646\u062a \u0627\u0644\u062c\u0627\u0633\u0648\u0633';
        document.getElementById('wordDisplay').style.color = 'var(--neon-pink)';
        playSound('spyReveal');
    } else {
        document.getElementById('wordIcon').textContent = '\uD83D\uDCDD';
        document.getElementById('wordDisplay').textContent = data.word;
        document.getElementById('wordDisplay').style.color = 'var(--neon-cyan)';
        playSound('reveal');
    }
    if (isHost) {
        document.getElementById('hostVotingSection').style.display = 'block';
        document.getElementById('playerLeaveSection').style.display = 'none';
    } else {
        document.getElementById('hostVotingSection').style.display = 'none';
        document.getElementById('playerLeaveSection').style.display = 'block';
    }
});

// === Voting ===
function startVoting() { initAudio(); playSound('countdown'); if (socket) safeEmit('start-voting'); }

safeOn('voting-started', function(data) {
    hasVoted = false; switchScreen('votingScreen');
    processedVoteIds.clear();
    document.getElementById('voteCounter').textContent = '0/' + data.voterCount;
    document.getElementById('voteLog').innerHTML = '';
    votingMyId = data.myId || socket.id;
    votingMyName = data.myName || playerName;
    if (isHost) {
        document.getElementById('votingLeaveSection').style.display = 'none';
    } else {
        document.getElementById('votingLeaveSection').style.display = 'block';
    }
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
    } else if (data.voterName && data.votedForName) {
        var voteKey = data.voterName + '->' + data.votedForName;
        if (!processedVoteIds.has(voteKey)) {
            processedVoteIds.add(voteKey);
            var log = document.getElementById('voteLog');
            var entry = document.createElement('div');
            entry.className = 'vote-log-entry';
            entry.innerHTML = '<span class="voter-name">' + toBold(data.voterName) + '</span> \u0635\u0648\u062a\u062a \u0639\u0644\u0649 <span class="voted-name">' + toBold(data.votedForName) + '</span>';
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
        }
    }
    playSound('vote');
});

// === Vote Results ===
safeOn('voting-ended', function(data) {
    switchScreen('voteResultScreen');
    if (data.isSpy) {
        document.getElementById('voteResultIcon').textContent = '\u2705';
        document.getElementById('voteResultTitle').style.color = 'var(--success)';
        document.getElementById('voteResultTitle').textContent = '\u062a\u0645 \u0643\u0634\u0641 \u0627\u0644\u062c\u0627\u0633\u0648\u0633!';
        document.getElementById('voteResultContent').innerHTML = '<p style="font-size:1.2rem;margin-bottom:10px;">\u0644\u0642\u062f \u0643\u0627\u0646 <span style="color:var(--neon-pink);font-weight:900;">' + toBold(data.spyName) + '</span> \u0627\u0644\u062c\u0627\u0633\u0648\u0633 \u0641\u0639\u0644\u0627\u064b\u060c \u0623\u062d\u0633\u0646\u062a\u0645</p><p style="color:var(--text-secondary);">\u0641\u064a \u0627\u0646\u062a\u0638\u0627\u0631 \u062a\u062e\u0645\u064a\u0646\u0647 \u0644\u0644\u0643\u0644\u0645\u0629</p>';
        playSound('win');
    } else {
        document.getElementById('voteResultIcon').textContent = '\u274C';
        document.getElementById('voteResultTitle').style.color = 'var(--danger)';
        document.getElementById('voteResultTitle').textContent = '\u062e\u0637\u0623!';
        document.getElementById('voteResultContent').innerHTML = '<p style="font-size:1.2rem;margin-bottom:10px;">\u0644\u0645 \u064a\u0643\u0646 <span style="color:var(--danger);font-weight:900;">' + toBold(data.mostVotedName) + '</span> \u0627\u0644\u062c\u0627\u0633\u0648\u0633</p><p style="margin-bottom:10px;">\u0644\u0642\u062f \u0643\u0627\u0646 <span style="color:var(--neon-pink);font-weight:900;">' + toBold(data.spyName) + '</span> \u0627\u0644\u062c\u0627\u0633\u0648\u0633</p><p style="color:var(--text-secondary);">\u0641\u064a \u0627\u0646\u062a\u0638\u0627\u0631 \u062a\u062e\u0645\u064a\u0646\u0647 \u0644\u0644\u0643\u0644\u0645\u0629</p>';
        playSound('lose');
    }
    if (isSpy) { document.getElementById('spyGuessSection').style.display = 'block'; document.getElementById('normalResultSection').style.display = 'none'; }
    else { document.getElementById('spyGuessSection').style.display = 'none'; document.getElementById('normalResultSection').style.display = 'block'; }
    window._guessWords = data.guessWords; window._correctWord = data.correctWord;
});

// === Guess ===
function showGuessScreen() {
    initAudio(); playSound('guess'); selectedGuessWord = null;
    document.getElementById('confirmGuessBtn').disabled = true;
    switchScreen('guessScreen');
    var words = window._guessWords || [];
    var html = '';
    words.forEach(function(word) {
        html += '<div class="glass-card guess-word-card" id="guessWord_' + word + '" onclick="selectGuessWord(\'' + word + '\')" style="padding:15px;text-align:center;cursor:pointer;transition:all 0.3s;"><span style="font-weight:700;font-size:1.1rem;">' + word + '</span><div class="guess-word-label" style="display:none;font-size:0.75rem;color:var(--neon-cyan);margin-top:5px;"></div></div>';
    });
    document.getElementById('guessWordsGrid').innerHTML = html;
}

function selectGuessWord(word) {
    initAudio(); playSound('click'); selectedGuessWord = word;
    document.querySelectorAll('.guess-word-card').forEach(function(card) { card.style.borderColor = 'var(--border-glass)'; card.style.boxShadow = 'none'; card.querySelector('.guess-word-label').style.display = 'none'; });
    var selected = document.getElementById('guessWord_' + word);
    if (selected) { selected.style.borderColor = 'var(--neon-cyan)'; selected.style.boxShadow = 'var(--glow-secondary)'; selected.querySelector('.guess-word-label').textContent = '\u0627\u062e\u062a\u0627\u0631\u0647\u0627 ' + toBold(playerName); selected.querySelector('.guess-word-label').style.display = 'block'; }
    document.getElementById('confirmGuessBtn').disabled = false;
}

function confirmGuess() { if (!selectedGuessWord) return; initAudio(); playSound('click'); if (socket) safeEmit('spy-guess', { word: selectedGuessWord }); }

safeOn('spy-guess-result', function(data) {
    switchScreen('guessResultScreen');
    if (data.isCorrect) {
        document.getElementById('guessResultIcon').textContent = '\uD83C\uDFAF';
        document.getElementById('guessResultTitle').style.color = 'var(--success)';
        document.getElementById('guessResultTitle').textContent = '\u0625\u062c\u0627\u0628\u0629 \u0635\u062d\u064a\u062d\u0629!';
        document.getElementById('guessResultContent').innerHTML = '<p style="font-size:1.2rem;margin-bottom:10px;">\u0644\u0642\u062f \u062e\u0645\u0646 \u0627\u0644\u062c\u0627\u0633\u0648\u0633 <span style="color:var(--neon-pink);font-weight:900;">' + toBold(data.spyName) + '</span> \u0627\u0644\u0643\u0644\u0645\u0629</p><p style="font-size:1.1rem;margin-bottom:10px;">\u0627\u0644\u0643\u0644\u0645\u0629: <span style="color:var(--neon-cyan);font-weight:900;">' + data.guessedWord + '</span></p><p style="color:var(--success);font-weight:700;">\u0627\u0644\u0625\u062c\u0627\u0628\u0629 \u0635\u062d\u064a\u062d\u0629! \uD83C\uDF89</p><p style="color:var(--text-secondary);">\u0627\u0644\u0643\u0644\u0645\u0629 \u0627\u0644\u0635\u062d\u064a\u062d\u0629 \u0643\u0627\u0646\u062a: <span style="color:var(--neon-cyan);">' + data.correctWord + '</span></p>';
    } else {
        document.getElementById('guessResultIcon').textContent = '\u274C';
        document.getElementById('guessResultTitle').style.color = 'var(--danger)';
        document.getElementById('guessResultTitle').textContent = '\u0625\u062c\u0627\u0628\u0629 \u062e\u0627\u0637\u0626\u0629!';
        document.getElementById('guessResultContent').innerHTML = '<p style="font-size:1.2rem;margin-bottom:10px;">\u0644\u0642\u062f \u062e\u0645\u0646 \u0627\u0644\u062c\u0627\u0633\u0648\u0633 <span style="color:var(--neon-pink);font-weight:900;">' + toBold(data.spyName) + '</span> \u0627\u0644\u0643\u0644\u0645\u0629</p><p style="font-size:1.1rem;margin-bottom:10px;">\u0627\u0644\u0643\u0644\u0645\u0629: <span style="color:var(--danger);font-weight:900;">' + data.guessedWord + '</span></p><p style="color:var(--danger);font-weight:700;">\u0627\u0644\u0625\u062c\u0627\u0628\u0629 \u062e\u0627\u0637\u0626\u0629!</p><p style="color:var(--text-secondary);">\u0627\u0644\u0643\u0644\u0645\u0629 \u0627\u0644\u0635\u062d\u064a\u062d\u0629 \u0643\u0627\u0646\u062a: <span style="color:var(--neon-cyan);">' + data.correctWord + '</span></p>';
    }
});

function endRound() { initAudio(); playSound('click'); if (socket) safeEmit('end-round'); if (!isHost) { switchScreen('roundEndScreen'); } }

safeOn('round-ended', function() { if (!isHost) { switchScreen('roundEndScreen'); } });
safeOn('game-restarted', function() { switchScreen(isHost ? 'hostRoomScreen' : 'playerRoomScreen'); showToast('\u062a\u0645 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0644\u0639\u0628\u0629!', 'success'); showHostSettingsFab(); });
safeOn('room-closed', function() { showToast('\u062a\u0645 \u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u063a\u0631\u0641\u0629', 'error'); hideHostSettingsFab(); closeHostSettings(); switchScreen('leftScreen'); });
safeOn('host-disconnected', function() { showToast('\u0627\u0644\u0645\u0633\u062a\u0636\u064a\u0641 \u063a\u064a\u0631 \u0645\u062a\u0635\u0644\u060c \u062c\u0627\u0631\u064a \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631...', 'warning'); });

// URL routing
window.addEventListener('load', function() {
    var pathParts = window.location.pathname.split('/');
    if (pathParts.length > 2 && (pathParts[1] === 'join' || pathParts[1] === 'room')) { switchScreen('joinScreen'); }
    loadSoundSettings();
});
