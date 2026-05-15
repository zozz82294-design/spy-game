// === Space Background - Animated Stars ===
(function() {
    var canvas = document.getElementById('spaceCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var stars = [];
    var shootingStars = [];
    var animId = null;
    var STAR_COUNT = 120;
    var SHOOTING_INTERVAL = 3000;
    var lastShootingTime = 0;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (var i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.8 + 0.3,
            alpha: Math.random() * 0.7 + 0.3,
            twinkleSpeed: Math.random() * 0.02 + 0.005,
            twinklePhase: Math.random() * Math.PI * 2
        });
    }

    function createShootingStar() {
        var side = Math.random();
        var sx, sy, angle;
        if (side < 0.5) {
            sx = Math.random() * canvas.width;
            sy = -10;
            angle = Math.PI / 4 + Math.random() * 0.3;
        } else {
            sx = canvas.width + 10;
            sy = Math.random() * canvas.height * 0.5;
            angle = Math.PI * 0.6 + Math.random() * 0.3;
        }
        shootingStars.push({
            x: sx, y: sy,
            len: Math.random() * 80 + 40,
            speed: Math.random() * 6 + 4,
            angle: angle,
            alpha: 1,
            life: 0
        });
    }

    function draw() {
        var homeScreen = document.getElementById('hostHomeScreen');
        if (!homeScreen || !homeScreen.classList.contains('active')) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            animId = requestAnimationFrame(draw);
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        var now = Date.now() * 0.001;
        for (var i = 0; i < stars.length; i++) {
            var s = stars[i];
            var twinkle = Math.sin(now * s.twinkleSpeed * 60 + s.twinklePhase);
            var a = s.alpha * (0.6 + 0.4 * twinkle);
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, ' + Math.max(0.1, a) + ')';
            ctx.fill();

            if (s.r > 1.2) {
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(180, 200, 255, ' + (a * 0.1) + ')';
                ctx.fill();
            }
        }

        var currentTime = Date.now();
        if (currentTime - lastShootingTime > SHOOTING_INTERVAL + Math.random() * 2000) {
            createShootingStar();
            lastShootingTime = currentTime;
        }

        for (var j = shootingStars.length - 1; j >= 0; j--) {
            var ss = shootingStars[j];
            ss.x += Math.cos(ss.angle) * ss.speed;
            ss.y += Math.sin(ss.angle) * ss.speed;
            ss.life++;
            ss.alpha = Math.max(0, 1 - ss.life / 60);

            if (ss.alpha <= 0) {
                shootingStars.splice(j, 1);
                continue;
            }

            var tailX = ss.x - Math.cos(ss.angle) * ss.len;
            var tailY = ss.y - Math.sin(ss.angle) * ss.len;

            var grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            grad.addColorStop(0.7, 'rgba(200, 220, 255, ' + (ss.alpha * 0.5) + ')');
            grad.addColorStop(1, 'rgba(255, 255, 255, ' + ss.alpha + ')');

            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(ss.x, ss.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, ' + ss.alpha + ')';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(ss.x, ss.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(180, 200, 255, ' + (ss.alpha * 0.3) + ')';
            ctx.fill();
        }

        animId = requestAnimationFrame(draw);
    }

    draw();
})();
