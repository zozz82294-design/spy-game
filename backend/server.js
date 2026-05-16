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

io.on('connection', (socket) => {

    socket.on('createRoom', (data) => {
        const roomId = data.roomId;
        socket.join(roomId);
        socket.roomId = roomId;
        
        rooms[roomId] = { players: {} };
        
        // تسجيل الهوست باسم SASUKE إجبارياً من السيرفر
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
        io.to(targetId).emit('youAreKicked');
    });

    socket.on('startGame', () => {
        if(socket.roomId) io.to(socket.roomId).emit('gameStarted');
    });

    socket.on('restartGame', () => {
        if(socket.roomId) io.to(socket.roomId).emit('gameRestarted');
    });

    socket.on('disconnect', () => {
        const roomId = socket.roomId;
        if (roomId && rooms[roomId] && rooms[roomId].players[socket.id]) {
            const isHost = rooms[roomId].players[socket.id].isHost;

            if (isHost) {
                socket.to(roomId).emit('errorMsg', 'الهوست خرج أو عمل ريفريش! تم إغلاق الغرفة.');
                delete rooms[roomId];
            } else {
                delete rooms[roomId].players[socket.id];
                io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`🚀 Server is successfully running on port ${PORT}`);
    console.log(`🌐 Open: http://localhost:${PORT} in your browser`);
    console.log(`=============================================`);
});