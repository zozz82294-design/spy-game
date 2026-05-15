// === Audio System ===
var audioCtx = null;
var soundEnabled = true;
var volume = 70;

function initAudio() {
    if (audioCtx) return;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
}

function playSound(type) {
    if (!soundEnabled || !audioCtx) return;
    try {
        var vol = volume / 100;
        var gain = audioCtx.createGain();
        gain.connect(audioCtx.destination);
        gain.gain.value = vol * 0.3;
        if (type === 'click') {
            var osc = audioCtx.createOscillator(); osc.type = 'sine';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.connect(gain); osc.start(); osc.stop(audioCtx.currentTime + 0.1);
        } else if (type === 'join') {
            var osc = audioCtx.createOscillator(); osc.type = 'sine';
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.connect(gain); osc.start(); osc.stop(audioCtx.currentTime + 0.3);
        } else if (type === 'leave') {
            var osc = audioCtx.createOscillator(); osc.type = 'sine';
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.connect(gain); osc.start(); osc.stop(audioCtx.currentTime + 0.3);
        } else if (type === 'start') {
            [0, 0.1, 0.2].forEach(function(delay, i) {
                var osc = audioCtx.createOscillator(); var g = audioCtx.createGain();
                osc.type = 'sine'; osc.frequency.setValueAtTime([523, 659, 784][i], audioCtx.currentTime + delay);
                g.gain.setValueAtTime(vol * 0.2, audioCtx.currentTime + delay);
                g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + 0.3);
                osc.connect(g); g.connect(audioCtx.destination); osc.start(audioCtx.currentTime + delay); osc.stop(audioCtx.currentTime + delay + 0.3);
            });
        } else if (type === 'reveal') {
            var osc = audioCtx.createOscillator(); osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.5);
            gain.gain.setValueAtTime(vol * 0.25, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
            osc.connect(gain); osc.start(); osc.stop(audioCtx.currentTime + 0.6);
        } else if (type === 'vote') {
            var osc = audioCtx.createOscillator(); osc.type = 'square';
            osc.frequency.setValueAtTime(440, audioCtx.currentTime);
            gain.gain.setValueAtTime(vol * 0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
            osc.connect(gain); osc.start(); osc.stop(audioCtx.currentTime + 0.15);
        } else if (type === 'spyReveal') {
            [0, 0.15, 0.3, 0.45].forEach(function(delay, i) {
                var osc = audioCtx.createOscillator(); var g = audioCtx.createGain();
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime([200, 250, 300, 400][i], audioCtx.currentTime + delay);
                g.gain.setValueAtTime(vol * 0.12, audioCtx.currentTime + delay);
                g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + 0.2);
                osc.connect(g); g.connect(audioCtx.destination); osc.start(audioCtx.currentTime + delay); osc.stop(audioCtx.currentTime + delay + 0.2);
            });
        } else if (type === 'win') {
            [0, 0.12, 0.24, 0.36, 0.48].forEach(function(delay, i) {
                var osc = audioCtx.createOscillator(); var g = audioCtx.createGain();
                osc.type = 'sine'; osc.frequency.setValueAtTime([523, 659, 784, 1047, 1319][i], audioCtx.currentTime + delay);
                g.gain.setValueAtTime(vol * 0.2, audioCtx.currentTime + delay);
                g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + 0.3);
                osc.connect(g); g.connect(audioCtx.destination); osc.start(audioCtx.currentTime + delay); osc.stop(audioCtx.currentTime + delay + 0.3);
            });
        } else if (type === 'lose') {
            [0, 0.2, 0.4].forEach(function(delay, i) {
                var osc = audioCtx.createOscillator(); var g = audioCtx.createGain();
                osc.type = 'sine'; osc.frequency.setValueAtTime([400, 300, 200][i], audioCtx.currentTime + delay);
                g.gain.setValueAtTime(vol * 0.2, audioCtx.currentTime + delay);
                g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + 0.4);
                osc.connect(g); g.connect(audioCtx.destination); osc.start(audioCtx.currentTime + delay); osc.stop(audioCtx.currentTime + delay + 0.4);
            });
        } else if (type === 'countdown') {
            var osc = audioCtx.createOscillator(); osc.type = 'sine';
            osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
            gain.gain.setValueAtTime(vol * 0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.connect(gain); osc.start(); osc.stop(audioCtx.currentTime + 0.1);
        } else if (type === 'guess') {
            var osc = audioCtx.createOscillator(); osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.3);
            gain.gain.setValueAtTime(vol * 0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
            osc.connect(gain); osc.start(); osc.stop(audioCtx.currentTime + 0.4);
        }
    } catch(e) {}
}

function updateVolume(val) { volume = parseInt(val); localStorage.setItem('spyGameVolume', volume); }
function toggleSound() { soundEnabled = !soundEnabled; localStorage.setItem('spyGameSound', soundEnabled); }
function loadSoundSettings() {
    var savedVol = localStorage.getItem('spyGameVolume');
    var savedSound = localStorage.getItem('spyGameSound');
    if (savedVol) { volume = parseInt(savedVol); }
    if (savedSound !== null) { soundEnabled = savedSound === 'true'; }
}
