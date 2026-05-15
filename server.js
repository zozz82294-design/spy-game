const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  pingTimeout: 120000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e6,
  transports: ['websocket', 'polling'],
  allowEIO3: true
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
const playerNames = {}; // roomId -> Set of names (منع تكرار الأسماء)
const disconnectTimeouts = {}; // socket.id -> timeout (إعادة اتصال مؤقتة)

// تنظيف الغرف القديمة كل 5 دقايق
setInterval(function() {
  var now = Date.now();
  for (var rid in rooms) {
    if (!rooms[rid]) continue;
    // لو الغرفة فاضية أو الهوست مش متصل
    var hostConnected = io.sockets.sockets.has(rooms[rid].hostSocketId);
    var playerCount = Object.keys(rooms[rid].players).length;
    if (!hostConnected && playerCount === 0) {
      console.log('Cleaning empty room:', rid);
      delete rooms[rid];
      delete playerNames[rid];
    }
  }
}, 300000);

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

    var hostName = (data.hostName || 'SASUKE').trim().substring(0, 15);

    rooms[roomId] = {
      id: roomId,
      hostSocketId: socket.id,
      hostName: hostName,
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
      linkActive: true,
      createdAt: Date.now()
    };

    // سجل اسم الهوست
    playerNames[roomId] = new Set();
    playerNames[roomId].add(hostName.toLowerCase());

    socketRoomMap[socket.id] = roomId;
    socketPlayerMap[socket.id] = { isHost: true, name: hostName };

    socket.join(roomId);

    console.log('Room created:', roomId);
    socket.emit('room-created', {
      roomId: roomId,
      hostName: hostName,
      avatar: avatar,
      joinLink: data.joinLink || roomId
    });

    emitRoomUpdate(roomId);
  });

  socket.on('join-room', (data) => {
    var roomId = data.roomId;

    // تنظيف roomId
    if (roomId) roomId = roomId.trim().toUpperCase();

    if (!roomId || !rooms[roomId]) {
      socket.emit('join-error', { message: 'الغرفة غير موجودة أو الرابط غلط' });
      return;
    }

    if (!rooms[roomId].linkActive) {
      socket.emit('join-error', { message: 'انتهت صلاحية الرابط' });
      return;
    }

    if (rooms[roomId].gameStarted) {
      // لو اللعبة بدأت، نشوف هل اللاعب ده كان في الغرفة قبل كده وقفل وقفل الـ timeout
      // يعني كان بيلعب وطلع بالغلط - لو نفس الاسم يدخل تاني
      var wasInRoom = false;
      var oldSocketId = null;
      for (var sid in rooms[roomId].players) {
        if (rooms[roomId].players[sid] && rooms[roomId].players[sid].name.toLowerCase() === playerName.toLowerCase()) {
          wasInRoom = true;
          oldSocketId = sid;
          break;
        }
      }
      // كمان نشوف في الـ disconnectTimeouts لو كان متسجل
      if (!wasInRoom && disconnectTimeouts) {
        for (var tid in disconnectTimeouts) {
          // نشوف في socketPlayerMap القديم
          if (socketPlayerMap[tid] && socketPlayerMap[tid].name && socketPlayerMap[tid].name.toLowerCase() === playerName.toLowerCase() && socketPlayerMap[tid].roomId === roomId) {
            wasInRoom = true;
            oldSocketId = tid;
            break;
          }
        }
      }
      if (wasInRoom && oldSocketId) {
        // نفس الاسم - ندخله تاني ويكمل
        // اشيل القديم
        if (disconnectTimeouts[oldSocketId]) {
          clearTimeout(disconnectTimeouts[oldSocketId]);
          delete disconnectTimeouts[oldSocketId];
        }
        var oldPlayer = rooms[roomId].players[oldSocketId];
        if (oldPlayer) {
          delete rooms[roomId].players[oldSocketId];
        }
        // نضيفه بالـ socket id الجديد
        rooms[roomId].players[socket.id] = {
          name: playerName,
          avatar: oldPlayer ? oldPlayer.avatar : (Math.floor(Math.random() * 8) + 1),
          displayMode: data.displayMode || 'computer',
          joinedAt: oldPlayer ? oldPlayer.joinedAt : Date.now(),
          rejoinedAt: Date.now()
        };
        socketRoomMap[socket.id] = roomId;
        socketPlayerMap[socket.id] = { isHost: false, name: playerName, roomId: roomId };
        socket.join(roomId);

        socket.emit('join-success', {
          roomId: roomId,
          playerName: playerName,
          avatar: rooms[roomId].players[socket.id].avatar,
          hostName: rooms[roomId].hostName
        });

        io.to(rooms[roomId].hostSocketId).emit('player-reconnected', { name: playerName });
        emitRoomUpdate(roomId);

        // لو اللعبة شغالة، نبعتله حالة اللعبة الحالية
        if (rooms[roomId].spySocketId === socket.id) {
          socket.emit('show-word', { word: null, category: 'عشوائي', isSpy: true });
        } else {
          socket.emit('show-word', { word: rooms[roomId].currentWord, category: 'عشوائي', isSpy: false });
        }

        console.log('Player rejoined game with same name:', playerName, '-> Room:', roomId);
        return;
      } else {
        // اسم مختلف واللعبة بدأت
        socket.emit('join-error', { message: 'الغرفة بدأت بالفعل! انتظر الهوست يعمل إعادة اللعب ووقتها تقدر تدخل' });
        return;
      }
    }

    // حد أقصى للاعبين
    var currentPlayerCount = getRoomPlayers(roomId).length;
    if (currentPlayerCount >= 20) {
      socket.emit('join-error', { message: 'الغرفة مليئة (أقصى حد 20 لاعب)' });
      return;
    }

    var playerName = (data.playerName || '').trim().substring(0, 15);
    if (!playerName || playerName.length < 1) {
      socket.emit('join-error', { message: 'اكتب اسمك الأول' });
      return;
    }

    // فحص تكرار الاسم (case-insensitive)
    if (playerNames[roomId] && playerNames[roomId].has(playerName.toLowerCase())) {
      socket.emit('join-error', { message: 'هذا الاسم مستخدم بالفعل! جرب اسم تاني' });
      return;
    }

    // لو اللاعب كان في الغرفة قبل كده (reconnect) - اشيل القديم
    if (socketRoomMap[socket.id] === roomId) {
      socket.emit('join-error', { message: 'أنت بالفعل في الغرفة!' });
      return;
    }

    var avatar = Math.floor(Math.random() * 8) + 1;

    rooms[roomId].players[socket.id] = {
      name: playerName,
      avatar: avatar,
      displayMode: data.displayMode || 'computer',
      joinedAt: Date.now()
    };

    // سجل اسم اللاعب
    if (!playerNames[roomId]) playerNames[roomId] = new Set();
    playerNames[roomId].add(playerName.toLowerCase());

    socketRoomMap[socket.id] = roomId;
    socketPlayerMap[socket.id] = { isHost: false, name: playerName };

    // اشيل timeout لو كان فيه
    if (disconnectTimeouts[socket.id]) {
      clearTimeout(disconnectTimeouts[socket.id]);
      delete disconnectTimeouts[socket.id];
    }

    socket.join(roomId);

    socket.emit('join-success', {
      roomId: roomId,
      playerName: playerName,
      avatar: avatar,
      hostName: rooms[roomId].hostName
    });

    io.to(rooms[roomId].hostSocketId).emit('player-joined', {
      name: playerName,
      avatar: avatar
    });

    emitRoomUpdate(roomId);
    console.log('Player joined:', playerName, '-> Room:', roomId, '(' + getRoomPlayers(roomId).length + ' players)');
  });

  socket.on('kick-player', (data) => {
    var roomId = socketRoomMap[socket.id];
    if (!rooms[roomId] || rooms[roomId].hostSocketId !== socket.id) return;

    var targetSocketId = data.playerId;
    if (rooms[roomId].players[targetSocketId]) {
      var kickedName = rooms[roomId].players[targetSocketId].name;
      io.to(targetSocketId).emit('kicked', { message: 'لقد تم طردك من الغرفة' });

      // شيل الاسم من playerNames
      if (playerNames[roomId]) playerNames[roomId].delete(kickedName.toLowerCase());

      delete rooms[roomId].players[targetSocketId];

      var targetSockets = io.sockets.sockets;
      if (targetSockets.has(targetSocketId)) {
        targetSockets.get(targetSocketId).leave(roomId);
      }

      delete socketRoomMap[targetSocketId];
      delete socketPlayerMap[targetSocketId];

      emitRoomUpdate(roomId);
      console.log('Player kicked:', kickedName, 'from Room:', roomId);
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

  // الحصول على قائمة اللاعبين (للإعدادات أثناء اللعب)
  socket.on('get-room-players', () => {
    const roomId = socketRoomMap[socket.id];
    if (!rooms[roomId]) return;
    const players = getRoomPlayers(roomId);
    socket.emit('room-players-list', { players: players });
  });

  socket.on('start-game', () => {
    const roomId = socketRoomMap[socket.id];
    if (!rooms[roomId] || rooms[roomId].hostSocketId !== socket.id) return;

    const players = getRoomPlayers(roomId);
    if (players.length < 3) return;

    rooms[roomId].gameStarted = true;
    rooms[roomId].linkActive = false;

    // اختيار الكلمة
    const wordIndex = Math.floor(Math.random() * WORDS.length);
    rooms[roomId].currentWord = WORDS[wordIndex];

    // اختيار الجاسوس من اللاعبين فقط (الهوست مش جاسوس أبداً)
    const playerIds = Object.keys(rooms[roomId].players);
    const spyIndex = Math.floor(Math.random() * playerIds.length);
    rooms[roomId].spySocketId = playerIds[spyIndex];

    rooms[roomId].votes = {};
    rooms[roomId].votingActive = false;
    rooms[roomId].roundEnded = false;
    rooms[roomId].spyGuessedWord = null;
    rooms[roomId].modeConfirmed = false;

    // الكل يشوف شاشة اختيار الوضع (بس الهوست بس اللي يقدر يضغط)
    const hostName = rooms[roomId].hostName || 'الهوست';
    io.to(roomId).emit('game-started', {
      category: 'عشوائي',
      categoryDescription: 'ميزة الأشياء العشوائية: تقدر تكشف الجاسوس بسهولة أكبر، وتسأله إذا كان مكان أو جماد أو شخص، وده يجعل النقاش أمتع وأسهل للكشف.',
      hostName: hostName
    });
  });

  // الهوست يضغط على بطاقة عشوائي
  socket.on('select-mode', () => {
    const roomId = socketRoomMap[socket.id];
    if (!rooms[roomId] || rooms[roomId].hostSocketId !== socket.id) return;

    const hostName = rooms[roomId].hostName || 'الهوست';
    // إبلاغ الكل إن الهوست اختار عشوائي
    io.to(roomId).emit('mode-selected', { hostName: hostName });
  });

  // الهوست يسحب اختياره
  socket.on('cancel-mode', () => {
    const roomId = socketRoomMap[socket.id];
    if (!rooms[roomId] || rooms[roomId].hostSocketId !== socket.id) return;

    // إبلاغ الكل إن الهوست سحب الاختيار
    io.to(roomId).emit('mode-cancelled');
  });

  // الهوست يؤكد اختيار الوضع
  socket.on('confirm-mode', () => {
    const roomId = socketRoomMap[socket.id];
    if (!rooms[roomId] || rooms[roomId].hostSocketId !== socket.id) return;
    if (rooms[roomId].modeConfirmed) return;

    rooms[roomId].modeConfirmed = true;

    // إرسال الكلمات للكل
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

    io.to(roomId).emit('mode-confirmed');
    emitRoomUpdate(roomId);
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

    // منع التصويت على النفس
    if (data.votedFor === socket.id) return;

    // منع التصويت المكرر
    if (rooms[roomId].votes[socket.id]) return;

    rooms[roomId].votes[socket.id] = data.votedFor;

    const voters = Object.keys(rooms[roomId].votes).length;
    const totalPlayers = getRoomPlayers(roomId).length;

    const voterName = socketPlayerMap[socket.id]?.name || 'مجهول';
    const votedForName = data.votedForName || 'مجهول';

    // إرسال سجل التصويت المباشر - كل شخص يشوف الاسم المصوّت عليه بالأحمر
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

      // التحقق من التعادل
      let maxVotes = 0;
      let mostVotedIds = [];
      for (const [id, count] of Object.entries(voteCounts)) {
        if (count > maxVotes) {
          maxVotes = count;
          mostVotedIds = [id];
        } else if (count === maxVotes) {
          mostVotedIds.push(id);
        }
      }

      // لو في تعادل، اختار عشوائياً
      const mostVotedId = mostVotedIds[Math.floor(Math.random() * mostVotedIds.length)];

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
    var roomId = socketRoomMap[socket.id];
    if (!roomId || !rooms[roomId]) return;

    if (rooms[roomId].hostSocketId === socket.id) {
      // الهوست غادر - اقفل الغرفة
      io.to(roomId).emit('room-closed');
      if (playerNames[roomId]) delete playerNames[roomId];
      delete rooms[roomId];
    } else {
      var leavingName = rooms[roomId].players[socket.id]?.name || 'لاعب';
      // شيل الاسم من playerNames
      if (playerNames[roomId]) playerNames[roomId].delete(leavingName.toLowerCase());
      delete rooms[roomId].players[socket.id];
      io.to(rooms[roomId].hostSocketId).emit('player-left', { name: leavingName });
      emitRoomUpdate(roomId);
    }

    socket.leave(roomId);
    delete socketRoomMap[socket.id];
    delete socketPlayerMap[socket.id];
  });

  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.id, 'Reason:', reason);
    var roomId = socketRoomMap[socket.id];
    if (!roomId || !rooms[roomId]) {
      delete socketRoomMap[socket.id];
      delete socketPlayerMap[socket.id];
      return;
    }

    if (rooms[roomId].hostSocketId === socket.id) {
      // الهوست فصل - استنى 30 ثانية قبل ما تقفل الغرفة
      io.to(roomId).emit('host-disconnected');
      disconnectTimeouts[socket.id] = setTimeout(function() {
        if (rooms[roomId] && rooms[roomId].hostSocketId === socket.id) {
          console.log('Host did not reconnect, closing room:', roomId);
          io.to(roomId).emit('room-closed');
          if (playerNames[roomId]) delete playerNames[roomId];
          delete rooms[roomId];
        }
        delete disconnectTimeouts[socket.id];
      }, 30000);
    } else {
      // لاعب فصل - استنى 60 ثانية قبل ما تشيله (عشان الموبايل يفصل شاشة ويرجع)
      var discName = rooms[roomId].players[socket.id]?.name || 'لاعب';
      io.to(rooms[roomId].hostSocketId).emit('player-disconnected', { name: discName, socketId: socket.id });

      disconnectTimeouts[socket.id] = setTimeout(function() {
        if (rooms[roomId] && rooms[roomId].players[socket.id]) {
          // شيل الاسم من playerNames
          if (playerNames[roomId]) playerNames[roomId].delete(discName.toLowerCase());
          delete rooms[roomId].players[socket.id];
          io.to(rooms[roomId].hostSocketId).emit('player-left', { name: discName });
          emitRoomUpdate(roomId);
          console.log('Player removed after timeout:', discName, 'from Room:', roomId);

          // لو في تصويت نشط، حدّث العداد وشوف هل كل اللي فاضل صوّتوا
          if (rooms[roomId].votingActive) {
            var currentPlayers = getRoomPlayers(roomId);
            var voters = Object.keys(rooms[roomId].votes).length;
            // شيل اللاعب اللي خرج من الأصوات لو كان صوّت
            if (rooms[roomId].votes[socket.id]) {
              delete rooms[roomId].votes[socket.id];
              voters = Object.keys(rooms[roomId].votes).length;
            }
            // حدّث العداد للكل
            io.to(roomId).emit('vote-update', {
              voterName: discName,
              votedForName: 'غادر اللعبة',
              voteCount: voters,
              totalPlayers: currentPlayers.length
            });
            // لو كل اللي فاضل صوّتوا، أنهِ التصويت
            if (voters >= currentPlayers.length) {
              rooms[roomId].votingActive = false;
              var voteCounts = {};
              for (var votedFor of Object.values(rooms[roomId].votes)) {
                voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
              }
              var maxVotes = 0;
              var mostVotedId = null;
              for (var [id, count] of Object.entries(voteCounts)) {
                if (count > maxVotes) {
                  maxVotes = count;
                  mostVotedId = id;
                }
              }
              var spyId = rooms[roomId].spySocketId;
              var isSpy = mostVotedId === spyId;
              var mostVotedName = '';
              if (mostVotedId === rooms[roomId].hostSocketId) {
                mostVotedName = rooms[roomId].hostName;
              } else if (rooms[roomId].players[mostVotedId]) {
                mostVotedName = rooms[roomId].players[mostVotedId].name;
              }
              var spyName = rooms[roomId].players[spyId]?.name || 'الجاسوس';
              var guessWords = getSimilarWords(rooms[roomId].currentWord, 14);
              rooms[roomId].guessWords = guessWords;
              io.to(roomId).emit('voting-ended', {
                mostVotedId: mostVotedId,
                mostVotedName: mostVotedName,
                isSpy: isSpy,
                spyName: spyName,
                guessWords: guessWords
              });
              rooms[roomId].roundEnded = true;
            }
          }
        }
        delete disconnectTimeouts[socket.id];
      }, 60000);
    }

    delete socketRoomMap[socket.id];
    delete socketPlayerMap[socket.id];
  });

  // إعادة اتصال لاعب
  socket.on('rejoin-room', function(data) {
    var roomId = data.roomId;
    if (!roomId || !rooms[roomId]) {
      socket.emit('join-error', { message: 'الغرفة لم تعد موجودة' });
      return;
    }

    // لو الهوست رجع
    if (rooms[roomId].hostSocketId === data.oldSocketId) {
      // اشيل timeout القديم
      if (disconnectTimeouts[data.oldSocketId]) {
        clearTimeout(disconnectTimeouts[data.oldSocketId]);
        delete disconnectTimeouts[data.oldSocketId];
      }
      rooms[roomId].hostSocketId = socket.id;
      socketRoomMap[socket.id] = roomId;
      socketPlayerMap[socket.id] = { isHost: true, name: rooms[roomId].hostName };
      socket.join(roomId);

      // نبعت حالة اللعبة الحالية
      var gameState = 'lobby'; // افتراضي
      if (rooms[roomId].gameStarted && !rooms[roomId].modeConfirmed) {
        gameState = 'mode-select';
      } else if (rooms[roomId].modeConfirmed && !rooms[roomId].votingActive && !rooms[roomId].roundEnded) {
        gameState = 'word';
      } else if (rooms[roomId].votingActive) {
        gameState = 'voting';
      } else if (rooms[roomId].roundEnded) {
        gameState = 'result';
      }

      socket.emit('rejoin-success', { roomId: roomId, isHost: true, gameState: gameState });

      // لو اللعبة بدأت، نبعت الكلمة للهوست
      if (rooms[roomId].modeConfirmed) {
        socket.emit('show-word', {
          word: rooms[roomId].currentWord,
          category: 'عشوائي',
          isSpy: false
        });
      }

      io.to(roomId).emit('host-reconnected');
      emitRoomUpdate(roomId);
      console.log('Host reconnected:', rooms[roomId].hostName, '-> Room:', roomId);
      return;
    }

    // لو لاعب رجع
    // اشيل timeout القديم
    if (disconnectTimeouts[data.oldSocketId]) {
      clearTimeout(disconnectTimeouts[data.oldSocketId]);
      delete disconnectTimeouts[data.oldSocketId];
    }
    // لو لسه موجود (ماشالناهوش بعد)
    if (rooms[roomId].players[data.oldSocketId]) {
      rooms[roomId].players[socket.id] = rooms[roomId].players[data.oldSocketId];
      delete rooms[roomId].players[data.oldSocketId];
      rooms[roomId].players[socket.id].rejoinedAt = Date.now();
    } else {
      // اتعمل له remove - يدخل من جديد
      socket.emit('join-error', { message: 'تم إزالتك من الغرفة، ادخل من جديد' });
      return;
    }

    socketRoomMap[socket.id] = roomId;
    socketPlayerMap[socket.id] = { isHost: false, name: rooms[roomId].players[socket.id].name };
    socket.join(roomId);

    // نبعت حالة اللعبة الحالية
    var playerGameState = 'lobby';
    if (rooms[roomId].gameStarted && !rooms[roomId].modeConfirmed) {
      playerGameState = 'mode-select';
    } else if (rooms[roomId].modeConfirmed && !rooms[roomId].votingActive && !rooms[roomId].roundEnded) {
      playerGameState = 'word';
    } else if (rooms[roomId].votingActive) {
      playerGameState = 'voting';
    } else if (rooms[roomId].roundEnded) {
      playerGameState = 'result';
    }

    socket.emit('rejoin-success', { roomId: roomId, isHost: false, playerName: rooms[roomId].players[socket.id].name, gameState: playerGameState });

    // لو اللعبة بدأت، نبعت الكلمة للاعب
    if (rooms[roomId].modeConfirmed) {
      if (rooms[roomId].spySocketId === socket.id) {
        socket.emit('show-word', { word: null, category: 'عشوائي', isSpy: true });
      } else {
        socket.emit('show-word', { word: rooms[roomId].currentWord, category: 'عشوائي', isSpy: false });
      }
    }

    // لو في تصويت نشط، نبعت بيانات التصويت
    if (rooms[roomId].votingActive) {
      var players = getRoomPlayers(roomId);
      socket.emit('voting-started', {
        players: players,
        voterCount: players.length
      });
    }

    io.to(rooms[roomId].hostSocketId).emit('player-reconnected', { name: rooms[roomId].players[socket.id].name });
    emitRoomUpdate(roomId);
    console.log('Player reconnected:', rooms[roomId].players[socket.id].name, '-> Room:', roomId);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log('═══════════════════════════════════════════');
  console.log('🎮 Spy Game server running!');
  console.log('📡 Port: ' + PORT);
  console.log('🌐 Production: https://spy-game-rrmo.onrender.com');
  console.log('═══════════════════════════════════════════');
});
