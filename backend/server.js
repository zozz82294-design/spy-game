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

// 📚 قائمة الكلمات العشوائية (جزء منها وتقدر تزود الباقي براحتك)
const randomWords = [
    "ماكدونالدز", "هاتف", "أسد", "قطار", "مدرسة", "ديسكورد", "بيتزا", "ناروتو", 
    "سيف", "مصر", "تيك توك", "ثلاجة", "قلم", "شجرة", "شاحن", "هامبرغر", 
    "لابتوب", "روبوت", "فيل", "مطار", "كرة", "كاميرا", "واتساب", "يوتيوب", 
    "كنبة", "باب", "نافذة", "موز", "تفاحة", "قطة", "كلب", "صيدلية", "مستشفى", 
    "شمس", "قمر", "كرسي", "مروحة", "كيبورد", "شاشة", "بلايستيشن", "سماعة", 
    "طيار", "شرطي", "مكتبة", "مول", "حديقة", "مسجد", "ساعة", "حقيبة", "صابون"
];

io.on('connection', (socket) => {

    socket.on('createRoom', (data) => {
        const roomId = data.roomId;
        socket.join(roomId);
        socket.roomId = roomId;
        
        if (!rooms[roomId]) rooms[roomId] = { players: {}, gameState: 'waiting' };
        
        rooms[roomId].players[socket.id] = { 
            id: socket.id, 
            name: '𝐒𝐀𝐒𝐔𝐊𝐄', 
            isHost: true 
        };
        
        io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));
    });

    socket.on('joinRoom', (data) => {
        const roomId = data.roomId;
        
        if (rooms[roomId]) {
            socket.join(roomId);
            socket.roomId = roomId;
            
            rooms[roomId].players[socket.id] = { 
                id: socket.id, 
                name: data.name, 
                isHost: false 
            };
            
            io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));
            
            // لو دخل واللعبة شغالة، ابعتله حالتها
            if(rooms[roomId].gameState === 'playing') {
                socket.emit('gameStarted');
            }
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

    // الطرد: بنبعت رسالة طرد ثابتة من غير ما نطلعه للصفحة الرئيسية
    socket.on('kickPlayer', (targetId) => {
        io.to(targetId).emit('youAreKickedPermanently');
        const roomId = socket.roomId;
        if(roomId && rooms[roomId]) {
            delete rooms[roomId].players[targetId];
            io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));
        }
    });

    // المغادرة الإرادية من الضيف
    socket.on('leaveRoom', () => {
        const roomId = socket.roomId;
        if (roomId && rooms[roomId]) {
            delete rooms[roomId].players[socket.id];
            io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));
            socket.leave(roomId);
        }
    });

    // الهوست بيطلب الانتقال لشاشة اختيار المود
    socket.on('goToModeSelection', () => {
        if(socket.roomId) io.to(socket.roomId).emit('showModeSelection');
    });

    // الهوست اختار "عشوائي" وبدأ اللعب
    socket.on('startRandomMode', () => {
        const roomId = socket.roomId;
        if(roomId && rooms[roomId]) {
            rooms[roomId].gameState = 'playing';
            
            // اختيار الكلمة
            const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
            
            // اختيار الجاسوس (لازم يكون ضيف، مستحيل يكون الهوست)
            const playersArray = Object.values(rooms[roomId].players);
            const guests = playersArray.filter(p => !p.isHost);
            
            let spyId = null;
            if(guests.length > 0) {
                const spyIndex = Math.floor(Math.random() * guests.length);
                spyId = guests[spyIndex].id;
            } else {
                // لو بيلعب لوحده للتجربة
                spyId = playersArray[0].id; 
            }

            // إرسال الأدوار لكل لاعب
            playersArray.forEach(player => {
                const isSpy = player.id === spyId;
                io.to(player.id).emit('assignRole', {
                    word: randomWord,
                    isSpy: isSpy,
                    category: 'عشوائي'
                });
            });
            
            io.to(roomId).emit('gameStarted');
        }
    });

    socket.on('restartGame', () => {
        if(socket.roomId && rooms[socket.roomId]) {
            rooms[socket.roomId].gameState = 'waiting';
            io.to(socket.roomId).emit('gameRestarted');
        }
    });

    socket.on('disconnect', () => {
        const roomId = socket.roomId;
        if (roomId && rooms[roomId] && rooms[roomId].players[socket.id]) {
            const isHost = rooms[roomId].players[socket.id].isHost;

            if (isHost) {
                socket.to(roomId).emit('hostDisconnected');
                delete rooms[roomId];
            } else {
                // مش بنمسح الضيف فوراً عشان لو الموبايل قفل ورجع يقدر يعمل Reconnect (هتتظبط في الفرونت إند)
                // مجرد تحديث وهمي
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});