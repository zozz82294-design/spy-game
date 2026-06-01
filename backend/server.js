const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.resolve(__dirname, '..', 'public')));
app.get('/health', (req, res) => res.status(200).send('OK'));

let rooms = {};

const categorizedWords = {
    "حاجات جوا وبرا البيت": ["سرير", "مخدة", "بطانية", "دولاب", "شماعة", "مراية", "سجادة", "ستارة", "نجفة", "لمبة", "فيشة", "مفتاح", "باب", "شباك", "بلكونة", "ريموت", "تلفزيون", "كنبة", "كرسي", "طاولة", "مكتب", "ساعة حائط", "فازة", "وردة", "صورة", "مروحة", "تكييف", "دفاية", "غسالة", "ثلاجة", "بوتاجاز", "فرن", "ميكروويف", "خلاط", "كاتل", "حنفية", "حوض", "صابونة", "فوطة", "ليفة", "شامبو", "معجون أسنان", "فرشاة أسنان", "مشط", "مقص أظافر", "استشوار", "مكواة", "مكنسة", "ممسحة", "مقشة", "جاروف", "زبالة", "كيس", "علبة", "صندوق", "درج", "قفل", "شنطة", "محفظة", "نظارة", "شاحن", "سماعة", "لاب توب", "تابلت", "كيبورد", "ماوس", "سلك", "كرتونة", "مسمار", "شاكوش", "مفك", "بنسة", "غراء", "شريط لحام", "بطارية", "ولاعة", "شمعة", "كبريت", "مبخرة", "سبحة", "سجادة صلاة", "مصحف", "قلم", "ورقة", "دباسة", "استيكة", "براية", "مسطرة", "لون", "لوحة", "ملف", "تقويم", "نوتة", "منبه", "حصالة", "ميزان", "طفاية حريق", "عمود نور", "إشارة مرور", "رصيف", "يافطة", "صندوق زبالة", "كشك", "نافورة", "تمثال", "سور", "بوابة"],
    "أكل وشرب": ["أرز", "مكرونة", "عيش", "بيض", "جبنة", "لبن", "زبادي", "عسل", "حلاوة", "مربى", "زيت", "سمنة", "زبدة", "ملح", "سكر", "فلفل", "كمون", "شطة", "كاتشب", "مايونيز", "بطاطس", "طماطم", "خيار", "بصل", "ثوم", "جزر", "فلفل رومي", "بتنجان", "كوسة", "بسلة", "فاصوليا", "عدس", "فول", "طعمية", "كشري", "حواوشي", "بيتزا", "برجر", "شاورما", "كباب", "كفتة", "فراخ", "لحمة", "سمك", "تونة", "كبدة", "شوربة", "سلطة", "مخلل", "شيبسي", "لبان", "بونبوني", "شوكولاتة", "بسكويت", "كيكة", "ايس كريم", "كنافة", "بسبوسة", "فاكهة", "تفاح", "موز", "برتقال", "عنب", "بطيخ", "مانجو", "فراولة", "خوخ", "رمان", "كمثرى", "جوافة", "تمر", "تين", "مشمش", "أناناس", "كيوي", "كانز", "مياه", "شاي", "قهوة", "عصير", "بيبسي", "كوكاكولا", "سفن اب", "ميرندا", "عصير قصب", "تمر هندي", "سوبيا", "لبن رايب", "ينسون", "نعناع", "قرفة", "كاكاو", "نسكافيه", "كابتشينو", "شاي بلبن", "سحلب", "خروب"],
    "أدوات وأشياء": ["سكينة", "شوكة", "معلقة", "طبق", "كوباية", "فنجان", "براد", "حلة", "طاسة", "صينية", "مبشرة", "مقشرة", "مصفاة", "هراسة", "مغرفة", "هون", "لبانة", "كنكة", "طقم توابل", "برطمان", "ترمس", "طرشي", "زمزمية", "لانش بوكس", "شنطة سفر", "كوتشي", "صندل", "شبشب", "شراب", "قميص", "بنطلون", "تيشيرت", "بلوفر", "جاكيت", "بالطو", "بدلة", "فستان", "طرحة", "جيبة", "بيجامة", "جلاليبة", "عباية", "كاب", "برنيطة", "جوانتي", "كوفية", "حزام", "كرافتة", "ساعة يد", "خاتم", "غويشة", "سلسلة", "حلق", "توكة", "بنسة شعر", "بروش", "ميدالية", "شمسية", "علم", "خريطة", "بوصلة", "تلسكوب", "ميكروسكوب", "كاميرا", "ميكروفون", "بيانو", "جيتار", "طبلة", "كمانجة", "ناي", "قانون", "سماعة دي جي", "مروحة ايد", "ريشة", "كرة قدم", "كرة سلة", "مضرب تنس", "طاولة بينج بونج", "شطرنج", "دومينو", "كوتشينة", "سلم وتعبان", "لودو", "طيارة ورق", "مرجيحة", "زحليقة"],
    "أماكن ومواصلات": ["جامع", "كنيسة", "مستشفى", "صيدلية", "مدرسة", "حضانة", "جامعة", "سنتر", "مكتبة", "محل", "سوبر ماركت", "مول", "مطعم", "كافيه", "ورشة", "بنك", "بنزينة", "قسم شرطة", "مطافي", "سجن", "محكمة", "سفارة", "قصر", "فيلا", "عمارة", "شقة", "فندق", "سينما", "مسرح", "كباريه", "سيرك", "ملاهي", "حديقة", "جنينة", "غابة", "صحراء", "شاطئ", "بحر", "نهر", "بحيرة", "جبل", "كهف", "شارع", "كوبري", "نفق", "محطة", "رصيف", "مطار", "ميناء", "مركب", "سفينة", "لنش", "يخت", "قارب", "غواصة", "طيارة", "هليكوبتر", "سيارة", "تاكسي", "ميكروباص", "اتوبيس", "مترو", "قطار", "ترام", "توكتوك", "موتوسيكل", "فيسبا", "عجلة", "سكوتر", "لودر", "ونش", "عربية اسعاف", "عربية مطافي", "بوكس شرطة", "دبابة"],
    "حيوانات ونباتات": ["أسد", "نمر", "فهد", "ذئب", "ثعلب", "كلب", "قطة", "فار", "أرنب", "قرد", "نسناس", "فيل", "زرافة", "حصان", "حمار", "جمل", "بقرة", "جاموسة", "خروف", "معزة", "خنزير", "غزال", "دب", "باندا", "كنغر", "كوالا", "تمساح", "ثعبان", "سحلية", "برص", "سلحفاة", "ضفدع", "سمكة", "قرش", "حوت", "دولفين", "أخطبوط", "قنديل بحر", "استاكوزا", "كابوريا", "نحلة", "نملة", "دبانة", "ناموسة", "صرصار", "عنكبوت", "عقرب", "فراشة", "غراب", "حمامة", "عصفور", "صقر", "نسر", "بومة", "ببغاء", "بطة", "وزة", "فرخة", "ديك", "ديك رومي", "نعامة", "بطريق", "شجرة", "نخلة", "صبار", "نجيلة", "غصن", "ورقة شجر", "ليمونة", "برتقالة", "بذرة"],
    "مهن ووظائف": ["دكتور", "مهندس", "مدرس", "ضابط", "محامي", "قاضي", "طيار", "ممرضة", "صيدلي", "نجار", "سباك", "كهربائي", "حداد", "جزار", "خباز", "حلاق", "كوافير", "محاسب", "مدير", "سكرتير", "صحفي", "مذيع", "ممثل", "مغني", "رسام", "كاتب", "عالم", "فلاح", "سواق", "بواب", "حارس", "طباخ", "جرسون", "عامل", "ميكانيكي", "صياد", "مفتش"],
    "رياضة وهوايات": ["كرة قدم", "كرة سلة", "كرة طائرة", "تنس", "تنس طاولة", "اسكواش", "سباحة", "غوص", "جري", "مشي", "عجل", "فروسية", "ملاكمة", "مصارعة", "كاراتيه", "جودو", "تايكوندو", "جمباز", "رفع أثقال", "شطرنج", "قراءة", "كتابة", "رسم", "تلوين", "عزف", "غناء", "تصوير", "صيد", "طبخ", "خياطة", "تطريز", "نحت", "تخييم"],
    "أجهزة وتكنولوجيا": ["موبايل", "لابتوب", "كمبيوتر", "ايباد", "تابلت", "سماعة", "مايك", "كاميرا", "شاشة", "بروجيكتور", "طابعة", "راوتر", "فلاشة", "هارد", "كيبورد", "ماوس", "بلايستيشن", "اكس بوكس", "ذراع تحكم", "شاحن", "باور بانك", "ساعة ذكية", "نظارة واقع افتراضي", "روبوت", "تكييف", "تلفزيون", "راديو"]
};

process.on('uncaughtException', (err) => { console.error('Uncaught Exception:', err); });
process.on('unhandledRejection', (reason, promise) => { console.error('Unhandled Rejection:', reason); });

function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex); currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function getSimilarWords(correctWord, categoryName) {
    let categoryWords = categorizedWords[categoryName] || [];
    let filtered = categoryWords.filter(w => w !== correctWord);
    filtered = shuffleArray(filtered);
    let selected = filtered.slice(0, 14);

    if (selected.length < 14) {
        let otherWords = [];
        Object.keys(categorizedWords).forEach(cat => { if (cat !== categoryName) otherWords.push(...categorizedWords[cat]); });
        otherWords = otherWords.filter(w => w !== correctWord && !selected.includes(w));
        otherWords = shuffleArray(otherWords);
        selected = selected.concat(otherWords.slice(0, 14 - selected.length));
    }
    selected.push(correctWord); return shuffleArray(selected); 
}

function cleanupRoom(roomId) {
    if (!rooms[roomId]) return;
    if (rooms[roomId].guessTimer) clearTimeout(rooms[roomId].guessTimer);
    if (rooms[roomId].tieTimer) clearTimeout(rooms[roomId].tieTimer);
    if (rooms[roomId].players) { Object.values(rooms[roomId].players).forEach(p => { if (p.disconnectTimeout) clearTimeout(p.disconnectTimeout); }); }
    delete rooms[roomId];
}

function checkVotingResult(roomId) {
    if (!rooms[roomId]) return;
    const voteCounts = {};
    Object.values(rooms[roomId].votes).forEach(id => { voteCounts[id] = (voteCounts[id] || 0) + 1; });
    let maxVotes = 0;
    for (const count of Object.values(voteCounts)) { if (count > maxVotes) maxVotes = count; }
    const tiedIds = [];
    for (const [id, count] of Object.entries(voteCounts)) { if (count === maxVotes) tiedIds.push(id); }
    const totalPlayers = Object.keys(rooms[roomId].players).length;
    
    if (tiedIds.length > 1 && totalPlayers > 1) {
        rooms[roomId].gameState = 'voting_tied';
        const tiedNames = tiedIds.map(id => rooms[roomId].players[id] ? rooms[roomId].players[id].name : "لاعب غادر").join(' و ');
        io.to(roomId).emit('votingTied', { tiedNames: tiedNames });
        rooms[roomId].votes = {}; 
        if (rooms[roomId].tieTimer) clearTimeout(rooms[roomId].tieTimer);
        rooms[roomId].tieTimer = setTimeout(() => {
            if(rooms[roomId] && rooms[roomId].gameState === 'voting_tied') {
                rooms[roomId].gameState = 'voting'; io.to(roomId).emit('votingStarted', Object.values(rooms[roomId].players));
            }
        }, 12000); 
        return;
    }

    rooms[roomId].gameState = 'voting_result';
    const topVotedId = tiedIds[0];
    const isSpyCaught = (topVotedId === rooms[roomId].spyId);
    const votedPlayer = rooms[roomId].players[topVotedId]; const votedPlayerName = votedPlayer ? votedPlayer.name : "لاعب غادر";
    const spyPlayer = rooms[roomId].players[rooms[roomId].spyId]; const spyName = spyPlayer ? spyPlayer.name : "الجاسوس";
    io.to(roomId).emit('votingEnded', { isSpyCaught: isSpyCaught, votedPlayerName: votedPlayerName, spyName: spyName, spyId: rooms[roomId].spyId });
}

function handlePlayerLeave(roomId, playerId) {
    if (!rooms[roomId] || !rooms[roomId].players[playerId]) return;
    const isHost = rooms[roomId].players[playerId].isHost;
    const wasVoting = (rooms[roomId].gameState === 'voting');
    let gameAborted = false;

    if (isHost) {
        const hostName = rooms[roomId].players[playerId].name; io.to(roomId).emit('hostLeftRoom', hostName); cleanupRoom(roomId); return; 
    }

    if (rooms[roomId].spyId === playerId && ['playing', 'voting', 'guessing', 'voting_result', 'voting_tied'].includes(rooms[roomId].gameState)) {
        if(rooms[roomId].guessTimer) clearTimeout(rooms[roomId].guessTimer); if(rooms[roomId].tieTimer) clearTimeout(rooms[roomId].tieTimer);
        rooms[roomId].gameState = 'waiting'; rooms[roomId].votes = {}; io.to(roomId).emit('gameRestarted'); gameAborted = true;
    }

    delete rooms[roomId].players[playerId];

    if (rooms[roomId]) {
        io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));
        if (Object.keys(rooms[roomId].players).length === 0) { cleanupRoom(roomId); return; }
        if (wasVoting && !gameAborted) {
            if (rooms[roomId].votes[playerId]) delete rooms[roomId].votes[playerId];
            const totalVotes = Object.keys(rooms[roomId].votes).length; const remainingPlayersCount = Object.keys(rooms[roomId].players).length;
            io.to(roomId).emit('playerRemovedFromVoting', playerId); io.to(roomId).emit('voteRegistered', { voterName: "النظام", targetName: "", currentVotes: totalVotes, totalRequired: remainingPlayersCount });
            if (totalVotes >= remainingPlayersCount && remainingPlayersCount > 0) checkVotingResult(roomId);
        }
    }
}

io.on('connection', (socket) => {
    socket.on('createRoom', (data) => {
        try {
            const roomId = data.roomId; const playerId = data.playerId; 
            socket.join(roomId); socket.roomId = roomId; socket.playerId = playerId;
            
            if (!rooms[roomId]) {
                rooms[roomId] = { players: {}, gameState: 'waiting', word: '', category: '', spyId: null, votes: {}, guessingWords: [], guessTimer: null, tieTimer: null, guessEndTime: 0, featureVotes: { hints: [], questions: [] }, wordMapping: {}, playedRounds: {} };
                for (let cat in categorizedWords) { rooms[roomId].wordMapping[cat] = shuffleArray([...categorizedWords[cat]]); rooms[roomId].playedRounds[cat] = []; }
            }
            
            if (rooms[roomId].players[playerId] && rooms[roomId].players[playerId].disconnectTimeout) { clearTimeout(rooms[roomId].players[playerId].disconnectTimeout); rooms[roomId].players[playerId].disconnectTimeout = null; }
            const existingName = rooms[roomId].players[playerId] ? rooms[roomId].players[playerId].name : '𝐒𝐀𝐒𝐔𝐊𝐄';
            rooms[roomId].players[playerId] = { id: playerId, socketId: socket.id, name: existingName, isHost: true };
            io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));
            
            const state = rooms[roomId].gameState; socket.emit('syncState', state);

            if(['playing', 'voting', 'guessing', 'voting_result', 'voting_tied'].includes(state)) {
                socket.emit('gameStarted', { word: rooms[roomId].word, isSpy: rooms[roomId].spyId === playerId, category: rooms[roomId].category });
                if (state === 'voting' || state === 'voting_result' || state === 'voting_tied') {
                    socket.emit('votingStarted', Object.values(rooms[roomId].players));
                    socket.emit('voteRegistered', { voterName: "النظام", targetName: "", currentVotes: Object.keys(rooms[roomId].votes).length, totalRequired: Object.keys(rooms[roomId].players).length });
                    if (rooms[roomId].votes[playerId]) socket.emit('youAlreadyVoted', rooms[roomId].votes[playerId]);
                } else if (state === 'guessing') {
                    let timeLeft = rooms[roomId].guessEndTime ? Math.max(1, Math.ceil((rooms[roomId].guessEndTime - Date.now()) / 1000)) : 30;
                    socket.emit('guessingPhaseStarted', { words: rooms[roomId].guessingWords, duration: timeLeft });
                }
            }
        } catch (e) {}
    });

    socket.on('joinRoom', (data) => {
        try {
            const roomId = data.roomId; const playerId = data.playerId;
            if (rooms[roomId]) {
                const isExistingPlayer = !!rooms[roomId].players[playerId];
                if (!isExistingPlayer && rooms[roomId].gameState !== 'waiting') { socket.emit('errorMsg', 'لقد بدأت اللعبة بالفعل! 🚫 لا يمكنك الانضمام الآن.'); return; }

                socket.join(roomId); socket.roomId = roomId; socket.playerId = playerId;
                
                if (isExistingPlayer) {
                    if (rooms[roomId].players[playerId].disconnectTimeout) { clearTimeout(rooms[roomId].players[playerId].disconnectTimeout); rooms[roomId].players[playerId].disconnectTimeout = null; }
                    rooms[roomId].players[playerId].socketId = socket.id;
                } else {
                    let finalName = data.name.trim(); let suffix = 1;
                    while(Object.values(rooms[roomId].players).some(p => p.name === finalName)) { finalName = `${data.name.trim()} (${suffix})`; suffix++; }
                    rooms[roomId].players[playerId] = { id: playerId, socketId: socket.id, name: finalName, isHost: false };
                }
                io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));
                
                const state = rooms[roomId].gameState; socket.emit('syncState', state);

                if(['playing', 'voting', 'guessing', 'voting_result', 'voting_tied'].includes(state)) {
                    socket.emit('gameStarted', { word: rooms[roomId].word, isSpy: rooms[roomId].spyId === playerId, category: rooms[roomId].category });
                    if (state === 'voting' || state === 'voting_result' || state === 'voting_tied') {
                        socket.emit('votingStarted', Object.values(rooms[roomId].players));
                        socket.emit('voteRegistered', { voterName: "النظام", targetName: "", currentVotes: Object.keys(rooms[roomId].votes).length, totalRequired: Object.keys(rooms[roomId].players).length });
                        if (rooms[roomId].votes[playerId]) socket.emit('youAlreadyVoted', rooms[roomId].votes[playerId]);
                    } else if (state === 'guessing') {
                        let timeLeft = rooms[roomId].guessEndTime ? Math.max(1, Math.ceil((rooms[roomId].guessEndTime - Date.now()) / 1000)) : 30;
                        socket.emit('guessingPhaseStarted', { words: rooms[roomId].guessingWords, duration: timeLeft });
                    }
                }
            } else socket.emit('errorMsg', 'الغرفة دي مش موجودة أو الهوست قفل اللعبة!');
        } catch (e) {}
    });

    // 🔥 تعديل أمر تغيير الاسم عشان نقفله نهائياً على اللاعب
    socket.on('changePlayerName', (data) => { 
        try { 
            if(socket.roomId && rooms[socket.roomId] && rooms[socket.roomId].players[data.targetId]) { 
                rooms[socket.roomId].players[data.targetId].name = data.newName; 
                io.to(socket.roomId).emit('updatePlayers', Object.values(rooms[socket.roomId].players)); 
                // إرسال أمر إغلاق الاسم للاعب المستهدف
                io.to(rooms[socket.roomId].players[data.targetId].socketId).emit('forceNameLock', data.newName);
            } 
        } catch(e){} 
    });

    socket.on('kickPlayer', (targetId) => { try { const roomId = socket.roomId; if(roomId && rooms[roomId] && rooms[roomId].players[targetId]) { io.to(rooms[roomId].players[targetId].socketId).emit('youAreKickedPermanently'); handlePlayerLeave(roomId, targetId); } } catch(e){} });
    socket.on('leaveRoom', () => { try { const roomId = socket.roomId; const playerId = socket.playerId; if (roomId && rooms[roomId] && rooms[roomId].players[playerId]) { handlePlayerLeave(roomId, playerId); socket.leave(roomId); } } catch(e){} });
    socket.on('goToModeSelection', () => { try { if(socket.roomId && rooms[socket.roomId]) { rooms[socket.roomId].featureVotes = { hints: [], questions: [] }; io.to(socket.roomId).emit('showModeSelection'); } } catch(e){} });

    socket.on('voteFeature', (feature) => {
        try {
            const roomId = socket.roomId; const playerId = socket.playerId;
            if(roomId && rooms[roomId]) {
                rooms[roomId].featureVotes = rooms[roomId].featureVotes || { hints: [], questions: [] };
                let hints = rooms[roomId].featureVotes.hints; let questions = rooms[roomId].featureVotes.questions;
                if (feature === 'hint') { if (hints.includes(playerId)) hints = hints.filter(id => id !== playerId); else { hints.push(playerId); questions = questions.filter(id => id !== playerId); } } 
                else if (feature === 'question') { if (questions.includes(playerId)) questions = questions.filter(id => id !== playerId); else { questions.push(playerId); hints = hints.filter(id => id !== playerId); } }
                rooms[roomId].featureVotes.hints = hints; rooms[roomId].featureVotes.questions = questions;
                io.to(roomId).emit('updateFeatureVotes', { hints: hints.length, questions: questions.length });
            }
        } catch(e){}
    });

    socket.on('selectCategory', (cat) => { io.to(socket.roomId).emit('categorySelected', cat); });
    socket.on('spinWheel', (targetCat) => { io.to(socket.roomId).emit('wheelSpinning', targetCat); });

    socket.on('requestRounds', (categoryName) => {
        try {
            const roomId = socket.roomId;
            if(roomId && rooms[roomId]) {
                const totalRounds = rooms[roomId].wordMapping[categoryName].length;
                const playedRounds = rooms[roomId].playedRounds[categoryName] || [];
                io.to(roomId).emit('showRoundsPhase', { category: categoryName, totalRounds: totalRounds, playedRounds: playedRounds });
            }
        } catch(e){}
    });

    socket.on('startRound', (data) => {
        try {
            const roomId = socket.roomId; const categoryName = data.category; const roundIndex = data.roundIndex;
            if(roomId && rooms[roomId]) {
                rooms[roomId].gameState = 'playing'; rooms[roomId].votes = {}; 
                if(rooms[roomId].guessTimer) clearTimeout(rooms[roomId].guessTimer); if(rooms[roomId].tieTimer) clearTimeout(rooms[roomId].tieTimer);
                if (!rooms[roomId].playedRounds[categoryName].includes(roundIndex)) { rooms[roomId].playedRounds[categoryName].push(roundIndex); }
                const selectedWord = rooms[roomId].wordMapping[categoryName][roundIndex];
                rooms[roomId].word = selectedWord; rooms[roomId].category = categoryName; 
                const playersArray = Object.values(rooms[roomId].players); const guests = playersArray.filter(p => !p.isHost);
                let spyId = guests.length > 0 ? guests[Math.floor(Math.random() * guests.length)].id : playersArray[0].id; rooms[roomId].spyId = spyId;
                playersArray.forEach(player => { io.to(player.socketId).emit('gameStarted', { word: selectedWord, isSpy: player.id === spyId, category: categoryName }); });
            }
        } catch(e){}
    });

    socket.on('startVotingPhase', () => { try { const roomId = socket.roomId; if(roomId && rooms[roomId]) { rooms[roomId].gameState = 'voting'; io.to(roomId).emit('votingStarted', Object.values(rooms[roomId].players)); } } catch(e){} });
    socket.on('submitVote', (targetId) => {
        try {
            const roomId = socket.roomId; const playerId = socket.playerId;
            if(roomId && rooms[roomId] && rooms[roomId].gameState === 'voting') {
                rooms[roomId].votes[playerId] = targetId; const totalVotes = Object.keys(rooms[roomId].votes).length; const totalPlayers = Object.keys(rooms[roomId].players).length;
                io.to(roomId).emit('voteRegistered', { voterName: rooms[roomId].players[playerId].name, targetName: rooms[roomId].players[targetId] ? rooms[roomId].players[targetId].name : "لاعب غادر", currentVotes: totalVotes, totalRequired: totalPlayers });
                if(totalVotes >= totalPlayers) checkVotingResult(roomId);
            }
        } catch(e){}
    });

    socket.on('startGuessingPhase', () => {
        try {
            const roomId = socket.roomId;
            if(roomId && rooms[roomId]) {
                rooms[roomId].gameState = 'guessing'; rooms[roomId].guessingWords = getSimilarWords(rooms[roomId].word, rooms[roomId].category); rooms[roomId].guessEndTime = Date.now() + 30000; 
                io.to(roomId).emit('guessingPhaseStarted', { words: rooms[roomId].guessingWords, duration: 30 });
                if(rooms[roomId].guessTimer) clearTimeout(rooms[roomId].guessTimer);
                rooms[roomId].guessTimer = setTimeout(() => { if(rooms[roomId] && rooms[roomId].gameState === 'guessing') { io.to(roomId).emit('spyTimeOut'); rooms[roomId].gameState = 'waiting'; } }, 30000); 
            }
        } catch(e){}
    });

    socket.on('spyHoverWord', (word) => { try { const roomId = socket.roomId; const playerId = socket.playerId; if(roomId && rooms[roomId]) io.to(roomId).emit('spySelectedWord', { word: word, spyName: rooms[roomId].players[playerId].name }); } catch(e){} });
    socket.on('spyConfirmWord', (chosenWord) => { try { const roomId = socket.roomId; const playerId = socket.playerId; if(roomId && rooms[roomId]) { if(rooms[roomId].guessTimer) clearTimeout(rooms[roomId].guessTimer); io.to(roomId).emit('gameFinalResult', { spyName: rooms[roomId].players[playerId].name, chosenWord: chosenWord, correctWord: rooms[roomId].word, isCorrect: (chosenWord === rooms[roomId].word) }); } } catch(e){} });
    socket.on('restartGame', () => { try { if(socket.roomId && rooms[socket.roomId]) { if(rooms[socket.roomId].guessTimer) clearTimeout(rooms[socket.roomId].guessTimer); if(rooms[socket.roomId].tieTimer) clearTimeout(rooms[socket.roomId].tieTimer); rooms[socket.roomId].gameState = 'waiting'; rooms[socket.roomId].votes = {}; io.to(socket.roomId).emit('gameRestarted'); } } catch(e){} });
    socket.on('disconnect', () => { try { const roomId = socket.roomId; const playerId = socket.playerId; if (roomId && rooms[roomId] && rooms[roomId].players[playerId]) { rooms[roomId].players[playerId].disconnectTimeout = setTimeout(() => { handlePlayerLeave(roomId, playerId); }, 60000); } } catch(e){} });
});

server.listen(PORT, () => { console.log(`🚀 Server running on port ${PORT}`); });