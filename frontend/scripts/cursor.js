// === Custom Cursor System ===
var cursorInitialized = false;
var lastMouseX = 0, lastMouseY = 0, mouseSpeed = 0, particleThrottle = 0;

function setupCustomCursor() {
    if (cursorInitialized) return;
    cursorInitialized = true;
    var dot = document.getElementById('cursorDot');
    var ring = document.getElementById('cursorRing');
    var mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

    document.addEventListener('mousemove', function(e) {
        mouseX = e.clientX; mouseY = e.clientY;
        var dx = mouseX - lastMouseX, dy = mouseY - lastMouseY;
        mouseSpeed = Math.sqrt(dx * dx + dy * dy);
        lastMouseX = mouseX; lastMouseY = mouseY;
        dot.style.left = mouseX + 'px'; dot.style.top = mouseY + 'px';
        particleThrottle++;
        var spawnRate = mouseSpeed > 15 ? 1 : mouseSpeed > 5 ? 2 : 4;
        if (particleThrottle % spawnRate === 0 && mouseSpeed > 2) { spawnParticle(mouseX, mouseY); }
    });
    document.addEventListener('mouseover', function(e) {
        var target = e.target.closest('button, a, [onclick], .btn, .glass-card, input');
        if (target) { dot.classList.add('hovering'); ring.classList.add('hovering'); }
    });
    document.addEventListener('mouseout', function(e) {
        var target = e.target.closest('button, a, [onclick], .btn, .glass-card, input');
        if (target) { dot.classList.remove('hovering'); ring.classList.remove('hovering'); }
    });
    document.addEventListener('mousedown', function(e) {
        dot.style.transform = 'translate(-50%, -50%) scale(0.7)';
        ring.style.transform = 'translate(-50%, -50%) scale(0.85)';
        for (var i = 0; i < 8; i++) { spawnBurstParticle(e.clientX, e.clientY); }
    });
    document.addEventListener('mouseup', function() {
        dot.style.transform = 'translate(-50%, -50%) scale(1)';
        ring.style.transform = 'translate(-50%, -50%) scale(1)';
    });
    function animateRing() {
        ringX += (mouseX - ringX) * 0.12; ringY += (mouseY - ringY) * 0.12;
        ring.style.left = ringX + 'px'; ring.style.top = ringY + 'px';
        requestAnimationFrame(animateRing);
    }
    animateRing();
}

function spawnParticle(x, y) {
    var types = ['star', 'spark', 'glow'];
    var type = types[Math.floor(Math.random() * types.length)];
    var particle = document.createElement('div');
    particle.className = 'particle-trail ' + type;
    particle.style.left = (x + (Math.random() - 0.5) * 20) + 'px';
    particle.style.top = (y + (Math.random() - 0.5) * 20) + 'px';
    var colors = ['var(--neon-purple)', 'var(--neon-cyan)', 'var(--neon-pink)', '#a29bfe', '#74b9ff', '#ffeaa7'];
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    if (type === 'glow') { particle.style.background = 'radial-gradient(circle, ' + colors[Math.floor(Math.random() * colors.length)] + ', transparent)'; }
    document.body.appendChild(particle);
    setTimeout(function() { if (particle.parentNode) particle.parentNode.removeChild(particle); }, 1000);
}

function spawnBurstParticle(x, y) {
    var particle = document.createElement('div');
    particle.className = 'particle-trail star';
    var angle = Math.random() * Math.PI * 2, distance = 20 + Math.random() * 30;
    particle.style.left = (x + Math.cos(angle) * distance) + 'px';
    particle.style.top = (y + Math.sin(angle) * distance) + 'px';
    var colors = ['var(--neon-purple)', 'var(--neon-cyan)', 'var(--neon-pink)', '#fff'];
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    document.body.appendChild(particle);
    setTimeout(function() { if (particle.parentNode) particle.parentNode.removeChild(particle); }, 800);
}

function setCustomCursor(enabled) {
    var dot = document.getElementById('cursorDot');
    var ring = document.getElementById('cursorRing');
    if (enabled) {
        document.body.classList.add('custom-cursor');
        if (dot) dot.style.display = 'block';
        if (ring) ring.style.display = 'block';
        setupCustomCursor();
    } else {
        document.body.classList.remove('custom-cursor');
        if (dot) dot.style.display = 'none';
        if (ring) ring.style.display = 'none';
    }
}
