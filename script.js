/* =========================================
   SCREEN NAVIGATION + CINEMATIC TRANSITIONS
   Every page change has its own transition.
   Each screen runs its intro animation while the
   transition is revealing it, and "tap" hints only
   appear once that intro has finished (class .ready).
========================================= */

/* Phones / low-power devices get a lighter version of the heavy effects
   (same look, much less GPU work).  Add ?lite=1 to the URL to test on a PC. */

const LITE = (function () {

  if (/[?&]lite=1/.test(location.search)) return true;
  if (/[?&]lite=0/.test(location.search)) return false;

  const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.screen.width, window.screen.height) < 820;
  const weak = (navigator.hardwareConcurrency || 8) <= 6 || (navigator.deviceMemory || 8) <= 4;

  return (coarse && small) || (small && weak);

})();

document.documentElement.classList.toggle("lite", LITE);

/* false while the tab is hidden / the window is not focused */
let pageActive = true;

const app = document.getElementById("app");

const screens = [
  ...document.querySelectorAll(".screen")
];

let currentScreen = -1;
let transitioning = false;
let enteredAt = 0;

const reduceMotion =
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const TX_DURATION = 1150;   /* length of a page transition   */
const TX_INTRO_AT = LITE ? 650 : 480;    /* when the new page starts its intro */

/* small random helper (the cake section has its own) */
const rr = (a, b) => a + Math.random() * (b - a);


/* layer that holds transition effects (rings, light lines…) */

const txLayer = document.createElement("div");
txLayer.className = "tx-layer";
app.appendChild(txLayer);


/* timers that belong to the screen that is currently showing */

let screenTimers = [];

function screenTimer(fn, ms) {
  screenTimers.push(setTimeout(fn, ms));
}

function clearScreenTimers() {
  screenTimers.forEach(clearTimeout);
  screenTimers = [];
}


/* "tap" hints are allowed to show once a page has finished animating */

function markReady(screen) {
  if (screen.classList.contains("active")) {
    screen.classList.add("ready");
  }
}


/* how long each page's intro takes before its hint may appear */

const READY_AFTER = {
  0: 1900,   /* opening: heart + bow settle        */
  1: 3500,   /* birthday: letters, name, cat, text */
  5: 4600    /* tree: branches grow, hearts bloom  */
  /* 2 letter, 3 balloons, 4 cake: ready when their own action finishes */
};


/* things that must be in place before the reveal starts */

function preEnter(n) {

  if (n === 0) resetOpening();
  if (n === 2) resetLetter();
  if (n === 3) resetReasons();
  if (n === 5) resetTree();
  if (n === 6) resetCosmos();

}


/* the page's own intro (runs while it is being revealed) */

function startIntro(n) {

  const screen = screens[n];

  enteredAt = performance.now();

  screen.classList.add("go");

  if (n === 1) introBirthday();
  if (n === 3) introReasons();
  if (n === 4) resetCake();
  if (n === 5) introTree();
  if (n === 6) introCosmos();
  if (n === 7) introFinal();

  if (READY_AFTER[n]) {
    screenTimer(() => markReady(screen), READY_AFTER[n]);
  }

}


/* -----------------------------------------
   SHOW SCREEN
----------------------------------------- */

function goToScreen(number, opts) {

  opts = opts || {};

  if (transitioning) {
    return;
  }

  const to = (number + screens.length) % screens.length;
  const from = currentScreen;

  clearScreenTimers();

  currentScreen = to;

  const next = screens[to];
  const prev = from >= 0 ? screens[from] : null;

  next.classList.add("active");


  /* first load / reduced motion: no transition */

  if (!prev || prev === next || opts.instant || reduceMotion) {

    screens.forEach(screen => {
      if (screen !== next) {
        screen.classList.remove(
          "active", "go", "ready", "tx-in", "tx-out"
        );
      }
    });

    preEnter(to);
    startIntro(to);

    return;

  }


  transitioning = true;

  prev.classList.remove("ready");
  prev.classList.add("tx-out");
  next.classList.add("tx-in");

  prev.style.zIndex = 1;
  next.style.zIndex = 2;

  preEnter(to);

  screenTimer(() => startIntro(to), TX_INTRO_AT);

  runTransition(prev, next, to).then(() => {

    prev.classList.remove("active", "tx-out", "go", "ready");
    prev.style.zIndex = "";

    next.classList.remove("tx-in");
    next.style.zIndex = "";

    transitioning = false;

  });

}


/* =========================================
   THE TRANSITIONS  (one per page)
========================================= */

function runTransition(prev, next, to) {

  const W = app.clientWidth;
  const H = app.clientHeight;
  const R = Math.hypot(W, H);

  const D = TX_DURATION;
  const EASE = "cubic-bezier(.65, 0, .25, 1)";

  const anims = [];
  const nodes = [];

  const A = (el, frames, opts) => {

    const anim = el.animate(
      frames,
      Object.assign(
        { duration: D, easing: EASE, fill: "both" },
        opts || {}
      )
    );

    anims.push(anim);

    return anim;

  };

  const node = (cls, css) => {

    const el = document.createElement("div");

    el.className = cls;

    if (css) {
      Object.assign(el.style, css);
    }

    txLayer.appendChild(el);
    nodes.push(el);

    return el;

  };

  const host = (x, y) => node("pop-host", { left: x + "px", top: y + "px" });

  playWhoosh();


  switch (to) {

    /* 1 — BLOOM: the shot heart blooms open into the next page */
    case 1: {

      const x = AIM.hx || W / 2;
      const y = AIM.hy || H / 2;

      A(next, [
        { clipPath: `circle(0px at ${x}px ${y}px)` },
        { clipPath: `circle(${R}px at ${x}px ${y}px)` }
      ]);

      A(prev, [
        { transform: "scale(1)", filter: "brightness(1)" },
        { transform: "scale(1.12)", filter: "brightness(1.3)" }
      ]);

      const ring = node("tx-ring", { left: x + "px", top: y + "px" });

      A(ring, [
        { width: "0px", height: "0px", opacity: 1 },
        { width: 2 * R + "px", height: 2 * R + "px", opacity: .85 }
      ]);

      spawnParticles(22, 90, 300, host(x, y), .75);

      break;

    }


    /* 2 — CURTAIN: the page splits open from a glowing seam */
    case 2: {

      A(next, [
        { clipPath: "inset(0 50% 0 50%)" },
        { clipPath: "inset(0 0% 0 0%)" }
      ]);

      A(prev, [
        { transform: "scale(1)", filter: "brightness(1)" },
        { transform: "scale(.92)", filter: "brightness(.5)" }
      ]);

      const left = node("tx-vline", { left: "50%" });
      const right = node("tx-vline", { left: "50%" });

      A(left, [
        { transform: "translateX(0px)", opacity: 1 },
        { transform: `translateX(${-W / 2}px)`, opacity: .15 }
      ]);

      A(right, [
        { transform: "translateX(0px)", opacity: 1 },
        { transform: `translateX(${W / 2}px)`, opacity: .15 }
      ]);

      spawnParticles(18, 60, Math.max(160, W * .45), host(W / 2, H / 2), .35);

      break;

    }


    /* 3 — WARP: fly through a flash of light into the next page */
    case 3: {

      A(prev, [
        { opacity: 1, transform: "scale(1)", filter: "blur(0px) brightness(1)" },
        { opacity: 0, transform: "scale(1.55)", filter: "blur(16px) brightness(1.6)" }
      ]);

      A(next, [
        { opacity: 0, transform: "scale(.7)", filter: "blur(18px) brightness(1.8)" },
        { opacity: 1, transform: "scale(1)", filter: "blur(0px) brightness(1)" }
      ]);

      const flash = node("tx-flash");

      A(flash, [
        { opacity: 0 },
        { opacity: .95, offset: .45 },
        { opacity: 0 }
      ]);

      spawnParticles(26, 120, Math.max(240, W * .6), host(W / 2, H / 2), .25);

      break;

    }


    /* 4 — SPARKLE SWEEP: a slanted curtain of light wipes across */
    case 4: {

      const slant = .3;
      const lineH = Math.hypot(slant * W, H);
      const angle = Math.atan2(slant * W, H);

      A(next, [
        { clipPath: "polygon(0% 0%, 0% 0%, -30% 100%, 0% 100%)" },
        { clipPath: "polygon(0% 0%, 130% 0%, 100% 100%, 0% 100%)" }
      ]);

      A(prev, [
        { transform: "scale(1)", filter: "brightness(1)" },
        { transform: "scale(1.06)", filter: "brightness(.55)" }
      ]);

      const bar = node("tx-diag", { height: lineH + "px" });

      A(bar, [
        { transform: `translateX(0px) rotate(${angle}rad)` },
        { transform: `translateX(${(1 + slant) * W}px) rotate(${angle}rad)` }
      ]);

      for (let i = 0; i < 4; i++) {

        setTimeout(() => {

          spawnParticles(
            8, 40, 180,
            host(rr(W * .15, W * .85), rr(H * .1, H * .9)),
            .3
          );

        }, 150 + i * 190);

      }

      break;

    }


    /* 5 — IRIS: opens from where the wish star flew off */
    case 5: {

      const x = W * .2;
      const y = H * .1;

      /* phones: opacity/transform only (clip-path + blur are too heavy here) */
      if (LITE) {

        A(next, [
          { opacity: 0, transform: "scale(1.05)" },
          { opacity: 1, transform: "scale(1)" }
        ], { easing: "ease-out" });

        A(prev, [
          { transform: "scale(1)" },
          { transform: "scale(.96)" }
        ]);

        const glow = node("tx-flash", {
          background:
            `radial-gradient(circle at ${x}px ${y}px, rgba(255,226,160,.85) 0, rgba(255,170,120,.35) 30%, transparent 62%)`
        });

        A(glow, [
          { opacity: 0 },
          { opacity: 1, offset: .35 },
          { opacity: 0 }
        ]);

        spawnParticles(10, 60, 200, host(x, y), .2);

        break;

      }

      A(next, [
        { clipPath: `circle(0px at ${x}px ${y}px)` },
        { clipPath: `circle(${R}px at ${x}px ${y}px)` }
      ]);

      A(prev, [
        { transform: "scale(1)", filter: "brightness(1) blur(0px)" },
        { transform: "scale(.94)", filter: "brightness(.6) blur(4px)" }
      ]);

      const ring = node("tx-ring gold", { left: x + "px", top: y + "px" });

      A(ring, [
        { width: "0px", height: "0px", opacity: 1 },
        { width: 2 * R + "px", height: 2 * R + "px", opacity: .8 }
      ]);

      spawnParticles(20, 60, 220, host(x, y), .2);

      break;

    }


    /* 6 — HYPERSPACE: the tree page zooms away into the stars */
    case 6: {

      if (LITE) {

        A(next, [
          { opacity: 0, transform: "scale(1.18)" },
          { opacity: 1, transform: "scale(1)" }
        ], { easing: "ease-out" });

        A(prev, [
          { opacity: 1, transform: "scale(1)" },
          { opacity: 0, transform: "scale(.82)" }
        ]);

        break;

      }

      A(next, [
        { opacity: 0, transform: "scale(1.3)", filter: "blur(10px) brightness(2)" },
        { opacity: 1, transform: "scale(1)", filter: "blur(0px) brightness(1)" }
      ]);

      A(prev, [
        { opacity: 1, transform: "scale(1)", filter: "brightness(1)" },
        { opacity: 0, transform: "scale(.7)", filter: "brightness(2.2)" }
      ]);

      spawnParticles(18, 80, 300, host(W / 2, H / 2), .3);

      break;

    }


    /* 7 — SUNRISE: a warm horizon of light lifts the final page up */
    case 7: {

      /* phones: the page simply slides up (transform only, no clip-path / filter) */
      if (LITE) {

        A(next, [
          { transform: "translateY(100%)" },
          { transform: "translateY(0px)" }
        ]);

        A(prev, [
          { transform: "translateY(0px)", opacity: 1 },
          { transform: `translateY(${-H * .07}px)`, opacity: .55 }
        ]);

        const liteBar = node("tx-hbar");

        A(liteBar, [
          { transform: `translateY(${H}px)` },
          { transform: "translateY(0px)" }
        ]);

        break;

      }

      A(next, [
        { clipPath: "inset(100% 0 0 0)" },
        { clipPath: "inset(0% 0 0 0)" }
      ]);

      A(prev, [
        { transform: "translateY(0px)", filter: "brightness(1)" },
        { transform: `translateY(${-H * .07}px)`, filter: "brightness(.65)" }
      ]);

      const bar = node("tx-hbar");

      A(bar, [
        { transform: `translateY(${H}px)` },
        { transform: "translateY(0px)" }
      ]);

      break;

    }


    /* 0 — REPLAY: a soft dream-dissolve back to the start */
    default: {

      if (LITE) {

        A(next, [
          { opacity: 0, transform: "scale(1.06)" },
          { opacity: 1, transform: "scale(1)" }
        ], { easing: "ease-out" });

        A(prev, [
          { opacity: 1 },
          { opacity: 0 }
        ]);

        spawnParticles(14, 80, 280, host(W / 2, H / 2), .8);

        break;

      }

      A(next, [
        { opacity: 0, transform: "scale(1.1)", filter: "blur(12px)" },
        { opacity: 1, transform: "scale(1)", filter: "blur(0px)" }
      ]);

      A(prev, [
        { opacity: 1, transform: "scale(1)", filter: "blur(0px)" },
        { opacity: 0, transform: "scale(.94)", filter: "blur(8px)" }
      ]);

      spawnParticles(20, 80, 280, host(W / 2, H / 2), .8);

    }

  }


  return new Promise(resolve => {

    setTimeout(() => {

      anims.forEach(anim => anim.cancel());
      nodes.forEach(el => el.remove());

      resolve();

    }, D + 90);

  });

}


/* =========================================
   TAP ANYWHERE TO CONTINUE
========================================= */

screens.forEach((screen, index) => {

  screen.addEventListener("click", function(event) {

    if (transitioning) {
      return;
    }

    /*
      Don't change screen when clicking
      an interactive element.
    */

    if (
      event.target.closest("button") ||
      event.target.closest("audio")
    ) {
      return;
    }


    /* Opening has the heart; the last page has Replay. */

    if (index === 0 || index === screens.length - 1) {
      return;
    }


    /* ignore taps while the page is still arriving */

    if (performance.now() - enteredAt < 700) {
      return;
    }


    /*
      Letter screen: first tap opens the envelope,
      and taps are ignored while it is opening.
    */

    if (index === 2 && letterState !== "open") {

      if (letterState === "closed") {
        openEnvelope();
      }

      return;
    }


    /* Birthday + tree: wait until the intro has finished. */

    if ((index === 1 || index === 5) && !screen.classList.contains("ready")) {
      return;
    }


    /* Balloons + cake: wait until the moment is complete. */

    if ((index === 3 || index === 4 || index === 6) && !screen.classList.contains("is-done")) {
      return;
    }


    /*
      Tap anywhere → next screen
    */

    goToScreen(index + 1);

  });

});


/* =========================================
   SOUND HELPERS  (whoosh + chime)
========================================= */

function ensureAudio() {

  /* no sound effects while the page is hidden / unfocused */
  if (!pageActive) {
    return null;
  }

  if (!audioContext) {

    audioContext = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();

  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;

}


function playWhoosh() {

  try {

    const ctx = ensureAudio();
    const now = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 1.0);

    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 1.4;
    filter.frequency.setValueAtTime(260, now);
    filter.frequency.exponentialRampToValueAtTime(2600, now + .5);
    filter.frequency.exponentialRampToValueAtTime(500, now + 1.0);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + .35);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    src.start(now);
    src.stop(now + 1.0);

  } catch (e) {}

}


/* a rising little glass-bell for every message that arrives */

const CHIME_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

function playChime(step) {

  try {

    const ctx = ensureAudio();
    const now = ctx.currentTime;
    const f = CHIME_NOTES[Math.min(step, CHIME_NOTES.length - 1)];

    [[1, .22, 0], [2, .08, 0], [1, .09, .17]].forEach(([mult, vol, delay]) => {

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = f * mult;

      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(vol, now + delay + .015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 1.35);

    });

  } catch (e) {}

}


/* =========================================
   PAGE INTROS (birthday / tree / final)
========================================= */

/* split a text element into letters that can drop in one by one */

function splitLetters(el, lines) {

  let i = 0;

  el.setAttribute("aria-label", lines.join(" "));

  el.innerHTML = lines
    .map(line =>
      `<span class="ln" aria-hidden="true">${
        [...line]
          .map(ch => `<span class="ch" style="--i:${i++}">${ch}</span>`)
          .join("")
      }</span>`
    )
    .join("<br>");

}

(function prepareBirthday() {

  const screen = document.querySelector(".birthday");

  splitLetters(screen.querySelector("h1"), ["Happy", "Birthday"]);
  splitLetters(screen.querySelector(".name"), ["Srijita!"]);

  const fx = document.createElement("div");
  fx.className = "pop-host birthday-fx";
  fx.id = "birthdayFx";
  screen.appendChild(fx);

})();


function introBirthday() {

  const fx = document.getElementById("birthdayFx");

  /* confetti pops out when the name lands */
  screenTimer(() => {
    spawnParticles(30, 100, 330, fx, .55);
  }, 1750);

  screenTimer(() => {
    spawnParticles(14, 80, 240, fx, .8);
  }, 2250);

}


/* ---- tree: branches grow, hearts bloom bottom → top ---- */

const treeScreen = document.querySelector(".tree-screen");
const treeBranches = [
  ...document.querySelectorAll(".branch-lines path")
];

treeBranches.forEach(path => {
  path.setAttribute("pathLength", "1");
  path.style.strokeDasharray = "1";
  path.style.strokeDashoffset = "1";
});


function resetTree() {

  treeBranches.forEach(path => {
    path.getAnimations().forEach(anim => anim.cancel());
  });

  if (treeHeartField) {
    treeHeartField.style.visibility = "hidden";
  }

}


function introTree() {

  treeBranches.forEach((path, i) => {

    path.animate(
      [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
      {
        duration: i === 0 ? 1300 : 1100,
        delay: i === 0 ? 0 : 500 + i * 85,
        easing: "cubic-bezier(.4, .1, .3, 1)",
        fill: "both"
      }
    );

  });

  if (!treeHeartField) {
    return;
  }

  treeHeartField.style.visibility = "visible";

  [...treeHeartField.children].forEach(heart => {

    const y = parseFloat(heart.style.top) || 50;     /* % from top */

    heart.animate(
      [{ scale: 0 }, { scale: 1.35, offset: .6 }, { scale: 1 }],
      {
        duration: 800,
        delay: 900 + (100 - y) * 18 + Math.random() * 200,
        easing: "cubic-bezier(.2, .9, .3, 1)",
        fill: "backwards"
      }
    );

  });

  /* a gentle shower of sparkles as the canopy fills in */
  screenTimer(() => rainHearts(treeScreen, 10), 1900);

}


/* ---- final ---- */

function rainHearts(screen, count) {

  if (LITE) count = Math.ceil(count * .5);

  const H = screen.clientHeight;
  const W = screen.clientWidth;

  for (let i = 0; i < count; i++) {

    const heart = document.createElement("i");

    heart.className = "letter-heart";
    heart.textContent = Math.random() < .7 ? "♥" : "♡";
    heart.style.left = rr(4, 96) + "%";
    heart.style.fontSize = rr(10, 26) + "px";
    heart.style.color = FX_COLORS[Math.floor(Math.random() * FX_COLORS.length)];

    screen.appendChild(heart);

    const sway = rr(-.5, .5) * Math.min(160, W * .35);

    const anim = heart.animate(
      [
        { transform: "translate(0, 0) scale(.6)", opacity: 0 },
        { transform: `translate(${sway * .5}px, ${-H * .35}px) scale(1)`, opacity: .85, offset: .25 },
        { transform: `translate(${sway}px, ${-H - 40}px) scale(.8)`, opacity: 0 }
      ],
      {
        duration: rr(5500, 9500),
        delay: rr(0, 2400),
        easing: "ease-out",
        fill: "both"
      }
    );

    anim.onfinish = () => heart.remove();

  }

}


function introFinal() {

  const screen = document.querySelector(".final-screen");

  screenTimer(() => {

    const host = document.createElement("div");

    host.className = "pop-host";
    host.style.left = "50%";
    host.style.top = "34%";

    screen.appendChild(host);

    spawnParticles(36, 120, 380, host, .65);

    setTimeout(() => host.remove(), 2600);

  }, 900);

  screenTimer(() => rainHearts(screen, 22), 700);

}


/* =========================================
   MUSIC
========================================= */

const song =
  document.getElementById("song");

const musicBtn =
  document.getElementById("musicBtn");

const musicPill =
  document.getElementById("musicPill");


async function playMusic() {

  try {

    await song.play();

    musicPill.classList.add(
      "playing"
    );

    musicBtn.textContent = "Ⅱ";

  }

  catch (error) {

    console.log(
      "Music could not start:",
      error
    );

  }

}


function pauseMusic() {

  song.pause();

  musicPill.classList.remove(
    "playing"
  );

  musicBtn.textContent = "♫";

}


musicBtn.addEventListener(
  "click",
  function(event) {

    event.stopPropagation();

    musicAutoPaused = false;

    if (song.paused) {

      playMusic();

    } else {

      pauseMusic();

    }

  }
);


/* The song only plays while this page is the one being looked at.
   Minimise the browser, switch tab or switch app → it pauses;
   come back → it continues (unless it was paused by hand). */

let musicAutoPaused = false;

function goAway() {

  pageActive = false;

  if (!song.paused) {
    musicAutoPaused = true;
    pauseMusic();
  }

  if (audioContext && audioContext.state === "running") {
    audioContext.suspend();
  }

}

function comeBack() {

  pageActive = true;

  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }

  if (musicAutoPaused) {
    musicAutoPaused = false;
    playMusic();
  }

}

document.addEventListener("visibilitychange", function() {
  document.hidden ? goAway() : comeBack();
});

window.addEventListener("blur", goAway);

window.addEventListener("focus", function() {
  if (!document.hidden) comeBack();
});

window.addEventListener("pagehide", goAway);

window.addEventListener("pageshow", function() {
  if (!document.hidden) comeBack();
});


/* =========================================
   OPENING HEART — BOW & ARROW
========================================= */

const openingHeart = document.getElementById("openingHeart");
const openingBow = document.getElementById("openingBow");
const openingArrow = document.getElementById("openingArrow");
const impactParticles = document.getElementById("impactParticles");

const heroScreen = document.querySelector(".hero");
const bowLimb = document.getElementById("bowLimb");
const bowGrip = document.getElementById("bowGrip");
const bowString = document.getElementById("bowString");
const arrowTrail = document.getElementById("arrowTrail");
const aimLine = document.getElementById("aimLine");

let openingShot = false;
let openingFrame = null;

/* Geometry (local bow space: +x points at the heart) */
const ARROW_LEN = 106;   // tail -> tip
const REST_X = -2;       // string position when relaxed
const MAX_PULL = 34;     // how far the string is drawn back

const AIM = { bx: 0, by: 0, angle: 0, distance: 0, hx: 0, hy: 0 };

const IDLE = {
  pull: 0, tail: REST_X, kick: 0,
  recoil: 0, wobble: 0, trail: 0, aim: 0
};


/* Work out where the bow sits and exactly where the heart is,
   so the arrow always flies straight at it (any screen size). */

function layoutArchery() {

  if (!heroScreen.clientWidth) {
    return;
  }

  const W = heroScreen.clientWidth;
  const H = heroScreen.clientHeight;

  AIM.hx = openingHeart.offsetLeft + openingHeart.offsetWidth / 2;
  AIM.hy = openingHeart.offsetTop + openingHeart.offsetHeight * 0.46;

  AIM.bx = Math.max(78, W * 0.22);
  AIM.by = H * 0.8;

  const dx = AIM.hx - AIM.bx;
  const dy = AIM.hy - AIM.by;

  AIM.angle = Math.atan2(dy, dx);
  AIM.distance = Math.hypot(dx, dy);

  heroScreen.style.setProperty("--bx", AIM.bx + "px");
  heroScreen.style.setProperty("--by", AIM.by + "px");
  heroScreen.style.setProperty("--ang", AIM.angle + "rad");

  impactParticles.style.left = AIM.hx + "px";
  impactParticles.style.top = AIM.hy + "px";

  aimLine.style.width =
    Math.max(0, AIM.distance - ARROW_LEN - 14 - 54) + "px";

  aimLine.style.transform =
    `translate(${AIM.bx}px, ${AIM.by}px) ` +
    `rotate(${AIM.angle}rad) translateX(${ARROW_LEN + 14}px)`;

}


/* Draw one frame of the bow + arrow. */

function renderArchery(s) {

  const tipX = REST_X - s.pull * 0.2;
  const tipY = 62 - s.pull * 0.14;
  const ctrlX = 22 - s.pull * 0.12;
  const nockX = REST_X - s.pull;

  bowLimb.setAttribute(
    "d",
    `M${tipX} ${-tipY} C${ctrlX} -40 ${ctrlX} 40 ${tipX} ${tipY}`
  );

  bowString.setAttribute(
    "d",
    `M${tipX} ${-tipY} L${nockX} 0 L${tipX} ${tipY}`
  );

  bowGrip.setAttribute(
    "transform",
    `translate(${-0.14 * s.pull} 0)`
  );

  openingBow.style.transform =
    `translate(${AIM.bx}px, ${AIM.by}px) ` +
    `rotate(${AIM.angle + s.kick}rad) translate(${s.recoil}px, 0)`;

  const wob = s.wobble
    ? ` translate(${ARROW_LEN}px, 0) rotate(${s.wobble}rad) translate(${-ARROW_LEN}px, 0)`
    : "";

  openingArrow.style.transform =
    `translate(${AIM.bx}px, ${AIM.by}px) ` +
    `rotate(${AIM.angle}rad) translate(${s.tail}px, 0)${wob}`;

  arrowTrail.setAttribute("opacity", s.trail);

  aimLine.style.opacity = s.aim * 0.9;

}


function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}


/* ---- impact effects ---- */

const FX_COLORS = [
  "#ec3270", "#ff5d91", "#ff9abb",
  "#ffb4ca", "#f0a72c", "#ffc044"
];

function spawnParticles(count, minDist, maxDist, host = impactParticles, heartRatio = 0.6) {

  if (LITE) count = Math.max(4, Math.ceil(count * .6));

  for (let i = 0; i < count; i++) {

    const el = document.createElement("i");
    const isHeart = Math.random() < heartRatio;

    el.className = "fx-particle";

    el.textContent = isHeart
      ? "♥"
      : (Math.random() < 0.5 ? "✦" : "✧");

    el.style.color = isHeart
      ? FX_COLORS[Math.floor(Math.random() * 4)]
      : (Math.random() < 0.5 ? "#f0a72c" : "#fff3e7");

    el.style.fontSize =
      (isHeart ? 12 + Math.random() * 16 : 10 + Math.random() * 12) + "px";

    host.appendChild(el);

    const a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const d = minDist + Math.random() * (maxDist - minDist);
    const dx = Math.cos(a) * d;
    const dy = Math.sin(a) * d;
    const rot = (Math.random() - 0.5) * 160;

    const anim = el.animate(
      [
        {
          transform: "translate(0px, 0px) translate(-50%, -50%) scale(.2) rotate(0deg)",
          opacity: 0
        },
        {
          transform: `translate(${dx * 0.7}px, ${dy * 0.7}px) translate(-50%, -50%) scale(1.1) rotate(${rot * 0.6}deg)`,
          opacity: 1,
          offset: 0.35
        },
        {
          transform: `translate(${dx}px, ${dy + 46}px) translate(-50%, -50%) scale(.6) rotate(${rot}deg)`,
          opacity: 0
        }
      ],
      {
        duration: 900 + Math.random() * 500,
        easing: "cubic-bezier(.12,.7,.3,1)",
        fill: "forwards"
      }
    );

    anim.onfinish = () => el.remove();

  }

}

function spawnShockwave() {

  const flash = document.createElement("i");
  flash.className = "fx-flash";
  impactParticles.appendChild(flash);

  flash.animate(
    [
      { transform: "translate(-50%, -50%) scale(.2)", opacity: 1 },
      { transform: "translate(-50%, -50%) scale(3.2)", opacity: 0 }
    ],
    { duration: 450, easing: "ease-out" }
  ).onfinish = () => flash.remove();

  const ring = document.createElement("i");
  ring.className = "fx-ring";
  impactParticles.appendChild(ring);

  ring.animate(
    [
      { transform: "translate(-50%, -50%) scale(.2)", opacity: .9 },
      { transform: "translate(-50%, -50%) scale(5.2)", opacity: 0 }
    ],
    { duration: 700, easing: "cubic-bezier(.1,.7,.3,1)" }
  ).onfinish = () => ring.remove();

}


/* ---- the release: fly -> hit -> burst (the draw is done by the player) ---- */

function playRelease(pull0, power) {

  /* a fuller draw flies a little faster */
  const base = Math.min(560, Math.max(360, AIM.distance));
  const fly = base * (1.28 - 0.38 * power);
  const tHit = fly;

  const tailStart = REST_X - pull0;
  const tailEnd = AIM.distance - ARROW_LEN + 4;

  let hit = false;
  let burst = false;

  const t0 = performance.now();

  function frame(now) {

    const t = now - t0;
    const s = { ...IDLE };

    const ms = t;
    const k = ms / 1000;
    const p = Math.min(1, ms / fly);
    const e = 0.65 * p + 0.35 * (1 - (1 - p) * (1 - p));

    s.pull = pull0 * Math.exp(-7 * k) * Math.cos(k * Math.PI * 18);
    s.tail = tailStart + (tailEnd - tailStart) * e;
    s.kick = 0.05 * power * Math.exp(-9 * k) * Math.sin(k * Math.PI * 14);
    s.recoil = -4 * power * Math.exp(-14 * k);
    s.aim = Math.max(0, 1 - ms / 160);

    s.trail = p < 1
      ? Math.min(1, p * 8) * 0.9
      : Math.max(0, 0.9 - (t - tHit) / 160);

    if (t >= tHit) {
      const k2 = (t - tHit) / 1000;
      s.wobble = 0.12 * Math.exp(-8 * k2) * Math.sin(k2 * Math.PI * 22);
    }

    renderArchery(s);

    if (!hit && t >= tHit) {
      hit = true;
      openingHeart.classList.add("hit");
      spawnShockwave();
      spawnParticles(16, 60, 150);
      buzz([18, 30, 40]);
    }

    if (!burst && t >= tHit + 170) {
      burst = true;
      openingHeart.classList.add("shattered");
      openingArrow.classList.add("gone");
      spawnParticles(10, 40, 110);
    }

    if (t >= tHit + 800) {
      openingFrame = null;
      goToScreen(1);
      return;
    }

    openingFrame = requestAnimationFrame(frame);

  }

  openingFrame = requestAnimationFrame(frame);

}


/* ---- little bow sounds (made with the same audio context as the rest) ---- */

function bowCreak(power) {
  const c = ensureAudio();
  if (!c) return;
  const t = c.currentTime, o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(70 + power * 90, t);
  f.type = "lowpass"; f.frequency.value = 420;
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(.03, t + .02);
  g.gain.exponentialRampToValueAtTime(.0001, t + .09);
  o.connect(f); f.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + .12);
}

function bowTwang(power) {
  const c = ensureAudio();
  if (!c) return;
  const t = c.currentTime;
  [[196, .22], [392, .1], [588, .05]].forEach(([hz, v], i) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = i ? "sine" : "triangle";
    o.frequency.setValueAtTime(hz * (0.92 + .08 * power), t);
    o.frequency.exponentialRampToValueAtTime(hz * .96, t + .5);
    g.gain.setValueAtTime(v * (.5 + .5 * power), t);
    g.gain.exponentialRampToValueAtTime(.0001, t + .55);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + .6);
  });
  /* the arrow's whoosh */
  const n = c.sampleRate * .4 | 0, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = .9;
  bp.frequency.setValueAtTime(900, t); bp.frequency.exponentialRampToValueAtTime(3200, t + .4);
  const g2 = c.createGain();
  g2.gain.setValueAtTime(.0001, t); g2.gain.exponentialRampToValueAtTime(.09 * power, t + .08);
  g2.gain.exponentialRampToValueAtTime(.0001, t + .4);
  src.connect(bp); bp.connect(g2); g2.connect(c.destination); src.start(t);
}


/* ---- the player draws the bow: press the bow, drag back, let go ---- */

const FULL_DRAG = 120;      /* px of dragging that equals a full draw      */
const MIN_POWER = 0.42;     /* a weaker draw just springs back             */
const GRAB_R    = 78;       /* how close to the bow/arrow a press must be  */

let drawing = false;
let drawPull = 0;
let drawStart = null;
let lastCreak = 0;
let springFrame = null;

const hint = heroScreen.querySelector(".hint");
const HINT_TEXT = hint ? hint.textContent.trim() : "";

function setHint(text) {
  if (hint) hint.textContent = text;
}

/* distance from a point to the bow + arrow (a short line along the aim) */
function nearBow(x, y) {

  const ux = Math.cos(AIM.angle), uy = Math.sin(AIM.angle);
  const rx = x - AIM.bx, ry = y - AIM.by;
  const along = Math.max(-40, Math.min(ARROW_LEN, rx * ux + ry * uy));

  return Math.hypot(rx - ux * along, ry - uy * along) <= GRAB_R;

}

function heroPoint(e) {
  const r = heroScreen.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function renderDraw(pull) {
  renderArchery({ ...IDLE, pull: pull, tail: REST_X - pull, aim: pull / MAX_PULL });
}

function springBack(from) {

  cancelAnimationFrame(springFrame);

  const t0 = performance.now();

  (function step(now) {

    const k = (now - t0) / 1000;
    const p = from * Math.exp(-9 * k) * Math.cos(k * Math.PI * 16);

    renderDraw(p);

    if (k < .55 && !openingShot && !drawing) {
      springFrame = requestAnimationFrame(step);
    } else if (!openingShot && !drawing) {
      renderArchery(IDLE);
    }

  })(t0);

}

heroScreen.addEventListener("pointerdown", function(e) {

  if (openingShot || transitioning || !heroScreen.classList.contains("go")) return;
  if (e.target.closest("button")) return;

  const p = heroPoint(e);

  layoutArchery();

  /* pressed somewhere else (or on the heart): show where to pull instead */
  if (!nearBow(p.x, p.y)) {

    heroScreen.classList.remove("nudge");
    void heroScreen.offsetWidth;
    heroScreen.classList.add("nudge");
    setHint("press the bow, pull back, then let go");
    return;

  }

  drawing = true;
  drawStart = p;
  drawPull = 0;
  cancelAnimationFrame(springFrame);

  try { heroScreen.setPointerCapture(e.pointerId); } catch (err) {}

  heroScreen.classList.remove("ready", "nudge");
  heroScreen.classList.add("aiming", "grabbed");

  /* the first touch is a user gesture: get the music going */
  if (song.paused) playMusic();

  bowCreak(.2);
  e.preventDefault();

});

heroScreen.addEventListener("pointermove", function(e) {

  if (!drawing) return;

  const p = heroPoint(e);

  /* only dragging AWAY from the heart draws the string */
  const ux = Math.cos(AIM.angle), uy = Math.sin(AIM.angle);
  const back = -((p.x - drawStart.x) * ux + (p.y - drawStart.y) * uy);

  const prev = drawPull;
  drawPull = Math.max(0, Math.min(MAX_PULL, back * (MAX_PULL / FULL_DRAG)));

  renderDraw(drawPull);

  const power = drawPull / MAX_PULL;

  heroScreen.classList.toggle("drawn", power >= MIN_POWER);
  heroScreen.style.setProperty("--draw", power.toFixed(3));

  if (Math.abs(drawPull - prev) > 0.01) {
    const now = performance.now();
    if (now - lastCreak > 110) {
      lastCreak = now;
      bowCreak(power);
      if (power > .98 && prev <= .98 * MAX_PULL) buzz(12);
    }
  }

});

function endDraw(e) {

  if (!drawing) return;

  drawing = false;

  try { heroScreen.releasePointerCapture(e.pointerId); } catch (err) {}

  const power = drawPull / MAX_PULL;

  heroScreen.classList.remove("grabbed", "drawn");
  heroScreen.style.setProperty("--draw", 0);

  if (e.type === "pointercancel" || power < MIN_POWER) {

    /* not drawn far enough: the string snaps back, try again */
    heroScreen.classList.remove("aiming");
    heroScreen.classList.add("ready");
    if (power > .08) {
      bowTwang(.25);
      setHint("a little further back…");
      setTimeout(() => { if (!openingShot) setHint(HINT_TEXT); }, 2200);
    }
    springBack(drawPull);
    drawPull = 0;
    return;

  }

  /* let go! */
  openingShot = true;
  heroScreen.classList.remove("ready");

  bowTwang(power);
  buzz([10, 20, 14]);

  playRelease(drawPull, power);

}

heroScreen.addEventListener("pointerup", endDraw);
heroScreen.addEventListener("pointercancel", endDraw);


/* Put the opening back exactly as it started (used by Replay). */

function resetOpening() {

  if (openingFrame) {
    cancelAnimationFrame(openingFrame);
    openingFrame = null;
  }

  openingShot = false;
  drawing = false;
  drawPull = 0;
  cancelAnimationFrame(springFrame);
  heroScreen.classList.remove("grabbed", "drawn", "nudge");
  heroScreen.style.setProperty("--draw", 0);
  setHint(HINT_TEXT);

  openingHeart.classList.remove("hit", "shattered");
  openingArrow.classList.remove("gone");
  heroScreen.classList.remove("aiming");
  impactParticles.innerHTML = "";

  layoutArchery();
  renderArchery(IDLE);

}


window.addEventListener("resize", function() {

  if (!openingShot && heroScreen.classList.contains("active")) {
    layoutArchery();
    renderArchery(IDLE);
  }

});


/* Tapping the heart no longer starts anything: it just reminds her
   to pull the bow (the pointerdown handler above shows the cue). */

openingHeart.addEventListener(
  "click",
  function(event) {
    event.stopPropagation();
  }
);


/* =========================================
   LETTER — ENVELOPE OPENING
========================================= */

const letterScreen = document.querySelector(".letter-screen");
const letterStage = document.getElementById("envelopeStage");
const letterEl = letterScreen.querySelector(".letter");
const letterFx = document.getElementById("letterFx");

let letterState = "closed";   // closed -> opening -> open
let letterTimers = [];

function later(fn, ms) {
  letterTimers.push(setTimeout(fn, ms));
}


/* Measure the letter + envelope so the animation fits any screen. */

function prepareLetter() {

  if (!letterStage.offsetWidth) {
    return;
  }

  const E = letterStage.offsetWidth;
  const EH = letterStage.offsetHeight;
  const Lw = letterEl.offsetWidth;
  const Lh = letterEl.offsetHeight;

  const s0 = (E * 0.84) / Lw;                       // size while inside
  const visible = Lh * 0.3;                         // top part showing while sliding
  const sf = Math.min(1, (letterScreen.clientHeight - 110) / Lh);

  const set = (name, value) =>
    letterStage.style.setProperty(name, value);

  set("--s0", s0);
  set("--sf", sf);
  set("--cut", (Lh - visible) + "px");
  set("--ty0", (EH * 0.16) + "px");                 // tucked inside
  set("--ty1", -(visible * s0 + 14) + "px");        // fully out of the pocket
  set("--ty2", ((EH - Lh * sf) / 2) + "px");        // centred on screen

}


function resetLetter() {

  letterTimers.forEach(clearTimeout);
  letterTimers = [];

  letterState = "closed";

  letterScreen.classList.remove(
    "is-opening", "flap-behind", "is-out", "is-final", "is-open"
  );

  letterScreen
    .querySelectorAll(".letter-heart")
    .forEach(node => node.remove());

  letterFx.innerHTML = "";

  prepareLetter();

}


function floatHearts() {

  const H = letterScreen.clientHeight;
  const W = letterScreen.clientWidth;

  for (let i = 0; i < 16; i++) {

    const heart = document.createElement("i");

    heart.className = "letter-heart";
    heart.textContent = "♥";
    heart.style.left = (4 + Math.random() * 92) + "%";
    heart.style.fontSize = (10 + Math.random() * 14) + "px";
    heart.style.color = FX_COLORS[Math.floor(Math.random() * FX_COLORS.length)];

    letterScreen.appendChild(heart);

    const sway = (Math.random() - 0.5) * Math.min(120, W * 0.3);

    const anim = heart.animate(
      [
        { transform: "translate(0, 0) scale(.6)", opacity: 0 },
        { transform: `translate(${sway * 0.5}px, ${-H * 0.35}px) scale(1)`, opacity: .85, offset: .25 },
        { transform: `translate(${sway}px, ${-H - 40}px) scale(.8)`, opacity: 0 }
      ],
      {
        duration: 5000 + Math.random() * 3500,
        delay: Math.random() * 2200,
        easing: "ease-out",
        fill: "both"
      }
    );

    anim.onfinish = () => heart.remove();

  }

}


function openEnvelope() {

  letterState = "opening";

  /* seal cracks, flap swings open, light blooms */
  letterScreen.classList.add("is-opening");

  /* flap is edge-on: move it behind the letter */
  later(() => letterScreen.classList.add("flap-behind"), 600);

  /* letter slides up out of the envelope */
  later(() => {
    letterScreen.classList.add("is-out");
  }, 950);

  later(() => {
    spawnParticles(14, 60, 150, letterFx, 0.25);
  }, 1250);

  /* letter unfolds + glides to the centre, envelope falls away */
  later(() => {
    letterScreen.classList.add("is-final");
  }, 1900);

  /* done: tap anywhere continues */
  later(() => {
    letterState = "open";
    letterScreen.classList.add("is-open");
    floatHearts();
    markReady(letterScreen);
  }, 3100);

}


letterStage.addEventListener("keydown", function(event) {

  if (
    (event.key === "Enter" || event.key === " ") &&
    letterState === "closed"
  ) {
    event.preventDefault();
    openEnvelope();
  }

});


window.addEventListener("resize", function() {

  if (letterState === "closed" && letterScreen.classList.contains("active")) {
    prepareLetter();
  }

});


/* =========================================
   BALLOON POP SOUND
========================================= */

let audioContext = null;


function playPopSound()  {
  if (!pageActive) {
    return;
  }

  if (!audioContext) {
    audioContext = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const now = audioContext.currentTime;

  /* =====================================
     LOUD REALISTIC BALLOON POP
  ===================================== */

  // Create noise burst
  const bufferSize =
    audioContext.sampleRate * 0.18;

  const buffer =
    audioContext.createBuffer(
      1,
      bufferSize,
      audioContext.sampleRate
    );

  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    const decay = 1 - i / bufferSize;

    // Sharp noisy explosion
    data[i] =
      (Math.random() * 2 - 1) *
      Math.pow(decay, 2.8);
  }

  const noise =
    audioContext.createBufferSource();

  noise.buffer = buffer;

  /* =====================================
     LOUDNESS
  ===================================== */

  const masterGain =
    audioContext.createGain();

  masterGain.gain.setValueAtTime(
    1.8,
    now
  );

  masterGain.gain.exponentialRampToValueAtTime(
    0.001,
    now + 0.18
  );

  /* =====================================
     BASS THUMP
  ===================================== */

  const bass =
    audioContext.createOscillator();

  const bassGain =
    audioContext.createGain();

  bass.type = "sine";

  bass.frequency.setValueAtTime(
    130,
    now
  );

  bass.frequency.exponentialRampToValueAtTime(
    45,
    now + 0.12
  );

  bassGain.gain.setValueAtTime(
    1.2,
    now
  );

  bassGain.gain.exponentialRampToValueAtTime(
    0.001,
    now + 0.13
  );

  bass.connect(bassGain);
  bassGain.connect(masterGain);

  bass.start(now);
  bass.stop(now + 0.14);

  /* =====================================
     SHARP SNAP
  ===================================== */

  const snap =
    audioContext.createOscillator();

  const snapGain =
    audioContext.createGain();

  snap.type = "triangle";

  snap.frequency.setValueAtTime(
    1100,
    now
  );

  snap.frequency.exponentialRampToValueAtTime(
    250,
    now + 0.055
  );

  snapGain.gain.setValueAtTime(
    1.0,
    now
  );

  snapGain.gain.exponentialRampToValueAtTime(
    0.001,
    now + 0.065
  );

  snap.connect(snapGain);
  snapGain.connect(masterGain);

  snap.start(now);
  snap.stop(now + 0.07);

  /* =====================================
     NOISE FILTER
  ===================================== */

  const filter =
    audioContext.createBiquadFilter();

  filter.type = "highpass";

  filter.frequency.setValueAtTime(
    500,
    now
  );

  noise.connect(filter);
  filter.connect(masterGain);

  masterGain.connect(
    audioContext.destination
  );

  noise.start(now);
  noise.stop(now + 0.18);
}


/* =========================================
   REASONS — A SKY OF BALLOONS
   Pop one → it bursts, its message flies out as a
   glowing orb and unfolds into a card, a bell chimes,
   and a heart lights up. Pop all five for a finale.
========================================= */

const reasonsScreen = document.querySelector(".reasons-screen");
const sky = document.getElementById("sky");
const reasonStage = document.getElementById("reasonStage");
const reasonFx = document.getElementById("reasonFx");
const reasonSub = document.getElementById("reasonSub");
const reasonDust = document.getElementById("reasonDust");

const balloons = [...document.querySelectorAll(".bl")];
const pips = [...document.querySelectorAll(".pip")];

const SUB_START = "Pop every balloon. I have something to tell you.";
const SUB_END = "…and a thousand more where those came from. ♡";

let popCount = 0;
let reasonTimers = [];
let reasonToken = 0;

function reasonLater(fn, ms) {
  reasonTimers.push(setTimeout(fn, ms));
}


/* slow drifting glitter in the background (built once) */

(function buildReasonDust() {

  for (let i = 0; i < 28; i++) {

    const dot = document.createElement("i");

    dot.style.setProperty("--l", rr(0, 100).toFixed(1) + "%");
    dot.style.setProperty("--s", rr(2, 6).toFixed(1) + "px");
    dot.style.setProperty("--t", rr(9, 19).toFixed(1) + "s");
    dot.style.setProperty("--d", (-rr(0, 19)).toFixed(1) + "s");
    dot.style.setProperty("--dx", rr(-50, 50).toFixed(0) + "px");

    reasonDust.appendChild(dot);

  }

})();


function setReasonSub(text) {

  reasonSub.textContent = text;

  reasonSub.classList.remove("sub-swap");

  void reasonSub.offsetWidth;

  reasonSub.classList.add("sub-swap");

}


/* back to a fresh sky (also used by Replay) */

function resetReasons() {

  reasonTimers.forEach(clearTimeout);
  reasonTimers = [];
  reasonToken++;

  popCount = 0;

  reasonsScreen.classList.remove("live", "busy", "finale", "is-done", "ready");

  balloons.forEach(balloon => {
    balloon.classList.remove("popped");
  });

  pips.forEach(pip => {
    pip.textContent = "♡";
    pip.classList.remove("on");
  });

  reasonStage.innerHTML = "";
  reasonFx.innerHTML = "";

  reasonSub.textContent = SUB_START;
  reasonSub.classList.remove("sub-swap");

}


/* balloons have risen into place → they can be popped */

function introReasons() {

  reasonLater(() => {
    reasonsScreen.classList.add("live");
  }, 1800);

}


/* -----------------------------------------
   POP!
----------------------------------------- */

balloons.forEach(balloon => {

  balloon.addEventListener("click", function(event) {

    /* Don't go to the next screen. */

    event.stopPropagation();

    if (
      balloon.classList.contains("popped") ||
      !reasonsScreen.classList.contains("live") ||
      reasonsScreen.classList.contains("busy")
    ) {
      return;
    }

    popBalloon(balloon);

  });

});


function popBalloon(balloon) {

  balloon.classList.add("popped");

  /* one message at a time, so each one gets read */
  reasonsScreen.classList.add("busy");

  popCount++;

  const style = getComputedStyle(balloon);
  const c1 = style.getPropertyValue("--c1").trim();
  const c2 = style.getPropertyValue("--c2").trim();

  const body = balloon.querySelector(".bl-body");
  const sr = reasonsScreen.getBoundingClientRect();
  const br = body.getBoundingClientRect();

  const x = br.left - sr.left + br.width / 2;
  const y = br.top - sr.top + br.height / 2;

  playPopSound();
  buzz(22);

  popBurst(x, y, c1, c2, br.width);

  sendReason(x, y, c1, c2, balloon.dataset.text, popCount);

}


/* the burst itself: flash, rings, rubber shreds, hearts, glow, shake */

function popBurst(x, y, c1, c2, size) {

  const at = fxEl("pop-host", reasonFx);

  at.style.left = x + "px";
  at.style.top = y + "px";


  /* white-hot flash */

  const flash = fxEl("pop-flash", at);

  flash.style.background =
    `radial-gradient(circle, #fff 0, ${c1} 38%, transparent 72%)`;

  runFx(
    flash,
    [
      { transform: "translate(-50%,-50%) scale(.2)", opacity: 1 },
      { transform: "translate(-50%,-50%) scale(2.8)", opacity: 0 }
    ],
    { duration: 430, easing: "ease-out" }
  );


  /* two shock rings */

  [0, 110].forEach((delay, k) => {

    const ring = fxEl("pop-ring", at);

    ring.style.setProperty("--rc", k ? c2 : "#fff");

    runFx(
      ring,
      [
        { transform: "translate(-50%,-50%) scale(.2)", opacity: .95 },
        { transform: `translate(-50%,-50%) scale(${4 + k * 1.6})`, opacity: 0 }
      ],
      { duration: 650 + k * 120, delay, easing: "cubic-bezier(.1,.7,.3,1)", fill: "both" }
    );

  });


  /* shreds of rubber, tumbling with a bit of gravity */

  for (let i = 0; i < 18; i++) {

    const shard = fxEl("pop-shard", at);

    const w = rr(8, 20);
    const h = rr(4, 9);

    shard.style.width = w + "px";
    shard.style.height = h + "px";
    shard.style.marginLeft = -w / 2 + "px";
    shard.style.marginTop = -h / 2 + "px";
    shard.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
    shard.style.borderRadius = `${rr(30, 60)}% ${rr(30, 60)}% ${rr(30, 60)}% ${rr(30, 60)}%`;

    const a = (i / 18) * Math.PI * 2 + rr(-.3, .3);
    const d = rr(size * .6, size * 1.9);
    const dx = Math.cos(a) * d;
    const dy = Math.sin(a) * d;
    const rot = rr(-620, 620);

    runFx(
      shard,
      [
        { transform: "translate(0px,0px) rotate(0deg) scale(1)", opacity: 1 },
        {
          transform: `translate(${dx * .75}px,${dy * .75 - 12}px) rotate(${rot * .6}deg) scale(1)`,
          opacity: 1,
          offset: .42
        },
        {
          transform: `translate(${dx}px,${dy + rr(70, 140)}px) rotate(${rot}deg) scale(.5)`,
          opacity: 0
        }
      ],
      { duration: rr(750, 1150), easing: "cubic-bezier(.15,.7,.35,1)" }
    );

  }


  /* hearts + sparkles */

  spawnParticles(14, 50, 160, at, .7);


  /* the whole sky glows in the balloon's colour */

  const pulse = fxEl("pop-pulse", reasonFx);

  pulse.style.background =
    `radial-gradient(circle at ${x}px ${y}px, ${c1}99 0, ${c2}44 28%, transparent 62%)`;

  runFx(
    pulse,
    [{ opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: 0 }],
    { duration: 900, easing: "ease-out" }
  );


  /* tiny camera shake */

  reasonsScreen.animate(
    [
      { transform: "translate(0,0)" },
      { transform: "translate(-4px,2px)", offset: .15 },
      { transform: "translate(4px,-3px)", offset: .35 },
      { transform: "translate(-2px,2px)", offset: .6 },
      { transform: "translate(0,0)" }
    ],
    { duration: 260, easing: "ease-out" }
  );

}


/* -----------------------------------------
   THE MESSAGE:  orb flies out → card unfolds
----------------------------------------- */

function sendReason(x, y, c1, c2, text, order) {

  const token = reasonToken;

  const sr = reasonsScreen.getBoundingClientRect();
  const tr = reasonStage.getBoundingClientRect();

  const tx = tr.left - sr.left + tr.width / 2;
  const ty = tr.top - sr.top + tr.height / 2;

  const P0 = { x, y };
  const P1 = {
    x: (x + tx) / 2 + rr(-110, 110),
    y: Math.min(y, ty) - rr(50, 120)
  };
  const P2 = { x: tx, y: ty };

  const bez = t => ({
    x: (1 - t) * (1 - t) * P0.x + 2 * (1 - t) * t * P1.x + t * t * P2.x,
    y: (1 - t) * (1 - t) * P0.y + 2 * (1 - t) * t * P1.y + t * t * P2.y
  });

  const orb = fxEl("msg-orb", reasonFx);

  orb.style.setProperty("--c1", c1);
  orb.style.setProperty("--c2", c2);

  const FLIGHT = 900;
  const N = 28;
  const frames = [];

  for (let i = 0; i <= N; i++) {

    const f = i / N;
    const p = bez(easeInOutCubic(f));

    frames.push({
      transform:
        `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) scale(${(.5 + Math.sin(f * Math.PI) * .8 + f * .3).toFixed(2)})`,
      opacity: f > .94 ? (1 - f) / .06 : 1,
      offset: f
    });

  }

  runFx(orb, frames, { duration: FLIGHT, easing: "linear" });


  /* comet trail */

  for (let k = 1; k < 22; k++) {

    reasonLater(() => {

      if (token !== reasonToken) return;

      const p = bez(easeInOutCubic(k / 22));

      const dot = fxEl("msg-trail", reasonFx);

      dot.style.setProperty("--c1", c1);
      dot.style.setProperty("--c2", c2);

      runFx(
        dot,
        [
          { transform: `translate(${p.x}px,${p.y}px) scale(1)`, opacity: .9 },
          {
            transform: `translate(${p.x + rr(-12, 12)}px,${p.y + rr(6, 26)}px) scale(.1)`,
            opacity: 0
          }
        ],
        { duration: 700, easing: "ease-out" }
      );

    }, (k / 22) * FLIGHT);

  }

  reasonLater(() => {

    if (token !== reasonToken) return;

    showReason(text, order, c1, c2, tx, ty);

  }, FLIGHT);

}


function showReason(text, order, c1, c2, tx, ty) {

  /* the old card drifts away */

  reasonStage.querySelectorAll(".reason-card").forEach(old => {

    old.classList.add("out");

    setTimeout(() => old.remove(), 400);

  });


  /* the new one unfolds */

  const card = document.createElement("div");

  card.className = "reason-card";

  card.style.setProperty("--c1", c1);
  card.style.setProperty("--c2", c2);

  const tag = document.createElement("span");

  tag.className = "rc-tag";
  tag.textContent = `reason ${order} of ${balloons.length}`;

  const line = document.createElement("p");

  line.className = "rc-text";

  text.split(" ").forEach((word, i) => {

    const w = document.createElement("span");

    w.className = "w";
    w.style.setProperty("--i", i);
    w.textContent = word;

    line.appendChild(w);
    line.appendChild(document.createTextNode(" "));

  });

  card.appendChild(tag);
  card.appendChild(line);

  reasonStage.appendChild(card);


  /* arrival sparkle */

  const at = fxEl("pop-host", reasonFx);

  at.style.left = tx + "px";
  at.style.top = ty + "px";

  const ring = fxEl("pop-ring", at);

  ring.style.setProperty("--rc", c1);

  runFx(
    ring,
    [
      { transform: "translate(-50%,-50%) scale(.3)", opacity: .9 },
      { transform: "translate(-50%,-50%) scale(7)", opacity: 0 }
    ],
    { duration: 800, easing: "cubic-bezier(.1,.7,.3,1)" }
  );

  spawnParticles(10, 50, 150, at, .5);

  setTimeout(() => at.remove(), 1600);


  /* the heart down below lights up in that balloon's colour */

  const pip = pips[order - 1];

  if (pip) {

    pip.textContent = "♥";

    pip.style.setProperty("--c1", c1);
    pip.style.setProperty("--c2", c2);

    pip.classList.add("on");

  }

  playChime(order - 1);
  buzz(12);

  /* the next balloon can be popped once this message has been read */
  reasonLater(() => {
    reasonsScreen.classList.remove("busy");
  }, 1500);

  if (order === balloons.length) {
    reasonLater(reasonFinale, 1500);
  }

}


/* all five popped: the sky erupts, then "tap" is allowed */

function reasonFinale() {

  reasonsScreen.classList.add("finale");

  setReasonSub(SUB_END);

  const W = reasonsScreen.clientWidth;
  const H = reasonsScreen.clientHeight;

  [.2, .5, .8].forEach((fx, i) => {

    reasonLater(() => {

      const at = fxEl("pop-host", reasonFx);

      at.style.left = W * fx + "px";
      at.style.top = H * .46 + "px";

      spawnParticles(18, 90, 240, at, .8);

      playChime(3 + i);

      setTimeout(() => at.remove(), 2600);

    }, i * 260);

  });

  rainHearts(reasonsScreen, 18);

  reasonLater(() => {

    reasonsScreen.classList.add("is-done");

    markReady(reasonsScreen);

  }, 1800);

}


/* =========================================
   CAKE — build it, light it, blow it out
========================================= */

const cake =
  document.getElementById(
    "cake"
  );


const cakeMessage =
  document.getElementById(
    "cakeMessage"
  );


const cakeSub =
  document.getElementById(
    "cakeSub"
  );


const cakeScreen =
  document.querySelector(
    ".cake-screen"
  );


const flames =
  [...cake.querySelectorAll(".flame")];


const candles =
  [...cake.querySelectorAll(".candle")];


/* candle centres in cake coordinates */
const CANDLE_X = [80.5, 115.5, 150.5];


/*
  idle → building → ready → lighting → lit → blowing → blown
*/

let cakeStage = "idle";

let cakeTimers = [];


/* full-screen layer for confetti / hearts / wish star */

const cakeFx =
  document.createElement("div");

cakeFx.className = "cake-fx";

cakeScreen.appendChild(cakeFx);


/* -----------------------------------------
   small helpers
----------------------------------------- */

const rnd =
  (a, b) => a + Math.random() * (b - a);

const pick =
  list => list[Math.floor(Math.random() * list.length)];


function cakeLater(fn, ms) {

  cakeTimers.push(setTimeout(fn, ms));

}


function clearCakeTimers() {

  cakeTimers.forEach(clearTimeout);

  cakeTimers = [];

}


function buzz(pattern) {

  try {

    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }

  }

  catch (e) {}

}


function fxEl(cls, parent) {

  const el = document.createElement("div");

  el.className = cls;

  parent.appendChild(el);

  return el;

}


function runFx(el, frames, options) {

  const anim = el.animate(
    frames,
    Object.assign({ fill: "forwards" }, options)
  );

  anim.onfinish = () => el.remove();

  return anim;

}


function setSub(text) {

  cakeSub.textContent = text;

  cakeSub.classList.remove("sub-swap");

  void cakeSub.offsetWidth;

  cakeSub.classList.add("sub-swap");

}


/* -----------------------------------------
   extra cake pieces (plate, cream, sprinkles…)
----------------------------------------- */

(function buildCakeDecor() {

  const frag = document.createDocumentFragment();

  function add(cls, vars) {

    const el = document.createElement("div");

    el.className = cls;

    Object.keys(vars || {}).forEach(key => {

      if (key.startsWith("--")) {
        el.style.setProperty(key, vars[key]);
      }

      else {
        el.style[key] = vars[key];
      }

    });

    frag.appendChild(el);

    return el;

  }


  add("cake-glow");

  add("plate");

  add("glob");


  /* cream drips: [x, length] */

  [
    [40, 18], [58, 28], [78, 12], [100, 32],
    [122, 16], [142, 26], [162, 14], [184, 22]
  ].forEach(([x, h], i) => {

    add("drip", {
      left: `${x}px`,
      "--h": `${h}px`,
      "--i": String(i)
    });

  });


  /* piped cream rosettes */

  [49.5, 97, 132, 179.5].forEach((x, i) => {

    add("dollop", {
      "--x": `${x}px`,
      "--i": String(i)
    });

  });


  /* sprinkles */

  const sprinkleColors = [
    "#ff5d91", "#ffc044", "#7fd6ff",
    "#b79cff", "#8be9a8", "#ffffff"
  ];

  for (let i = 0; i < 28; i++) {

    add("sprinkle", {
      left: `${rnd(40, 188).toFixed(1)}px`,
      top: `${rnd(66, 90).toFixed(1)}px`,
      background: pick(sprinkleColors),
      "--r": `${Math.round(rnd(0, 180))}deg`,
      "--d": `${rnd(0, .85).toFixed(2)}s`
    });

  }


  /* cherries on the two outer rosettes */

  [49.5, 179.5].forEach((x, i) => {

    add("cherry", {
      "--x": `${x}px`,
      "--i": String(i)
    });

  });


  cake.insertBefore(frag, cake.firstChild);

})();


/* -----------------------------------------
   little effects
----------------------------------------- */

function thud(px) {

  cake.animate(
    [
      { transform: "translateY(0)" },
      { transform: `translateY(${px}px)`, offset: .35 },
      { transform: "translateY(0)" }
    ],
    { duration: 260, easing: "ease-out" }
  );

}


function puff(x, y, n) {

  for (let i = 0; i < n; i++) {

    const el = fxEl("fx puff", cake);

    const dir = x < 115 ? -1 : 1;

    const dx = dir * rnd(14, 42);

    const dy = rnd(-12, 4);

    runFx(
      el,
      [
        {
          transform: `translate(${x}px,${y}px) scale(.4)`,
          opacity: .9
        },
        {
          transform:
            `translate(${x + dx}px,${y + dy}px) scale(${rnd(1.4, 2.2)})`,
          opacity: 0
        }
      ],
      { duration: rnd(450, 700), easing: "ease-out" }
    );

  }

}


function sparkBurst(x, y, n, radius, parent) {

  parent = parent || cake;

  radius = radius || 30;

  for (let i = 0; i < n; i++) {

    const el = fxEl("fx spark", parent);

    const a = rnd(0, Math.PI * 2);

    const d = rnd(radius * .35, radius);

    runFx(
      el,
      [
        {
          transform: `translate(${x}px,${y}px) scale(1)`,
          opacity: 1
        },
        {
          transform:
            `translate(${x + Math.cos(a) * d}px,${y + Math.sin(a) * d}px) scale(.2)`,
          opacity: 0
        }
      ],
      { duration: rnd(380, 650), easing: "ease-out" }
    );

  }

}


/* -----------------------------------------
   BUILD  (pieces drop, cream falls, candles land)
----------------------------------------- */

const BUILD_OFFSET = 450;   /* matches --b in the CSS */


function resetCake() {

  clearCakeTimers();

  cakeFx.innerHTML = "";

  cake.querySelectorAll(".fx").forEach(el => el.remove());

  cake.classList.remove("build", "is-ready", "is-lit");

  cakeScreen.classList.remove("is-done");

  flames.forEach(f => f.classList.remove("lit", "out"));

  candles.forEach(c => c.classList.remove("smoking"));

  cakeMessage.classList.remove("show");

  cakeMessage.textContent =
    "A wish this beautiful deserves to come true.";

  cakeStage = "building";

  setSub("Something sweet is on its way…");

  /* restart the CSS animations */
  void cake.offsetWidth;

  cake.classList.add("build");


  /* bottom tier lands */
  cakeLater(() => {
    thud(3);
    puff(18, 184, 5);
    puff(212, 184, 5);
    buzz(12);
  }, BUILD_OFFSET + 820);

  /* top tier lands */
  cakeLater(() => {
    thud(5);
    puff(36, 128, 4);
    puff(194, 128, 4);
    buzz(18);
  }, BUILD_OFFSET + 1570);

  /* cream blob splats */
  cakeLater(() => {
    sparkBurst(115, 76, 10, 34);
    buzz(10);
  }, BUILD_OFFSET + 1930);

  /* candles are in — little shimmer */
  cakeLater(() => {
    CANDLE_X.forEach((x, i) => {
      cakeLater(() => sparkBurst(x, 24, 5, 20), i * 110);
    });
  }, BUILD_OFFSET + 3650);

  /* ready for the first tap */
  cakeLater(() => {

    cakeStage = "ready";

    cake.classList.add("is-ready");

    setSub("Tap the cake to light the candles.");

  }, BUILD_OFFSET + 3950);

}


/* -----------------------------------------
   LIGHT  (a glowing spark hops from candle to candle)
----------------------------------------- */

function ignite(i) {

  flames[i].classList.remove("out");

  flames[i].classList.add("lit");

  sparkBurst(CANDLE_X[i], 18, 9, 28);

  cake.classList.add("is-lit");

  buzz(10);

}


function lightCandles() {

  cakeStage = "lighting";

  cake.classList.remove("is-ready");

  cakeMessage.classList.remove("show");

  flames.forEach(f => f.classList.remove("lit", "out"));

  candles.forEach(c => c.classList.remove("smoking"));

  setSub("Lighting the candles…");


  const orb = fxEl("fx orb", cake);

  const T = 1500;

  runFx(
    orb,
    [
      { transform: "translate(-30px,120px) scale(.4)", opacity: 0, offset: 0, easing: "ease-out" },
      { transform: "translate(20px,52px) scale(.9)", opacity: 1, offset: .12, easing: "ease-in-out" },
      { transform: "translate(80.5px,22px) scale(1)", opacity: 1, offset: .25 },
      { transform: "translate(80.5px,22px) scale(1)", opacity: 1, offset: .30, easing: "ease-in-out" },
      { transform: "translate(115.5px,22px) scale(1)", opacity: 1, offset: .50 },
      { transform: "translate(115.5px,22px) scale(1)", opacity: 1, offset: .55, easing: "ease-in-out" },
      { transform: "translate(150.5px,22px) scale(1)", opacity: 1, offset: .75 },
      { transform: "translate(150.5px,22px) scale(1)", opacity: 1, offset: .80, easing: "ease-in" },
      { transform: "translate(176px,-20px) scale(.3)", opacity: 0, offset: 1 }
    ],
    { duration: T, easing: "linear" }
  );


  [0, 1, 2].forEach(i => {

    cakeLater(() => ignite(i), T * (.25 + i * .25));

  });


  cakeLater(() => {

    cakeStage = "lit";

    setSub("Close your eyes… then tap to blow.");

    cakeMessage.classList.add("show");

  }, T + 150);

}


/* -----------------------------------------
   BLOW  (wind, flames lean over, smoke, then the party)
----------------------------------------- */

function smoke(i) {

  const x = CANDLE_X[i];

  for (let k = 0; k < 3; k++) {

    const el = fxEl("fx smoke", cake);

    const dr = rnd(16, 36);

    runFx(
      el,
      [
        {
          transform: `translate(${x}px,22px) scale(.5)`,
          opacity: 0,
          offset: 0
        },
        {
          transform: `translate(${x + dr * .3}px,4px) scale(1)`,
          opacity: .6,
          offset: .18
        },
        {
          transform:
            `translate(${x + dr * .2 + rnd(-6, 6)}px,-30px) scale(1.8)`,
          opacity: .4,
          offset: .55
        },
        {
          transform: `translate(${x + dr}px,-68px) scale(2.8)`,
          opacity: 0,
          offset: 1
        }
      ],
      {
        duration: rnd(1500, 2300),
        delay: k * 160,
        easing: "ease-out",
        fill: "both"
      }
    );

  }

}


function blowCandles() {

  cakeStage = "blowing";

  cakeMessage.classList.remove("show");

  setSub("Whooosh…");


  /* wind streaks sweep across the flames */

  for (let i = 0; i < 6; i++) {

    const w = fxEl("fx wind", cake);

    const y = rnd(2, 52);

    runFx(
      w,
      [
        {
          transform: `translate(-120px,${y}px) scaleX(.6)`,
          opacity: 0
        },
        {
          transform: `translate(60px,${y + rnd(-6, 6)}px) scaleX(1.2)`,
          opacity: .9,
          offset: .35
        },
        {
          transform: `translate(360px,${y + rnd(-14, 14)}px) scaleX(1.6)`,
          opacity: 0
        }
      ],
      {
        duration: rnd(550, 800),
        delay: i * 70,
        easing: "ease-in",
        fill: "both"
      }
    );

  }


  /* flames lean over and go out, left to right */

  flames.forEach((f, i) => {

    f.style.setProperty("--bd", `${(.18 + i * .1).toFixed(2)}s`);

    f.classList.remove("lit");

    f.classList.add("out");

    cakeLater(() => {

      candles[i].classList.add("smoking");

      smoke(i);

    }, 480 + i * 100);

  });


  cakeLater(() => {

    cake.classList.remove("is-lit");

  }, 450);


  cakeLater(() => {

    celebrate();

    buzz([30, 40, 30, 40, 60]);

  }, 1000);


  cakeLater(() => {

    cakeStage = "blown";

    cakeScreen.classList.add("is-done");

    markReady(cakeScreen);

    cakeMessage.textContent =
      "Wish made. Now let life surprise you. ✨";

    cakeMessage.classList.add("show");

    setSub("Now keep it a secret. 🤫");

  }, 1700);

}


/* -----------------------------------------
   CELEBRATE  (flash, confetti cannons, hearts, wish star)
----------------------------------------- */

const CONFETTI = [
  "#ff5d91", "#ff9abb", "#ffc044", "#fff1e7",
  "#b79cff", "#7fd6ff", "#8be9a8", "#ff8b70"
];


function confetto(x0, y0, vx, vy, dur) {

  const el = fxEl("conf", cakeFx);

  const w = rnd(5, 9);

  const h = rnd(8, 15);

  const kind = Math.random();

  el.style.width = `${w}px`;

  el.style.height = `${h}px`;

  el.style.background = pick(CONFETTI);

  if (kind < .22) {

    el.style.borderRadius = "50%";

    el.style.height = `${w}px`;

  }

  else if (kind < .34) {

    el.textContent = "♥";

    el.style.background = "none";

    el.style.color = pick(["#ff5d91", "#ff9abb", "#ffc0d4"]);

    el.style.fontSize = `${rnd(11, 18).toFixed(0)}px`;

    el.style.width = "auto";

    el.style.height = "auto";

    el.style.lineHeight = "1";

  }


  /* motion with a bit of air drag, so it hangs and flutters */

  const k = rnd(2, 3);

  const g = 520;

  const vt = g / k;

  const steps = 24;

  const spin = rnd(-720, 720);

  const frames = [];

  for (let i = 0; i <= steps; i++) {

    const f = i / steps;

    const t = f * dur / 1000;

    const e = 1 - Math.exp(-k * t);

    const x = x0 + vx * e / k;

    const y = y0 + vt * t + (vy - vt) * e / k;

    frames.push({
      transform:
        `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${(spin * f).toFixed(0)}deg) rotateY(${(spin * f * 1.3).toFixed(0)}deg)`,
      opacity: f > .8 ? (1 - f) / .2 : 1,
      offset: f
    });

  }

  runFx(el, frames, { duration: dur, easing: "linear" });

}


function cannon(side, n, W, H) {

  for (let i = 0; i < n; i++) {

    const dir = side === "left" ? 1 : -1;

    confetto(
      side === "left" ? -8 : W + 8,
      H * .82,
      dir * rnd(350, 760),
      -rnd(1100, 1700),
      rnd(2600, 3800)
    );

  }

}


function riseHeart(x, y) {

  const el = fxEl("rise-heart", cakeFx);

  el.textContent = pick(["♥", "♥", "♡"]);

  el.style.fontSize = `${rnd(14, 26).toFixed(0)}px`;

  const up = rnd(200, 330);

  const sway = rnd(-30, 30);

  runFx(
    el,
    [
      { transform: `translate(${x}px,${y}px) scale(.4)`, opacity: 0, offset: 0 },
      { transform: `translate(${x + sway * .3}px,${y - up * .15}px) scale(1)`, opacity: 1, offset: .15 },
      { transform: `translate(${x - sway}px,${y - up * .6}px) scale(1.05)`, opacity: .9, offset: .6 },
      { transform: `translate(${x + sway * .6}px,${y - up}px) scale(.9)`, opacity: 0, offset: 1 }
    ],
    { duration: rnd(2200, 3400), easing: "ease-out" }
  );

}


function wishStar(P0, P1, P2) {

  const bez = t => ({
    x: (1 - t) * (1 - t) * P0.x + 2 * (1 - t) * t * P1.x + t * t * P2.x,
    y: (1 - t) * (1 - t) * P0.y + 2 * (1 - t) * t * P1.y + t * t * P2.y
  });

  const star = fxEl("wish-star", cakeFx);

  star.textContent = "✦";

  const N = 24;

  const frames = [];

  for (let i = 0; i <= N; i++) {

    const f = i / N;

    const p = bez(f);

    frames.push({
      transform:
        `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) rotate(${(f * 420).toFixed(0)}deg) scale(${(1.2 - f * .5).toFixed(2)})`,
      opacity: f > .92 ? (1 - f) / .08 : 1,
      offset: f
    });

  }

  const FLIGHT = 1500;

  runFx(star, frames, { duration: FLIGHT, easing: "cubic-bezier(.3,.1,.5,1)" });


  /* sparkly trail */

  for (let k = 1; k < 24; k++) {

    cakeLater(() => {

      const p = bez(k / 24);

      const dot = fxEl("trail", cakeFx);

      runFx(
        dot,
        [
          {
            transform: `translate(${p.x}px,${p.y}px) scale(1)`,
            opacity: .9
          },
          {
            transform: `translate(${p.x + rnd(-10, 10)}px,${p.y + rnd(4, 22)}px) scale(.1)`,
            opacity: 0
          }
        ],
        { duration: 650, easing: "ease-out" }
      );

    }, k * (FLIGHT / 26));

  }


  /* …and it bursts into stars up in the sky */

  cakeLater(() => {

    sparkBurst(P2.x, P2.y, 16, 54, cakeFx);

    buzz(15);

  }, FLIGHT);

}


function celebrate() {

  const sr = cakeScreen.getBoundingClientRect();

  const cr = cake.getBoundingClientRect();

  const W = sr.width;

  const H = sr.height;

  const cx = cr.left - sr.left + cr.width / 2;

  const cy = cr.top - sr.top + 30;


  /* soft pink flash */

  const flash = fxEl("flash", cakeFx);

  flash.style.background =
    `radial-gradient(circle at ${cx}px ${cy}px, rgba(255,210,235,.6) 0, rgba(255,150,200,.22) 28%, rgba(255,150,200,0) 60%)`;

  runFx(
    flash,
    [
      { opacity: 0 },
      { opacity: 1, offset: .2 },
      { opacity: 0 }
    ],
    { duration: 900, easing: "ease-out" }
  );


  /* the cake does a happy hop */

  cake.animate(
    [
      { transform: "translateY(0) scale(1,1)" },
      { transform: "translateY(6px) scale(1.04,.94)", offset: .2 },
      { transform: "translateY(-16px) scale(.97,1.05)", offset: .5 },
      { transform: "translateY(0) scale(1.02,.97)", offset: .75 },
      { transform: "none" }
    ],
    { duration: 760, easing: "ease-out" }
  );


  /* confetti burst straight out of the candles */

  for (let i = 0; i < 46; i++) {

    const a = rnd(-Math.PI * .95, -Math.PI * .05);

    const s = rnd(500, 1100);

    confetto(
      cx,
      cy,
      Math.cos(a) * s,
      Math.sin(a) * s,
      rnd(2200, 3200)
    );

  }


  /* confetti cannons from both bottom corners, in three waves */

  [0, 180, 360].forEach(delay => {

    cakeLater(() => {

      cannon("left", 10, W, H);

      cannon("right", 10, W, H);

      buzz(15);

    }, delay);

  });


  /* hearts drifting up */

  for (let i = 0; i < 9; i++) {

    cakeLater(() => {

      riseHeart(cx + rnd(-80, 80), cy + 70);

    }, i * 140);

  }


  /* the wish itself shoots off into the sky */

  cakeLater(() => {

    wishStar(
      { x: cx, y: cy - 10 },
      { x: cx + W * .38, y: cy - H * .28 },
      { x: W * .2, y: H * .1 }
    );

  }, 250);


  createSparkles();

}


/* -----------------------------------------
   TAP THE CAKE
----------------------------------------- */

cake.addEventListener(
  "click",
  function(event) {

    /*
      Don't move to next screen.
    */

    event.stopPropagation();


    if (cakeStage === "ready") {

      lightCandles();

    }

    /* candles already blown: tapping the cake moves on, like tapping anywhere else */

    else if (cakeStage === "blown") {

      if (!transitioning) {
        goToScreen(screens.indexOf(cakeScreen) + 1);
      }

    }

    else if (cakeStage === "lit") {

      blowCandles();

    }

  }
);


/* =========================================
   CAKE SPARKLES
========================================= */

function createSparkles() {

  for (
    let i = 0;
    i < 18;
    i++
  ) {

    const sparkle =
      document.createElement(
        "span"
      );


    sparkle.textContent = "✨";


    sparkle.style.position =
      "fixed";


    sparkle.style.left =
      `${45 + Math.random() * 10}%`;


    sparkle.style.top =
      `${45 + Math.random() * 10}%`;


    sparkle.style.zIndex =
      "50";


    sparkle.style.transition =
      "1.2s ease";


    sparkle.style.pointerEvents =
      "none";


    document.body.appendChild(
      sparkle
    );


    requestAnimationFrame(() => {

      sparkle.style.transform =
        `translate(
          ${(Math.random() - 0.5) * 280}px,
          ${-100 - Math.random() * 220}px
        )`;


      sparkle.style.opacity =
        "0";

    });


    setTimeout(
      () => sparkle.remove(),
      1300
    );

  }

}


/* =========================================
   REPLAY
========================================= */

const replay =
  document.getElementById(
    "replay"
  );


replay.addEventListener(
  "click",
  function(event) {

    event.stopPropagation();

    /* restart the song from the very beginning along with the story */
    try { song.currentTime = 0; } catch (e) {}
    musicAutoPaused = false;
    playMusic();

    goToScreen(0);

  }
);



/* =========================================
   TREE — fixed branch-aligned hearts
========================================= */

const treeHeartField = document.querySelector(".tree-heart-field");

if (treeHeartField) {

  const hearts = [
    [241.5,153.5,17.4,'#ffc044',-1.20,3.08,3.70],
    [106.7,171.8,18.8,'#ff9abb',-3.05,2.34,4.07],
    [218.9,92.2,21.3,'#ff9abb',-2.34,2.65,4.28],
    [228.8,343.9,18.3,'#ffb4ca',-0.89,3.54,4.31],
    [451.2,215.1,19.1,'#ff8b70',-5.32,3.45,3.53],
    [461.0,112.3,21.3,'#ff9abb',-4.96,2.68,4.31],
    [542.5,303.7,17.1,'#ffb4ca',-2.83,3.06,4.86],
    [145.4,280.2,22.7,'#ff9abb',-3.26,2.93,4.53],
    [166.5,82.1,20.4,'#ffb4ca',-0.27,2.61,3.57],
    [587.4,206.2,18.6,'#ff9abb',-2.73,3.78,5.68],
    [134.4,220.9,18.2,'#ffb4ca',-3.32,2.75,4.85],
    [328.1,149.2,15.6,'#ff9abb',-0.67,2.44,5.18],
    [285.2,144.8,23.3,'#ffb4ca',-4.65,2.31,5.63],
    [476.5,260.7,20.2,'#ff5d91',-4.09,2.89,3.98],
    [469.8,250.2,26.1,'#ff5d91',-2.64,3.70,5.59],
    [599.2,315.6,16.1,'#ff78a7',-3.57,2.93,5.25],
    [437.3,221.1,23.4,'#ff9abb',-1.35,3.01,4.33],
    [231.5,240.0,17.8,'#ff8b70',-3.02,2.72,5.16],
    [405.0,261.5,27.2,'#ff5d91',-3.16,3.37,3.93],
    [152.0,198.7,19.1,'#ff78a7',-2.04,2.44,3.56],
    [460.9,146.2,25.5,'#ffc044',-4.36,3.71,4.87],
    [602.4,169.1,17.4,'#ff78a7',-0.78,3.02,3.91],
    [473.9,198.3,24.5,'#ff8b70',-2.88,2.47,3.90],
    [636.7,264.9,24.5,'#ff78a7',-3.16,3.64,4.84],
    [512.2,166.1,21.8,'#ff9abb',-5.25,3.72,4.18],
    [184.1,96.9,20.6,'#ff9abb',-1.16,3.24,5.79],
    [180.7,215.9,19.6,'#ffb4ca',-1.25,2.81,4.26],
    [542.8,286.9,16.0,'#ff78a7',-5.05,4.07,5.53],
    [529.6,154.3,19.4,'#ffb4ca',-2.27,3.77,4.31],
    [153.0,59.0,22.6,'#ffc044',-2.45,2.39,5.56],
    [456.4,143.3,25.1,'#ffc044',-1.57,3.18,3.75],
    [218.5,124.7,21.8,'#ff78a7',-5.30,3.20,4.02],
    [432.5,353.8,26.8,'#ff5d91',-0.89,2.64,5.36],
    [259.2,150.6,26.5,'#ff8b70',-0.91,3.06,5.60],
    [228.8,93.3,16.8,'#ff8b70',-5.37,3.00,4.20],
    [435.5,145.2,27.8,'#ffb4ca',-1.43,4.00,5.60],
    [583.8,195.7,19.4,'#ff8b70',-3.89,4.19,4.96],
    [481.3,248.7,18.0,'#ff8b70',-1.68,2.35,5.24],
    [645.3,144.3,23.4,'#ff9abb',-0.32,4.10,5.62],
    [95.6,248.3,27.7,'#ff8b70',-1.00,3.25,3.85],
    [331.4,83.1,19.6,'#ff8b70',-3.68,3.54,3.63],
    [273.7,164.2,21.6,'#ff8b70',-5.45,2.98,5.76],
    [358.7,363.8,19.5,'#ff9abb',-5.36,3.14,4.67],
    [126.8,201.5,15.2,'#ff78a7',-4.60,3.41,3.71],
    [145.8,172.7,19.9,'#ff9abb',-5.01,4.04,3.45],
    [300.9,54.5,24.3,'#ffc044',-1.63,3.58,3.67],
    [665.0,271.0,26.0,'#ff5d91',-1.07,3.68,3.90],
    [520.0,281.0,19.5,'#ff5d91',-3.91,3.79,5.27],
    [299.8,270.9,16.1,'#ff9abb',-3.31,3.44,5.57],
    [266.5,177.2,17.9,'#ff5d91',-1.12,3.15,3.72],
    [537.8,154.4,20.4,'#ff78a7',-2.11,3.47,3.69],
    [148.5,191.2,23.7,'#ff78a7',-2.21,4.09,3.48],
    [433.3,186.7,26.0,'#ffc044',-2.33,2.78,4.37],
    [176.0,280.8,23.7,'#ff9abb',-1.61,2.42,3.72],
    [115.2,276.0,21.8,'#ff5d91',-1.93,3.93,4.60],
    [606.5,79.7,27.0,'#ff8b70',-4.62,2.54,4.14],
    [659.0,255.1,19.9,'#ffc044',-1.53,3.76,3.96],
    [187.0,177.7,22.4,'#ffc044',-5.21,3.59,3.48],
    [131.2,169.8,15.4,'#ff78a7',-4.64,3.84,3.72],
    [249.0,159.2,23.3,'#ff5d91',-5.30,3.16,5.46],
    [132.1,274.5,21.3,'#ff9abb',-3.26,2.23,4.46],
    [496.8,235.7,15.1,'#ff5d91',-2.84,4.08,5.66],
    [354.6,223.6,22.9,'#ffc044',-0.06,3.75,5.75],
    [256.0,337.2,17.3,'#ff5d91',-4.83,3.04,5.26],
    [251.8,156.3,25.8,'#ffb4ca',-3.22,3.22,5.70],
    [136.6,168.0,20.6,'#ff5d91',-3.82,3.83,3.77],
    [274.8,75.9,19.7,'#ff9abb',-0.82,2.22,5.78],
    [419.6,288.4,16.5,'#ffc044',-4.78,2.91,5.58],
    [506.7,173.3,16.5,'#ffc044',-2.16,2.90,4.28],
    [491.1,53.3,17.9,'#ff9abb',-2.19,4.00,5.68],
    [489.7,77.7,17.4,'#ff9abb',-3.15,3.27,3.48],
    [470.2,52.9,26.6,'#ff8b70',-2.37,4.11,4.29],
    [570.8,304.6,24.6,'#ff78a7',-1.82,2.25,5.15],
    [347.9,354.1,21.1,'#ff9abb',-1.99,3.65,4.15],
    [427.1,130.0,26.1,'#ff9abb',-1.71,2.50,5.75],
    [592.9,200.7,26.5,'#ff5d91',-5.14,3.35,4.45],
    [405.3,173.1,18.2,'#ffc044',-4.48,3.49,4.02],
    [476.8,125.6,16.8,'#ff78a7',-1.84,2.26,4.45],
    [482.0,161.5,19.3,'#ff9abb',-1.00,4.04,4.99],
    [262.7,174.6,17.2,'#ffc044',-3.82,3.00,5.68],
    [436.5,355.9,24.3,'#ff9abb',-0.37,3.99,4.84],
    [249.3,76.6,20.4,'#ff78a7',-4.39,3.08,3.46],
    [552.6,285.8,26.8,'#ff8b70',-2.29,3.79,4.38],
    [202.3,72.2,17.0,'#ffc044',-0.45,2.72,5.41],
    [529.2,222.9,27.8,'#ff78a7',-5.19,2.35,5.26],
    [469.4,71.3,27.5,'#ff78a7',-2.10,4.18,5.39],
    [323.0,51.3,24.8,'#ff9abb',-2.38,2.34,3.84],
    [379.8,185.5,22.9,'#ff78a7',-3.46,2.48,4.77],
    [249.1,307.2,22.3,'#ff5d91',-0.47,4.03,5.38],
    [589.1,93.5,16.8,'#ff9abb',-4.17,3.99,5.34],
    [244.3,141.1,18.3,'#ffb4ca',-5.34,3.04,4.78],
    [272.0,92.2,20.2,'#ff8b70',-5.11,3.66,3.93],
    [216.1,191.6,18.9,'#ff5d91',-5.38,2.81,3.70],
    [579.2,70.5,18.6,'#ff78a7',-2.43,2.23,3.71],
    [488.1,156.6,27.7,'#ffb4ca',-1.79,2.38,5.08],
    [179.6,80.9,27.4,'#ffc044',-4.00,3.16,5.64],
    [418.1,147.1,25.3,'#ff5d91',-3.93,2.68,5.22],
    [578.0,96.0,25.8,'#ff9abb',-4.55,3.90,5.60],
    [483.5,71.8,25.2,'#ffb4ca',-0.89,4.08,5.26],
    [563.8,109.5,19.0,'#ffb4ca',-3.65,2.86,4.21],
    [274.6,185.4,23.1,'#ff78a7',-3.35,2.62,4.32],
    [200.9,111.7,21.9,'#ff9abb',-0.65,3.37,3.87],
    [693.0,308.2,16.4,'#ff9abb',-1.62,3.78,5.32],
    [584.5,176.0,27.4,'#ff8b70',-3.63,3.19,3.62],
    [372.4,244.3,15.3,'#ff78a7',-4.96,3.19,3.54],
    [374.6,249.2,18.5,'#ffb4ca',-4.18,3.26,4.76],
    [426.6,123.9,22.4,'#ff9abb',-1.43,3.54,4.67],
    [590.0,192.7,26.7,'#ffc044',-5.07,2.79,4.05],
    [467.3,245.3,15.6,'#ff9abb',-1.58,2.75,5.37],
    [669.4,315.3,20.5,'#ffb4ca',-3.46,3.69,3.78],
    [90.3,298.3,20.9,'#ffb4ca',-0.23,2.65,3.43],
    [444.5,125.1,17.2,'#ff5d91',-2.46,4.04,5.35],
    [277.9,93.1,26.4,'#ffb4ca',-2.01,2.73,3.88],
    [357.9,298.3,17.6,'#ff78a7',-4.42,2.27,5.16],
    [359.2,291.2,23.5,'#ffc044',-0.08,3.71,3.96],
    [546.2,278.2,15.3,'#ff78a7',-4.60,3.51,4.51],
    [634.5,278.4,26.9,'#ffc044',-0.38,3.14,5.25],
    [467.1,232.0,24.7,'#ff78a7',-3.20,2.61,4.37],
    [605.6,169.0,17.3,'#ffc044',-2.58,3.73,3.81],
    [410.7,197.1,23.5,'#ff5d91',-5.48,3.46,3.96],
    [209.2,307.5,27.0,'#ff8b70',-4.77,3.12,5.03],
    [506.7,246.9,24.8,'#ff8b70',-3.56,2.53,5.11],
    [301.0,185.3,21.5,'#ff8b70',-4.44,3.40,3.53],
    [152.8,185.1,19.5,'#ff5d91',-1.82,3.93,3.91],
    [258.3,234.4,21.5,'#ff8b70',-2.54,2.28,4.39],
    [436.6,179.8,25.9,'#ff8b70',-4.43,3.31,4.25],
    [626.1,325.2,20.4,'#ff5d91',-4.45,3.52,4.87],
    [290.0,61.6,17.3,'#ff9abb',-0.18,2.35,3.83],
    [196.8,68.4,24.4,'#ffb4ca',-2.20,2.64,4.84],
    [583.4,57.1,25.7,'#ffb4ca',-2.20,2.48,5.78],
    [669.8,257.8,20.6,'#ff78a7',-4.28,3.68,4.73],
    [276.3,106.3,20.2,'#ff78a7',-5.06,2.76,4.39],
    [484.2,87.1,27.4,'#ff9abb',-2.96,2.33,3.46],
    [278.4,85.8,21.5,'#ff78a7',-3.31,2.37,5.01],
    [259.8,301.7,19.0,'#ff8b70',-2.72,4.04,3.61],
    [175.2,165.3,19.2,'#ffc044',-1.57,3.71,5.53],
    [511.9,217.5,26.9,'#ff5d91',-1.82,3.58,3.76],
    [327.0,153.5,26.5,'#ffb4ca',-2.10,3.96,5.39],
    [461.9,343.1,18.0,'#ff78a7',-2.39,3.01,5.47],
    [328.9,69.6,16.8,'#ff8b70',-3.94,2.23,4.71],
    [174.5,287.2,27.9,'#ff5d91',-5.11,2.38,3.54],
    [318.6,36.7,19.6,'#ffc044',-4.22,2.66,4.71],
    [132.8,256.4,26.1,'#ffc044',-5.30,3.33,4.45],
    [271.5,84.1,19.3,'#ff9abb',-3.85,3.57,3.56],
    [162.4,183.7,16.2,'#ff5d91',-4.45,2.88,5.42],
    [302.4,341.0,22.9,'#ffc044',-2.23,2.46,3.50],
    [455.4,193.6,19.9,'#ff5d91',-3.50,2.91,4.88],
    [254.0,104.0,24.1,'#ff9abb',-2.29,2.25,4.83],
    [288.0,225.9,22.2,'#ffc044',-3.99,3.89,4.43],
    [222.9,211.8,26.5,'#ffc044',-4.35,3.24,4.92],
    [318.0,35.9,21.7,'#ff9abb',-4.61,2.46,5.41],
    [419.5,247.8,26.8,'#ff78a7',-2.26,2.64,3.54],
    [537.5,312.8,27.6,'#ff78a7',-2.67,3.79,4.90],
    [614.2,298.7,20.6,'#ffc044',-3.23,3.59,4.54],
    [624.0,287.5,15.6,'#ffc044',-1.35,3.13,4.71],
    [123.4,175.2,18.2,'#ff78a7',-1.16,2.97,5.17],
    [210.4,79.7,21.0,'#ff5d91',-2.26,4.19,4.67],
    [569.1,190.4,17.4,'#ff8b70',-5.21,3.25,5.65],
    [625.7,178.8,23.5,'#ffb4ca',-0.35,2.61,4.36],
    [368.7,236.8,25.5,'#ffb4ca',-2.25,3.33,3.82],
    [326.5,176.3,20.0,'#ff8b70',-1.41,2.44,5.19],
    [332.6,200.0,15.8,'#ff78a7',-0.46,4.01,5.75],
    [217.6,96.7,26.5,'#ff78a7',-3.59,2.36,3.59],
    [368.1,255.5,18.6,'#ff8b70',-0.18,3.28,5.42],
    [265.7,210.5,16.5,'#ff9abb',-1.02,3.65,4.65]
  ];

  hearts.forEach(([x, y, size, color, delay, twinkle, floating]) => {
    const heart = document.createElement("i");

    heart.className = "tree-heart";
    heart.textContent = "♥";

    heart.style.left = `${x / 760 * 100}%`;
    heart.style.top = `${y / 500 * 100}%`;
    heart.style.fontSize = `${size}px`;
    heart.style.color = color;

    heart.style.setProperty("--delay", `${delay}s`);
    heart.style.setProperty("--twinkle", `${twinkle}s`);
    heart.style.setProperty("--float", `${floating}s`);

    treeHeartField.appendChild(heart);
  });
}


/* =========================================
   INITIAL SCREEN
========================================= */

goToScreen(0, { instant: true });
