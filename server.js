const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/join/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/room/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const rooms = {};
const socketRoomMap = {};
const socketPlayerMap = {};

const WORDS = [
  'ماكدونالدز','هاتف','أسد','قطار','مدرسة','ديسكورد','بيتزا','ناروتو','سيف','مصر',
  'تيك توك','ثلاجة','قلم','شجرة','شاحن','هامبرغر','لابتوب','روبوت','فيل','مطار',
  'كرة','كاميرا','واتساب','يوتيوب','كنبة','باب','نافذة','موز','تفاحة','قطة',
  'كلب','صيدلية','مستشفى','شمس','قمر','كرسي','مروحة','كيبورد','شاشة','بلايستيشن',
  'سماعة','طيار','شرطي','مكتبة','مول','حديقة','مسجد','ساعة','حقيبة','صابون',
  'بطاطس','شاورما','كشري','فندق','شاطئ','غابة','تابلت','راوتر','إنستغرام','فيسبوك',
  'دب','ذئب','قرش','بطريق','تمساح','زرافة','دراجة','سفينة','بنك','مطعم',
  'حلويات','قهوة','شاي','ذهب','ألماس','ريموت','ميكروفون','طابعة','لوحة رسم','حذاء',
  'عطر','مسبح','سينما','هرم','جزيرة','خيمة','مقص','بطارية','ذكاء اصطناعي','كعكة',
  'دونات','فرن','غسالة','مكنسة','علم','خريطة','تاج','قوس','طائرة','صاروخ',
  'مجرة','ديناصور','تمثال','بيانو','جيتار','سيرفر','موقع إلكتروني','تطبيق','مطار','سفينة',
  'فيل','أرنب','سلحفاة','نمر','ببغاء','دلفين','فراشة','عقرب','حمام','نحلة',
  'خفاش','قندس','كنغر','بومة','طاووس','بجعة','حمار وحشي','غزال','ثعلب','قرد',
  'باب','نافذة','سلم','مفتاح','قفل','مرآة','وسادة','بطانية','منشفة','فرشاة',
  'مشط','معجون','صابون','شامبو','إسفنجة','مكنسة','دلو','ممسحة','سجادة','ستارة',
  'مكتب','خزانة','رف','درج','طاولة','سرير','أريكة','حوض','صنبور','دش',
  'سيراميك','رخام','أسمنت','طوب','خشب','حديد','زجاج','بلاستيك','قماش','جلد',
  'مطعم','مقهى','مخبز','محل حلويات','سوبر ماركت','صيدلية','مستشفى','مدرسة','جامعة','مكتبة',
  'متحف','حديقة','ملعب','مسبح','صالة رياضية','سينما','مسرح','فندق','مطار','محطة قطار',
  'ميناء','بنك','مكتب بريد','مركز شرطة','محكمة','مستشفى','عيادة','مختبر','مصنع','مزرعة',
  'حاسوب','لابتوب','هاتف','تابلت','شاشة','كيبورد','ماوس','سماعة','ميكروفون','كاميرا',
  'طابعة','ماسح ضوئي','راوتر','مودم','سيرفر','هارد','فلاشة','شاحن','بطارية','سماعة بلوتوث'
];

function getSimilarWords(correctWord, count = 14) {
  const similar = [];
  const used = new Set([correctWord]);
  const shuffled = [...WORDS].sort(() => Math.random() - 0.5);

  for (const word of shuffled) {
    if (similar.length >= count) break;
    if (!used.has(word)) {
      similar.push(word);
      used.add(word);
    }
  }

  const allWords = [...similar, correctWord].sort(() => Math.random() - 0.5);
  return allWords;
}

function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getRoomPlayers(roomId) {
  if (!rooms[roomId]) return [];
  const players = [];
  players.push({
    id: rooms[roomId].hostSocketId,
    name: rooms[roomId].hostName,
    isHost: true,
    avatar: rooms[roomId].hostAvatar
  });
  for (const [socketId, player] of Object.entries(rooms[roomId].players)) {
    players.push({
      id: socketId,
      name: player.name,
      isHost: false,
      avatar: player.avatar
    });
  }
  return players;
}

function emitRoomUpdate(roomId) {
  if (!rooms[roomId]) return;
  const players = getRoomPlayers(roomId);
  io.to(roomId).emit('room-update', {
    players: players,
    playerCount: players.length,
    gameStarted: rooms[roomId].gameStarted || false
  });
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-room', (data) => {
    const roomId = generateRoomId();
    const avatar = Math.floor(Math.random() * 8) + 1;

    rooms[roomId] = {
      id: roomId,
      hostSocketId: socket.id,
      hostName: data.hostName || 'SASUKE',
      hostAvatar: avatar,
      hostDisplayMode: data.displayMode || 'computer',
      players: {},
      gameStarted: false,
      currentWord: null,
      spySocketId: null,
      votes: {},
      votingActive: false,
      guessWords: null,
      spyGuessedWord: null,
      roundEnded: false,
      linkActive: true
    };

    socketRoomMap[socket.id] = roomId;
    socketPlayerMap[socket.id] = { isHost: true, name: data.hostName || 'SASUKE' };

    socket.join(roomId);

    console.log('Room created:', roomId);
    socket.emit('room-created', {
      roomId: roomId,
      hostName: data.hostName || 'SASUKE',
      avatar: avatar,
      joinLink: data.joinLink || roomId
    });

    emitRoomUpdate(roomId);
  });

  socket.on('join-room', (data) => {
    const roomId = data.roomId;

    if (!rooms[roomId]) {
      socket.emit('join-error', { message: 'الغرفة غير موجودة' });
      return;
    }

    if (!rooms[roomId].linkActive) {
      socket.emit('join-error', { message: 'انتهت صلاحية الرابط' });
      return;
    }

    if (rooms[roomId].gameStarted) {
      socket.emit('join-error', { message: 'اللعبة已经开始 بالفعل' });
      return;
    }

    const existingNames = getRoomPlayers(roomId).map(p => p.name);
    if (existingNames.includes(data.playerName)) {
      socket.emit('join-error', { message: 'هذا الاسم مستخدم بالفعل' });
      return;
    }

    const avatar = Math.floor(Math.random() * 8) + 1;

    rooms[roomId].players[socket.id] = {
      name: data.playerName,
      avatar: avatar,
      displayMode: data.displayMode || 'computer'
    };

    socketRoomMap[socket.id] = roomId;
    socketPlayerMap[socket.id] = { isHost: false, name: data.playerName };

    socket.join(roomId);

    socket.emit('join-success', {
      roomId: roomId,
      playerName: data.playerName,
      avatar: avatar,
      hostName: rooms[roomId].hostName
    });

    io.to(rooms[roomId].hostSocketId).emit('player-joined', {
      name: data.playerName,
      avatar: avatar
    });

    emitRoomUpdate(roomId);
  });

  socket.on('kick-player', (data) => {
    const roomId = socketRoomMap[socket.id];
    if (!rooms[roomId] || rooms[roomId].hostSocketId !== socket.id) return;

    const targetSocketId = data.playerId;
    if (rooms[roomId].players[targetSocketId]) {
      const playerName = rooms[roomId].players[targetSocketId].name;
      io.to(targetSocketId).emit('kicked', { message: 'لقد تم طردك من الغرفة' });
      delete rooms[roomId].players[targetSocketId];

      const targetSockets = io.sockets.sockets;
      if (targetSockets.has(targetSocketId)) {
        targetSockets.get(targetSocketId).leave(roomId);
      }

      delete socketRoomMap[targetSocketId];
      delete socketPlayerMap[targetSocketId];

      emitRoomUpdate(roomId);
    }
  });

  socket.on('change-player-name', (data) => {
    const roomId = socketRoomMap[socket.id];
    if (!rooms[roomId] || rooms[roomId].hostSocketId !== socket.id) return;

    const targetSocketId = data.playerId;
    if (rooms[roomId].players[targetSocketId]) {
      rooms[roomId].players[targetSocketId].name = data.newName;
      io.to(targetSocketId).emit('name-changed', { newName: data.newName });
      emitRoomUpdate(roomId);
    }
  });

  socket.on('start-game', () => {
    const roomId = socketRoomMap[socket.id];
    if (!rooms[roomId] || rooms[roomId].hostSocketId !== socket.id) return;

    const players = getRoomPlayers(roomId);
    if (players.length < 3) return;

    rooms[roomId].gameStarted = true;
    rooms[roomId].linkActive = false;

    const wordIndex = Math.floor(Math.random() * WORDS.length);
    rooms[roomId].currentWord = WORDS[wordIndex];

    const playerIds = Object.keys(rooms[roomId].players);
    const spyIndex = Math.floor(Math.random() * playerIds.length);
    rooms[roomId].spySocketId = playerIds[spyIndex];

    rooms[roomId].votes = {};
    rooms[roomId].votingActive = false;
    rooms[roomId].roundEnded = false;
    rooms[roomId].spyGuessedWord = null;

    io.to(roomId).emit('game-started', {
      category: 'عشوائي',
      categoryDescription: 'ميزة الأشياء العشوائية: تقدر تكشف الجاسوس بسهولة أكبر، وتسأله إذا كان مكان أو جماد أو شخص، وده يجعل النقاش أمتع وأسهل للكشف.'
    });

    setTimeout(() => {
      const hostData = {
        word: rooms[roomId].currentWord,
        category: 'عشوائي',
        isSpy: false
      };
      io.to(rooms[roomId].hostSocketId).emit('show-word', hostData);

      for (const [socketId, player] of Object.entries(rooms[roomId].players)) {
        if (socketId === rooms[roomId].spySocketId) {
          io.to(socketId).emit('show-word', {
            word: null,
            category: 'عشوائي',
            isSpy: true
          });
        } else {
          io.to(socketId).emit('show-word', {
            word: rooms[roomId].currentWord,
            category: 'عشوائي',
            isSpy: false
          });
        }
      }

      emitRoomUpdate(roomId);
    }, 2000);
  });

  socket.on('start-voting', () => {
    const roomId = socketRoomMap[socket.id];
    if (!rooms[roomId] || rooms[roomId].hostSocketId !== socket.id) return;
    if (!rooms[roomId].gameStarted) return;

    rooms[roomId].votingActive = true;
    rooms[roomId].votes = {};

    const players = getRoomPlayers(roomId);
    io.to(roomId).emit('voting-started', {
      players: players,
      voterCount: players.length
    });
  });

  socket.on('vote', (data) => {
    const roomId = socketRoomMap[socket.id];
    if (!rooms[roomId]) return;
    if (!rooms[roomId].votingActive) return;

    if (rooms[roomId].votes[socket.id]) return;

    rooms[roomId].votes[socket.id] = data.votedFor;

    const voters = Object.keys(rooms[roomId].votes).length;
    const totalPlayers = getRoomPlayers(roomId).length;

    const voterName = socketPlayerMap[socket.id]?.name || 'مجهول';
    const votedForName = data.votedForName || 'مجهول';

    io.to(roomId).emit('vote-update', {
      voterName: voterName,
      votedForName: votedForName,
      voteCount: voters,
      totalPlayers: totalPlayers
    });

    if (voters >= totalPlayers) {
      rooms[roomId].votingActive = false;

      const voteCounts = {};
      for (const votedFor of Object.values(rooms[roomId].votes)) {
        voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
      }

      let maxVotes = 0;
      let mostVotedId = null;
      for (const [id, count] of Object.entries(voteCounts)) {
        if (count > maxVotes) {
          maxVotes = count;
          mostVotedId = id;
        }
      }

      const spyId = rooms[roomId].spySocketId;
      const isSpy = mostVotedId === spyId;

      let mostVotedName = '';
      if (mostVotedId === rooms[roomId].hostSocketId) {
        mostVotedName = rooms[roomId].hostName;
      } else if (rooms[roomId].players[mostVotedId]) {
        mostVotedName = rooms[roomId].players[mostVotedId].name;
      }

      const spyName = rooms[roomId].players[spyId]?.name || 'الجاسوس';

      const guessWords = getSimilarWords(rooms[roomId].currentWord, 14);
      rooms[roomId].guessWords = guessWords;

      io.to(roomId).emit('voting-ended', {
        mostVotedId: mostVotedId,
        mostVotedName: mostVotedName,
        isSpy: isSpy,
        spyName: spyName,
        guessWords: guessWords,
        correctWord: rooms[roomId].currentWord
      });
    }
  });

  socket.on('spy-guess', (data) => {
    const roomId = socketRoomMap[socket.id];
    if (!rooms[roomId]) return;
    if (socket.id !== rooms[roomId].spySocketId) return;

    rooms[roomId].spyGuessedWord = data.word;
    rooms[roomId].roundEnded = true;

    const isCorrect = data.word === rooms[roomId].currentWord;
    const spyName = rooms[roomId].players[rooms[roomId].spySocketId]?.name || 'الجاسوس';

    io.to(roomId).emit('spy-guess-result', {
      spyName: spyName,
      guessedWord: data.word,
      isCorrect: isCorrect,
      correctWord: rooms[roomId].currentWord
    });
  });

  socket.on('end-round', () => {
    const roomId = socketRoomMap[socket.id];
    if (!rooms[roomId]) return;

    io.to(roomId).emit('round-ended');
  });

  socket.on('restart-game', () => {
    const roomId = socketRoomMap[socket.id];
    if (!rooms[roomId] || rooms[roomId].hostSocketId !== socket.id) return;

    rooms[roomId].gameStarted = false;
    rooms[roomId].currentWord = null;
    rooms[roomId].spySocketId = null;
    rooms[roomId].votes = {};
    rooms[roomId].votingActive = false;
    rooms[roomId].guessWords = null;
    rooms[roomId].spyGuessedWord = null;
    rooms[roomId].roundEnded = false;
    rooms[roomId].linkActive = true;

    io.to(roomId).emit('game-restarted');
    emitRoomUpdate(roomId);
  });

  socket.on('generate-new-link', () => {
    const oldRoomId = socketRoomMap[socket.id];
    if (!rooms[oldRoomId] || rooms[oldRoomId].hostSocketId !== socket.id) return;

    // إنشاء ID جديد للغرفة عشان الرابط القديم يبوظ
    const newRoomId = generateRoomId();
    rooms[newRoomId] = rooms[oldRoomId];
    rooms[newRoomId].id = newRoomId;
    rooms[newRoomId].linkActive = true;
    delete rooms[oldRoomId];

    // تحديث الـ maps لكل اللاعبين
    socketRoomMap[socket.id] = newRoomId;
    for (const socketId of Object.keys(rooms[newRoomId].players)) {
      socketRoomMap[socketId] = newRoomId;
    }

    // نقل كل السوكتس للروم الجديد
    const sockets = io.sockets.adapter.rooms.get(oldRoomId);
    if (sockets) {
      for (const socketId of sockets) {
        const s = io.sockets.sockets.get(socketId);
        if (s) {
          s.leave(oldRoomId);
          s.join(newRoomId);
        }
      }
    }

    socket.emit('new-link-generated', { roomId: newRoomId });
  });

  socket.on('leave-room', () => {
    const roomId = socketRoomMap[socket.id];
    if (!roomId || !rooms[roomId]) return;

    if (rooms[roomId].hostSocketId === socket.id) {
      io.to(roomId).emit('room-closed');
      delete rooms[roomId];
    } else {
      delete rooms[roomId].players[socket.id];
      emitRoomUpdate(roomId);
    }

    socket.leave(roomId);
    delete socketRoomMap[socket.id];
    delete socketPlayerMap[socket.id];
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const roomId = socketRoomMap[socket.id];
    if (!roomId || !rooms[roomId]) return;

    if (rooms[roomId].hostSocketId === socket.id) {
      io.to(roomId).emit('host-disconnected');
      setTimeout(() => {
        if (rooms[roomId] && rooms[roomId].hostSocketId === socket.id) {
          delete rooms[roomId];
        }
      }, 10000);
    } else {
      const playerName = rooms[roomId].players[socket.id]?.name || 'لاعب';
      delete rooms[roomId].players[socket.id];
      io.to(rooms[roomId].hostSocketId).emit('player-left', { name: playerName });
      emitRoomUpdate(roomId);
    }

    delete socketRoomMap[socket.id];
    delete socketPlayerMap[socket.id];
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log('═══════════════════════════════════════════');
  console.log('🎮 Spy Game server running!');
  console.log('📡 Port: ' + PORT);
  console.log('🌐 Open: http://localhost:' + PORT);
  console.log('═══════════════════════════════════════════');
});
