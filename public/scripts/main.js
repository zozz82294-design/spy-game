const urlParamsSync = new URLSearchParams(window.location.search);
const socket = io({ transports: ['websocket'], upgrade: false });

const cleverQuestions = ["متى كانت آخر مرة استخدمت فيها الحاجة دي؟", "هل الحجم بيفرق في جودته أو سعره؟", "موجود في كل بيت ولا بيوت معينة؟", "سعره غالي ولا في متناول الجميع؟", "هل الأطفال بيحبوه ولا للكبار بس؟", "لونه بيأثر على اختيارك ليه؟", "بتفضل تستخدمه لوحدك ولا مع حد؟", "هل ممكن نستغنى عنه بسهولة في حياتنا؟", "بيتأثر بالحرارة أو الجو؟", "بيفضل معاك فترة طويلة ولا بيستهلك/بيبوظ بسرعة؟", "ممكن تلاقيه في الشارع عادي؟", "هل ليه ريحة أو صوت مميز؟", "ينفع نهديه لحد في مناسبة؟", "طريقة استخدامه محتاجة مجهود بدني؟", "مصنوع من مواد طبيعية ولا صناعية؟", "هل هو حاجة أساسية ولا رفاهية؟", "حجمه أكبر من كف الإيد؟", "ينفع تحطه في جيبك؟", "هل بيحتاج كهربا أو طاقة عشان يشتغل؟", "لو ضاع منك هتزعل عليه أو تدور عليه كتير؟", "بتشوفه كل يوم بعينك؟", "ممكن تشتريه من السوبر ماركت؟", "هل بيعتبر اختراع قديم ولا حديث؟", "بيستخدم في الشتاء أكتر ولا الصيف؟", "تقدر تعمله بنفسك في البيت؟"];
const cleverHints = ["حاجة مألوفة جداً وبنشوفها كتير.", "استخدامه معروف للكل ومفيش حد ميعرفوش.", "ممكن ييجي بألوان وأشكال مختلفة.", "مش كل الناس بتهتم بيه بنفس الدرجة.", "موجود من زمان جداً وتطور مع الوقت.", "ليه أكتر من نوع وماركة.", "صعب تتلخبط فيه أو تديه اسم تاني.", "وزنه غالباً مش بيكون مشكلة.", "بيعبر عن حاجة في الروتين اليومي.", "ممكن يخلص أو يتغير مع الاستخدام المستمر.", "مفيش غنى عنه في أوقات معينة.", "بيدي طابع خاص أو بيسهل خطوة مهمة.", "الناس بتختلف في تفضيلها ليه.", "ممكن يكون غالي وممكن يكون رخيص جداً.", "موجود حوالينا أكتر مما بنتخيل.", "بيحتاج مكان معين عشان نحتفظ بيه.", "طريقة تصنيعه بقت أسهل من زمان.", "بيكون مفيد جداً وقت الزنقة.", "ممكن تلاقيه في شنطتك أو درج مكتبك.", "بيعتبر من الأساسيات عند بعض الناس.", "لو مش موجود بنحس بنقص بسيط.", "ممكن تتشاركه مع حد وممكن لأ.", "مش بيحتاج مهارة خاصة عشان تستخدمه.", "في منه أحجام تناسب كل الاحتياجات.", "بنشتريه وإحنا متأكدين إحنا عايزينه ليه."];
const shortHints = { "حاجات جوا وبرا البيت": ["خشب", "يومي", "أساسي", "راحة", "تنظيف", "معدن"], "أكل وشرب": ["مزاج", "ريحة", "مسكر", "حادق", "طاقة", "دايت"], "أدوات وأشياء": ["معدن", "بلاستيك", "صغير", "حادة", "عملي"], "أماكن ومواصلات": ["تذكرة", "مشوار", "زحمة", "فلوس", "هواء"], "حيوانات ونباتات": ["طبيعة", "لون", "شجر", "ريحة", "أليف"], "مهن ووظائف": ["شغل", "بدلة", "فلوس", "شهادة", "مهارة"], "رياضة وهوايات": ["صحة", "تسلية", "مجهود", "عرق", "تحدي"], "أجهزة وتكنولوجيا": ["شاشة", "كهربا", "إنترنت", "شاحن", "بطارية"] };
const shortQuestions = { "حاجات جوا وبرا البيت": ["في كل أوضة؟", "بنلمسه كل يوم؟"], "أكل وشرب": ["فيه سكر؟", "بناكله كل يوم؟"], "أدوات وأشياء": ["في الجيب؟", "بلاستيك ولا معدن؟"], "أماكن ومواصلات": ["تذكرة؟", "بنزين؟"], "حيوانات ونباتات": ["أليف ولا شرس؟", "أخضر؟"], "مهن ووظائف": ["في مكتب؟", "في الشارع؟"], "رياضة وهوايات": ["بكرة؟", "فردي ولا فريق؟"], "أجهزة وتكنولوجيا": ["فيها شاشة؟", "بطارية ولا فيشة؟"] };
const specificWordHints = { "كاميرا": ["استديو", "إنترنت", "ذكريات"], "اكس بوكس": ["دراع", "شاشة", "أونلاين"], "بلايستيشن": ["دراع", "شاشة", "أونلاين"] };

function createStars() { const c = document.getElementById('starsContainer'); c.innerHTML=''; for(let i=0;i<75;i++){let s=document.createElement('div');s.className='falling-star';let z=Math.random()*3+1.5;s.style.width=z+'px';s.style.height=z+'px';s.style.left=Math.random()*100+'vw';s.style.animationDuration=Math.random()*3+3+'s';s.style.animationDelay='-'+(Math.random()*6)+'s';c.appendChild(s);} } createStars();
const audioJoin = new Audio('audio/join.mp3'); const audioWaiting = new Audio('audio/waiting.mp3'); const audioStart = new Audio('audio/start.mp3');
const playerNameInput = document.getElementById('playerNameInput');
socket.on('forceNameLock', (newName) => { localStorage.setItem('lockedPlayerName', newName); sessionStorage.setItem('guestName', newName); if(playerNameInput) { playerNameInput.value = newName; playerNameInput.readOnly = true; playerNameInput.style.background = 'rgba(0,0,0,0.5)'; playerNameInput.style.color = '#888'; } });
const lockedName = localStorage.getItem('lockedPlayerName'); if (lockedName && playerNameInput) { playerNameInput.value = lockedName; playerNameInput.readOnly = true; playerNameInput.style.background = 'rgba(0,0,0,0.5)'; playerNameInput.style.color = '#888'; }

if (urlParamsSync.get('room')) {
    document.getElementById('goToSpyBtn')?.classList.add('hidden'); document.getElementById('goToRebusBtn')?.classList.add('hidden');
    if(playerNameInput) playerNameInput.classList.remove('hidden'); document.getElementById('joinRoomBtn')?.classList.remove('hidden');
    const playJoinAudio = () => { audioJoin.play().catch(e=>{}); document.removeEventListener('click', playJoinAudio); }; document.addEventListener('click', playJoinAudio);
}

let audioCtx; function initAudio() { if(!audioCtx) audioCtx = new AudioContext(); if(audioCtx.state === 'suspended') audioCtx.resume(); } document.addEventListener('click', initAudio, {once:true});
function playSound(type) {
    if(!audioCtx) return; const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.connect(gain); gain.connect(audioCtx.destination); const now = audioCtx.currentTime;
    if(type==='click'){osc.type='sine';osc.frequency.setValueAtTime(800,now);osc.frequency.exponentialRampToValueAtTime(300,now+0.1);gain.gain.setValueAtTime(0.1,now);gain.gain.exponentialRampToValueAtTime(0.01,now+0.1);osc.start(now);osc.stop(now+0.1);}
    else if(type==='start'){osc.type='triangle';osc.frequency.setValueAtTime(300,now);osc.frequency.exponentialRampToValueAtTime(800,now+0.4);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(0.2,now+0.2);gain.gain.linearRampToValueAtTime(0,now+0.4);osc.start(now);osc.stop(now+0.4);}
    else if(type==='vote'){osc.type='square';osc.frequency.setValueAtTime(400,now);gain.gain.setValueAtTime(0.05,now);gain.gain.exponentialRampToValueAtTime(0.01,now+0.1);osc.start(now);osc.stop(now+0.1);}
    else if(type==='win'){osc.type='sine';osc.frequency.setValueAtTime(400,now);osc.frequency.setValueAtTime(600,now+0.1);osc.frequency.setValueAtTime(800,now+0.2);gain.gain.setValueAtTime(0.2,now);gain.gain.linearRampToValueAtTime(0,now+0.5);osc.start(now);osc.stop(now+0.5);}
    else if(type==='lose'){osc.type='sawtooth';osc.frequency.setValueAtTime(300,now);osc.frequency.exponentialRampToValueAtTime(100,now+0.5);gain.gain.setValueAtTime(0.2,now);gain.gain.linearRampToValueAtTime(0,now+0.5);osc.start(now);osc.stop(now+0.5);}
} document.addEventListener('click', (e) => { if(e.target.tagName === 'BUTTON') playSound('click'); });

window.addEventListener('beforeunload', () => { socket.emit('leaveRoom'); });
let myPlayerId = sessionStorage.getItem('playerId') || 'player_' + Math.random().toString(36).substr(2, 9); sessionStorage.setItem('playerId', myPlayerId);

let isHost = false; let myRoleData = null; let selectedSpyWord = null; let guessInterval; let currentGameMode = 'spy'; let rebusTimerInterval;
const screens = ['welcomeScreen', 'waitingScreen', 'modeSelectionScreen', 'gameScreen', 'votingScreen', 'guessingScreen', 'rebusGameScreen', 'podiumScreen'];
function showScreen(screenName) {
    document.getElementById('gameLayout').classList.remove('hidden');
    screens.forEach(s => { const el = document.getElementById(s); if(el) el.classList.add('hidden'); });
    const target = document.getElementById(screenName); if(target) target.classList.remove('hidden');
}

// 🔥 الهينتات
function showSuggestions(type) {
    if(!myRoleData || myRoleData.isSpy) return; 
    const list = document.getElementById('suggestionsList'); list.innerHTML = '';
    const title = document.getElementById('suggestionsTitle');
    title.innerText = type === 'hints' ? "💡 هينتات احترافية" : "❓ أسئلة ذكية";
    title.style.color = type === 'hints' ? "#00f3ff" : "#00ff88";
    const prefix = "بخصوص (الشيء ده) 👈";
    let pool = type === 'hints' ? [...(shortHints[myRoleData.category]||shortHints["أدوات وأشياء"])] : [...(shortQuestions[myRoleData.category]||shortQuestions["أدوات وأشياء"])];
    if(type === 'hints' && specificWordHints[myRoleData.word]) pool = [...specificWordHints[myRoleData.word], ...pool];
    pool = [...new Set(pool)].sort(() => 0.5 - Math.random()).slice(0, 10);
    pool.forEach(item => {
        const li = document.createElement('li'); li.className = "suggestion-item"; li.style.cssText = "margin-bottom:10px; padding:12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px;";
        li.innerHTML = `<span style="color:${type==='hints'?'#00f3ff':'#00ff88'}; font-weight:bold; font-size:0.9rem;">${prefix}</span><br><span style="font-size:1.3rem; font-weight:bold; color:#fff;">${item}</span>`;
        list.appendChild(li);
    });
    document.getElementById('suggestionsModal').classList.remove('hidden'); playSound('click');
}
document.getElementById('btnSuggestHints')?.addEventListener('click', () => showSuggestions('hints'));
document.getElementById('btnSuggestQuestions')?.addEventListener('click', () => showSuggestions('questions'));
document.getElementById('closeSuggestionsBtn')?.addEventListener('click', () => document.getElementById('suggestionsModal').classList.add('hidden'));

// 🔥 زراير الانضمام وإنشاء الغرفة الجديدة
let requestedGameMode = 'spy';
document.getElementById('goToSpyBtn')?.addEventListener('click', () => { requestedGameMode = 'spy'; document.getElementById('hostPasswordInput').value = ''; document.getElementById('hostPasswordModal').classList.remove('hidden'); });
document.getElementById('goToRebusBtn')?.addEventListener('click', () => { requestedGameMode = 'rebus'; document.getElementById('hostPasswordInput').value = ''; document.getElementById('hostPasswordModal').classList.remove('hidden'); });
document.getElementById('cancelHostPasswordBtn')?.addEventListener('click', () => document.getElementById('hostPasswordModal').classList.add('hidden'));
document.getElementById('closeWrongPasswordBtn')?.addEventListener('click', () => document.getElementById('wrongPasswordModal').classList.add('hidden'));

document.getElementById('confirmHostPasswordBtn')?.addEventListener('click', () => {
    if (document.getElementById('hostPasswordInput').value.trim() !== '098') { document.getElementById('hostPasswordModal').classList.add('hidden'); document.getElementById('wrongPasswordModal').classList.remove('hidden'); return; }
    document.getElementById('hostPasswordModal').classList.add('hidden'); isHost = true;
    document.getElementById('hostSettingsBtn').classList.remove('hidden'); document.getElementById('copyInviteBtn').classList.remove('hidden'); document.getElementById('destroyRoomBtn').classList.remove('hidden');
    const newRoomId = Math.random().toString(36).substring(2, 8); localStorage.setItem('hostRoomId', newRoomId);
    const savedName = localStorage.getItem('lockedPlayerName') || '𝐒𝐀𝐒𝐔𝐊𝐄';
    socket.emit('createRoom', { roomId: newRoomId, playerId: myPlayerId, name: savedName, gameMode: requestedGameMode });
    showScreen('waitingScreen');
});

document.getElementById('joinRoomBtn')?.addEventListener('click', () => {
    let name = playerNameInput.value.trim() || localStorage.getItem('lockedPlayerName');
    if(!name) return alert("اكتب اسمك الأول يا بطل!");
    isHost = false; document.getElementById('leaveRoomBtn').classList.remove('hidden'); sessionStorage.setItem('guestName', name);
    socket.emit('joinRoom', { roomId: urlParamsSync.get('room'), name: name, playerId: myPlayerId });
    showScreen('waitingScreen'); audioWaiting.play().catch(e=>{});
});

socket.on('syncState', (state, mode) => { 
    currentGameMode = mode || 'spy';
    document.getElementById('waitingTitle').innerText = currentGameMode === 'spy' ? 'لعبة الجاسوس' : 'تخمين الكلمة';
    if(state === 'waiting') showScreen('waitingScreen'); 
});

socket.on('updatePlayers', (playersArray) => {
    document.getElementById('playerCount').innerText = playersArray.length;
    let listHTML = '', modalHTML = '';
    playersArray.forEach(p => {
        const isMe = p.id === myPlayerId; const hostBadge = p.isHost ? '<span style="color:#00f3ff; font-weight:bold;">👑 هوست</span>' : '';
        listHTML += `<div class="player-item"><div class="player-avatar">👤</div><div class="player-info"><div class="player-name">${p.name}</div><div class="player-status">${hostBadge} ${isMe?'(أنت)':''}</div></div></div>`;
        const actionBtn = p.isHost ? `<button class="btn-sidebar edit" onclick="editPlayerName('${p.id}')">✏️</button>` : `<button class="btn-sidebar edit" onclick="editPlayerName('${p.id}')">✏️</button><button class="btn-sidebar btn-danger" onclick="kickPlayer('${p.id}')">❌</button>`;
        modalHTML += `<div class="modal-player-item" style="display:flex; justify-content:space-between; margin-bottom:10px; background:rgba(255,255,255,0.1); padding:10px; border-radius:5px;"><span>${p.name} ${p.isHost?'👑':''}</span><div>${actionBtn}</div></div>`;
    });
    document.getElementById('playersList').innerHTML = listHTML; document.getElementById('modalPlayersList').innerHTML = modalHTML;
    const actualBtn = document.getElementById('actualStartBtn'); const startBtn = document.getElementById('startGameBtn');
    if(isHost) {
        if(playersArray.length >= 2) { 
            startBtn.classList.add('hidden'); actualBtn.classList.remove('hidden');
            actualBtn.innerText = currentGameMode === 'spy' ? "اختيار التصنيف 🚀" : "بدء الجولة الأولى 🚀";
        } else {
            startBtn.classList.remove('hidden'); actualBtn.classList.add('hidden'); startBtn.innerText = "في انتظار باقي اللاعبين... ⏳";
        }
    } else {
        startBtn.classList.remove('hidden'); actualBtn.classList.add('hidden'); startBtn.innerText = "في انتظار الهوست ⏳";
    }
});

// 🔥 أزرار الغرفة الأساسية
document.getElementById('destroyRoomBtn')?.addEventListener('click', () => { if(confirm('إغلاق الغرفة؟')) { socket.emit('leaveRoom'); localStorage.removeItem('hostRoomId'); window.location.href = window.location.pathname; } });
document.getElementById('leaveRoomBtn')?.addEventListener('click', () => { if(confirm('مغادرة؟')) { socket.emit('leaveRoom'); window.location.href = window.location.pathname; } });
document.getElementById('actualStartBtn')?.addEventListener('click', (e) => { 
    e.target.disabled = true; playSound('start'); 
    if(currentGameMode === 'spy') socket.emit('goToModeSelection', localStorage.getItem('hostRoomId')); 
    else socket.emit('startRebusGame', localStorage.getItem('hostRoomId'));
    setTimeout(() => e.target.disabled = false, 1000); 
});

// 🔥 لعبة الجاسوس القديمة
socket.on('showModeSelection', () => { showScreen('modeSelectionScreen'); renderCategories(); });
function renderCategories() {
    const grid = document.getElementById('categoriesGrid'); grid.innerHTML = '';
    const cats = ["أكل وشرب", "أدوات وأشياء", "أماكن ومواصلات", "مهن ووظائف", "تكنولوجيا"];
    cats.forEach(cat => { let d=document.createElement('div'); d.className='category-card'; d.innerText=cat; d.onclick=()=>{playSound('click'); socket.emit('startGameWithCategory', cat, localStorage.getItem('hostRoomId'));}; grid.appendChild(d); });
}
socket.on('gameStarted', (data) => {
    audioStart.play().catch(e=>{}); myRoleData = data;
    document.getElementById('roleIcon').innerText = data.isSpy ? "🕵️‍♂️" : "🎯";
    document.getElementById('roleTitle').innerHTML = `<span>${data.isSpy ? "أنت الجاسوس!" : data.word}</span>`;
    document.getElementById('helperButtons').className = data.isSpy ? 'hidden' : 'display:flex; gap:15px;';
    showScreen('gameScreen'); if(isHost) document.getElementById('startVotingPhaseBtn').classList.remove('hidden');
});

// 🔥 لعبة تخمين الكلمة (Rebus Game) الشات والمنصة
socket.on('rebusRoundStarted', (data) => {
    playSound('start'); showScreen('rebusGameScreen');
    document.getElementById('rebusRoundNum').innerText = data.round;
    document.getElementById('puzzleText').innerText = data.clue;
    document.getElementById('chatLog').innerHTML = ''; // تنظيف الشات
    
    let tl = 30; const tEl = document.getElementById('rebusTimer'); tEl.innerText = tl; tEl.style.color = '#ff0055';
    if(rebusTimerInterval) clearInterval(rebusTimerInterval);
    rebusTimerInterval = setInterval(() => { tl--; tEl.innerText = tl; if(tl<=0) clearInterval(rebusTimerInterval); }, 1000);
});

function sendRebusGuess() {
    const input = document.getElementById('chatInput'); const txt = input.value.trim();
    if(txt) { socket.emit('sendChatMsg', { msg: txt, fallbackRoomId: localStorage.getItem('hostRoomId') || urlParamsSync.get('room') }); input.value = ''; }
}
document.getElementById('sendChatBtn')?.addEventListener('click', sendRebusGuess);
document.getElementById('chatInput')?.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendRebusGuess(); });

socket.on('rebusChatMsg', (data) => { document.getElementById('chatLog').innerHTML = `<div class="chat-msg"><span class="sender">${data.playerName}:</span> ${data.msg}</div>` + document.getElementById('chatLog').innerHTML; });
socket.on('rebusCorrectGuess', (data) => { playSound('win'); document.getElementById('chatLog').innerHTML = `<div class="chat-msg correct">🎉 ${data.playerName} خمن الكلمة صح! (+${data.points})</div>` + document.getElementById('chatLog').innerHTML; });
socket.on('rebusRoundEnded', (data) => { playSound('lose'); clearInterval(rebusTimerInterval); document.getElementById('puzzleText').innerText = `الحل: ${data.answer}`; });

socket.on('rebusGameOver', (players) => {
    playSound('win'); showScreen('podiumScreen');
    const p1 = players[0], p2 = players[1], p3 = players[2];
    document.getElementById('podiumName1').innerText = p1 ? p1.name : '---'; document.getElementById('podiumScore1').innerText = p1 ? p1.score : '0';
    document.getElementById('podiumName2').innerText = p2 ? p2.name : '---'; document.getElementById('podiumScore2').innerText = p2 ? p2.score : '0';
    document.getElementById('podiumName3').innerText = p3 ? p3.name : '---'; document.getElementById('podiumScore3').innerText = p3 ? p3.score : '0';
    if(isHost) { const btn = document.getElementById('rebusReturnBtn'); btn.classList.remove('hidden'); btn.onclick = () => socket.emit('restartGame'); }
});

socket.on('gameRestarted', () => { playSound('start'); showScreen('waitingScreen'); document.getElementById('podiumScreen').classList.add('hidden'); });

socket.on('connect', () => { 
    if (localStorage.getItem('hostRoomId')) { isHost = true; document.getElementById('hostSettingsBtn').classList.remove('hidden'); socket.emit('createRoom', { roomId: localStorage.getItem('hostRoomId'), playerId: myPlayerId, name: lockedName||'𝐒𝐀𝐒𝐔𝐊𝐄', gameMode: 'spy' }); } 
    else if (urlParamsSync.get('room') && sessionStorage.getItem('guestName')) { isHost = false; document.getElementById('leaveRoomBtn').classList.remove('hidden'); socket.emit('joinRoom', { roomId: urlParamsSync.get('room'), name: sessionStorage.getItem('guestName'), playerId: myPlayerId }); } 
    else { showScreen('welcomeScreen'); } 
});

window.editPlayerName = function(tid) { const n = prompt('الاسم:'); if(n) socket.emit('changePlayerName', {targetId: tid, newName: n.trim(), fallbackRoomId: localStorage.getItem('hostRoomId')}); };
window.kickPlayer = function(tid) { if(confirm('طرد؟')) socket.emit('kickPlayer', {targetId: tid, fallbackRoomId: localStorage.getItem('hostRoomId')}); };
document.getElementById('pcViewBtn').onclick = () => { document.body.className = 'pc-mode'; document.getElementById('pcViewBtn').classList.add('active-view'); document.getElementById('mobileViewBtn').classList.remove('active-view'); };
document.getElementById('mobileViewBtn').onclick = () => { document.body.className = 'mobile-mode'; document.getElementById('mobileViewBtn').classList.add('active-view'); document.getElementById('pcViewBtn').classList.remove('active-view'); };