const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
});

const PORT = process.env.PORT || 3000;

// Serve static files from frontend directory
app.use('/styles', express.static(path.join(__dirname, '../frontend/styles')));
app.use('/scripts', express.static(path.join(__dirname, '../frontend/scripts')));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/room/:roomId', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// === Game Data ===
const rooms = {};
const WORDS = {
    random: {
        name: '\u0639\u0634\u0648\u0627\u0626\u064a',
        words: [
            '\u0645\u0633\u062c\u062f', '\u0643\u0646\u064a\u0633\u0629', '\u0645\u0633\u0631\u062d', '\u0645\u0633\u062a\u0634\u0641\u0649', '\u0645\u0637\u0627\u0631',
            '\u0645\u062d\u0637\u0629 \u0642\u0637\u0627\u0631', '\u062d\u062f\u064a\u0642\u0629 \u062d\u064a\u0648\u0627\u0646\u0627\u062a', '\u0645\u062a\u062d\u0641', '\u0645\u0643\u062a\u0628\u0629', '\u0645\u062f\u0631\u0633\u0629',
            '\u062c\u0627\u0645\u0639\u0629', '\u0645\u0637\u0639\u0645', '\u0641\u0646\u062f\u0642', '\u0634\u0627\u0637\u0626', '\u0633\u064a\u0646\u0645\u0627',
            '\u0645\u0644\u0639\u0628', '\u0633\u0648\u0642', '\u0645\u0635\u0646\u0639', '\u0634\u0631\u0643\u0629', '\u0645\u0643\u062a\u0628',
            '\u0637\u0627\u0626\u0631\u0629', '\u0633\u0641\u064a\u0646\u0629', '\u0642\u0637\u0627\u0631', '\u062d\u0627\u0641\u0644\u0629', '\u062f\u0631\u0627\u062c\u0629',
            '\u0633\u064a\u0627\u0631\u0629', '\u062a\u0627\u0643\u0633\u064a', '\u0645\u062a\u0631\u0648', '\u0645\u0635\u0639\u062f', '\u062c\u0633\u0631',
            '\u0642\u0644\u0639\u0629', '\u0628\u0631\u062c', '\u062d\u062f\u064a\u0642\u0629', '\u063a\u0627\u0628\u0629', '\u0635\u062d\u0631\u0627\u0621',
            '\u062c\u0632\u064a\u0631\u0629', '\u0628\u062d\u0631', '\u0646\u0647\u0631', '\u0628\u062d\u064a\u0631\u0629', '\u0646\u0627\u0641\u0648\u0631\u0629',
            '\u0643\u0631\u0633\u064a', '\u0637\u0627\u0648\u0644\u0629', '\u0633\u0631\u064a\u0631', '\u062a\u0644\u0641\u0632\u064a\u0648\u0646', '\u0647\u0627\u062a\u0641',
            '\u062d\u0627\u0633\u0648\u0628', '\u0633\u0627\u0639\u0629', '\u0646\u0638\u0627\u0631\u0629', '\u0645\u0641\u062a\u0627\u062d', '\u0643\u062a\u0627\u0628'
        ]
    }
};

// === Socket.IO Events ===
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create-room', (data) => {
        const roomId = uuidv4().substring(0, 6).toUpperCase();
        rooms[roomId] = {
            id: roomId,
            host: socket.id,
            players: [{ id: socket.id, name: data.hostName, isHost: true, displayMode: data.displayMode }],
            status: 'waiting',
            gameState: 'lobby',
            word: null,
            category: null,
            spy: null,
            votes: {},
            voteLog: [],
            maxPlayers: 12,
            createdAt: Date.now(),
            linkUsed: false
        };
        socket.join(roomId);
        socket.emit('room-created', { roomId, hostName: data.hostName });
        console.log('Room created:', roomId);
    });

    socket.on('join-room', (data) => {
        const room = rooms[data.roomId];
        if (!room) {
            socket.emit('join-error', { message: '\u0627\u0644\u063a\u0631\u0641\u0629 \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f\u0629' });
            return;
        }
        if (room.linkUsed) {
            socket.emit('join-error', { message: '\u0627\u0646\u062a\u0647\u062a \u0635\u0644\u0627\u062d\u064a\u0629 \u0627\u0644\u0631\u0627\u0628\u0637' });
            return;
        }
        if (room.players.length >= room.maxPlayers) {
            socket.emit('join-error', { message: '\u0627\u0644\u063a\u0631\u0641\u0629 \u0645\u0645\u062a\u0644\u0626\u0629' });
            return;
        }
        if (room.status !== 'waiting') {
            socket.emit('join-error', { message: '\u0627\u0644\u0644\u0639\u0628\u0629 \u0628\u062f\u0623\u062a \u0628\u0627\u0644\u0641\u0639\u0644' });
            return;
        }
        // Check duplicate names
        const nameExists = room.players.some(p => p.name === data.playerName);
        if (nameExists) {
            socket.emit('join-error', { message: '\u0627\u0644\u0627\u0633\u0645 \u0645\u0633\u062a\u062e\u062f\u0645 \u0628\u0627\u0644\u0641\u0639\u0644\u060c \u0627\u062e\u062a\u0631 \u0627\u0633\u0645 \u0622\u062e\u0631' });
            return;
        }

        room.players.push({ id: socket.id, name: data.playerName, isHost: false, displayMode: data.displayMode });
        socket.join(data.roomId);
        io.to(data.roomId).emit('player-joined', { name: data.playerName });
        io.to(data.roomId).emit('room-update', { players: room.players });
        socket.emit('join-success', { roomId: data.roomId, playerName: data.playerName });
        console.log('Player joined room:', data.roomId);
    });

    socket.on('rejoin-room', (data) => {
        const room = rooms[data.roomId];
        if (!room) return;
        const existingPlayer = room.players.find(p => p.name === data.playerName);
        if (existingPlayer) {
            existingPlayer.id = socket.id;
            socket.join(data.roomId);
            const isHost = existingPlayer.isHost;
            socket.emit('rejoin-success', { roomId: data.roomId, isHost, gameState: room.gameState });
            io.to(data.roomId).emit('room-update', { players: room.players });
        }
    });

    socket.on('get-room-players', () => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.players.some(p => p.id === socket.id)) {
                socket.emit('room-players-list', { players: room.players });
                break;
            }
        }
    });

    socket.on('kick-player', (data) => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.host === socket.id) {
                const player = room.players.find(p => p.id === data.playerId);
                if (player && !player.isHost) {
                    io.to(data.playerId).emit('kicked', { message: '\u062a\u0645 \u0637\u0631\u062f\u0643 \u0645\u0646 \u0627\u0644\u063a\u0631\u0641\u0629' });
                    room.players = room.players.filter(p => p.id !== data.playerId);
                    io.to(roomId).emit('room-update', { players: room.players });
                }
                break;
            }
        }
    });

    socket.on('change-player-name', (data) => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const player = room.players.find(p => p.id === data.playerId);
            if (player) {
                player.name = data.newName;
                io.to(data.playerId).emit('name-changed', { newName: data.newName });
                io.to(roomId).emit('room-update', { players: room.players });
                break;
            }
        }
    });

    socket.on('start-game', () => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.host === socket.id && room.players.length >= 3) {
                room.status = 'playing';
                room.gameState = 'mode-select';
                io.to(roomId).emit('game-started', {});
                break;
            }
        }
    });

    socket.on('select-mode', () => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.host === socket.id) {
                const hostPlayer = room.players.find(p => p.isHost);
                io.to(roomId).emit('mode-selected', { hostName: hostPlayer.name });
                break;
            }
        }
    });

    socket.on('cancel-mode', () => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.host === socket.id) {
                io.to(roomId).emit('mode-cancelled', {});
                break;
            }
        }
    });

    socket.on('confirm-mode', () => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.host === socket.id) {
                room.gameState = 'word';
                // Pick random word
                const category = WORDS.random;
                const word = category.words[Math.floor(Math.random() * category.words.length)];
                room.word = word;
                room.category = category.name;

                // Pick spy (not host)
                const nonHostPlayers = room.players.filter(p => !p.isHost);
                const spy = nonHostPlayers[Math.floor(Math.random() * nonHostPlayers.length)];
                room.spy = spy.id;

                // Generate guess words
                const guessWords = [word];
                const otherWords = category.words.filter(w => w !== word);
                const shuffled = otherWords.sort(() => Math.random() - 0.5);
                for (let i = 0; i < 5 && i < shuffled.length; i++) {
                    guessWords.push(shuffled[i]);
                }
                room.guessWords = guessWords.sort(() => Math.random() - 0.5);

                // Send word to each player
                room.players.forEach(player => {
                    io.to(player.id).emit('show-word', {
                        isSpy: player.id === room.spy,
                        word: word,
                        category: category.name
                    });
                });

                io.to(roomId).emit('mode-confirmed', {});
                break;
            }
        }
    });

    socket.on('start-voting', () => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.host === socket.id) {
                room.gameState = 'voting';
                room.votes = {};
                room.voteLog = [];
                const voterCount = room.players.length;
                room.players.forEach(player => {
                    io.to(player.id).emit('voting-started', {
                        players: room.players,
                        voterCount,
                        myId: player.id,
                        myName: player.name
                    });
                });
                break;
            }
        }
    });

    socket.on('vote', (data) => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.players.some(p => p.id === socket.id)) {
                // Prevent duplicate votes
                if (room.votes[socket.id]) return;
                // Prevent voting for self
                if (data.votedFor === socket.id) return;

                const voter = room.players.find(p => p.id === socket.id);
                const votedFor = room.players.find(p => p.id === data.votedFor);
                if (!voter || !votedFor) return;

                room.votes[socket.id] = data.votedFor;
                room.voteLog.push({
                    voterId: socket.id,
                    voterName: voter.name,
                    votedForId: data.votedFor,
                    votedForName: data.votedForName
                });

                const voteCount = Object.keys(room.votes).length;
                io.to(roomId).emit('vote-update', {
                    voteCount,
                    totalPlayers: room.players.length,
                    voteLog: room.voteLog,
                    voterName: voter.name,
                    votedForName: data.votedForName
                });

                // Check if all voted
                if (voteCount >= room.players.length) {
                    // Count votes
                    const voteCounts = {};
                    Object.values(room.votes).forEach(votedId => {
                        voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
                    });

                    let mostVotedId = null;
                    let maxVotes = 0;
                    Object.entries(voteCounts).forEach(([id, count]) => {
                        if (count > maxVotes) { mostVotedId = id; maxVotes = count; }
                    });

                    const isSpy = mostVotedId === room.spy;
                    const spyPlayer = room.players.find(p => p.id === room.spy);
                    const mostVotedPlayer = room.players.find(p => p.id === mostVotedId);

                    room.gameState = 'result';
                    io.to(roomId).emit('voting-ended', {
                        isSpy,
                        spyName: spyPlayer ? spyPlayer.name : '',
                        mostVotedName: mostVotedPlayer ? mostVotedPlayer.name : '',
                        guessWords: room.guessWords,
                        correctWord: room.word
                    });
                }
                break;
            }
        }
    });

    socket.on('spy-guess', (data) => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (socket.id === room.spy) {
                const isCorrect = data.word === room.word;
                const spyPlayer = room.players.find(p => p.id === room.spy);
                io.to(roomId).emit('spy-guess-result', {
                    isCorrect,
                    spyName: spyPlayer ? spyPlayer.name : '',
                    guessedWord: data.word,
                    correctWord: room.word
                });
                break;
            }
        }
    });

    socket.on('end-round', () => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.host === socket.id) {
                room.gameState = 'lobby';
                room.status = 'waiting';
                room.word = null;
                room.spy = null;
                room.votes = {};
                room.voteLog = [];
                io.to(roomId).emit('round-ended', {});
                io.to(roomId).emit('game-restarted', {});
                break;
            }
        }
    });

    socket.on('leave-room', () => {
        handleDisconnect(socket.id);
        socket.emit('left-room', {});
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        handleDisconnect(socket.id);
    });

    function handleDisconnect(socketId) {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socketId);
            if (playerIndex !== -1) {
                const player = room.players[playerIndex];
                room.players.splice(playerIndex, 1);

                if (room.players.length === 0) {
                    delete rooms[roomId];
                    console.log('Room deleted:', roomId);
                } else {
                    if (room.host === socketId) {
                        room.host = room.players[0].id;
                        room.players[0].isHost = true;
                        io.to(room.host).emit('became-host', {});
                    }
                    io.to(roomId).emit('player-left', { name: player.name });
                    io.to(roomId).emit('room-update', { players: room.players });

                    // Update vote counts if voting
                    if (room.gameState === 'voting') {
                        const voteCount = Object.keys(room.votes).length;
                        io.to(roomId).emit('vote-update', {
                            voteCount,
                            totalPlayers: room.players.length,
                            voteLog: room.voteLog
                        });
                    }
                }
                break;
            }
        }
    }
});

server.listen(PORT, () => {
    console.log(`SASUKE Spy Game running on http://localhost:${PORT}`);
});
