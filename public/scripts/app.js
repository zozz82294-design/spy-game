const socket = io();

const screens = {
    welcome: document.getElementById('welcomeScreen'),
    waiting: document.getElementById('waitingScreen')
};

const mainContainer = document.getElementById('mainContainer');
const pcViewBtn = document.getElementById('pcViewBtn');
const mobileViewBtn = document.getElementById('mobileViewBtn');
const goToWaitingBtn = document.getElementById('goToWaitingBtn');
const copyInviteBtn = document.getElementById('copyInviteBtn');
const notificationToast = document.getElementById('notificationToast');

// جلب عناصر الماوس الثلاثة
const customCursor = document.getElementById('customCursor');
const follow1 = document.getElementById('cursorFollow1');
const follow2 = document.getElementById('cursorFollow2');

let isPcMode = false;

function showScreen(screenName) {
    Object.values(screens).forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    screens[screenName].classList.remove('hidden');
    screens[screenName].classList.add('active');
}

// تشغيل وضع الكمبيوتر
pcViewBtn.addEventListener('click', () => {
    isPcMode = true;
    document.body.className = 'pc-mode'; 
    customCursor.classList.remove('hidden');
    follow1.classList.remove('hidden');
    follow2.classList.remove('hidden');
    mainContainer.classList.add('container-pc');
    pcViewBtn.classList.add('active-view');
    mobileViewBtn.classList.remove('active-view');
});

// تشغيل وضع الموبايل
mobileViewBtn.addEventListener('click', () => {
    isPcMode = false;
    document.body.className = 'mobile-mode'; 
    customCursor.classList.add('hidden');
    follow1.classList.add('hidden');
    follow2.classList.add('hidden');
    mainContainer.classList.remove('container-pc');
    mobileViewBtn.classList.add('active-view');
    pcViewBtn.classList.remove('active-view');
});

// الانتقال لغرفة اللعبة
goToWaitingBtn.addEventListener('click', () => {
    showScreen('waiting');
});

// برمجة نسخ رابط الدعوة
copyInviteBtn.addEventListener('click', () => {
    const inviteUrl = window.location.href;
    navigator.clipboard.writeText(inviteUrl).then(() => {
        notificationToast.classList.remove('hidden');
        setTimeout(() => {
            notificationToast.classList.add('hidden');
        }, 2500);
    }).catch(err => {
        console.error('فشل نسخ الرابط: ', err);
    });
});

// حركة الماوس المتتابعة في الكمبيوتر
document.addEventListener('mousemove', (e) => {
    if (!isPcMode) return;
    
    const x = e.clientX + 'px';
    const y = e.clientY + 'px';

    customCursor.style.left = x;
    customCursor.style.top = y;

    follow1.style.left = x;
    follow1.style.top = y;

    follow2.style.left = x;
    follow2.style.top = y;
});

// تكبير وتوهج الماوس عند لمس الأزرار
document.addEventListener('mouseover', (e) => {
    if (!isPcMode) return;
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        customCursor.classList.add('hovering');
    }
});

document.addEventListener('mouseout', (e) => {
    if (!isPcMode) return;
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        customCursor.classList.remove('hovering');
    }
});