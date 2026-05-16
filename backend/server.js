const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.resolve(__dirname, '..', 'public')));

let rooms = {};

const randomWords = [
    "ماكدونالدز", "هاتف", "أسد", "قطار", "مدرسة", "ديسكورد", "بيتزا", "ناروتو", 
    "سيف", "مصر", "تيك توك", "ثلاجة", "قلم", "شجرة", "شاحن", "هامبرغر", 
    "لابتوب", "روبوت", "فيل", "مطار", "كرة", "كاميرا", "واتساب", "يوتيوب", 
    "كنبة", "باب", "نافذة", "موز", "تفاحة", "قطة", "كلب", "صيدلية", "مستشفى", 
    "شمس", "قمر", "كرسي", "مروحة", "كيبورد", "شاشة", "بلايستيشن", "سماعة", 
    "طيار", "شرطي", "مكتبة", "مول", "حديقة", "مسجد", "ساعة", "حقيبة", "صابون"
];

// دالة لجلب 14 كلمة عشوائية غير الكلمة الأصلية
function getSimilarWords(correctWord) {
    let filtered = randomWords.filter(w => w !== correctWord);
    let shuffled = filtered.sort(() => 0.5 - Math.random());
    let selected = shuffled.slice(0, 14);
    selected.push(correctWord);
    return selected.sort(() => 0.5 - Math.random()); // خلط الـ 15 كلمة
}

io.on('connection', (socket) => {

    socket.on('createRoom', (data) => {
        const roomId = data.roomId;
        socket.join(roomId);
        socket.roomId = roomId;
        
        rooms[roomId] = { 
            players: {}, 
            gameState: 'waiting',
            word: '',
            spyId: null,
            votes: {}, // { voterId: targetId }
            guessingWords: []
        };
        
        rooms[roomId].players[socket.id] = { id: socket.id, name: '𝐒𝐀𝐒𝐔𝐊𝐄', isHost: true };
        io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));
    });

    socket.on('joinRoom', (data) => {
        const roomId = data.roomId;
        if (rooms[roomId]) {
            socket.join(roomId);
            socket.roomId = roomId;
            rooms[roomId].players[socket.id] = { id: socket.id, name: data.name, isHost: false };
            io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));
            
            if(rooms[roomId].gameState === 'playing') socket.emit('gameStarted');
        } else {
            socket.emit('errorMsg', 'الغرفة دي مش موجودة أو الهوست قفل اللعبة!');
        }
    });

    socket.on('changePlayerName', (data) => {
        if(socket.roomId && rooms[socket.roomId] && rooms[socket.roomId].players[data.targetId]) {
            rooms[socket.roomId].players[data.targetId].name = data.newName;
            io.to(socket.roomId).emit('updatePlayers', Object.values(rooms[socket.roomId].players));
        }
    });

    socket.on('kickPlayer', (targetId) => {
        io.to(targetId).emit('youAreKickedPermanently');
        if(socket.roomId && rooms[socket.roomId]) {
            delete rooms[socket.roomId].players[targetId];
            io.to(socket.roomId).emit('updatePlayers', Object.values(rooms[socket.roomId].players));
        }
    });

    socket.on('leaveRoom', () => {
        if (socket.roomId && rooms[socket.roomId]) {
            delete rooms[socket.roomId].players[socket.id];
            io.to(socket.roomId).emit('updatePlayers', Object.values(rooms[socket.roomId].players));
            socket.leave(socket.roomId);
        }
    });

    socket.on('goToModeSelection', () => {
        if(socket.roomId) io.to(socket.roomId).emit('showModeSelection');
    });

    socket.on('selectMode', (modeName) => io.to(socket.roomId).emit('modeSelected', modeName));
    socket.on('deselectMode', (modeName) => io.to(socket.roomId).emit('modeDeselected', modeName));

    socket.on('startRandomMode', () => {
        const roomId = socket.roomId;
        if(roomId && rooms[roomId]) {
            rooms[roomId].gameState = 'playing';
            rooms[roomId].votes = {}; // تصفير التصويت
            
            const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
            rooms[roomId].word = randomWord;

            const playersArray = Object.values(rooms[roomId].players);
            const guests = playersArray.filter(p => !p.isHost);
            
            let spyId = guests.length > 0 ? guests[Math.floor(Math.random() * guests.length)].id : playersArray[0].id;
            rooms[roomId].spyId = spyId;

            playersArray.forEach(player => {
                io.to(player.id).emit('assignRole', {
                    word: randomWord,
                    isSpy: player.id === spyId,
                    category: 'عشوائي'
                });
            });
            io.to(roomId).emit('gameStarted');
        }
    });

    // ==========================================
    // 🗳️ نظام التصويت المباشر
    // ==========================================
    socket.on('startVotingPhase', () => {
        const roomId = socket.roomId;
        if(roomId && rooms[roomId]) {
            rooms[roomId].gameState = 'voting';
            io.to(roomId).emit('votingStarted', Object.values(rooms[roomId].players));
        }
    });

    socket.on('submitVote', (targetId) => {
        const roomId = socket.roomId;
        if(roomId && rooms[roomId] && rooms[roomId].gameState === 'voting') {
            const voterName = rooms[roomId].players[socket.id].name;
            const targetName = rooms[roomId].players[targetId].name;
            
            // تسجيل الصوت
            rooms[roomId].votes[socket.id] = targetId;
            const totalVotes = Object.keys(rooms[roomId].votes).length;
            const totalPlayers = Object.keys(rooms[roomId].players).length;

            // إرسال اللوج المباشر والعداد لكل الغرفة
            io.to(roomId).emit('voteRegistered', {
                voterName: voterName,
                targetName: targetName,
                currentVotes: totalVotes,
                totalRequired: totalPlayers
            });

            // لو كل الناس صوتت
            if(totalVotes >= totalPlayers) {
                rooms[roomId].gameState = 'voting_result';
                
                // حساب من حصل على أعلى أصوات
                const voteCounts = {};
                Object.values(rooms[roomId].votes).forEach(id => {
                    voteCounts[id] = (voteCounts[id] || 0) + 1;
                });
                
                let maxVotes = 0;
                let topVotedId = null;
                for (const [id, count] of Object.entries(voteCounts)) {
                    if (count > maxVotes) {
                        maxVotes = count;
                        topVotedId = id;
                    }
                }

                const isSpyCaught = (topVotedId === rooms[roomId].spyId);
                const votedPlayerName = rooms[roomId].players[topVotedId].name;
                const spyName = rooms[roomId].players[rooms[roomId].spyId].name;

                io.to(roomId).emit('votingEnded', {
                    isSpyCaught: isSpyCaught,
                    votedPlayerName: votedPlayerName,
                    spyName: spyName,
                    spyId: rooms[roomId].spyId
                });
            }
        }
    });

    // ==========================================
    // 🧠 مرحلة تخمين الجاسوس
    // ==========================================
    socket.on('startGuessingPhase', () => {
        const roomId = socket.roomId;
        if(roomId && rooms[roomId]) {
            rooms[roomId].gameState = 'guessing';
            rooms[roomId].guessingWords = getSimilarWords(rooms[roomId].word);
            io.to(roomId).emit('guessingPhaseStarted', rooms[roomId].guessingWords);
        }
    });

    socket.on('spyHoverWord', (word) => {
        const roomId = socket.roomId;
        if(roomId && rooms[roomId]) {
            const spyName = rooms[roomId].players[socket.id].name;
            io.to(roomId).emit('spySelectedWord', { word: word, spyName: spyName });
        }
    });

    socket.on('spyConfirmWord', (chosenWord) => {
        const roomId = socket.roomId;
        if(roomId && rooms[roomId]) {
            const correctWord = rooms[roomId].word;
            const isCorrect = (chosenWord === correctWord);
            const spyName = rooms[roomId].players[socket.id].name;

            io.to(roomId).emit('gameFinalResult', {
                spyName: spyName,
                chosenWord: chosenWord,
                correctWord: correctWord,
                isCorrect: isCorrect
            });
        }
    });

    socket.on('restartGame', () => {
        if(socket.roomId && rooms[socket.roomId]) {
            rooms[socket.roomId].gameState = 'waiting';
            rooms[socket.roomId].votes = {};
            io.to(socket.roomId).emit('gameRestarted');
        }
    });

    socket.on('disconnect', () => {
        const roomId = socket.roomId;
        if (roomId && rooms[roomId] && rooms[roomId].players[socket.id]) {
            if (rooms[roomId].players[socket.id].isHost) {
                socket.to(roomId).emit('hostDisconnected');
                delete rooms[roomId];
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});