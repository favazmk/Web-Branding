// Vanilla JS port of React Bits DotGrid
(function() {
    function hexToRgb(hex) {
        const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
        if (!m) return { r: 0, g: 0, b: 0 };
        return {
            r: parseInt(m[1], 16),
            g: parseInt(m[2], 16),
            b: parseInt(m[3], 16)
        };
    }

    const dotSize = 10;
    const gap = 27;
    const baseColor = '#5227FF';
    const activeColor = '#8B3DFF'; // Accent color for active
    const proximity = 120;
    const speedTrigger = 100;
    const shockRadius = 250;
    const shockStrength = 5;
    const maxSpeed = 5000;
    const returnDuration = 1.5;

    let dots = [];
    let pointer = { x: -1000, y: -1000, vx: 0, vy: 0, speed: 0, lastTime: 0, lastX: 0, lastY: 0 };
    let rafId;

    const baseRgb = hexToRgb(baseColor);
    const activeRgb = hexToRgb(activeColor);
    
    let circlePath = null;
    if (window.Path2D) {
        circlePath = new Path2D();
        circlePath.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
    }

    // Give time for DOM if needed, but it's loaded at end of body.
    function init() {
        const wrapper = document.getElementById('dot-grid-container');
        const canvas = document.getElementById('dot-grid-canvas');
        if (!wrapper || !canvas) return;

        function buildGrid() {
            const rect = wrapper.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            const dpr = window.devicePixelRatio || 1;

            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.scale(dpr, dpr);

            const cols = Math.floor((width + gap) / (dotSize + gap));
            const rows = Math.floor((height + gap) / (dotSize + gap));
            const cell = dotSize + gap;

            const gridW = cell * cols - gap;
            const gridH = cell * rows - gap;

            const extraX = width - gridW;
            const extraY = height - gridH;

            const startX = extraX / 2 + dotSize / 2;
            const startY = extraY / 2 + dotSize / 2;

            dots = [];
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    dots.push({ cx: startX + x * cell, cy: startY + y * cell, xOffset: 0, yOffset: 0, _inertiaApplied: false });
                }
            }
        }

        function draw() {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const px = pointer.x;
            const py = pointer.y;
            const proxSq = proximity * proximity;

            for (const dot of dots) {
                const ox = dot.cx + dot.xOffset;
                const oy = dot.cy + dot.yOffset;
                const dx = dot.cx - px;
                const dy = dot.cy - py;
                const dsq = dx * dx + dy * dy;

                let style = baseColor;
                if (dsq <= proxSq) {
                    const dist = Math.sqrt(dsq);
                    const t = 1 - (dist / proximity);
                    const r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t);
                    const g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t);
                    const b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t);
                    style = `rgba(${r},${g},${b}, 0.8)`; // slight transparency for modern feel
                } else {
                    style = `rgba(${baseRgb.r},${baseRgb.g},${baseRgb.b}, 0.3)`; // dimmer base dots for clean look
                }

                ctx.save();
                ctx.translate(ox, oy);
                ctx.fillStyle = style;
                if (circlePath) {
                    ctx.fill(circlePath);
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }

            rafId = requestAnimationFrame(draw);
        }

        function onMove(e) {
            const now = performance.now();
            const dt = pointer.lastTime ? now - pointer.lastTime : 16;
            const dx = e.clientX - pointer.lastX;
            const dy = e.clientY - pointer.lastY;
            let vx = (dx / dt) * 1000;
            let vy = (dy / dt) * 1000;
            let speed = Math.hypot(vx, vy);
            if (speed > maxSpeed) {
                const scale = maxSpeed / speed;
                vx *= scale;
                vy *= scale;
                speed = maxSpeed;
            }
            pointer.lastTime = now;
            pointer.lastX = e.clientX;
            pointer.lastY = e.clientY;
            pointer.vx = vx;
            pointer.vy = vy;
            pointer.speed = speed;

            const rect = canvas.getBoundingClientRect();
            pointer.x = e.clientX - rect.left;
            pointer.y = e.clientY - rect.top;

            for (const dot of dots) {
                const dist = Math.hypot(dot.cx - pointer.x, dot.cy - pointer.y);
                if (speed > speedTrigger && dist < proximity && !dot._inertiaApplied) {
                    dot._inertiaApplied = true;
                    if (window.gsap) {
                        gsap.killTweensOf(dot);
                        const pushX = (dot.cx - pointer.x) + vx * 0.005;
                        const pushY = (dot.cy - pointer.y) + vy * 0.005;
                        
                        gsap.to(dot, {
                            xOffset: pushX,
                            yOffset: pushY,
                            duration: 0.2,
                            ease: "power2.out",
                            onComplete: () => {
                                gsap.to(dot, {
                                    xOffset: 0,
                                    yOffset: 0,
                                    duration: returnDuration,
                                    ease: 'elastic.out(1,0.75)',
                                    onComplete: () => { dot._inertiaApplied = false; }
                                });
                            }
                        });
                    }
                }
            }
        }

        function onClick(e) {
            const rect = canvas.getBoundingClientRect();
            const cx = e.clientX - rect.left;
            const cy = e.clientY - rect.top;
            for (const dot of dots) {
                const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
                if (dist < shockRadius && !dot._inertiaApplied) {
                    dot._inertiaApplied = true;
                    if (window.gsap) {
                        gsap.killTweensOf(dot);
                        const falloff = Math.max(0, 1 - dist / shockRadius);
                        const pushX = (dot.cx - cx) * shockStrength * falloff;
                        const pushY = (dot.cy - cy) * shockStrength * falloff;
                        
                        gsap.to(dot, {
                            xOffset: pushX,
                            yOffset: pushY,
                            duration: 0.15,
                            ease: "power2.out",
                            onComplete: () => {
                                gsap.to(dot, {
                                    xOffset: 0,
                                    yOffset: 0,
                                    duration: returnDuration,
                                    ease: 'elastic.out(1,0.75)',
                                    onComplete: () => { dot._inertiaApplied = false; }
                                });
                            }
                        });
                    }
                }
            }
        }

        buildGrid();
        window.addEventListener('resize', buildGrid);
        
        let lastCall = 0;
        window.addEventListener('mousemove', (e) => {
            const now = performance.now();
            if (now - lastCall >= 50) {
                lastCall = now;
                onMove(e);
            }
        }, { passive: true });
        
        window.addEventListener('click', onClick);

        draw();
    }
    
    // Initialize once DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
