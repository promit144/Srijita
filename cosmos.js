/* =========================================
   OUT OF THIS WORLD  (page 7)
   1. warp-speed jump through the stars
   2. a spinning spiral galaxy, planets, shooting stars
      (drag a finger through the sky to leave stardust)
   3. one star shines brighter: tap it and a heart
      constellation is drawn around it with her name
   Loaded after script.js + enhance.js. Uses their helpers:
   ensureAudio, screenTimer, transitioning.
========================================= */
(function () {
"use strict";

const scr = document.getElementById("cosmos");
if (!scr) return;

const cv   = document.getElementById("cosmosCanvas");
const g    = cv.getContext("2d");
const star = document.getElementById("herStar");
const svg  = document.getElementById("constellation");
const tag  = document.getElementById("starTag");
const sub  = document.getElementById("cosmosSub");

const LITE = document.documentElement.classList.contains("lite");
const RM   = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const TAU  = Math.PI * 2;
const R    = (a, b) => a + Math.random() * (b - a);
const rp   = a => a[Math.random() * a.length | 0];
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;
const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

const SUB_1 = sub.innerHTML;
const SUB_2 = "Out of all that sky,<br>this one's yours ♡";


/* ---------- tiny synth (same idea as enhance.js) ---------- */
const AC = () => { try { return ensureAudio(); } catch (e) { return null; } };

function tone(f, d, o) {
  o = o || {};
  const c = AC(); if (!c) return;
  const t = c.currentTime + (o.at || 0), os = c.createOscillator(), gn = c.createGain();
  os.type = o.type || "sine";
  os.frequency.setValueAtTime(f, t);
  if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + d);
  gn.gain.setValueAtTime(.0001, t);
  gn.gain.exponentialRampToValueAtTime(o.v || .08, t + (o.a || .02));
  gn.gain.exponentialRampToValueAtTime(.0001, t + d);
  os.connect(gn); gn.connect(c.destination); os.start(t); os.stop(t + d + .05);
}

function noise(d, f0, f1, o) {
  o = o || {};
  const c = AC(); if (!c) return;
  const t = c.currentTime + (o.at || 0), n = c.sampleRate * d | 0;
  const b = c.createBuffer(1, n, c.sampleRate), a = b.getChannelData(0);
  for (let i = 0; i < n; i++) a[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(); s.buffer = b;
  const f = c.createBiquadFilter();
  f.type = o.type || "bandpass"; f.Q.value = o.q || 1;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + d);
  const gn = c.createGain();
  gn.gain.setValueAtTime(.0001, t);
  gn.gain.exponentialRampToValueAtTime(o.v || .1, t + d * (o.a || .3));
  gn.gain.exponentialRampToValueAtTime(.0001, t + d);
  s.connect(f); f.connect(gn); gn.connect(c.destination); s.start(t);
}

/* C major pentatonic, two octaves */
const PENT = [0, 2, 4, 7, 9];
const note = i => 523.25 * Math.pow(2, (PENT[i % 5] + 12 * Math.floor(i / 5)) / 12);


/* ---------- sprites (drawn once, stamped every frame) ---------- */
let SP = null;
const glow = (col, sz) => {
  const c = document.createElement("canvas"); c.width = c.height = sz;
  const x = c.getContext("2d");
  const gr = x.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, sz / 2);
  gr.addColorStop(0, col + "ff"); gr.addColorStop(.35, col + "88"); gr.addColorStop(1, col + "00");
  x.fillStyle = gr; x.fillRect(0, 0, sz, sz); return c;
};

function planet(r, c1, c2, ring, rc) {
  const pad = ring ? r * 1.95 : r * 1.25, S = Math.ceil(pad * 2);
  const c = document.createElement("canvas"); c.width = c.height = S * 2;
  const x = c.getContext("2d"); x.scale(2, 2);
  const cx = pad, cy = pad;
  /* atmosphere */
  const at = x.createRadialGradient(cx, cy, r * .9, cx, cy, r * 1.25);
  at.addColorStop(0, c1 + "55"); at.addColorStop(1, c1 + "00");
  x.fillStyle = at; x.beginPath(); x.arc(cx, cy, r * 1.25, 0, TAU); x.fill();
  /* back half of the ring */
  const ringHalf = (a0, a1) => {
    x.strokeStyle = rc; x.lineWidth = r * .2; x.globalAlpha = .7;
    x.beginPath(); x.ellipse(cx, cy, r * 1.75, r * .52, -.35, a0, a1); x.stroke(); x.globalAlpha = 1;
  };
  if (ring) ringHalf(Math.PI, TAU);
  /* sphere */
  const sp = x.createRadialGradient(cx - r * .38, cy - r * .4, r * .1, cx, cy, r);
  sp.addColorStop(0, c1); sp.addColorStop(1, c2);
  x.fillStyle = sp; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
  /* night side */
  x.save(); x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.clip();
  const sh = x.createRadialGradient(cx - r * .45, cy - r * .45, r * .6, cx + r * .3, cy + r * .3, r * 1.35);
  sh.addColorStop(0, "rgba(5,3,20,0)"); sh.addColorStop(1, "rgba(5,3,20,.45)");
  x.fillStyle = sh; x.fillRect(cx - r, cy - r, r * 2, r * 2); x.restore();
  /* front half of the ring */
  if (ring) ringHalf(0, Math.PI);
  c._pad = pad; return c;
}

function makeSprites() {
  const m = Math.min(W, H);
  const core = document.createElement("canvas"); core.width = core.height = 256;
  const x = core.getContext("2d");
  const cg = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  cg.addColorStop(0, "rgba(255,246,220,1)"); cg.addColorStop(.14, "rgba(255,218,160,.8)");
  cg.addColorStop(.4, "rgba(255,140,190,.28)"); cg.addColorStop(1, "rgba(255,120,180,0)");
  x.fillStyle = cg; x.fillRect(0, 0, 256, 256);
  SP = {
    core,
    gl: [glow("#ffd9a0", 32), glow("#ff7fb0", 32), glow("#a78bff", 32), glow("#7fd6ff", 32)],
    dust: [glow("#fff1c9", 24), glow("#ff9abb", 24), glow("#b79cff", 24)],
    pA: planet(m * .075, "#ffc9da", "#c85a97", true,  "rgba(255,226,190,.9)"),
    pB: planet(m * .036, "#c6f5ff", "#4a9bcf", false, ""),
  };
}


/* ---------- layout + scene state ---------- */
let W = 0, H = 0, D = 1;
let st = null, raf = 0, last = 0, phase = "idle";
const ptr = { x: 0, y: 0, tx: 0, ty: 0 };

function fit() {
  D = Math.min(LITE ? 1.5 : 2, window.devicePixelRatio || 1);
  W = scr.clientWidth; H = scr.clientHeight;
  cv.width = W * D; cv.height = H * D;
  g.setTransform(D, 0, 0, D, 0, 0);
  scr.style.setProperty("--cs", Math.min(W * .84, H * .36) + "px");
  scr.style.setProperty("--cy", H * .49 + "px");
  makeSprites();
}

/* a star starts at a random spot on the screen; as z shrinks it streaks outward */
function spawnStar(s, z) { s.z = z; s.x = R(-1, 1) * z; s.y = R(-1, 1) * z; }

function build() {
  const Rg = Math.min(W * .5, H * .32);
  const nS = LITE ? 130 : 280, nG = LITE ? 850 : 1700;
  const stars = Array.from({ length: nS }, () => {
    const s = { sp: R(.6, 1.4), ph: R(0, 6), c: rp(["#ffffff", "#ffe3ef", "#d6e8ff", "#fff1c9"]) };
    spawnStar(s, R(.08, 1)); return s;
  });
  const gal = Array.from({ length: nG }, () => {
    const halo = Math.random() < .18;
    const r = Rg * Math.pow(Math.random(), .72) * .98, f = r / Rg;
    const sd = .28 + (f < .25 ? 1.6 * (1 - f / .25) : 0);
    const a = halo ? R(0, TAU) : (Math.random() < .5 ? 0 : Math.PI) + f * 4.4 + gauss() * sd;
    const c = f < .22 ? 0 : f < .55 ? rp([1, 1, 2]) : rp([2, 3, 2]);
    return {
      r, a, w: .18 / (.5 + f * 2), c,
      s: R(2, 6) * (f < .2 ? 1.4 : 1) * (LITE ? 1.3 : 1),
      al: R(.35, .9) * (1 - .35 * f)
    };
  });
  st = {
    t: RM ? 3.2 : 0, Rg, gx: W / 2, gy: H * .6, sf: stars, gal,
    dust: [], shoot: null, nx: 5, fk: 0, flash: 0, mv: 0
  };
}


/* ---------- dust (finger trail, taps, the big burst) ---------- */
function dust(x, y, n, spd, big) {
  for (let i = 0; i < n; i++) {
    if (st.dust.length > (LITE ? 90 : 180)) st.dust.shift();
    const a = R(0, TAU), v = R(.3, 1) * spd;
    st.dust.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (big ? 0 : .15),
      l: 1, dl: R(.012, .028) * (big ? .7 : 1), s: R(5, 13) * (big ? 1.2 : 1), c: i % 3
    });
  }
}


/* ---------- the frame ---------- */
function frame(now) {
  if (!scr.classList.contains("go")) { raf = 0; return; }
  raf = requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last) / 1000); last = now;

  /* phones: hold the scene while the page transition is still running */
  if (LITE && typeof transitioning !== "undefined" && transitioning) return;

  st.t += dt;
  draw(st.t, dt);
}

function draw(t, dt) {
  g.clearRect(0, 0, W, H);
  ptr.x += (ptr.tx - ptr.x) * .06; ptr.y += (ptr.ty - ptr.y) * .06;

  /* ---- stars: warp streaks that settle into a quiet sky ---- */
  const wv = RM ? .02 : t < 1.5 ? 1 : Math.max(.02, Math.exp(-(t - 1.5) * 2.4));
  g.lineCap = "round";
  const hw = W / 2, hh = H / 2;
  for (const s of st.sf) {
    s.z -= wv * dt * .9 * s.sp;
    let px = hw + s.x / s.z * hw + ptr.x * (1 - s.z) * 16, py = hh + s.y / s.z * hh + ptr.y * (1 - s.z) * 16;
    if (s.z <= .03 || px < -40 || px > W + 40 || py < -40 || py > H + 40) {
      spawnStar(s, 1); px = hw + s.x * hw; py = hh + s.y * hh;
    }
    const z2 = s.z + wv * .09;
    const qx = hw + s.x / z2 * hw + ptr.x * (1 - z2) * 16, qy = hh + s.y / z2 * hh + ptr.y * (1 - z2) * 16;
    const tw = .55 + .45 * Math.sin(t * 2 + s.ph);
    g.globalAlpha = Math.min(1, (1 - s.z) * 1.6 + .25) * tw;
    const len = Math.hypot(px - qx, py - qy);
    if (len > 1.6) {
      g.strokeStyle = s.c; g.lineWidth = (1 - s.z) * 1.8 + .4;
      g.beginPath(); g.moveTo(qx, qy); g.lineTo(px, py); g.stroke();
    } else {
      g.fillStyle = s.c; g.beginPath(); g.arc(px, py, (1 - s.z) * 1.3 + .35, 0, TAU); g.fill();
    }
  }
  g.globalAlpha = 1;

  /* the white flash as the jump ends */
  const fl = Math.max(0, 1 - Math.abs(t - 1.75) / .4) * .5;
  if (fl > 0.01 && !RM) {
    const fg = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * .6);
    fg.addColorStop(0, "rgba(255,240,250," + fl + ")"); fg.addColorStop(1, "rgba(255,200,230,0)");
    g.fillStyle = fg; g.fillRect(0, 0, W, H);
  }

  /* ---- planets ---- */
  const pk = smooth((t - 2.3) / 1.5);
  if (pk > 0) {
    const a = SP.pA, b = SP.pB;
    g.globalAlpha = pk * (1 - .35 * st.fk);
    g.drawImage(a, W * .13 + ptr.x * -14 - a._pad, H * .83 + Math.sin(t * .5) * 5 + ptr.y * -10 - a._pad, a._pad * 2, a._pad * 2);
    g.drawImage(b, W * .9 + ptr.x * -9 - b._pad, H * .43 + Math.sin(t * .7 + 1) * 4 + ptr.y * -7 - b._pad, b._pad * 2, b._pad * 2);
    g.globalAlpha = 1;
  }

  /* ---- the galaxy ---- */
  const gk = smooth((t - 1.9) / 2.4), dim = 1 - .6 * st.fk;
  if (gk > 0) {
    const gx = st.gx + ptr.x * 8, gy = st.gy + ptr.y * 6, ph = -.35, ct = Math.cos(ph), sn = Math.sin(ph);
    g.globalCompositeOperation = "lighter";
    const cs = st.Rg * 1.25 * (.3 + .7 * gk);
    g.globalAlpha = gk * dim * (.88 + .12 * Math.sin(t * 2));
    g.drawImage(SP.core, gx - cs / 2, gy - cs / 2, cs, cs);
    for (const p of st.gal) {
      const th = p.a + t * p.w * (RM ? 0 : 1), rr = p.r * (.15 + .85 * gk);
      const ex = Math.cos(th) * rr, ey = Math.sin(th) * rr * .42;
      g.globalAlpha = p.al * gk * dim;
      g.drawImage(SP.gl[p.c], gx + ex * ct - ey * sn - p.s / 2, gy + ex * sn + ey * ct - p.s / 2, p.s, p.s);
    }
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
  }

  /* ---- shooting star ---- */
  if (t > 3) {
    st.nx -= dt;
    if (st.nx <= 0 && !st.shoot) {
      st.shoot = { x: W * R(.45, .95), y: H * R(.02, .3), l: 1 };
      st.nx = R(3.5, 6.5);
      tone(2400, .6, { to: 900, v: .025 }); tone(3200, .3, { v: .015, at: .1 });
    }
  }
  if (st.shoot) {
    const s = st.shoot; s.x -= 560 * dt; s.y += 250 * dt; s.l -= dt * .95;
    if (s.l <= 0) st.shoot = null;
    else {
      const gr = g.createLinearGradient(s.x, s.y, s.x + 110, s.y - 49);
      gr.addColorStop(0, "rgba(255,255,255," + s.l + ")"); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.strokeStyle = gr; g.lineWidth = 2; g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x + 110, s.y - 49); g.stroke();
    }
  }

  /* ---- stardust ---- */
  if (st.dust.length) {
    g.globalCompositeOperation = "lighter";
    st.dust = st.dust.filter(p => {
      p.x += p.vx * dt * 60; p.y += p.vy * dt * 60; p.vx *= .985; p.vy *= .985; p.l -= p.dl * dt * 60;
      if (p.l <= 0) return false;
      g.globalAlpha = p.l * .9;
      g.drawImage(SP.dust[p.c], p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
      return true;
    });
    g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
  }

  /* ease the galaxy dimmer while the constellation is drawn */
  const target = (phase === "found" || phase === "done") ? 1 : 0;
  st.fk += (target - st.fk) * Math.min(1, dt * 1.4);
}


/* ---------- touch / mouse: parallax + stardust ---------- */
let moveN = 0;
scr.addEventListener("pointermove", e => {
  if (!st) return;
  const r = scr.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  ptr.tx = (x / W - .5) * 2; ptr.ty = (y / H - .5) * 2;
  if (st.t > 2 && (++moveN % 2 === 0)) dust(x, y, 1, 1.2, false);
});
scr.addEventListener("pointerdown", e => {
  if (!st || st.t < 2 || e.target.closest("button")) return;
  const r = scr.getBoundingClientRect();
  dust(e.clientX - r.left, e.clientY - r.top, 12, 2.2, false);
  tone(note(Math.random() * 8 | 0) * 2, .9, { v: .035 });
});


/* ---------- the constellation ---------- */
const NS = "http://www.w3.org/2000/svg";
const mkEl = (tg, at, parent) => {
  const el = document.createElementNS(NS, tg);
  for (const k in at) el.setAttribute(k, at[k]);
  (parent || svg).appendChild(el); return el;
};

function heartPoints() {
  const N = 24, pts = [];
  for (let i = 0; i < N; i++) {
    const t = i / N * TAU;
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    pts.push([50 + hx * 2.5, 40 - hy * 2.5]);
  }
  return pts;
}

let heart = null;

function buildConstellation() {
  svg.innerHTML = "";
  svg.setAttribute("class", "constellation");
  const pts = heartPoints(), N = pts.length;
  const mx = pts.reduce((s, p) => s + p[0], 0) / N, my = pts.reduce((s, p) => s + p[1], 0) / N;

  mkEl("polygon", { class: "c-fill", points: pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ") });

  const lines = [], nodes = [];
  for (let i = 0; i < N; i++) {
    const a = pts[i], b = pts[(i + 1) % N];
    lines.push(mkEl("path", { class: "c-line", pathLength: "1", d: `M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}` }));
  }
  for (let i = 0; i < N; i++) {
    const gr = mkEl("g", { class: "c-node" });
    gr.style.setProperty("--tw", (-Math.random() * 2.6).toFixed(2) + "s");
    mkEl("circle", { class: "c-halo", cx: pts[i][0].toFixed(1), cy: pts[i][1].toFixed(1), r: 2.6 }, gr);
    mkEl("circle", { class: "c-dot",  cx: pts[i][0].toFixed(1), cy: pts[i][1].toFixed(1), r: .95 }, gr);
    nodes.push(gr);
  }
  /* a few tiny stars inside the heart */
  const tiny = [];
  for (let i = 0; i < 9; i++) {
    const p = rp(pts), k = R(.12, .72);
    const gr = mkEl("g", { class: "c-node" });
    gr.style.setProperty("--tw", (-Math.random() * 2.6).toFixed(2) + "s");
    mkEl("circle", { class: "c-tiny", cx: (mx + (p[0] - mx) * k).toFixed(1), cy: (my + (p[1] - my) * k).toFixed(1), r: R(.35, .7).toFixed(2) }, gr);
    tiny.push(gr);
  }
  heart = { pts, mx, my, lines, nodes, tiny };
}

function found() {
  phase = "found";
  scr.classList.add("found");
  scr.classList.remove("hint-on");
  star.classList.remove("nudge");
  buildConstellation();

  /* the star glides to the middle of the heart */
  const sr = svg.getBoundingClientRect(), pr = scr.getBoundingClientRect();
  const sx = sr.left - pr.left + heart.mx / 100 * sr.width;
  const sy = sr.top - pr.top + heart.my / 100 * sr.height;
  star.style.left = sx + "px"; star.style.top = sy + "px";

  tone(330, 1.6, { to: 990, v: .05, a: .5 });
  noise(1.2, 400, 3200, { v: .05, a: .6, type: "highpass" });

  screenTimer(() => { sub.classList.add("swap"); }, 100);
  screenTimer(() => { sub.innerHTML = SUB_2; }, 340);

  /* trace the outline: node, line, node, line… */
  const N = heart.pts.length, STEP = 90, T0 = 1100;
  for (let i = 0; i < N; i++) {
    screenTimer(() => {
      heart.nodes[i].classList.add("on");
      if (i > 0) heart.lines[i - 1].classList.add("on");
      const idx = Math.round((i < N / 2 ? i : N - 1 - i) * 7 / (N / 2));
      tone(note(idx) * 2, 1, { v: .055 });
    }, T0 + i * STEP);
  }
  const tEnd = T0 + N * STEP;                      /* ≈ 3.1 s */
  screenTimer(() => { heart.lines[N - 1].classList.add("on"); tone(note(0) * 4, 1.2, { v: .04 }); }, tEnd);
  screenTimer(() => {
    heart.tiny.forEach((el, i) => setTimeout(() => el.classList.add("on"), i * 90));
    svg.classList.add("filled");
    dust(sx, sy, LITE ? 36 : 70, 4.2, true);
    [523.25, 659.25, 783.99, 1046.5].forEach(f => tone(f, 3, { v: .045, at: .05 }));
    noise(.5, 3000, 600, { v: .08, a: .1 });
  }, tEnd + 350);
  screenTimer(() => { tag.classList.add("show"); svg.classList.add("twinkle"); phase = "done"; }, tEnd + 900);
  screenTimer(() => { scr.classList.add("is-done", "ready"); }, tEnd + 1900);   /* then: tap anywhere to continue */
}

star.addEventListener("click", e => {
  e.stopPropagation();
  if (phase !== "sky") return;
  found();
});


/* ---------- hooks called from script.js ---------- */
window.resetCosmos = function () {
  phase = "idle";
  scr.classList.remove("star-on", "found", "hint-on", "is-done", "ready");
  star.classList.remove("nudge");
  star.style.left = ""; star.style.top = "";
  tag.classList.remove("show");
  sub.classList.remove("swap"); sub.innerHTML = SUB_1;
  svg.innerHTML = ""; heart = null;
  ptr.x = ptr.y = ptr.tx = ptr.ty = 0; moveN = 0;
  fit(); build();
};

window.introCosmos = function () {
  if (!st) { fit(); build(); }
  phase = "sky";
  last = performance.now();
  if (!raf) raf = requestAnimationFrame(frame);

  /* the jump */
  if (!RM) {
    noise(2.3, 180, 5200, { v: .11, q: .8, a: .75 });
    tone(55, 2.2, { to: 380, v: .09, a: 1.5 });
    screenTimer(() => { tone(90, 1.2, { to: 30, v: .12 }); noise(.8, 1400, 150, { v: .08, type: "lowpass", a: .05 }); }, 1700);
  }
  /* arrival: a soft chord while the galaxy unfolds */
  screenTimer(() => [392, 493.88, 587.33, 783.99].forEach(f => tone(f, 4, { v: .03, a: .8 })), RM ? 50 : 1900);

  screenTimer(() => scr.classList.add("star-on"), 3600);
  screenTimer(() => scr.classList.add("hint-on"), 4200);
  screenTimer(() => { if (phase === "sky") star.classList.add("nudge"); }, 12000);
};

addEventListener("resize", () => {
  if (!st || !scr.classList.contains("active")) return;
  fit(); st.Rg = Math.min(W * .5, H * .32); st.gx = W / 2; st.gy = H * .6;
});

})();
