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

// 📚 القاموس الشامل (مئات الكلمات المباشرة لتمويه الجاسوس)
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

// 🧠 دالة استخراج الكلمات المموهة (من نفس التصنيف عشان نلخبط الجاسوس)
function getSimilarWords(correctWord, categoryName) {
    let categoryWords = categorizedWords[categoryName];
    
    // إزالة الكلمة الصحيحة من القائمة مؤقتاً
    let filtered = categoryWords.filter(w => w !== correctWord);
    
    // خلط الكلمات الباقية
    let shuffled = filtered.sort(() => 0.5 - Math.random());
    
    // اختيار 14 كلمة للتمويه
    let selected = shuffled.slice(0, 14);

    // إضافة الكلمة الصحيحة للـ 14 كلمة وخلطهم كلهم تاني
    selected.push(correctWord);
    return selected.sort(() => 0.5 - Math.random()); 
}

io.on('connection', (socket) => {

    socket.on('createRoom', (data) => {
        const roomId = data.roomId;
        const playerId = data.playerId; 
        socket.join(roomId);
        socket.roomId = roomId;
        socket.playerId = playerId;
        
        rooms[roomId] = { 
            players: {}, 
            gameState: 'waiting',
            word: '',
            category: '', 
            spyId: null,
            votes: {}, 
            guessingWords: []
        };
        
        rooms[roomId].players[playerId] = { id: playerId, socketId: socket.id, name: '𝐒𝐀𝐒𝐔𝐊𝐄', isHost: true };
        io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));
    });

    socket.on('joinRoom', (data) => {
        const roomId = data.roomId;
        const playerId = data.playerId;

        if (rooms[roomId]) {
            socket.join(roomId);
            socket.roomId = roomId;
            socket.playerId = playerId;
            
            if (rooms[roomId].players[playerId]) {
                rooms[roomId].players[playerId].socketId = socket.id;
                rooms[roomId].players[playerId].name = data.name;
            } else {
                rooms[roomId].players[playerId] = { id: playerId, socketId: socket.id, name: data.name, isHost: false };
            }
            
            io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));
            
            if(['playing', 'voting', 'guessing', 'voting_result'].includes(rooms[roomId].gameState)) {
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

    socket.on('kickPlayer', (targetId) => {
        const roomId = socket.roomId;
        if(roomId && rooms[roomId] && rooms[roomId].players[targetId]) {
            const targetSocketId = rooms[roomId].players[targetId].socketId;
            io.to(targetSocketId).emit('youAreKickedPermanently');
            delete rooms[roomId].players[targetId];
            io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));
        }
    });

    socket.on('leaveRoom', () => {
        const roomId = socket.roomId;
        const playerId = socket.playerId;
        if (roomId && rooms[roomId] && rooms[roomId].players[playerId]) {
            
            if (rooms[roomId].spyId === playerId && ['playing', 'voting', 'guessing', 'voting_result'].includes(rooms[roomId].gameState)) {
                const spyName = rooms[roomId].players[playerId].name;
                io.to(roomId).emit('spyDisconnected', spyName);
                rooms[roomId].gameState = 'waiting';
            }

            delete rooms[roomId].players[playerId];
            io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));
            socket.leave(roomId);
        }
    });

    socket.on('goToModeSelection', () => {
        if(socket.roomId) io.to(socket.roomId).emit('showModeSelection');
    });

    socket.on('selectMode', (modeName) => io.to(socket.roomId).emit('modeSelected', modeName));
    socket.on('deselectMode', (modeName) => io.to(socket.roomId).emit('modeDeselected', modeName));

    // 🎯 بدء اللعبة واختيار الكلمة من التصنيفات
    socket.on('startRandomMode', () => {
        const roomId = socket.roomId;
        if(roomId && rooms[roomId]) {
            rooms[roomId].gameState = 'playing';
            rooms[roomId].votes = {}; 
            
            // اختيار تصنيف عشوائي من القائمة (مثلاً: جماد، أكل، حيوان)
            const categories = Object.keys(categorizedWords);
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            
            // اختيار كلمة عشوائية من هذا التصنيف
            const wordsList = categorizedWords[randomCategory];
            const randomWord = wordsList[Math.floor(Math.random() * wordsList.length)];

            // حفظ الكلمة والتصنيف في السيرفر للغرفة دي
            rooms[roomId].word = randomWord;
            rooms[roomId].category = randomCategory; 

            const playersArray = Object.values(rooms[roomId].players);
            const guests = playersArray.filter(p => !p.isHost);
            
            let spyId = guests.length > 0 ? guests[Math.floor(Math.random() * guests.length)].id : playersArray[0].id;
            rooms[roomId].spyId = spyId;

            // إرسال الكلمة للاعبين العاديين، وإرسال (التصنيف) للكل عشان الجاسوس يستفيد منه
            playersArray.forEach(player => {
                io.to(player.socketId).emit('assignRole', {
                    word: randomWord,
                    isSpy: player.id === spyId,
                    category: randomCategory // التصنيف المباشر هيظهر هنا
                });
            });
            io.to(roomId).emit('gameStarted');
        }
    });

    socket.on('startVotingPhase', () => {
        const roomId = socket.roomId;
        if(roomId && rooms[roomId]) {
            rooms[roomId].gameState = 'voting';
            io.to(roomId).emit('votingStarted', Object.values(rooms[roomId].players));
        }
    });

    socket.on('submitVote', (targetId) => {
        const roomId = socket.roomId;
        const playerId = socket.playerId;
        if(roomId && rooms[roomId] && rooms[roomId].gameState === 'voting') {
            const voterName = rooms[roomId].players[playerId].name;
            const targetName = rooms[roomId].players[targetId].name;
            
            rooms[roomId].votes[playerId] = targetId;
            const totalVotes = Object.keys(rooms[roomId].votes).length;
            const totalPlayers = Object.keys(rooms[roomId].players).length;

            io.to(roomId).emit('voteRegistered', {
                voterName: voterName,
                targetName: targetName,
                currentVotes: totalVotes,
                totalRequired: totalPlayers
            });

            if(totalVotes >= totalPlayers) {
                rooms[roomId].gameState = 'voting_result';
                
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

    // 🧠 إرسال الكلمات المموهة بناءً على التصنيف وقت التخمين
    socket.on('startGuessingPhase', () => {
        const roomId = socket.roomId;
        if(roomId && rooms[roomId]) {
            rooms[roomId].gameState = 'guessing';
            // نستدعي دالة التمويه ونبصيلها الكلمة الصح والتصنيف بتاعها
            rooms[roomId].guessingWords = getSimilarWords(rooms[roomId].word, rooms[roomId].category);
            io.to(roomId).emit('guessingPhaseStarted', rooms[roomId].guessingWords);
        }
    });

    socket.on('spyHoverWord', (word) => {
        const roomId = socket.roomId;
        const playerId = socket.playerId;
        if(roomId && rooms[roomId]) {
            const spyName = rooms[roomId].players[playerId].name;
            io.to(roomId).emit('spySelectedWord', { word: word, spyName: spyName });
        }
    });

    socket.on('spyConfirmWord', (chosenWord) => {
        const roomId = socket.roomId;
        const playerId = socket.playerId;
        if(roomId && rooms[roomId]) {
            const correctWord = rooms[roomId].word;
            const isCorrect = (chosenWord === correctWord);
            const spyName = rooms[roomId].players[playerId].name;

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
        const playerId = socket.playerId;
        if (roomId && rooms[roomId] && rooms[roomId].players[playerId]) {
            
            if (rooms[roomId].spyId === playerId && ['playing', 'voting', 'guessing', 'voting_result'].includes(rooms[roomId].gameState)) {
                const spyName = rooms[roomId].players[playerId].name;
                io.to(roomId).emit('spyDisconnected', spyName);
                rooms[roomId].gameState = 'waiting';
            }

            if (rooms[roomId].players[playerId].isHost) {
                socket.to(roomId).emit('hostDisconnected');
                delete rooms[roomId];
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});