/* ==========================================================================
   LANYARD — dependency-free hanging ID-card physics
   --------------------------------------------------------------------------
   A vanilla port of the React Bits <Lanyard /> component.

   The original relies on three.js + @react-three/rapier + a card.glb model.
   Both the Rapier WASM binary and the .glb are fetched at runtime, and
   browsers block fetch/XHR on file:// origins — so that stack cannot render
   when index.html is opened straight from disk. This implementation gets the
   same result with a small verlet solver: no libraries, no network requests,
   and the card itself stays real DOM so photos and names are editable HTML.

   Model
     - A rope of point masses, pinned at the top.
     - The card assembly hangs off the rope's last point (the pivot, at the
       top ring of the clip) and carries a second point at its base, so the
       two together behave as a compound pendulum and the card rotates for
       free instead of needing a scripted swing.
     - Horizontal pivot velocity feeds a damped spring on rotateY, which is
       what produces the twist/flip as the card is thrown around.
   ========================================================================== */

(function () {
    'use strict';

    /* --- Tunables --------------------------------------------------------- */
    var ROPE_POINTS = 10;      // masses in the strap, pivot included
    var ITERATIONS = 16;       // constraint relaxation passes (higher = stiffer)
    var GRAVITY = 2600;        // px/s^2
    var FRICTION = 0.994;      // velocity retained per step
    var CARD_FRICTION = 0.988; // the card sheds energy faster than the strap
    var STEP = 1 / 60;         // fixed physics timestep
    var MAX_STEPS = 3;         // substep ceiling, guards against spiral of death
    var SPIN_GAIN = 0.16;      // how strongly sideways motion twists the card
    var SPIN_SPRING = 0.045;   // pull back to face-on
    var SPIN_DAMP = 0.9;
    var WIND = 26;             // idle breeze amplitude, px/s^2

    var BAND_LABEL = 'THE WEB BRANDING • ';

    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var uid = 0;

    /* --- Small helpers ---------------------------------------------------- */
    function point(x, y) {
        return { x: x, y: y, ox: x, oy: y };
    }

    function clamp(v, lo, hi) {
        return v < lo ? lo : (v > hi ? hi : v);
    }

    /* Chaikin-style quadratic smoothing through the rope points. Keeps the
       strap reading as fabric rather than a chain of straight segments. */
    function ropePath(pts) {
        var d = 'M' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
        for (var i = 1; i < pts.length - 1; i++) {
            var mx = (pts[i].x + pts[i + 1].x) * 0.5;
            var my = (pts[i].y + pts[i + 1].y) * 0.5;
            d += 'Q' + pts[i].x.toFixed(1) + ' ' + pts[i].y.toFixed(1) +
                ' ' + mx.toFixed(1) + ' ' + my.toFixed(1);
        }
        var last = pts[pts.length - 1];
        return d + 'L' + last.x.toFixed(1) + ' ' + last.y.toFixed(1);
    }

    /* --- Lanyard ---------------------------------------------------------- */
    function Lanyard(stage) {
        this.stage = stage;
        this.hanger = stage.querySelector('.lanyard-hanger');
        this.card = stage.querySelector('.lanyard-card');
        this.id = 'lny' + (++uid);

        this.buildBand();

        this.points = [];
        this.base = point(0, 0);
        this.segLen = 10;
        this.ropeLen = 100;
        this.bodyLen = 200;
        this.halfW = 0;

        this.spin = 0;
        this.spinVel = 0;
        this.phase = Math.random() * Math.PI * 2;
        this.time = 0;
        this.running = false;
        this.settled = false;

        this.drag = null;
        this.pointerId = null;

        this.measure();
        this.reset();

        if (reduceMotion) {
            this.rest();
            this.render();
        } else {
            this.bindPointer();
        }
    }

    /* Injects the strap SVG. Done in JS so the markup for each team member
       stays down to a card — nothing decorative to copy-paste. */
    Lanyard.prototype.buildBand = function () {
        var ns = 'http://www.w3.org/2000/svg';
        var svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('class', 'lanyard-band');
        svg.setAttribute('aria-hidden', 'true');

        var defs = document.createElementNS(ns, 'defs');
        /* Horizontal gradient across a near-vertical strap reads as tube
           shading — the cheap way to make flat stroke look like webbing. */
        var grad = document.createElementNS(ns, 'linearGradient');
        grad.setAttribute('id', this.id + 'g');
        grad.setAttribute('x1', '0');
        grad.setAttribute('y1', '0');
        grad.setAttribute('x2', '1');
        grad.setAttribute('y2', '0');
        var stops = [
            ['0%', '#2a0f42'], ['18%', '#5A2C89'], ['45%', '#a855f7'],
            ['62%', '#7b2cbf'], ['100%', '#220d36']
        ];
        stops.forEach(function (s) {
            var stop = document.createElementNS(ns, 'stop');
            stop.setAttribute('offset', s[0]);
            stop.setAttribute('stop-color', s[1]);
            grad.appendChild(stop);
        });
        defs.appendChild(grad);
        svg.appendChild(defs);

        this.shadow = document.createElementNS(ns, 'path');
        this.shadow.setAttribute('class', 'lanyard-band-shadow');

        this.strap = document.createElementNS(ns, 'path');
        this.strap.setAttribute('class', 'lanyard-band-strap');
        this.strap.setAttribute('id', this.id + 'p');
        this.strap.setAttribute('stroke', 'url(#' + this.id + 'g)');

        var text = document.createElementNS(ns, 'text');
        text.setAttribute('class', 'lanyard-band-text');
        var tp = document.createElementNS(ns, 'textPath');
        tp.setAttribute('href', '#' + this.id + 'p');
        // Safari below 12 only honours the xlink form.
        tp.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href',
            '#' + this.id + 'p');
        tp.setAttribute('startOffset', '4');
        // Repeat well past any realistic strap length; the tail simply
        // renders off the end of the path.
        tp.textContent = new Array(9).join(BAND_LABEL);
        text.appendChild(tp);

        svg.appendChild(this.shadow);
        svg.appendChild(this.strap);
        svg.appendChild(text);
        this.stage.insertBefore(svg, this.stage.firstChild);
    };

    Lanyard.prototype.measure = function () {
        var r = this.stage.getBoundingClientRect();
        this.w = r.width;
        this.h = r.height;
        this.halfW = this.hanger.offsetWidth / 2;
        this.bodyLen = Math.max(40, this.hanger.offsetHeight);

        this.anchor = { x: this.w / 2, y: 6 };
        this.ropeLen = Math.max(50, (this.h * 0.75) - this.bodyLen - this.anchor.y - 14);
        this.segLen = this.ropeLen / (ROPE_POINTS - 1);
    };

    /* Released from a small angle so each card swings into place.
       Note this deliberately does NOT start collapsed at the anchor: with
       every point on the same spot the segment distances are ~0, the
       correction direction (dx/dist) becomes arbitrary, and eight relaxation
       passes inject enough random energy to fling the cards near-horizontal.
       Starting already extended keeps every distance well-conditioned. */
    Lanyard.prototype.reset = function () {
        var a = (0.09 + Math.random() * 0.09) * (Math.random() < 0.5 ? -1 : 1);
        var sin = Math.sin(a);
        var cos = Math.cos(a);

        this.points = [];
        for (var i = 0; i < ROPE_POINTS; i++) {
            var d = this.segLen * i;
            this.points.push(point(this.anchor.x + sin * d, this.anchor.y + cos * d));
        }
        var pivot = this.points[ROPE_POINTS - 1];
        this.base = point(pivot.x + sin * this.bodyLen, pivot.y + cos * this.bodyLen);
        this.spin = 0;
        this.spinVel = 0;
        this.settled = false;
    };

    /* Straight-down rest pose, used for reduced-motion and as the pose to
       snap back to after a resize. */
    Lanyard.prototype.rest = function () {
        for (var i = 0; i < ROPE_POINTS; i++) {
            var p = this.points[i];
            p.x = p.ox = this.anchor.x;
            p.y = p.oy = this.anchor.y + this.segLen * i;
        }
        var pivot = this.points[ROPE_POINTS - 1];
        this.base = point(pivot.x, pivot.y + this.bodyLen);
        this.spin = 0;
        this.spinVel = 0;
    };

    Lanyard.prototype.integrate = function (p, ax, ay, friction) {
        var vx = (p.x - p.ox) * friction;
        var vy = (p.y - p.oy) * friction;
        p.ox = p.x;
        p.oy = p.y;
        p.x += vx + ax * STEP * STEP;
        p.y += vy + ay * STEP * STEP;
    };

    Lanyard.prototype.link = function (a, b, len, pinA, pinB) {
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        var diff = (dist - len) / dist * 0.5;
        var ox = dx * diff;
        var oy = dy * diff;
        if (!pinA) { a.x += ox; a.y += oy; }
        if (!pinB) { b.x -= ox; b.y -= oy; }
    };

    Lanyard.prototype.step = function () {
        this.time += STEP;

        var breeze = Math.sin(this.time * 1.1 + this.phase) * WIND +
            Math.sin(this.time * 0.37 + this.phase * 2) * WIND * 0.6;

        var i;
        for (i = 1; i < ROPE_POINTS; i++) {
            this.integrate(this.points[i], breeze, GRAVITY, FRICTION);
        }
        this.integrate(this.base, breeze * 0.5, GRAVITY, CARD_FRICTION);

        var pivot = this.points[ROPE_POINTS - 1];

        // A held card is driven straight from the pointer. Rewriting the
        // previous position rather than the current one means verlet reads
        // the drag delta as real velocity, so releasing mid-swing throws it.
        if (this.drag) {
            var tx = this.drag.x;
            var ty = this.drag.y;
            var dx = tx - this.anchor.x;
            var dy = ty - this.anchor.y;
            var d = Math.sqrt(dx * dx + dy * dy);
            var max = this.ropeLen * 1.02;
            if (d > max) {
                tx = this.anchor.x + dx / d * max;
                ty = this.anchor.y + dy / d * max;
            }
            pivot.ox = pivot.x;
            pivot.oy = pivot.y;
            pivot.x = tx;
            pivot.y = ty;
        }

        for (var k = 0; k < ITERATIONS; k++) {
            this.points[0].x = this.anchor.x;
            this.points[0].y = this.anchor.y;
            for (i = 0; i < ROPE_POINTS - 1; i++) {
                this.link(this.points[i], this.points[i + 1], this.segLen,
                    i === 0, !!this.drag && i + 1 === ROPE_POINTS - 1);
            }
            this.link(pivot, this.base, this.bodyLen, !!this.drag, false);
        }

        // Sideways pivot travel spins the card about its vertical axis; a
        // damped spring returns it to face-on.
        var pvx = pivot.x - pivot.ox;
        this.spinVel += pvx * SPIN_GAIN;
        this.spinVel -= this.spin * SPIN_SPRING;
        this.spinVel *= SPIN_DAMP;
        this.spin += this.spinVel;
        this.spin = clamp(this.spin, -170, 170);
    };

    Lanyard.prototype.render = function () {
        this.strap.setAttribute('d', ropePath(this.points));
        this.shadow.setAttribute('d', this.strap.getAttribute('d'));

        var pivot = this.points[ROPE_POINTS - 1];
        var dx = this.base.x - pivot.x;
        var dy = this.base.y - pivot.y;
        // Screen-space CSS rotate() sends the base to -sin(theta); negate the
        // x term so a base hanging right maps to the matching tilt.
        var tilt = Math.atan2(-dx, Math.max(dy, 0.001)) * 180 / Math.PI;

        this.hanger.style.transform =
            'translate3d(' + (pivot.x - this.halfW).toFixed(1) + 'px,' +
            pivot.y.toFixed(1) + 'px,0) rotate(' + tilt.toFixed(2) + 'deg)' +
            ' rotateY(' + this.spin.toFixed(2) + 'deg)';
    };

    /* --- Interaction ------------------------------------------------------ */
    Lanyard.prototype.bindPointer = function () {
        var self = this;

        this.card.addEventListener('pointerdown', function (e) {
            if (self.pointerId !== null) return;
            self.pointerId = e.pointerId;
            self.card.setPointerCapture(e.pointerId);

            var r = self.stage.getBoundingClientRect();
            var pivot = self.points[ROPE_POINTS - 1];
            self.grabX = (e.clientX - r.left) - pivot.x;
            self.grabY = (e.clientY - r.top) - pivot.y;
            self.drag = { x: pivot.x, y: pivot.y };
            self.stage.classList.add('is-held');
            self.wake();
            e.preventDefault();
        });

        this.card.addEventListener('pointermove', function (e) {
            if (self.pointerId !== e.pointerId || !self.drag) return;
            var r = self.stage.getBoundingClientRect();
            self.drag.x = (e.clientX - r.left) - self.grabX;
            self.drag.y = (e.clientY - r.top) - self.grabY;
        });

        function release(e) {
            if (self.pointerId !== e.pointerId) return;
            self.pointerId = null;
            self.drag = null;
            self.stage.classList.remove('is-held');
        }
        this.card.addEventListener('pointerup', release);
        this.card.addEventListener('pointercancel', release);

        // Keyboard nudge — the card is focusable, so the interaction is not
        // pointer-only.
        this.card.addEventListener('keydown', function (e) {
            var dir = e.key === 'ArrowLeft' ? -1 : (e.key === 'ArrowRight' ? 1 : 0);
            if (!dir) return;
            var pivot = self.points[ROPE_POINTS - 1];
            pivot.ox -= dir * 22;
            self.base.ox -= dir * 14;
            self.wake();
            e.preventDefault();
        });
    };

    Lanyard.prototype.wake = function () {
        this.settled = false;
        this.idle = 0;
    };

    Lanyard.prototype.onResize = function () {
        this.measure();
        this.rest();
        this.render();
    };

    /* --- Mobile Marquee Card Swing Handler -------------------------------- */
    function initMobileSwing() {
        var cards = Array.prototype.slice.call(document.querySelectorAll('.tm-card'));
        if (!cards.length) return;

        cards.forEach(function (card) {
            var startX = 0, startY = 0;
            var lastX = 0;
            var isDragging = false;
            var track = card.closest('.tm-track');

            card.addEventListener('touchstart', function (e) {
                var touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                lastX = touch.clientX;
                isDragging = false;
                card.classList.remove('is-settling');
                card.classList.remove('is-tapped');
            }, { passive: true });

            card.addEventListener('touchmove', function (e) {
                var touch = e.touches[0];
                var dx = touch.clientX - startX;
                var dy = touch.clientY - startY;

                // Allow clean vertical page scroll if gesture is predominantly vertical
                if (!isDragging && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
                    return;
                }

                if (Math.abs(dx) > 5) {
                    isDragging = true;
                    lastX = touch.clientX;
                    if (track) track.style.animationPlayState = 'paused';
                    card.classList.add('is-dragging');

                    var angle = clamp(dx * 0.25, -36, 36);
                    var twist = clamp(dx * 0.16, -24, 24);
                    card.style.transform = 'rotateZ(' + angle + 'deg) rotateY(' + twist + 'deg)';
                }
            }, { passive: true });

            card.addEventListener('touchend', function () {
                if (!isDragging) {
                    // Tap trigger a fun swing
                    card.classList.add('is-tapped');
                    setTimeout(function () { card.classList.remove('is-tapped'); }, 1400);
                    return;
                }
                isDragging = false;
                if (track) track.style.animationPlayState = '';
                card.classList.remove('is-dragging');

                var totalDx = lastX - startX;
                var releaseAngle = clamp(totalDx * 0.25, -30, 30);
                card.style.setProperty('--release-angle', releaseAngle + 'deg');
                card.style.transform = '';
                card.classList.add('is-settling');

                setTimeout(function () {
                    card.classList.remove('is-settling');
                }, 1400);
            }, { passive: true });
        });
    }

    /* --- Driver ----------------------------------------------------------- */
    function init() {
        initMobileSwing();

        if (window.innerWidth <= 768) {
            window.addEventListener('resize', function onFirstDesk() {
                if (window.innerWidth > 768) {
                    window.removeEventListener('resize', onFirstDesk);
                    init();
                }
            });
            return;
        }

        var stages = Array.prototype.slice.call(
            document.querySelectorAll('.lanyard-stage'));
        if (!stages.length) return;

        var items = stages.map(function (s) { return new Lanyard(s); });

        // Fall back to the card's initials when a photo is missing or fails
        // to load, so an unfilled slot still looks deliberate.
        stages.forEach(function (s) {
            var img = s.querySelector('.lanyard-photo img');
            if (!img) return;
            if (!img.getAttribute('src')) {
                s.classList.add('no-photo');
                return;
            }
            img.addEventListener('error', function () {
                s.classList.add('no-photo');
            });
        });

        if (reduceMotion) return;

        var visible = false;
        var acc = 0;
        var last = 0;
        var raf = null;

        function frame(now) {
            if (!last) last = now;
            var dt = Math.min((now - last) / 1000, 0.1);
            last = now;
            acc += dt;

            var steps = 0;
            while (acc >= STEP && steps < MAX_STEPS) {
                for (var i = 0; i < items.length; i++) items[i].step();
                acc -= STEP;
                steps++;
            }
            if (steps === MAX_STEPS) acc = 0;

            for (var j = 0; j < items.length; j++) items[j].render();
            raf = requestAnimationFrame(frame);
        }

        function start() {
            if (raf !== null) return;
            last = 0;
            acc = 0;
            raf = requestAnimationFrame(frame);
        }
        function stop() {
            if (raf === null) return;
            cancelAnimationFrame(raf);
            raf = null;
        }

        // Matches the rest of the site: simulation is halted whenever the
        // section is off-screen or the tab is hidden.
        var io = new IntersectionObserver(function (entries) {
            visible = entries.some(function (en) { return en.isIntersecting; });
            if (visible) start(); else stop();
        }, { threshold: 0.08 });

        stages.forEach(function (s) { io.observe(s); });

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) stop();
            else if (visible) start();
        });

        var resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                items.forEach(function (it) { it.onResize(); });
            }, 180);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
