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

const categorizedWords = {
    "مكان": ["مسجد", "مستشفى", "مدرسة", "جامعة", "مقهى", "مطعم", "حديقة", "فندق", "سينما", "مسرح", "ملعب", "مطار", "محطة قطار", "صيدلية", "سوبر ماركت", "متحف", "مكتبة", "شاطئ", "ملاهي", "بنك", "محكمة", "عيادة", "مخبز", "نادي", "مسبح", "محطة بنزين", "قسم شرطة", "سجن", "قصر", "قلعة", "خيمة", "كوخ", "كهف", "صحراء", "غابة", "جزيرة", "جبل", "بحر", "نهر", "شلال", "منزل", "شقة", "مصنع", "شركة", "ورشة", "صالون حلاقة", "صالة حديد", "استوديو", "مول", "سوق"],
    "جماد": ["ملعقة", "شوكة", "سكين", "طبق", "كأس", "طنجرة", "مقلاة", "إبريق", "خلاط", "ثلاجة", "غسالة", "شواية", "هاتف", "محفظة", "مفاتيح", "نظارة", "ساعة", "خاتم", "عطر", "حقيبة", "قلم", "دفتر", "شاحن", "سماعة", "منديل", "مرآة", "مشط", "ميدالية", "ولاعة", "سرير", "خزانة", "طاولة", "كرسي", "أريكة", "مكتب", "سجادة", "ستارة", "مصباح", "لوحة", "مزهرية", "تلفزيون", "تكييف", "مروحة", "لابتوب", "كيبورد", "ماوس", "طابعة", "كاميرا", "بامبرز", "فرشاة", "صابون", "شامبو", "منشفة", "مطرقة", "مسمار", "مفك", "منشار", "سلم", "كتاب", "مجلة", "جريدة", "ريموت", "بطارية", "لمبة", "سلك", "زجاجة", "كوب", "فنجان", "صينية", "وسادة", "بطانية", "مظلة", "قفل", "مقص", "دباسة", "مسطرة", "آلة حاسبة", "عجلة", "إطار", "موتور", "فرامل", "عصا", "حبل", "سلسلة", "صندوق", "علبة", "برميل", "دلو", "مكنسة", "ممسحة", "إسفنجة", "خرطوم", "مسدس", "بندقية", "سيف", "درع", "خنجر"],
    "أكل ومشروبات": ["بيتزا", "برجر", "شاورما", "بطاطس مقلية", "دجاج", "لحم", "سمك", "سندويش", "نقانق", "تاكو", "كباب", "فلافل", "سوشي", "نودلز", "فطيرة", "كشري", "حواوشي", "مكرونة", "أرز", "شوربة", "ستيك", "شوكولاتة", "كيك", "بسكويت", "ايس كريم", "جبنة", "بيض", "عسل", "مربى", "زبادي", "شيبسي", "فشار", "كعك", "كرواسون", "دوناتس", "ماء", "شاي", "قهوة", "حليب", "عصير", "بيبسي", "نسكافيه"],
    "حيوان": ["أسد", "نمر", "فيل", "زرافة", "قرد", "حصان", "كلب", "قطة", "فأر", "أرنب", "بقرة", "خروف", "ماعز", "حمار", "غزال", "دب", "ذئب", "ثعلب", "ضفدع", "بطريق", "نعامة", "طاووس", "صقر", "نسر", "بومة", "حمامة", "غراب", "ببغاء", "سمكة", "قرش", "حوت", "دلفين", "أخطبوط", "تمساح", "ثعبان", "سلحفاة", "سحلية", "حرباء", "نحلة", "نملة", "ذبابة", "فراشة", "عنكبوت", "عقرب", "خنفساء", "جمل", "خنزير", "فهد", "ضبع"],
    "نبات وفواكه": ["تفاح", "موز", "برتقال", "عنب", "بطيخ", "فراولة", "مانجو", "طماطم", "خيار", "جزر", "بصل", "ليمون", "ثوم", "خس", "أناناس", "خوخ", "رمان", "فلفل", "باذنجان", "بطاطا", "كوسة", "سبانخ", "بروكلي", "ذرة", "فول", "تمر", "تين", "زيتون", "جوز هند", "كيوي", "كرز", "مشمش", "كمثرى", "جوافة", "شمام", "توت", "قرنبيط", "بقدونس", "كزبرة", "نعناع", "ريحان", "شجرة", "وردة", "ياسمين", "صبار"],
    "وظيفة": ["طبيب", "مهندس", "معلم", "شرطي", "طباخ", "ميكانيكي", "نجار", "سباك", "محامي", "قاضي", "طيار", "ممرض", "محاسب", "حلاق", "خياط", "إطفائي", "صحفي", "مزارع", "خباز", "مبرمج", "رسام", "مغني", "ممثل", "مخرج", "مصور", "جزار", "صياد", "حداد", "عالم", "رائد فضاء", "جندي", "بحار", "كاتب", "مؤلف", "حارس", "سائق", "قبطان", "مضيف", "بائع", "مدير"],
    "ملابس": ["قميص", "بنطلون", "فستان", "تنورة", "حذاء", "جورب", "قبعة", "معطف", "سترة", "وشاح", "قفازات", "حزام", "بيجامة", "ربطة عنق", "شورت", "صندل", "جاكيت", "خوذة", "نظارة", "ساعة", "عباءة", "جلابية", "بدلة", "بلوفر", "تي شيرت", "ملابس داخلية"],
    "مواصلات": ["سيارة", "حافلة", "قطار", "طائرة", "دراجة", "سفينة", "قارب", "غواصة", "هليكوبتر", "تاكسي", "مترو", "شاحنة", "إسعاف", "إطفاء", "دبابة", "يخت", "تلفريك", "صاروخ", "جرار", "توك توك", "ميكروباص", "عربة", "حنطور", "موتوسيكل", "سكوتر"]
};

function getSimilarWords(correctWord, categoryName) {
    let categoryWords = categorizedWords[categoryName];
    let filtered = categoryWords.filter(w => w !== correctWord);
    let shuffled = filtered.sort(() => 0.5 - Math.random());
    let selected = shuffled.slice(0, 14);
    selected.push(correctWord);
    return selected.sort(() => 0.5 - Math.random()); 
}

function checkVotingResult(roomId) {
    if (!rooms[roomId]) return;
    rooms[roomId].gameState = 'voting_result';
    const voteCounts = {};
    Object.values(rooms[roomId].votes).forEach(id => { voteCounts[id] = (voteCounts[id] || 0) + 1; });
    let maxVotes = 0; let topVotedId = null;
    for (const [id, count] of Object.entries(voteCounts)) { if (count > maxVotes) { maxVotes = count; topVotedId = id; } }
    const isSpyCaught = (topVotedId === rooms[roomId].spyId);
    const votedPlayer = rooms[roomId].players[topVotedId];
    const votedPlayerName = votedPlayer ? votedPlayer.name : "لاعب غادر";
    const spyPlayer = rooms[roomId].players[rooms[roomId].spyId];
    const spyName = spyPlayer ? spyPlayer.name : "الجاسوس";

    io.to(roomId).emit('votingEnded', { isSpyCaught: isSpyCaught, votedPlayerName: votedPlayerName, spyName: spyName, spyId: rooms[roomId].spyId });
}

function handlePlayerLeave(roomId, playerId) {
    if (!rooms[roomId] || !rooms[roomId].players[playerId]) return;

    const isHost = rooms[roomId].players[playerId].isHost;
    const wasVoting = (rooms[roomId].gameState === 'voting');

    if (rooms[roomId].spyId === playerId && ['playing', 'voting', 'guessing', 'voting_result'].includes(rooms[roomId].gameState)) {
        const spyName = rooms[roomId].players[playerId].name;
        io.to(roomId).emit('spyDisconnected', spyName);
        if(rooms[roomId].guessTimer) clearTimeout(rooms[roomId].guessTimer);
        rooms[roomId].gameState = 'waiting';
    }

    delete rooms[roomId].players[playerId];

    if (isHost) {
        io.to(roomId).emit('hostDisconnected');
        delete rooms[roomId];
    } else {
        if (rooms[roomId]) {
            io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));
            if (wasVoting) {
                if (rooms[roomId].votes[playerId]) delete rooms[roomId].votes[playerId];
                const totalVotes = Object.keys(rooms[roomId].votes).length;
                const remainingPlayersCount = Object.keys(rooms[roomId].players).length;

                io.to(roomId).emit('playerRemovedFromVoting', playerId);
                io.to(roomId).emit('voteRegistered', { voterName: "النظام", targetName: "", currentVotes: totalVotes, totalRequired: remainingPlayersCount });

                if (totalVotes >= remainingPlayersCount && remainingPlayersCount > 0) {
                    checkVotingResult(roomId);
                }
            }
        }
    }
}

io.on('connection', (socket) => {

    socket.on('createRoom', (data) => {
        const roomId = data.roomId;
        const playerId = data.playerId; 
        socket.join(roomId); socket.roomId = roomId; socket.playerId = playerId;
        
        // لو الغرفة مش موجودة نعملها (عشان لو الهوست عمل ريفرش الغرفة ماتتمسحش)
        if (!rooms[roomId]) {
            rooms[roomId] = { players: {}, gameState: 'waiting', word: '', category: '', spyId: null, votes: {}, guessingWords: [], guessTimer: null, guessEndTime: 0 };
        }
        
        // إلغاء مؤقت الطرد لو الهوست رجع
        if (rooms[roomId].players[playerId] && rooms[roomId].players[playerId].disconnectTimeout) {
            clearTimeout(rooms[roomId].players[playerId].disconnectTimeout);
            rooms[roomId].players[playerId].disconnectTimeout = null;
        }

        const existingName = rooms[roomId].players[playerId] ? rooms[roomId].players[playerId].name : '𝐒𝐀𝐒𝐔𝐊𝐄';
        rooms[roomId].players[playerId] = { id: playerId, socketId: socket.id, name: existingName, isHost: true };
        
        io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));
        
        // مزامنة الشاشات للهوست لو رجع أثناء اللعب
        const state = rooms[roomId].gameState;
        if(['playing', 'voting', 'guessing', 'voting_result'].includes(state)) {
            const isSpy = rooms[roomId].spyId === playerId;
            socket.emit('assignRole', { word: rooms[roomId].word, isSpy: isSpy, category: rooms[roomId].category });
            socket.emit('gameStarted');
            if (state === 'voting' || state === 'voting_result') {
                socket.emit('votingStarted', Object.values(rooms[roomId].players));
                const totalVotes = Object.keys(rooms[roomId].votes).length;
                const totalRequired = Object.keys(rooms[roomId].players).length;
                socket.emit('voteRegistered', { voterName: "النظام", targetName: "", currentVotes: totalVotes, totalRequired: totalRequired });
                if (rooms[roomId].votes[playerId]) socket.emit('youAlreadyVoted', rooms[roomId].votes[playerId]);
            } else if (state === 'guessing') {
                let timeLeft = 30;
                if (rooms[roomId].guessEndTime) timeLeft = Math.max(1, Math.ceil((rooms[roomId].guessEndTime - Date.now()) / 1000));
                socket.emit('guessingPhaseStarted', { words: rooms[roomId].guessingWords, duration: timeLeft });
            }
        }
    });

    socket.on('joinRoom', (data) => {
        const roomId = data.roomId;
        const playerId = data.playerId;

        if (rooms[roomId]) {
            socket.join(roomId); socket.roomId = roomId; socket.playerId = playerId;
            
            if (rooms[roomId].players[playerId]) {
                // 🔥 اللاعب ده موجود وبيعمل Reconnect (رجع من تيك توك مثلاً)
                if (rooms[roomId].players[playerId].disconnectTimeout) {
                    clearTimeout(rooms[roomId].players[playerId].disconnectTimeout);
                    rooms[roomId].players[playerId].disconnectTimeout = null;
                }
                rooms[roomId].players[playerId].socketId = socket.id;
                // نحافظ على اسمه زي ما هو بدون تكرار
            } else {
                // 🔥 لاعب جديد تماماً، نتأكد إن اسمه مش مكرر
                let finalName = data.name.trim(); let suffix = 1;
                while(Object.values(rooms[roomId].players).some(p => p.name === finalName)) {
                    finalName = `${data.name.trim()} (${suffix})`; suffix++;
                }
                rooms[roomId].players[playerId] = { id: playerId, socketId: socket.id, name: finalName, isHost: false };
            }
            
            io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));
            
            // مزامنة الشاشات للضيوف لو رجعوا أثناء اللعب
            const state = rooms[roomId].gameState;
            if(['playing', 'voting', 'guessing', 'voting_result'].includes(state)) {
                const isSpy = rooms[roomId].spyId === playerId;
                socket.emit('assignRole', { word: rooms[roomId].word, isSpy: isSpy, category: rooms[roomId].category });
                socket.emit('gameStarted');

                if (state === 'voting' || state === 'voting_result') {
                    socket.emit('votingStarted', Object.values(rooms[roomId].players));
                    const totalVotes = Object.keys(rooms[roomId].votes).length;
                    const totalRequired = Object.keys(rooms[roomId].players).length;
                    socket.emit('voteRegistered', { voterName: "النظام", targetName: "", currentVotes: totalVotes, totalRequired: totalRequired });
                    if (rooms[roomId].votes[playerId]) socket.emit('youAlreadyVoted', rooms[roomId].votes[playerId]);
                } else if (state === 'guessing') {
                    let timeLeft = 30;
                    if (rooms[roomId].guessEndTime) timeLeft = Math.max(1, Math.ceil((rooms[roomId].guessEndTime - Date.now()) / 1000));
                    socket.emit('guessingPhaseStarted', { words: rooms[roomId].guessingWords, duration: timeLeft });
                }
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

    socket.on('kickPlayer', (targetId) => {
        const roomId = socket.roomId;
        if(roomId && rooms[roomId] && rooms[roomId].players[targetId]) {
            const targetSocketId = rooms[roomId].players[targetId].socketId;
            if (rooms[roomId].players[targetId].disconnectTimeout) clearTimeout(rooms[roomId].players[targetId].disconnectTimeout);
            io.to(targetSocketId).emit('youAreKickedPermanently');
            handlePlayerLeave(roomId, targetId);
        }
    });

    socket.on('leaveRoom', () => {
        const roomId = socket.roomId;
        const playerId = socket.playerId;
        if (roomId && rooms[roomId] && rooms[roomId].players[playerId]) {
            if (rooms[roomId].players[playerId].disconnectTimeout) clearTimeout(rooms[roomId].players[playerId].disconnectTimeout);
            handlePlayerLeave(roomId, playerId);
            socket.leave(roomId);
        }
    });

    socket.on('goToModeSelection', () => { if(socket.roomId) io.to(socket.roomId).emit('showModeSelection'); });
    socket.on('selectMode', (modeName) => io.to(socket.roomId).emit('modeSelected', modeName));
    socket.on('deselectMode', (modeName) => io.to(socket.roomId).emit('modeDeselected', modeName));

    socket.on('startRandomMode', () => {
        const roomId = socket.roomId;
        if(roomId && rooms[roomId]) {
            rooms[roomId].gameState = 'playing'; rooms[roomId].votes = {}; 
            if(rooms[roomId].guessTimer) clearTimeout(rooms[roomId].guessTimer);
            
            const categories = Object.keys(categorizedWords);
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            const wordsList = categorizedWords[randomCategory];
            const randomWord = wordsList[Math.floor(Math.random() * wordsList.length)];

            rooms[roomId].word = randomWord; rooms[roomId].category = randomCategory; 

            const playersArray = Object.values(rooms[roomId].players);
            const guests = playersArray.filter(p => !p.isHost);
            let spyId = guests.length > 0 ? guests[Math.floor(Math.random() * guests.length)].id : playersArray[0].id;
            rooms[roomId].spyId = spyId;

            playersArray.forEach(player => {
                io.to(player.socketId).emit('assignRole', { word: randomWord, isSpy: player.id === spyId, category: randomCategory });
            });
            io.to(roomId).emit('gameStarted');
        }
    });

    socket.on('startVotingPhase', () => {
        const roomId = socket.roomId;
        if(roomId && rooms[roomId]) {
            rooms[roomId].gameState = 'voting'; io.to(roomId).emit('votingStarted', Object.values(rooms[roomId].players));
        }
    });

    socket.on('submitVote', (targetId) => {
        const roomId = socket.roomId; const playerId = socket.playerId;
        if(roomId && rooms[roomId] && rooms[roomId].gameState === 'voting') {
            const voterName = rooms[roomId].players[playerId].name;
            const targetName = rooms[roomId].players[targetId] ? rooms[roomId].players[targetId].name : "لاعب غادر";
            
            rooms[roomId].votes[playerId] = targetId;
            const totalVotes = Object.keys(rooms[roomId].votes).length;
            const totalPlayers = Object.keys(rooms[roomId].players).length;

            io.to(roomId).emit('voteRegistered', { voterName: voterName, targetName: targetName, currentVotes: totalVotes, totalRequired: totalPlayers });
            if(totalVotes >= totalPlayers) checkVotingResult(roomId);
        }
    });

    socket.on('startGuessingPhase', () => {
        const roomId = socket.roomId;
        if(roomId && rooms[roomId]) {
            rooms[roomId].gameState = 'guessing';
            rooms[roomId].guessingWords = getSimilarWords(rooms[roomId].word, rooms[roomId].category);
            rooms[roomId].guessEndTime = Date.now() + 30000; 
            
            io.to(roomId).emit('guessingPhaseStarted', { words: rooms[roomId].guessingWords, duration: 30 });

            if(rooms[roomId].guessTimer) clearTimeout(rooms[roomId].guessTimer);
            rooms[roomId].guessTimer = setTimeout(() => {
                if(rooms[roomId] && rooms[roomId].gameState === 'guessing') {
                    io.to(roomId).emit('spyTimeOut');
                    rooms[roomId].gameState = 'waiting';
                }
            }, 30000); 
        }
    });

    socket.on('spyHoverWord', (word) => {
        const roomId = socket.roomId; const playerId = socket.playerId;
        if(roomId && rooms[roomId]) {
            const spyName = rooms[roomId].players[playerId].name;
            io.to(roomId).emit('spySelectedWord', { word: word, spyName: spyName });
        }
    });

    socket.on('spyConfirmWord', (chosenWord) => {
        const roomId = socket.roomId; const playerId = socket.playerId;
        if(roomId && rooms[roomId]) {
            if(rooms[roomId].guessTimer) clearTimeout(rooms[roomId].guessTimer); 
            const correctWord = rooms[roomId].word;
            const isCorrect = (chosenWord === correctWord);
            const spyName = rooms[roomId].players[playerId].name;
            io.to(roomId).emit('gameFinalResult', { spyName: spyName, chosenWord: chosenWord, correctWord: correctWord, isCorrect: isCorrect });
        }
    });

    socket.on('restartGame', () => {
        if(socket.roomId && rooms[socket.roomId]) {
            if(rooms[socket.roomId].guessTimer) clearTimeout(rooms[socket.roomId].guessTimer);
            rooms[socket.roomId].gameState = 'waiting'; rooms[socket.roomId].votes = {}; io.to(socket.roomId).emit('gameRestarted');
        }
    });

    // 🔥 مهلة 60 ثانية للموبايلات لو قطع الاتصال
    socket.on('disconnect', () => {
        const roomId = socket.roomId;
        const playerId = socket.playerId;
        if (roomId && rooms[roomId] && rooms[roomId].players[playerId]) {
            rooms[roomId].players[playerId].disconnectTimeout = setTimeout(() => {
                handlePlayerLeave(roomId, playerId);
            }, 60000); // 60 ثانية بدل 30
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});