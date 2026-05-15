const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// توجيه الخادم لملفات واجهة المستخدم
app.use(express.static(path.join(__dirname, '../public')));

// تخزين بيانات الغرف
const rooms = {};

// توليد كود غرفة عشوائي
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
    console.log('لاعب جديد متصل:', socket.id);

    // إنشاء غرفة
    socket.on('createRoom', (playerName) => {
        const roomCode = generateRoomCode();
        rooms[roomCode] = {
            host: socket.id,
            players: [{ id: socket.id, name: playerName }],
            gameStarted: false,
            spyId: null
        };
        socket.join(roomCode);
        socket.emit('roomCreated', roomCode);
        io.to(roomCode).emit('updatePlayers', rooms[roomCode].players);
    });

    // الانضمام لغرفة
    socket.on('joinRoom', ({ playerName, roomCode }) => {
        if (!rooms[roomCode]) {
            return socket.emit('errorMsg', 'عذراً، الغرفة غير موجودة أو انتهت صلاحيتها');
        }
        if (rooms[roomCode].gameStarted) {
            return socket.emit('errorMsg', 'اللعبة بدأت بالفعل!');
        }

        rooms[roomCode].players.push({ id: socket.id, name: playerName });
        socket.join(roomCode);
        socket.emit('roomJoined', roomCode);
        io.to(roomCode).emit('updatePlayers', rooms[roomCode].players);
    });

    // بدء اللعبة وتحديد الجاسوس
    socket.on('startGame', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.host === socket.id) {
            room.gameStarted = true;
            // اختيار جاسوس عشوائي
            const playersList = room.players;
            const spyIndex = Math.floor(Math.random() * playersList.length);
            room.spyId = playersList[spyIndex].id;

            const currentWord = "آيفون 15"; // الكلمة السارية

            playersList.forEach(player => {
                const isSpy = player.id === room.spyId;
                io.to(player.id).emit('gameStarted', {
                    isSpy: isSpy,
                    word: isSpy ? null : currentWord
                });
            });
        }
    });

    // نظام التصويت
    socket.on('vote', ({ roomCode, targetId, targetName, voterName }) => {
        io.to(roomCode).emit('voteRecord', { voterName, targetName });
    });

    // عند خروج لاعب
    socket.on('disconnect', () => {
        for (const roomCode in rooms) {
            const room = rooms[roomCode];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                io.to(roomCode).emit('updatePlayers', room.players);
                
                // لو الهوست خرج، اقفل الغرفة
                if (room.host === socket.id) {
                    io.to(roomCode).emit('errorMsg', 'الهوست غادر اللعبة، تم إغلاق الغرفة.');
                    delete rooms[roomCode];
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 السيرفر شغال على البورت ${PORT}`);
});