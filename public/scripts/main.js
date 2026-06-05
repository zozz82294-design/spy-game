const navEntries = performance.getEntriesByType("navigation");
const urlParamsSync = new URLSearchParams(window.location.search);
if (navEntries.length > 0 && navEntries[0].type !== "reload") {
    if (!urlParamsSync.get('room')) {
        sessionStorage.removeItem('hostRoomId');
        sessionStorage.removeItem('guestName');
    }
}

const socket = io();

// 🔥 بنك الأسئلة الذكية العملاق (50 سؤال خبيث يلخبط الجاسوس)
const cleverQuestions = [
    "متى كانت آخر مرة استخدمت فيها الحاجة دي؟", "هل الحجم بيفرق في جودته أو سعره؟", 
    "موجود في كل بيت ولا بيوت معينة؟", "سعره غالي ولا في متناول الجميع؟", 
    "هل الأطفال بيحبوه ولا للكبار بس؟", "لونه بيأثر على اختيارك ليه؟", 
    "بتفضل تستخدمه لوحدك ولا مع حد؟", "هل ممكن نستغنى عنه بسهولة في حياتنا؟", 
    "بيتأثر بالحرارة أو الجو؟", "بيفضل معاك فترة طويلة ولا بيستهلك/بيبوظ بسرعة؟", 
    "ممكن تلاقيه في الشارع عادي؟", "هل ليه ريحة أو صوت مميز؟", 
    "ينفع نهديه لحد في مناسبة؟", "طريقة استخدامه محتاجة مجهود بدني؟", 
    "مصنوع من مواد طبيعية ولا صناعية؟", "هل هو حاجة أساسية ولا رفاهية؟", 
    "حجمه أكبر من كف الإيد؟", "ينفع تحطه في جيبك؟", 
    "هل بيحتاج كهربا أو طاقة عشان يشتغل؟", "لو ضاع منك هتزعل عليه أو تدور عليه كتير؟", 
    "بتشوفه كل يوم بعينك؟", "ممكن تشتريه من السوبر ماركت؟", 
    "هل بيعتبر اختراع قديم ولا حديث؟", "بيستخدم في الشتاء أكتر ولا الصيف؟", 
    "تقدر تعمله بنفسك في البيت؟", "هل هي حاجة ملموسة بنمسكها بإيدينا بسهولة؟", 
    "بتستخدمها كل يوم ولا في مناسبات معينة؟", "هل بتعمل صوت مميز وهي شغالة أو بنستخدمها؟", 
    "في منها ألوان كتير ولا ألوانها محدودة؟", "ممكن تضرنا لو وقعت علينا أو استخدمناها غلط؟", 
    "ينفع تحطها في شنطتك وأنت خارج؟", "موجودة في كل أوضة في البيت ولا مكان معين بس؟", 
    "هل بتخلص وبنحتاج نشتري غيرها باستمرار؟", "هل الأطفال مسموح ليهم يستخدموها لوحدهم؟", 
    "هل بتتباع في الصيدليات ولا مكاتب ولا محلات لبس؟", "هل ليها علاقة بالأكل أو الشرب بشكل أو بآخر؟", 
    "بتعيش سنين ولا بتترمي بعد فترة قصيرة؟", "لو باظت، بتصلحها ولا بتشتري غيرها فوراً؟", 
    "هل بتستخدمها وإنت قاعد ولا وإنت بتتحرك؟", "هل حجمها ممكن يتغير (تتقفل وتتفتح أو تتني)؟", 
    "هل بتحتاج تتدرب أو تقرأ كتالوج عشان تعرف تستخدمها؟", "هل تعتبر حاجة شخصية جداً ولا عادي حد يستلفها؟", 
    "هل بتحتاج مياه أو تنظيف مستمر؟", "فيها زجاج أو معدن في تكوينها الأساسي؟", 
    "لو سافرت هتاخدها معاك ولا هتسيبها؟", "هل ممكن تلاقيها في المدرسة أو الجامعة؟", 
    "هل بتحتاج تركيز وإنت بتتعامل معاها؟", "هل بتستهلك مساحة كبيرة في التخزين؟", 
    "هل بتأثر على حاسة الشم أو التذوق؟", "هل ليها ماركات عالمية مشهورة بتتنافس فيها؟"
];

// 🔥 بنك الهينتات العميقة العملاق (50 تلميح غامض ومحير)
const cleverHints = [
    "حاجة مألوفة جداً وبنشوفها كتير.", "استخدامه معروف للكل ومفيش حد ميعرفوش.", 
    "ممكن ييجي بألوان وأشكال مختلفة.", "مش كل الناس بتهتم بيه بنفس الدرجة.", 
    "موجود من زمان جداً وتطور مع الوقت.", "ليه أكتر من نوع وماركة.", 
    "صعب تتلخبط فيه أو تديه اسم تاني.", "وزنه غالباً مش بيكون مشكلة.", 
    "بيعبر عن حاجة في الروتين اليومي.", "ممكن يخلص أو يتغير مع الاستخدام المستمر.", 
    "مفيش غنى عنه في أوقات معينة.", "بيدي طابع خاص أو بيسهل خطوة مهمة.", 
    "الناس بتختلف في تفضيلها ليه.", "ممكن يكون غالي وممكن يكون رخيص جداً.", 
    "موجود حوالينا أكتر مما بنتخيل.", "بيحتاج مكان معين عشان نحتفظ بيه.", 
    "طريقة تصنيعه بقت أسهل من زمان.", "بيكون مفيد جداً وقت الزنقة.", 
    "ممكن تلاقيه في شنطتك أو درج مكتبك.", "بيعتبر من الأساسيات عند بعض الناس.", 
    "لو مش موجود بنحس بنقص بسيط.", "ممكن تتشاركه مع حد وممكن لأ.", 
    "مش بيحتاج مهارة خاصة عشان تستخدمه.", "في منه أحجام تناسب كل الاحتياجات.", 
    "بنشتريه وإحنا متأكدين إحنا عايزينه ليه.", "حاجة بنتعامل معاها من غير ما نفكر كتير.", 
    "ممكن تكون مصدر إزعاج لو مش شغالة كويس.", "بتعلمنا حاجة أو بتسهل علينا حاجة يومية.", 
    "في ناس بتعتبرها جزء من شخصيتها أو ذوقها.", "ممكن تلاقيها في أماكن عامة وأماكن خاصة.", 
    "بتتأثر بالبيئة المحيطة بيها (حرارة، تراب، مياه).", "ممكن تكون خطيرة أو مؤذية لو استخدمناها باستهتار.", 
    "بعض الناس بتحب تجمع منها أشكال أو أنواع كنوع من الهواية.", "صعب تتخيل يومك أو أسبوعك من غير ما تشوفها أو تسمع عنها.", 
    "ممكن تشتريها مستعملة وممكن تجيبها جديدة بكرتونتها.", "ليها عمر افتراضي وبعدين كفاءتها بتقل.", 
    "بترتبط بذكرى معينة أو موقف عند بعض الناس.", "ممكن تتصنع من أكتر من مادة (بلاستيك، خشب، قماش، معدن).", 
    "فيها جزء بيتحرك أو بيتغير شكله.", "ممكن تكون سبب في مشكلة أو أزمة لو نسيناها في حتة.", 
    "في ناس بتدفع فيها مبالغ خيالية لمجرد إنها ماركة مشهورة.", "بتستخدمها أكتر وإنت بره البيت ولا جواه؟ (فكر فيها كده).", 
    "ليها علاقة بالطاقة أو بتوفر علينا مجهود بدني.", "بتأثر على حواسنا بشكل مباشر.", 
    "ممكن تكون هدية مثالية جداً وممكن تكون حاجة متتجابش هدية أصلاً.", "بتشوفها أكتر بالنهار ولا بالليل؟", 
    "ممكن تلاقيها في عربيتك أو وسيلة مواصلات.", "ليها علاقة بالنظافة أو الترتيب أو النظام.", 
    "ساعات بنستخدمها وإحنا متضايقين وساعات وإحنا مبسوطين.", "شكلها اتغير تماماً من 50 سنة لحد دلوقتي."
];

function createStars() {
    const container = document.getElementById('starsContainer'); container.innerHTML = '';
    for (let i = 0; i < 75; i++) {
        let star = document.createElement('div'); star.className = 'falling-star';
        let size = Math.random() * 3 + 1.5; star.style.width = size + 'px'; star.style.height = size + 'px';
        star.style.left = Math.random() * 100 + 'vw'; star.style.animationDuration = Math.random() * 3 + 3 + 's'; star.style.animationDelay = '-' + (Math.random() * 6) + 's'; 
        container.appendChild(star);
    }
}
createStars(); 

function applyRgbWaveToElement(element, text) { if (element) element.textContent = text; }

const audioJoin = new Audio('audio/join.mp3'); const audioWaiting = new Audio('audio/waiting.mp3'); const audioStart = new Audio('audio/start.mp3');
const roomFromUrlSync = urlParamsSync.get('room'); const playerNameInput = document.getElementById('playerNameInput');

socket.on('forceNameLock', (newName) => {
    localStorage.setItem('lockedPlayerName', newName); sessionStorage.setItem('guestName', newName);
    if(playerNameInput) { playerNameInput.value = newName; playerNameInput.readOnly = true; playerNameInput.style.background = 'rgba(0,0,0,0.5)'; playerNameInput.style.color = '#888'; }
});

const lockedName = localStorage.getItem('lockedPlayerName');
if (lockedName && playerNameInput) { playerNameInput.value = lockedName; playerNameInput.readOnly = true; playerNameInput.style.background = 'rgba(0,0,0,0.5)'; playerNameInput.style.color = '#888'; }

if (roomFromUrlSync) {
    document.getElementById('goToWaitingBtn').classList.add('hidden'); if(playerNameInput) playerNameInput.classList.remove('hidden'); document.getElementById('joinRoomBtn').classList.remove('hidden');
    const playJoinAudio = () => { audioJoin.play().catch(e => {}); document.removeEventListener('click', playJoinAudio); if(playerNameInput) playerNameInput.removeEventListener('focus', playJoinAudio); };
    document.addEventListener('click', playJoinAudio); if(playerNameInput) playerNameInput.addEventListener('focus', playJoinAudio);
}

const AudioContext = window.AudioContext || window.webkitAudioContext; let audioCtx;
function initAudio() { if (!audioCtx) audioCtx = new AudioContext(); if (audioCtx.state === 'suspended') audioCtx.resume(); } document.addEventListener('click', initAudio, { once: true });
function playSound(type) {
    if (!audioCtx) return; const osc = audioCtx.createOscillator(); const gainNode = audioCtx.createGain(); osc.connect(gainNode); gainNode.connect(audioCtx.destination); const now = audioCtx.currentTime;
    if (type === 'click') { osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(300, now + 0.1); gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1); } 
    else if (type === 'start') { osc.type = 'triangle'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.4); gainNode.gain.setValueAtTime(0, now); gainNode.gain.linearRampToValueAtTime(0.2, now + 0.2); gainNode.gain.linearRampToValueAtTime(0, now + 0.4); osc.start(now); osc.stop(now + 0.4); } 
    else if (type === 'vote') { osc.type = 'square'; osc.frequency.setValueAtTime(400, now); gainNode.gain.setValueAtTime(0.05, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1); } 
    else if (type === 'win') { osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.setValueAtTime(600, now + 0.1); osc.frequency.setValueAtTime(800, now + 0.2); gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.linearRampToValueAtTime(0, now + 0.5); osc.start(now); osc.stop(now + 0.5); } 
    else if (type === 'lose') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.5); gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.linearRampToValueAtTime(0, now + 0.5); osc.start(now); osc.stop(now + 0.5); }
} document.addEventListener('click', (e) => { if(e.target.tagName === 'BUTTON' || e.target.closest('button')) playSound('click'); });

window.addEventListener('beforeunload', () => { socket.emit('leaveRoom'); });
let myPlayerId = sessionStorage.getItem('playerId'); if (!myPlayerId) { myPlayerId = 'player_' + Math.random().toString(36).substr(2, 9); sessionStorage.setItem('playerId', myPlayerId); }

const hostSettingsModal = document.getElementById('hostSettingsModal'); const closeModalBtn = document.getElementById('closeModalBtn'); const modalPlayersList = document.getElementById('modalPlayersList'); const restartGameBtn = document.getElementById('restartGameBtn');
const hostLeftModal = document.getElementById('hostLeftModal'); const kickedModal = document.getElementById('kickedModal'); const invalidRoomModal = document.getElementById('invalidRoomModal'); const errorMsgText = document.getElementById('errorMsgText'); const tieBreakerModal = document.getElementById('tieBreakerModal'); const tiedPlayersNames = document.getElementById('tiedPlayersNames'); const tieTimerEl = document.getElementById('tieTimer'); const guestWaitingHostModal = document.getElementById('guestWaitingHostModal'); const votingResultModal = document.getElementById('votingResultModal'); const finalResultModal = document.getElementById('finalResultModal');

const welcomeScreen = document.getElementById('welcomeScreen'); const gameLayout = document.getElementById('gameLayout');
const pcViewBtn = document.getElementById('pcViewBtn'); const mobileViewBtn = document.getElementById('mobileViewBtn'); const goToWaitingBtn = document.getElementById('goToWaitingBtn'); const joinRoomBtn = document.getElementById('joinRoomBtn'); const copyInviteBtn = document.getElementById('copyInviteBtn'); const playerCountSpan = document.getElementById('playerCount'); const playersListDiv = document.getElementById('playersList'); const startGameBtn = document.getElementById('startGameBtn'); const actualStartBtn = document.getElementById('actualStartBtn'); const hostSettingsBtn = document.getElementById('hostSettingsBtn'); const leaveRoomBtn = document.getElementById('leaveRoomBtn'); const destroyRoomBtn = document.getElementById('destroyRoomBtn'); const confirmStartGameBtn = document.getElementById('confirmStartGameBtn'); const startVotingPhaseBtn = document.getElementById('startVotingPhaseBtn'); const voteCounter = document.getElementById('voteCounter'); const liveVoteLog = document.getElementById('liveVoteLog'); const votingGrid = document.getElementById('votingGrid'); const spyProceedBtn = document.getElementById('spyProceedBtn'); const wordsGrid = document.getElementById('wordsGrid'); const confirmGuessBtn = document.getElementById('confirmGuessBtn'); const finalOkBtn = document.getElementById('finalOkBtn');

const hostPasswordModal = document.getElementById('hostPasswordModal'); const hostPasswordInput = document.getElementById('hostPasswordInput'); const confirmHostPasswordBtn = document.getElementById('confirmHostPasswordBtn'); const cancelHostPasswordBtn = document.getElementById('cancelHostPasswordBtn'); const wrongPasswordModal = document.getElementById('wrongPasswordModal'); const closeWrongPasswordBtn = document.getElementById('closeWrongPasswordBtn');

const helperButtons = document.getElementById('helperButtons'); const btnSuggestHints = document.getElementById('btnSuggestHints'); const btnSuggestQuestions = document.getElementById('btnSuggestQuestions'); const suggestionsModal = document.getElementById('suggestionsModal'); const suggestionsList = document.getElementById('suggestionsList'); const suggestionsTitle = document.getElementById('suggestionsTitle'); const closeSuggestionsBtn = document.getElementById('closeSuggestionsBtn');

let tieInterval; let isHost = false; let myRoleData = null; let selectedSpyWord = null; let guessInterval;

const availableCategories = ["حاجات جوا وبرا البيت", "أكل وشرب", "أدوات وأشياء", "أماكن ومواصلات", "حيوانات ونباتات", "مهن ووظائف", "رياضة وهوايات", "أجهزة وتكنولوجيا"];
let chosenCategory = null; let isWheelSpinning = false;

function showScreen(screenName) { 
    if(screenName === 'welcome') {
        welcomeScreen.classList.remove('hidden'); gameLayout.classList.add('hidden');
    } else {
        welcomeScreen.classList.add('hidden'); gameLayout.classList.remove('hidden');
        ['waitingScreen', 'modeSelectionScreen', 'gameScreen', 'votingScreen', 'guessingScreen'].forEach(s => {
            const el = document.getElementById(s); if(el) { el.classList.add('hidden'); }
        });
        const target = document.getElementById(screenName + 'Screen');
        if(target) { target.classList.remove('hidden'); }
    }
}

function showSuggestions(type) {
    if(!myRoleData || myRoleData.isSpy) return; 
    
    suggestionsList.innerHTML = '';
    let sourceArray = type === 'hints' ? cleverHints : cleverQuestions;
    suggestionsTitle.innerText = type === 'hints' ? "💡 هينتات عميقة" : "❓ أسئلة ذكية";
    suggestionsTitle.style.color = type === 'hints' ? "#00f3ff" : "#00ff88";
    suggestionsTitle.style.textShadow = type === 'hints' ? "0 0 15px #00f3ff" : "0 0 15px #00ff88";
    
    let shuffled = sourceArray.sort(() => 0.5 - Math.random());
    let selected = shuffled.slice(0, 10);
    
    selected.forEach(item => {
        const li = document.createElement('li');
        li.style.marginBottom = "10px"; li.style.padding = "12px"; li.style.background = "rgba(255,255,255,0.05)"; li.style.border = "1px solid rgba(255,255,255,0.1)"; li.style.borderRadius = "8px"; li.className = "suggestion-item"; li.innerText = item;
        suggestionsList.appendChild(li);
    });
    
    suggestionsModal.classList.remove('hidden'); playSound('click');
}

if(btnSuggestHints) btnSuggestHints.addEventListener('click', () => showSuggestions('hints'));
if(btnSuggestQuestions) btnSuggestQuestions.addEventListener('click', () => showSuggestions('questions'));
if(closeSuggestionsBtn) closeSuggestionsBtn.addEventListener('click', () => suggestionsModal.classList.add('hidden'));

function renderCategories() {
    const catGrid = document.getElementById('categoriesGrid'); if(!catGrid) return; catGrid.innerHTML = '';
    availableCategories.forEach((cat, index) => {
        const card = document.createElement('div'); card.className = 'category-card'; card.id = `cat-idx-${index}`; card.innerText = cat;
        card.addEventListener('click', () => { if(!isHost || isWheelSpinning) return; playSound('click'); socket.emit('selectCategory', cat); });
        catGrid.appendChild(card);
    });
    const randomCard = document.createElement('div'); randomCard.className = 'category-card random-card'; randomCard.id = 'cat-random'; randomCard.innerText = 'اختيار عشوائي 🎡';
    randomCard.addEventListener('click', () => { if(!isHost || isWheelSpinning) return; playSound('start'); const targetCat = availableCategories[Math.floor(Math.random() * availableCategories.length)]; socket.emit('spinWheel', targetCat); });
    catGrid.appendChild(randomCard);
}

socket.on('categorySelected', (cat) => {
    const targetIdx = availableCategories.indexOf(cat); document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected', 'roulette-active'));
    const card = document.getElementById(`cat-idx-${targetIdx}`); if(card) card.classList.add('selected'); chosenCategory = cat; if(isHost) confirmStartGameBtn.classList.remove('hidden');
});

socket.on('wheelSpinning', (targetCat) => {
    isWheelSpinning = true; if(isHost) confirmStartGameBtn.classList.add('hidden');
    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected', 'roulette-active')); document.getElementById('cat-random').classList.add('selected');
    const targetIdx = availableCategories.indexOf(targetCat); const cards = availableCategories.map((_, i) => document.getElementById(`cat-idx-${i}`));
    let currentStep = 0; let steps = (3 * cards.length) + targetIdx; let delays = [];
    for(let i = 0; i <= steps; i++) { let progress = i / steps; delays.push(40 + (progress * progress * 300)); }
    let totalTime = delays.reduce((a, b) => a + b, 0);
    let forceStop = setTimeout(() => { if(isWheelSpinning) finishSpin(targetCat, targetIdx, cards); }, totalTime + 1000);
    function tick() {
        if(!isWheelSpinning) return;
        if (currentStep <= steps) { cards.forEach(c => c.classList.remove('roulette-active')); cards[currentStep % cards.length].classList.add('roulette-active'); playSound('vote'); setTimeout(tick, delays[currentStep]); currentStep++; } 
        else { clearTimeout(forceStop); finishSpin(targetCat, targetIdx, cards); }
    }
    tick();
});

function finishSpin(cat, idx, cards) {
    isWheelSpinning = false; cards.forEach(c => c.classList.remove('roulette-active')); cards[idx].classList.add('selected'); document.getElementById('cat-random').classList.remove('selected'); playSound('win'); chosenCategory = cat;
    if(isHost) { setTimeout(() => { confirmStartGameBtn.classList.remove('hidden'); }, 1000); }
}

socket.on('connect', () => { 
    const urlParams = new URLSearchParams(window.location.search); const roomFromUrl = urlParams.get('room'); const hostRoomId = sessionStorage.getItem('hostRoomId'); const guestName = sessionStorage.getItem('guestName'); 
    if (hostRoomId) { 
        isHost = true; if(hostSettingsBtn) hostSettingsBtn.classList.remove('hidden'); if(copyInviteBtn) copyInviteBtn.classList.remove('hidden'); if(destroyRoomBtn) destroyRoomBtn.classList.remove('hidden');
        const savedName = localStorage.getItem('lockedPlayerName') || '𝐒𝐀𝐒𝐔𝐊𝐄';
        socket.emit('createRoom', { roomId: hostRoomId, playerId: myPlayerId, name: savedName }); 
    } else if (roomFromUrl) { 
        isHost = false; if(leaveRoomBtn) leaveRoomBtn.classList.remove('hidden');
        if (guestName) { if(playerNameInput) playerNameInput.value = guestName; socket.emit('joinRoom', { roomId: roomFromUrl, name: guestName, playerId: myPlayerId }); } 
    } else { 
        sessionStorage.removeItem('hostRoomId'); sessionStorage.removeItem('guestName'); showScreen('welcome'); 
    } 
});

socket.on('syncState', (state) => { if (state === 'waiting') { showScreen('waiting'); } else if (state === 'modeSelection') { showScreen('modeSelection'); } });

if(goToWaitingBtn) goToWaitingBtn.addEventListener('click', () => { 
    hostPasswordInput.value = ''; 
    hostPasswordModal.classList.remove('hidden'); 
});

if(cancelHostPasswordBtn) cancelHostPasswordBtn.addEventListener('click', () => { hostPasswordModal.classList.add('hidden'); });
if(closeWrongPasswordBtn) closeWrongPasswordBtn.addEventListener('click', () => { wrongPasswordModal.classList.add('hidden'); });

if(confirmHostPasswordBtn) confirmHostPasswordBtn.addEventListener('click', () => {
    const hostPass = hostPasswordInput.value.trim();
    if (hostPass !== '098') { 
        hostPasswordModal.classList.add('hidden'); wrongPasswordModal.classList.remove('hidden'); return; 
    }
    hostPasswordModal.classList.add('hidden'); isHost = true; 
    if(hostSettingsBtn) hostSettingsBtn.classList.remove('hidden'); if(copyInviteBtn) copyInviteBtn.classList.remove('hidden'); if(destroyRoomBtn) destroyRoomBtn.classList.remove('hidden');
    const newRoomId = Math.random().toString(36).substring(2, 8); sessionStorage.setItem('hostRoomId', newRoomId); 
    const savedName = localStorage.getItem('lockedPlayerName') || '𝐒𝐀𝐒𝐔𝐊𝐄';
    socket.emit('createRoom', { roomId: newRoomId, playerId: myPlayerId, name: savedName }); 
    showScreen('waiting'); 
});

if(joinRoomBtn) joinRoomBtn.addEventListener('click', () => { 
    let enteredName = playerNameInput ? playerNameInput.value.trim() : ''; const lockedName = localStorage.getItem('lockedPlayerName'); if(lockedName) enteredName = lockedName;
    if(!enteredName) { alert("اكتب اسمك الأول يا بطل!"); return; } 
    isHost = false; if(leaveRoomBtn) leaveRoomBtn.classList.remove('hidden'); sessionStorage.setItem('guestName', enteredName); 
    const roomIdToJoin = new URLSearchParams(window.location.search).get('room'); socket.emit('joinRoom', { roomId: roomIdToJoin, name: enteredName, playerId: myPlayerId }); 
    showScreen('waiting'); audioWaiting.play().catch(e => console.log(e)); 
});

if (destroyRoomBtn) { destroyRoomBtn.addEventListener('click', () => { if (confirm('هل أنت متأكد من إغلاق الغرفة وطرد جميع اللاعبين للعودة للقائمة الرئيسية؟')) { socket.emit('leaveRoom'); sessionStorage.clear(); window.location.href = window.location.pathname; } }); }
if(leaveRoomBtn) leaveRoomBtn.addEventListener('click', () => { if(confirm('هل أنت متأكد من مغادرة الغرفة؟')) { socket.emit('leaveRoom'); sessionStorage.clear(); window.location.href = window.location.pathname; } });
socket.on('errorMsg', (msg) => { if(invalidRoomModal && errorMsgText) { errorMsgText.innerText = msg; invalidRoomModal.classList.remove('hidden'); } });

socket.on('updatePlayers', (playersArray) => {
    if (!playersArray) return; if (playerCountSpan) playerCountSpan.innerText = playersArray.length;
    if (playersListDiv) { 
        let playersHTML = ''; 
        playersArray.forEach(player => { 
            const isMe = player.id === myPlayerId; const hostBadge = player.isHost ? '<span style="color:#00f3ff; font-weight:bold;">👑 هوست</span>' : ''; const youBadge = isMe ? '<span style="color:#00ff88; margin-right:5px;">(أنت)</span>' : '';
            playersHTML += `<div class="player-item"><div class="player-avatar">👤</div><div class="player-info"><div class="player-name">${player.name}</div><div class="player-status">${hostBadge} ${youBadge}</div></div></div>`; 
        }); 
        playersListDiv.innerHTML = playersHTML; 
    }

    if (isHost) { if (playersArray.length >= 3) { if(startGameBtn) startGameBtn.classList.add('hidden'); if(actualStartBtn) actualStartBtn.classList.remove('hidden'); } else { if(startGameBtn) { startGameBtn.innerText = "في انتظار باقي اللاعبين... ⏳"; startGameBtn.classList.remove('hidden'); } if(actualStartBtn) actualStartBtn.classList.add('hidden'); } } else { if(startGameBtn) { startGameBtn.innerText = "في انتظار الهوست لاختيار التصنيف ⏳"; startGameBtn.classList.remove('hidden'); } if(actualStartBtn) actualStartBtn.classList.add('hidden'); }
    
    if (isHost && modalPlayersList) { 
        let modalHTML = ''; 
        playersArray.forEach(player => { 
            const crown = player.isHost ? '<span style="color:#ff0055;">👑</span>' : ''; const isMe = player.id === myPlayerId; 
            const actionButtons = player.isHost ? `<button class="btn-sidebar edit" style="width:auto; padding:5px 10px;" onclick="editPlayerName('${player.id}')">✏️</button>` : `<button class="btn-sidebar edit" style="width:auto; padding:5px 10px;" onclick="editPlayerName('${player.id}')">✏️</button><button class="btn-sidebar btn-danger" style="width:auto; padding:5px 10px; margin-right:5px;" onclick="kickPlayer('${player.id}')">❌</button>`; 
            modalHTML += `<div class="modal-player-item"><div class="player-name-wrapper"><span class="player-name-text">${player.name}</span>${crown}${isMe ? '<span style="color:#00ff88; font-size:0.8rem;">(أنت)</span>' : ''}</div><div class="modal-player-actions">${actionButtons}</div></div>`; 
        }); 
        modalPlayersList.innerHTML = modalHTML; 
    }
});

if(actualStartBtn) actualStartBtn.addEventListener('click', (e) => { e.target.disabled = true; playSound('start'); socket.emit('goToModeSelection'); setTimeout(() => e.target.disabled = false, 1000); });
socket.on('showModeSelection', () => { showScreen('modeSelection'); chosenCategory = null; isWheelSpinning = false; confirmStartGameBtn.classList.add('hidden'); renderCategories(); });
if(confirmStartGameBtn) confirmStartGameBtn.addEventListener('click', (e) => { e.target.disabled = true; playSound('start'); socket.emit('startGameWithCategory', chosenCategory); setTimeout(() => e.target.disabled = false, 2000); });

socket.on('gameStarted', (data) => {
    if(data) { 
        audioStart.play().catch(e => console.log(e));
        myRoleData = data; const roleIcon = document.getElementById('roleIcon'); const roleTitle = document.getElementById('roleTitle'); const categoryTitle = document.getElementById('categoryTitle'); 
        
        if(data.isSpy) { 
            roleIcon.innerText = "🕵️‍♂️"; roleTitle.innerHTML = "<span>أنت الجاسوس!</span>"; 
            if(helperButtons) helperButtons.classList.add('hidden');
        } else { 
            roleIcon.innerText = "🎯"; roleTitle.innerHTML = `<span>${data.word}</span>`; 
            if(helperButtons) helperButtons.classList.remove('hidden');
        }
        if(categoryTitle) { categoryTitle.innerText = `التصنيف: ${data.category}`; categoryTitle.classList.remove('hidden'); }
    }
    showScreen('game');
    if (isHost && restartGameBtn) restartGameBtn.disabled = false; if (isHost && startVotingPhaseBtn) startVotingPhaseBtn.classList.remove('hidden');
});

if(startVotingPhaseBtn) startVotingPhaseBtn.addEventListener('click', (e) => { e.target.disabled = true; playSound('start'); socket.emit('startVotingPhase', sessionStorage.getItem('hostRoomId')); setTimeout(() => e.target.disabled = false, 2000); });

socket.on('votingStarted', (playersArray) => { 
    playSound('start'); showScreen('voting'); liveVoteLog.innerHTML = ''; voteCounter.innerText = `0/${playersArray.length}`; voteCounter.style.color = "#00f3ff"; voteCounter.style.textShadow = "none"; let gridHTML = ''; playersArray.forEach(p => { if (p.id !== myPlayerId) gridHTML += `<div class="vote-card" onclick="castVote('${p.id}', this)" data-player-id="${p.id}"><div style="font-size: 2rem; margin-bottom:10px;">${p.isHost ? '👑' : '👤'}</div><div style="font-weight:bold; color:#fff;">${p.name}</div></div>`; }); votingGrid.innerHTML = gridHTML; 
});

socket.on('votingTied', (data) => { playSound('lose'); tiedPlayersNames.innerText = data.tiedNames; tieBreakerModal.classList.remove('hidden'); let timeLeft = 12; tieTimerEl.innerText = timeLeft; if(tieInterval) clearInterval(tieInterval); tieInterval = setInterval(() => { timeLeft--; tieTimerEl.innerText = timeLeft; if(timeLeft <= 0) { clearInterval(tieInterval); tieBreakerModal.classList.add('hidden'); } }, 1000); });
socket.on('youAlreadyVoted', (targetId) => { const allCards = document.querySelectorAll('.vote-card'); allCards.forEach(c => c.classList.add('disabled')); const myCard = document.querySelector(`.vote-card[data-player-id="${targetId}"]`); if(myCard) { myCard.classList.remove('disabled'); myCard.classList.add('voted'); } });
socket.on('playerRemovedFromVoting', (playerId) => { const card = document.querySelector(`.vote-card[data-player-id="${playerId}"]`); if (card) card.remove(); });
window.castVote = function(targetId, cardElement) { socket.emit('submitVote', targetId); const allCards = document.querySelectorAll('.vote-card'); allCards.forEach(c => c.classList.add('disabled')); cardElement.classList.remove('disabled'); cardElement.classList.add('voted'); };

socket.on('voteRegistered', (data) => { 
    if(data.voterName !== "النظام") playSound('vote'); voteCounter.innerText = `${data.currentVotes}/${data.totalRequired}`; if(data.currentVotes >= data.totalRequired) { voteCounter.style.color = "#00ff88"; voteCounter.style.textShadow = "0 0 10px #00ff88"; } if (data.voterName !== "النظام") { const logP = document.createElement('div'); logP.className = 'log-entry'; logP.innerHTML = `${data.voterName} صوت على <span class="target-name">${data.targetName}</span>`; liveVoteLog.prepend(logP); } 
});

socket.on('votingEnded', (data) => { const vTitle = document.getElementById('votingResultTitle'); const vDesc1 = document.getElementById('votingResultDesc1'); const vDesc2 = document.getElementById('votingResultDesc2'); if (!myRoleData.isSpy) { spyProceedBtn.classList.add('hidden'); if (data.isSpyCaught) { playSound('win'); vTitle.innerText = "عمل جيد! 👏"; vTitle.style.color = "#00ff88"; vDesc1.innerText = `لقد كان ${data.votedPlayerName} الجاسوس فعلاً، أحسنتم.`; vDesc2.innerText = "في انتظار تخمينه للكلمة..."; } else { playSound('lose'); vTitle.innerText = "اختيار خاطئ! ❌"; vTitle.style.color = "#ff0055"; vDesc1.innerText = `لم يكن ${data.votedPlayerName} الجاسوس. لقد كان ${data.spyName}.`; vDesc2.innerText = "في انتظار تخمينه للكلمة..."; } } else { spyProceedBtn.classList.remove('hidden'); if (data.isSpyCaught) { playSound('lose'); vTitle.innerText = "تم كشفك! 🚨"; vTitle.style.color = "#ff0055"; vDesc1.innerText = `لقد تم كشفك يا ${data.spyName}.`; vDesc2.innerText = "ابذل قصارى جهدك المرة القادمة!"; spyProceedBtn.innerText = "خمن الكلمة"; } else { playSound('win'); vTitle.innerText = "نجاح باهر! 🕵️‍♂️"; vTitle.style.color = "#00ff88"; vDesc1.innerText = `لقد اختاروا شخصاً خاطئاً، نجحت في التخفي يا ${data.spyName}.`; vDesc2.innerText = ""; spyProceedBtn.innerText = "تخمين الكلمة"; } } votingResultModal.classList.remove('hidden'); });

if(spyProceedBtn) spyProceedBtn.addEventListener('click', () => { votingResultModal.classList.add('hidden'); socket.emit('startGuessingPhase'); });

socket.on('guessingPhaseStarted', (data) => { 
    playSound('start'); votingResultModal.classList.add('hidden'); showScreen('guessing'); document.getElementById('wordsGrid').style.pointerEvents = 'auto'; if(!myRoleData.isSpy) { document.getElementById('guessingSubtitle').innerText = "الجاسوس يختار الكلمة الآن..."; } else { document.getElementById('guessingSubtitle').innerText = "اختر الكلمة التي تعتقد أنها صحيحة!"; } let wordsHTML = ''; data.words.forEach(w => { const onClickAttr = myRoleData.isSpy ? `onclick="selectSpyWord('${w}')"` : ''; wordsHTML += `<div class="word-card" id="word-${w}" ${onClickAttr}>${w}</div>`; }); wordsGrid.innerHTML = wordsHTML; let timeLeft = data.duration; const spyTimerEl = document.getElementById('spyTimer'); if(spyTimerEl) { spyTimerEl.innerText = timeLeft; spyTimerEl.style.color = "#00ff88"; spyTimerEl.style.textShadow = "0 0 10px #00ff88"; } if(guessInterval) clearInterval(guessInterval); guessInterval = setInterval(() => { timeLeft--; if(spyTimerEl) { spyTimerEl.innerText = timeLeft; if(timeLeft <= 10) { spyTimerEl.style.color = "#ff0055"; spyTimerEl.style.textShadow = "0 0 10px #ff0055"; } } if(timeLeft <= 0) clearInterval(guessInterval); }, 1000); 
});

socket.on('spyTimeOut', () => { playSound('lose'); if(guessInterval) clearInterval(guessInterval); document.getElementById('wordsGrid').style.pointerEvents = 'none'; const t1 = document.getElementById('finalResultText1'); const t2 = document.getElementById('finalResultText2'); const t3 = document.getElementById('finalResultText3'); const t4 = document.getElementById('finalResultText4'); t1.innerText = "نفد الوقت! ⏳"; t2.innerText = "لقد انتهت اللعبه لعدم اختيار الجاسوس الإجابة"; t2.style.color = "#ff0055"; t3.innerText = "لقد خسر الجاسوس!"; t3.style.color = "#ff0055"; t4.innerText = ""; finalResultModal.classList.remove('hidden'); });

window.selectSpyWord = function(word) { if (!myRoleData.isSpy) return; selectedSpyWord = word; confirmGuessBtn.classList.remove('hidden'); socket.emit('spyHoverWord', word); };
socket.on('spySelectedWord', (data) => { playSound('vote'); document.querySelectorAll('.word-card').forEach(c => { c.classList.remove('spy-active'); const tag = c.querySelector('.spy-tag'); if(tag) tag.remove(); }); const activeCard = document.getElementById(`word-${data.word}`); if (activeCard) { activeCard.classList.add('spy-active'); activeCard.innerHTML += `<div class="spy-tag">اختارها ${data.spyName}</div>`; } });
if(confirmGuessBtn) confirmGuessBtn.addEventListener('click', (e) => { e.target.disabled = true; if(selectedSpyWord) socket.emit('spyConfirmWord', selectedSpyWord); setTimeout(() => e.target.disabled = false, 2000); });

socket.on('gameFinalResult', (data) => { 
    if(guessInterval) clearInterval(guessInterval); document.getElementById('wordsGrid').style.pointerEvents = 'none'; if(data.isCorrect) playSound('win'); else playSound('lose'); const t1 = document.getElementById('finalResultText1'); const t2 = document.getElementById('finalResultText2'); const t3 = document.getElementById('finalResultText3'); const t4 = document.getElementById('finalResultText4'); t1.innerText = `لقد خمن الجاسوس ${data.spyName} الكلمة`; t2.innerText = data.chosenWord; if (data.isCorrect) { t3.innerText = "وكانت الإجابة صحيحة! ✅"; t3.style.color = "#00ff88"; t4.innerText = ""; } else { t3.innerText = "وكانت الإجابة خاطئة! ❌"; t3.style.color = "#ff0055"; t4.innerText = `والكلمة الصحيحة كانت: ${data.correctWord}`; } finalResultModal.classList.remove('hidden'); 
});

if(finalOkBtn) finalOkBtn.addEventListener('click', () => { finalResultModal.classList.add('hidden'); if (isHost) { if(hostSettingsModal) hostSettingsModal.classList.remove('hidden'); } else { if(guestWaitingHostModal) guestWaitingHostModal.classList.remove('hidden'); } });
socket.on('gameRestarted', () => { playSound('start'); if(guessInterval) clearInterval(guessInterval); showScreen('waiting'); votingResultModal.classList.add('hidden'); finalResultModal.classList.add('hidden'); tieBreakerModal.classList.add('hidden'); if(startVotingPhaseBtn) startVotingPhaseBtn.classList.add('hidden'); if(confirmGuessBtn) confirmGuessBtn.classList.add('hidden'); if (isHost && restartGameBtn && hostSettingsModal) { restartGameBtn.disabled = true; hostSettingsModal.classList.add('hidden'); } if(guestWaitingHostModal) guestWaitingHostModal.classList.add('hidden'); });

window.editPlayerName = function(targetId) { const newName = prompt('أدخل الاسم الجديد:'); if (newName && newName.trim() !== '') { socket.emit('changePlayerName', { targetId: targetId, newName: newName.trim() }); } }; 
window.kickPlayer = function(targetId) { if (confirm('طرد نهائي لهذا اللاعب؟')) socket.emit('kickPlayer', targetId); };

if(pcViewBtn) pcViewBtn.addEventListener('click', () => { document.body.className = 'pc-mode'; pcViewBtn.classList.add('active-view'); if(mobileViewBtn) mobileViewBtn.classList.remove('active-view'); }); 
if(mobileViewBtn) mobileViewBtn.addEventListener('click', () => { document.body.className = 'mobile-mode'; mobileViewBtn.classList.add('active-view'); if(pcViewBtn) pcViewBtn.classList.remove('active-view'); });

if(hostSettingsBtn) hostSettingsBtn.addEventListener('click', () => { if(hostSettingsModal) hostSettingsModal.classList.remove('hidden'); }); if(closeModalBtn) closeModalBtn.addEventListener('click', () => { if(hostSettingsModal) hostSettingsModal.classList.add('hidden'); });
if(restartGameBtn) restartGameBtn.addEventListener('click', (e) => { e.target.disabled = true; if(confirm('إعادة اللعب وإرجاع الجميع لغرفة الانتظار؟')) socket.emit('restartGame'); setTimeout(() => e.target.disabled = false, 2000); });
if(copyInviteBtn) copyInviteBtn.addEventListener('click', () => { const roomId = sessionStorage.getItem('hostRoomId'); const inviteLink = window.location.origin + window.location.pathname + '?room=' + roomId; navigator.clipboard.writeText(inviteLink).then(() => { if(notificationToast) { notificationToast.classList.remove('hidden'); setTimeout(() => notificationToast.classList.add('hidden'), 2500); } }); });
socket.on('hostLeftRoom', (hostName) => { const hostLeftText = document.getElementById('hostLeftText'); if(hostLeftText) hostLeftText.innerText = `لقد تم اغلاق الغرفه لان الهوست (${hostName}) غادر الغرفه`; if(hostLeftModal) hostLeftModal.classList.remove('hidden'); sessionStorage.clear(); });
const closeHostLeftBtn = document.getElementById('closeHostLeftBtn'); if(closeHostLeftBtn) closeHostLeftBtn.addEventListener('click', () => { if(hostLeftModal) hostLeftModal.classList.add('hidden'); window.location.href = window.location.pathname; });
socket.on('youAreKickedPermanently', () => { if(kickedModal) kickedModal.classList.remove('hidden'); sessionStorage.clear(); });