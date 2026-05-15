// === Socket.IO Connection ===
var socket = null;
var socketReady = false;
var lastSocketId = null;
var myRoomId = null;
var myPlayerName = '';
var amIHost = false;

console.log('[DEBUG] Starting socket initialization...');
try {
    socket = io({
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket', 'polling'],
        upgrade: true,
        forceNew: false
    });

    socket.on('connect', function() {
        socketReady = true;
        lastSocketId = socket.id;
        console.log('[DEBUG] Socket connected! id:', socket.id);

        if (myRoomId && myPlayerName) {
            var oldSocketId = lastSocketId;
            socket.emit('rejoin-room', {
                roomId: myRoomId,
                oldSocketId: oldSocketId,
                playerName: myPlayerName
            });
        }
    });

    socket.on('rejoin-success', function(data) {
        console.log('[DEBUG] Rejoin success:', data);
        myRoomId = data.roomId;
        amIHost = data.isHost || false;
        isHost = data.isHost || false;
        showToast('\u062a\u0645 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u0646\u062c\u0627\u062d! \u2705', 'success');

        if (data.gameState === 'mode-select') {
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
        } else if (data.gameState === 'word') {
            switchScreen('wordScreen');
        } else if (data.gameState === 'voting') {
            switchScreen('votingScreen');
        } else if (data.gameState === 'result') {
            switchScreen('resultScreen');
        } else {
            if (isHost) { switchScreen('hostRoomScreen'); }
            else { switchScreen('playerRoomScreen'); }
        }
    });

    socket.on('disconnect', function(reason) {
        socketReady = false;
        console.log('[DEBUG] Socket disconnected, reason:', reason);
        if (reason === 'io server disconnect') {
            showToast('\u062a\u0645 \u0642\u0637\u0639 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0645\u0646 \u0627\u0644\u0633\u064a\u0631\u0641\u0631\u060c \u062c\u0627\u0631\u064a \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0627\u062a\u0635\u0627\u0644...', 'warning');
        } else {
            showToast('\u062a\u0645 \u0642\u0637\u0639 \u0627\u0644\u0627\u062a\u0635\u0627\u0644\u060c \u062c\u0627\u0631\u064a \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0627\u062a\u0635\u0627\u0644...', 'warning');
        }
    });

    socket.on('connect_error', function(err) {
        socketReady = false;
        console.warn('[DEBUG] Socket connection error:', err.message);
    });
} catch(e) {
    console.warn('[DEBUG] Socket.IO not available:', e.message);
    showToast('Socket.IO \u0645\u0634 \u0645\u062a\u0627\u062d: ' + e.message, 'error');
}

function safeOn(event, handler) {
    if (socket) {
        try { socket.on(event, handler); } catch(e) { console.warn('Socket on error:', e); }
    }
}

function safeEmit(event, data) {
    if (socket && socketReady) {
        try { socket.emit(event, data); } catch(e) { console.warn('Socket emit error:', e); }
    } else if (socket && !socketReady) {
        showToast('\u062c\u0627\u0631\u064a \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u0627\u0644\u0633\u064a\u0631\u0641\u0631... \u062d\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649', 'warning');
    } else {
        showToast('\u063a\u064a\u0631 \u0645\u062a\u0635\u0644 \u0628\u0627\u0644\u0633\u064a\u0631\u0641\u0631', 'error');
    }
}
