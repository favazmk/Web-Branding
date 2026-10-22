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
     - The strap is elastic: its links are XPBD soft constraints, so it
       stretches when the card is pulled and bounces back on release. Rest
       lengths are pre-shortened by the sag the card's weight causes, so the
       card still hangs at the height the layout expects.
     - Phones run the same engine on the marquee cards (PHONE config): a
       short strap above each card, sideways drag to swing and throw, pull
       to stretch, tap to bounce. Vertical swipes still scroll the page.
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
    var SAG = 0.23;            // strap stretch under the card's weight, x strap length (elasticity)
    var PULL = 1.7;            // furthest a held card can stretch the strap, x strap length
    var STRETCH_DAMP = 0.04;   // damping along the strap only, so bounces settle but swings don't

    var BAND_LABEL = 'THE WEB BRANDING • ';

    /* What differs between the desktop badge wall and the phone marquee.
       Everything else (the solver and every tunable above) is shared. */
    var DESKTOP = {
        hanger: '.lanyard-hanger', card: '.lanyard-card',
        points: ROPE_POINTS, label: true, tapKick: false
    };
    var PHONE = {
        hanger: '.tm-card', card: '.tm-card',
        points: 6, label: false, tapKick: true,
        strap: 30,  // visible strap above the card, px
        clipTop: 4  // y of the clip ring inside the card (its transform-origin)
    };

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
    function Lanyard(stage, kind) {
        this.kind = kind;
        this.n = kind.points;
        this.stage = stage;
        this.hanger = stage.querySelector(kind.hanger);
        this.card = stage.querySelector(kind.card);
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

        /* Webbing look from three strokes on the same path: a dark edge, the
           purple strap and a violet centre thread. This used to be one
           horizontal objectBoundingBox gradient, but a strap hanging straight
           has a bounding box ~1px wide (0px when perfectly vertical), so the
           shading collapsed to a hairline or the strap vanished outright.
           Each stroke instead fades in over the top few pixels (a vertical,
           user-space gradient), so the strap reads as coming from above
           rather than starting as a stub in mid-air. */
        var defs = document.createElementNS(ns, 'defs');
        var self = this;
        this.fades = [];
        function layer(cls, color, opacity) {
            var grad = document.createElementNS(ns, 'linearGradient');
            var gid = self.id + cls;
            grad.setAttribute('id', gid);
            grad.setAttribute('gradientUnits', 'userSpaceOnUse');
            grad.setAttribute('x1', '0');
            grad.setAttribute('x2', '0');
            [[0, 0], [1, opacity]].forEach(function (st) {
                var stop = document.createElementNS(ns, 'stop');
                stop.setAttribute('offset', String(st[0]));
                stop.setAttribute('stop-color', color);
                stop.setAttribute('stop-opacity', String(st[1]));
                grad.appendChild(stop);
            });
            defs.appendChild(grad);
            self.fades.push(grad);
            var path = document.createElementNS(ns, 'path');
            path.setAttribute('class', 'lanyard-band-' + cls);
            path.setAttribute('stroke', 'url(#' + gid + ')');
            return path;
        }
        this.shadow = layer('shadow', '#000000', 0.5);
        this.strap = layer('strap', '#5A2C89', 1);
        this.stripe = layer('stripe', '#a855f7', 0.7);
        this.strap.setAttribute('id', this.id + 'p');
        svg.appendChild(defs);

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
        svg.appendChild(this.stripe);
        if (this.kind.label) svg.appendChild(text);
        this.stage.insertBefore(svg, this.stage.firstChild);
    };

    Lanyard.prototype.measure = function () {
        var r = this.stage.getBoundingClientRect();
        this.w = r.width;
        this.h = r.height;
        this.halfW = this.hanger.offsetWidth / 2;
        this.bodyLen = Math.max(40, this.hanger.offsetHeight);

        if (this.kind === PHONE) {
            // The card sits in normal flow inside its slot; the pivot rests on
            // its clip ring and the strap rises straight up from there.
            this.halfW = this.w / 2;
            this.originY = this.kind.clipTop;
            this.anchor = { x: this.w / 2, y: this.originY - this.kind.strap };
            this.ropeLen = this.kind.strap;
        } else {
            this.originY = 0;
            this.anchor = { x: this.w / 2, y: 6 };
            this.ropeLen = Math.max(50, (this.h * 0.75) - this.bodyLen - this.anchor.y - 14);
        }
        this.segLen = this.ropeLen / (this.n - 1);

        // Strap fade-in runs from the anchor down over its first stretch.
        var fadeTo = this.anchor.y + Math.min(18, this.ropeLen * 0.45);
        this.fades.forEach(function (g) {
            g.setAttribute('y1', this.anchor.y.toFixed(1));
            g.setAttribute('y2', fadeTo.toFixed(1));
        }, this);

        // XPBD: link i carries the weight of the N - i points below it, so a
        // compliance of sag / (g * sum) makes the whole strap sag by `sag`.
        // Shortening each rest length by its own sag keeps the hang height.
        var sag = this.ropeLen * SAG;
        this.compliance = sag / (GRAVITY * (this.n * (this.n + 1) / 2 - 1));
        this.restLens = [];
        this.lambda = [];
        for (var i = 0; i < this.n - 1; i++) {
            this.restLens.push(this.segLen - this.compliance * GRAVITY * (this.n - i));
            this.lambda.push(0);
        }
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
        for (var i = 0; i < this.n; i++) {
            var d = this.segLen * i;
            this.points.push(point(this.anchor.x + sin * d, this.anchor.y + cos * d));
        }
        var pivot = this.points[this.n - 1];
        this.base = point(pivot.x + sin * this.bodyLen, pivot.y + cos * this.bodyLen);
        this.spin = 0;
        this.spinVel = 0;
        this.settled = false;
    };

    /* Straight-down rest pose, used for reduced-motion and as the pose to
       snap back to after a resize. */
    Lanyard.prototype.rest = function () {
        for (var i = 0; i < this.n; i++) {
            var p = this.points[i];
            p.x = p.ox = this.anchor.x;
            p.y = p.oy = this.anchor.y + this.segLen * i;
        }
        var pivot = this.points[this.n - 1];
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

    /* Elastic strap link (XPBD). lambda accumulates the link's tension over
       the passes of one step, which is what makes the stretch independent of
       ITERATIONS. */
    Lanyard.prototype.elastic = function (i, a, b, pinA, pinB, alphaT) {
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        var wa = pinA ? 0 : 1;
        var wb = pinB ? 0 : 1;
        if (!wa && !wb) return;
        var dl = (this.restLens[i] - dist - alphaT * this.lambda[i]) / (wa + wb + alphaT);
        this.lambda[i] += dl;
        var nx = dx / dist * dl;
        var ny = dy / dist * dl;
        a.x -= nx * wa; a.y -= ny * wa;
        b.x += nx * wb; b.y += ny * wb;
    };

    Lanyard.prototype.step = function () {
        this.time += STEP;

        var breeze = Math.sin(this.time * 1.1 + this.phase) * WIND +
            Math.sin(this.time * 0.37 + this.phase * 2) * WIND * 0.6;

        var i;
        for (i = 1; i < this.n; i++) {
            this.integrate(this.points[i], breeze, GRAVITY, FRICTION);
        }
        this.integrate(this.base, breeze * 0.5, GRAVITY, CARD_FRICTION);

        var pivot = this.points[this.n - 1];

        // A held card is driven straight from the pointer. Rewriting the
        // previous position rather than the current one means verlet reads
        // the drag delta as real velocity, so releasing mid-swing throws it.
        if (this.drag) {
            var tx = this.drag.x;
            var ty = this.drag.y;
            var dx = tx - this.anchor.x;
            var dy = ty - this.anchor.y;
            var d = Math.sqrt(dx * dx + dy * dy);
            var max = this.ropeLen * PULL;
            if (d > max) {
                tx = this.anchor.x + dx / d * max;
                ty = this.anchor.y + dy / d * max;
            }
            pivot.ox = pivot.x;
            pivot.oy = pivot.y;
            pivot.x = tx;
            pivot.y = ty;
        }

        var alphaT = this.compliance / (STEP * STEP);
        for (i = 0; i < this.n - 1; i++) this.lambda[i] = 0;
        for (var k = 0; k < ITERATIONS; k++) {
            this.points[0].x = this.anchor.x;
            this.points[0].y = this.anchor.y;
            for (i = 0; i < this.n - 1; i++) {
                this.elastic(i, this.points[i], this.points[i + 1],
                    i === 0, !!this.drag && i + 1 === this.n - 1, alphaT);
            }
            this.link(pivot, this.base, this.bodyLen, !!this.drag, false);
        }

        // Damp motion along the strap's axis only: bounces die out in about a
        // second while the sideways swing keeps its energy.
        if (!this.drag) {
            var ax = pivot.x - this.anchor.x;
            var ay = pivot.y - this.anchor.y;
            var al = Math.sqrt(ax * ax + ay * ay) || 0.0001;
            ax /= al; ay /= al;
            var ends = [pivot, this.base];
            for (i = 0; i < 2; i++) {
                var q = ends[i];
                var vr = (q.x - q.ox) * ax + (q.y - q.oy) * ay;
                q.ox += ax * vr * STRETCH_DAMP;
                q.oy += ay * vr * STRETCH_DAMP;
            }
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
        var d = ropePath(this.points);
        this.strap.setAttribute('d', d);
        this.shadow.setAttribute('d', d);
        this.stripe.setAttribute('d', d);

        var pivot = this.points[this.n - 1];
        var dx = this.base.x - pivot.x;
        var dy = this.base.y - pivot.y;
        // Screen-space CSS rotate() sends the base to -sin(theta); negate the
        // x term so a base hanging right maps to the matching tilt.
        var tilt = Math.atan2(-dx, Math.max(dy, 0.001)) * 180 / Math.PI;

        this.hanger.style.transform =
            'translate3d(' + (pivot.x - this.halfW).toFixed(1) + 'px,' +
            (pivot.y - this.originY).toFixed(1) + 'px,0) rotate(' + tilt.toFixed(2) + 'deg)' +
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
            var pivot = self.points[self.n - 1];
            self.grabX = (e.clientX - r.left) - pivot.x;
            self.grabY = (e.clientY - r.top) - pivot.y;
            self.drag = { x: pivot.x, y: pivot.y };
            self.press = { x: e.clientX, y: e.clientY, t: e.timeStamp, moved: false };
            if (self.track) self.track.style.animationPlayState = 'paused';
            self.stage.classList.add('is-held');
            self.wake();
            e.preventDefault();
        });

        this.card.addEventListener('pointermove', function (e) {
            if (self.pointerId !== e.pointerId || !self.drag) return;
            var r = self.stage.getBoundingClientRect();
            self.drag.x = (e.clientX - r.left) - self.grabX;
            self.drag.y = (e.clientY - r.top) - self.grabY;
            if (Math.abs(e.clientX - self.press.x) + Math.abs(e.clientY - self.press.y) > 8) {
                self.press.moved = true;
            }
        });

        function release(e) {
            if (self.pointerId !== e.pointerId) return;
            self.pointerId = null;
            self.drag = null;
            if (self.track) self.track.style.animationPlayState = '';
            self.stage.classList.remove('is-held');
            // A tap on a phone card has no drag to throw it, so give it a
            // kick: down into the strap (it stretches and bounces) and a
            // little sideways for a swing.
            if (self.kind.tapKick && e.type === 'pointerup' && !self.press.moved &&
                e.timeStamp - self.press.t < 350) {
                var side = Math.random() < 0.5 ? -1 : 1;
                var pv = self.points[self.n - 1];
                pv.oy -= 7;
                pv.ox -= side * 6;
                self.base.ox -= side * 3;
            }
        }
        this.card.addEventListener('pointerup', release);
        this.card.addEventListener('pointercancel', release);
        // Capture can also end without pointerup (window blur, context menu,
        // element re-layout). Without this the card stayed "held": pinned to
        // a stale point and impossible to grab again.
        this.card.addEventListener('lostpointercapture', release);

        // Keyboard nudge — the card is focusable, so the interaction is not
        // pointer-only.
        this.card.addEventListener('keydown', function (e) {
            var dir = e.key === 'ArrowLeft' ? -1 : (e.key === 'ArrowRight' ? 1 : 0);
            if (!dir) return;
            var pivot = self.points[self.n - 1];
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

    /* --- Phone marquee ------------------------------------------------------ */
    /* Each marquee card gets a slot: an untransformed box in the card's place
       that holds the strap SVG and gives the simulation fixed coordinates
       while the card itself is moved by the physics. */
    function phoneSlots() {
        var marquee = document.querySelector('.team-mobile-marquee');
        if (!marquee) return [];
        marquee.classList.add('tm-physics');
        return Array.prototype.slice.call(marquee.querySelectorAll('.tm-card'))
            .map(function (card) {
                var slot = document.createElement('div');
                slot.className = 'tm-slot';
                card.parentNode.insertBefore(slot, card);
                slot.appendChild(card);
                return slot;
            });
    }

    /* --- Driver ----------------------------------------------------------- */
    function run(kind, stages) {
        var items = stages.map(function (s) {
            var it = new Lanyard(s, kind);
            // The phone rows scroll sideways; hold still while a card is held.
            it.track = s.closest('.tm-track');
            return it;
        });

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
        // Entries only report the stages whose visibility just changed, so keep
        // the full set. Deciding from the entries alone froze every card as
        // soon as one row scrolled out while the others were still on screen.
        var onScreen = new Set();
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) onScreen.add(en.target);
                else onScreen.delete(en.target);
            });
            visible = onScreen.size > 0;
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

    /* The badge wall and the phone marquee are never shown together. Each is
       built the first time it is on screen, because a display:none layout
       measures as zero. */
    function init() {
        var built = {};
        function ensure() {
            var phone = window.innerWidth <= 768;
            var key = phone ? 'phone' : 'desktop';
            if (built[key]) return;
            var stages = phone ? phoneSlots() :
                Array.prototype.slice.call(document.querySelectorAll('.lanyard-stage'));
            if (!stages.length) return;
            built[key] = true;
            run(phone ? PHONE : DESKTOP, stages);
        }
        ensure();
        window.addEventListener('resize', ensure);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
