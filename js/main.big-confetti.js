document.addEventListener("DOMContentLoaded", () => {
    const cardStack = document.querySelector(".card-stack");
    let cards = Array.from(document.querySelectorAll(".card"));

    // --- BIG CONFETTI (runs when card "04" or final card becomes active) ---
    let confettiPlayed = false;

    const confettiFX = (() => {
        const canvas = document.createElement("canvas");
        canvas.id = "confetti-canvas-505";
        canvas.setAttribute("aria-hidden", "true");
        Object.assign(canvas.style, {
            position: "fixed",
            inset: "0",
            width: "100vw",
            height: "100vh",
            pointerEvents: "none",
            zIndex: "10080",
        });
        document.body.appendChild(canvas);

        const ctx = canvas.getContext("2d", { alpha: true });

        let dpr = Math.max(1, window.devicePixelRatio || 1);
        let W = 0, H = 0;

        const pieces = [];
        let raf = 0;

        const COLORS = [
            [255, 255, 255],
            [235, 235, 235],
            [215, 215, 215],
            [195, 195, 195],
            [175, 175, 175],
        ];

        const rand = (a, b) => a + Math.random() * (b - a);
        const pick = (arr) => arr[(Math.random() * arr.length) | 0];

        function resize() {
            W = window.innerWidth;
            H = window.innerHeight;
            canvas.width = Math.floor(W * dpr);
            canvas.height = Math.floor(H * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        function onResize() {
            dpr = Math.max(1, window.devicePixelRatio || 1);
            resize();
        }
        onResize();
        window.addEventListener("resize", onResize);

        function makePiece(x, y, vx, vy, shape = "rect") {
            const c = pick(COLORS);
            return {
                x, y, vx, vy,
                w: rand(10, 22),
                h: rand(10, 26),
                r: rand(2.2, 5.2),
                rot: rand(0, Math.PI * 2),
                vr: rand(-0.22, 0.22),
                g: rand(0.16, 0.22),
                drift: rand(-0.02, 0.02),
                drag: rand(0.985, 0.992),
                shape,
                c,
                life: rand(2200, 3200),
                born: performance.now(),
            };
        }

        function burst({
            count = 520,
            originX = 0.5,      // 0..1
            originY = 0.65,     // 0..1
            spread = Math.PI * 1.35,
            power = 18,
            biasUp = 1.0,       // bigger -> more upward
        } = {}) {
            const x = W * originX;
            const y = H * originY;
            for (let i = 0; i < count; i++) {
                // angle: mostly upward, with spread
                const a = (Math.PI * 1.5) + rand(-spread / 2, spread / 2);
                const v = rand(power * 0.55, power);
                const up = rand(0.65, 1.15) * biasUp;

                const vx = Math.cos(a) * v + rand(-0.6, 0.6);
                const vy = Math.sin(a) * v * up - rand(0.4, 1.0);

                const shape = Math.random() < 0.18 ? "circle" : "rect";
                pieces.push(makePiece(x, y, vx, vy, shape));
            }
            if (!raf) raf = requestAnimationFrame(tick);
        }

        function tick(t) {
            raf = requestAnimationFrame(tick);
            ctx.clearRect(0, 0, W, H);

            // Bright look (without dark overlay)
            ctx.globalCompositeOperation = "lighter";
            ctx.shadowBlur = 11;
            ctx.shadowColor = "rgba(255,255,255,0.65)";

            for (let i = pieces.length - 1; i >= 0; i--) {
                const p = pieces[i];
                const age = t - p.born;
                if (age >= p.life) {
                    pieces.splice(i, 1);
                    continue;
                }

                // fade out near the end
                const k = 1 - (age / p.life);
                const alpha = Math.min(1, Math.max(0, k * 1.15));

                p.vx = (p.vx + p.drift) * p.drag;
                p.vy = (p.vy + p.g) * p.drag;
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vr;

                const [r, g, b] = p.c;
                ctx.save();
                ctx.globalAlpha = alpha;

                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);

                ctx.fillStyle = `rgba(${r},${g},${b},1)`;

                if (p.shape === "circle") {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.r, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                }

                ctx.restore();
            }

            ctx.globalCompositeOperation = "source-over";
            ctx.shadowBlur = 0;

            if (pieces.length === 0) {
                cancelAnimationFrame(raf);
                raf = 0;
            }
        }

        function mega() {
            // Multiple cinematic bursts
            function mega() {
                // Single centered burst
                burst({
                    count: 120,        // было сотни+ — уменьшаем
                    originX: 0.50,
                    originY: 0.62,
                    power: 13,         // ниже скорость
                    spread: Math.PI * 1.10,
                    biasUp: 1.05
                });
            }

            // setTimeout(() => burst({ count: 420, originX: 0.20, originY: 0.72, power: 17, spread: Math.PI * 1.45, biasUp: 1.10 }), 120);
            // setTimeout(() => burst({ count: 420, originX: 0.80, originY: 0.72, power: 17, spread: Math.PI * 1.45, biasUp: 1.10 }), 120);
            setTimeout(() => burst({ count: 360, originX: 0.50, originY: 0.55, power: 15, spread: Math.PI * 1.60, biasUp: 1.25 }), 260);
        }

        return { mega };
    })();

    function maybePlayConfetti() {
        const active = cards[0];
        if (!active) return;

        // "One step earlier" supports last brief card: footer 04 (or 4)
        const footerEl = active.querySelector?.(".mock__paper-footer");
        const footer = footerEl ? footerEl.textContent.trim() : "";
        const is04 = footer === "04" || footer === "4";

        // Fallback: final card class
        const isFinal = active.classList.contains("card--final");

        const should = is04 || isFinal;

        if (should && !confettiPlayed) {
            confettiPlayed = true;
            confettiFX.mega();
        }
        if (!should) confettiPlayed = false;
    }


    let isSwiping = false;
    let startX = 0;
    let currentX = 0;
    let rafId = null;
    let activePointerId = null;

    const getDurationFromCSS = (varName, el = document.documentElement) => {
        const v = getComputedStyle(el).getPropertyValue(varName).trim();
        if (!v) return 0;
        if (v.endsWith("ms")) return parseFloat(v);
        if (v.endsWith("s")) return parseFloat(v) * 1000;
        return parseFloat(v) || 0;
    };

    const duration = () => getDurationFromCSS("--card-swap-duration");

    const getActiveCard = () => cards[0];

    const updatePositions = () => {
        cards.forEach((card, i) => {
            card.style.setProperty("--i", i);
            card.style.setProperty("--swipe-x", "0px");
            card.style.setProperty("--swipe-rotate", "0deg");
            card.style.opacity = "1";

            // контент виден только на верхней карточке
            const isActive = i === 0;
            card.classList.toggle("is-active", isActive);
            card.classList.toggle("is-behind", !isActive);
            card.setAttribute("aria-hidden", (!isActive).toString());
        });

        maybePlayConfetti();
    };

    const applySwipeStyles = (deltaX) => {
        const card = getActiveCard();
        if (!card) return;

        card.style.setProperty("--swipe-x", `${deltaX}px`);
        card.style.setProperty("--swipe-rotate", `${deltaX * 0.18}deg`);

        const fade = 1 - Math.min(Math.abs(deltaX) / 120, 1) * 0.75;
        card.style.opacity = String(fade);
    };

    const ignoreTarget = (target) =>
        !!target.closest("button, a, input, textarea, select, label");

    const handleStart = (e) => {
        if (isSwiping) return;
        if (ignoreTarget(e.target)) return;

        isSwiping = true;
        activePointerId = e.pointerId;
        startX = currentX = e.clientX;

        const card = getActiveCard();
        if (card) {
            card.style.transition = "none";
            card.setPointerCapture?.(activePointerId);
        }
    };

    const handleMove = (e) => {
        if (!isSwiping) return;
        if (activePointerId !== e.pointerId) return;

        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            currentX = e.clientX;
            const dx = currentX - startX;
            applySwipeStyles(dx);

            // если резко утащили — автоматически “досвайп”
            if (Math.abs(dx) > 70) handleEnd();
        });
    };

    const swipeOut = (direction = 1) => {
        const card = getActiveCard();
        if (!card) return;

        const d = duration();
        card.style.transition = `transform ${d}ms ease, opacity ${d}ms ease`;

        card.style.setProperty("--swipe-x", `${direction * 340}px`);
        card.style.setProperty("--swipe-rotate", `${direction * 18}deg`);
        card.style.opacity = "0.25";

        setTimeout(() => {
            // перекидываем карточку в конец
            cards = [...cards.slice(1), card];
            updatePositions();
        }, d);
    };

    const handleEnd = () => {
        if (!isSwiping) return;

        cancelAnimationFrame(rafId);

        const dx = currentX - startX;
        const threshold = 70;

        const card = getActiveCard();
        if (card) {
            card.style.transition = `transform ${duration()}ms ease, opacity ${duration()}ms ease`;

            if (Math.abs(dx) > threshold) {
                swipeOut(Math.sign(dx));
            } else {
                applySwipeStyles(0);
            }

            try { card.releasePointerCapture?.(activePointerId); } catch(_) {}
        }

        isSwiping = false;
        activePointerId = null;
        startX = currentX = 0;
    };

    // listeners
    cardStack.addEventListener("pointerdown", handleStart);
    cardStack.addEventListener("pointermove", handleMove);
    cardStack.addEventListener("pointerup", handleEnd);
    cardStack.addEventListener("pointercancel", handleEnd);

    // кнопки "Далее/Получить" — тоже листают
    document.querySelectorAll(".js-next").forEach((btn) => {
        btn.addEventListener("click", () => swipeOut(1));
        btn.addEventListener("pointerdown", (e) => e.stopPropagation());
    });

    // reset (вернуть сначала)
    const resetBtn = document.querySelector(".js-reset");
    resetBtn?.addEventListener("click", () => {
        // простой ресет: отсортируем по порядку в DOM
        cards = Array.from(document.querySelectorAll(".card"));
        updatePositions();
    });
    resetBtn?.addEventListener("pointerdown", (e) => e.stopPropagation());

    updatePositions();
});


// cursor
(() => {
    const canvas = document.getElementById("cursor-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });

    const CONF = {
        baseSpawn: 10,      // базовое количество частиц на движение
        maxSpawn: 19,      // максимум частиц на движение
        maxParticles: 260, // меньше = меньше лагов
        lifeMin: 16,
        lifeMax: 34,
        sizeMin: 0.6,
        sizeMax: 3.1,
        speedMin: 0.2,
        speedMax: 1.4,
        // можешь заменить на свои фирменные оттенки
        colors: [
            [255, 255, 255], // белый
            [235, 235, 235], // светло-серый
            [210, 210, 210], // серебристый
            [190, 190, 190], // холодный серый
            [160, 160, 160]  // более тёмный для глубины
        ],

    };

    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let W = 0, H = 0;

    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.floor(W * dpr);
        canvas.height = Math.floor(H * dpr);
        canvas.style.width = W + "px";
        canvas.style.height = H + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", () => {
        dpr = Math.max(1, window.devicePixelRatio || 1);
        resize();
    });

    const particles = [];

    const rand = (a, b) => a + Math.random() * (b - a);
    const pick = (arr) => arr[(Math.random() * arr.length) | 0];

    let lastX = null, lastY = null;
    let running = false;
    let lastMoveTs = 0;

    function spawn(x, y, amount, vx, vy) {
        for (let i = 0; i < amount; i++) {
            if (particles.length >= CONF.maxParticles) particles.shift();

            const c = pick(CONF.colors);
            const ang = rand(0, Math.PI * 2);
            const sp = rand(CONF.speedMin, CONF.speedMax);
            const life = Math.floor(rand(CONF.lifeMin, CONF.lifeMax));

            particles.push({
                x, y,
                vx: Math.cos(ang) * sp + vx * 0.06,
                vy: Math.sin(ang) * sp + vy * 0.06,
                r: rand(CONF.sizeMin, CONF.sizeMax),
                life,
                ttl: life,
                c
            });
        }
    }

    function onMove(x, y) {
        const now = performance.now();
        lastMoveTs = now;

        if (lastX == null) {
            lastX = x; lastY = y;
        }

        const vx = x - lastX;
        const vy = y - lastY;
        lastX = x; lastY = y;

        // const speed = Math.min(40, Math.hypot(vx, vy));
        // const amount = Math.min(CONF.maxSpawn, Math.floor(CONF.baseSpawn + speed * 0.25));
        // spawn(x, y, amount, vx, vy);
        const amount = CONF.baseSpawn; // всегда одинаково, даже при 1px
        spawn(x, y, amount, vx, vy);


        if (!running) {
            running = true;
            requestAnimationFrame(tick);
        }
    }

    // window.addEventListener("pointermove", (e) => onMove(e.clientX, e.clientY), { passive: true });
    // window.addEventListener("pointerdown", (e) => {
    //     onMove(e.clientX, e.clientY);
    //     spawn(e.clientX, e.clientY, 40, 0, 0);
    // }, { passive: true });
    const moveXY = (x, y) => onMove(x, y);

// Десктоп: мышь/трекпад — без клика
    window.addEventListener("mousemove", (e) => {
        moveXY(e.clientX, e.clientY);
    }, { passive: true, capture: true });

// Pointer для стилуса/прочего (но тач по факту двигается только при "нажатии")
    window.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch") return; // тач отдельно через touchmove ниже
        moveXY(e.clientX, e.clientY);
    }, { passive: true, capture: true });

// Тач: движение пальцем (иначе на таче никак)
    window.addEventListener("touchstart", (e) => {
        const t = e.touches && e.touches[0];
        if (!t) return;
        moveXY(t.clientX, t.clientY);
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
        const t = e.touches && e.touches[0];
        if (!t) return;
        moveXY(t.clientX, t.clientY);
    }, { passive: true });



    function tick() {
        // ✅ НИКАКОЙ чёрной заливки — только очистка
        ctx.clearRect(0, 0, W, H);

        // рисуем “светом”, но без тяжёлых эффектов
        ctx.globalCompositeOperation = "lighter";

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.ttl -= 1;
            if (p.ttl <= 0) {
                particles.splice(i, 1);
                continue;
            }

            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.985;
            p.vy *= 0.985;

            const a = p.ttl / p.life; // 1..0
            const [r, g, b] = p.c;

            ctx.beginPath();
            ctx.fillStyle = `rgba(${r},${g},${b},${0.75 * a})`;
            ctx.arc(p.x, p.y, p.r * (0.9 - 0.4 * (1 - a)), 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalCompositeOperation = "source-over";

        // экономим ресурсы: если давно не двигали и частиц нет — стоп
        const idle = performance.now() - lastMoveTs;
        if (particles.length === 0 && idle > 120) {
            running = false;
            return;
        }

        requestAnimationFrame(tick);
    }
})();
