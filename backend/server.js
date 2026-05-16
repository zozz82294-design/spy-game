const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// تشغيل الملفات الثابتة من فولدر public
app.use(express.static(path.join(__dirname, 'public')));

// إدارة اتصالات اللاعبين (WebSockets)
io.on('connection', (socket) => {
    console.log('لاعب جديد اتصل بالسيرفر: ' + socket.id);

    socket.on('disconnect', () => {
        console.log('لاعب قطع الاتصال: ' + socket.id);
    });
});

// تشغيل السيرفر على البورت 3000
server.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`🚀 Server is successfully running on port ${PORT}`);
    console.log(`🌐 Open: http://localhost:${PORT} in your browser`);
    console.log(`=============================================`);
});