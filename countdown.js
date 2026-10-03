/* =========================================
   BIRTHDAY COUNTDOWN LOCK
   Change UNLOCK_AT to change when the surprise opens.
   The "+05:30" means India time, whatever time zone
   the phone is in.
========================================= */
(function () {
  "use strict";

  const UNLOCK_AT = new Date("2026-10-06T00:00:00+05:30").getTime();

  const lock = document.getElementById("lock");
  if (!lock) return;

  const app = document.getElementById("app");
  const pill = document.getElementById("musicPill");
  const nums = {
    d: document.getElementById("cdD"),
    h: document.getElementById("cdH"),
    m: document.getElementById("cdM"),
    s: document.getElementById("cdS")
  };
  const openBtn = document.getElementById("lockOpen");

  /* the clock on a phone can be wrong, so ask the server what time it is
     and use that instead (falls back to the phone clock if that fails) */
  let offset = 0;
  const now = () => Date.now() + offset;

  function syncClock() {
    const t0 = Date.now();
    return fetch(location.pathname + "?_=" + t0, { method: "HEAD", cache: "no-store" })
      .then(res => {
        const h = res.headers.get("date");
        if (!h) return;
        const server = new Date(h).getTime();
        if (isNaN(server)) return;
        const rtt = Date.now() - t0;
        offset = server + rtt / 2 - Date.now();
      })
      .catch(() => {});
  }

  /* ---------- keep the real page untouchable while locked ---------- */
  function setInert(on) {
    [app, pill].forEach(el => {
      if (!el) return;
      if (on) el.setAttribute("inert", "");
      else el.removeAttribute("inert");
    });
    document.body.style.overflow = on ? "hidden" : "";
  }

  /* ---------- floating hearts in the lock screen ---------- */
  (function floaters() {
    const small = Math.min(screen.width, screen.height) < 820;
    const n = small ? 14 : 24;
    const glyphs = ["♥", "♥", "♡", "✦", "✧"];
    const cols = ["#ff5d91", "#ff9abb", "#ffb4ca", "#f0a72c", "#ffc044"];
    for (let i = 0; i < n; i++) {
      const el = document.createElement("i");
      el.className = "lock-float";
      el.textContent = glyphs[i % glyphs.length];
      el.style.left = (Math.random() * 96 + 2).toFixed(1) + "%";
      el.style.fontSize = (10 + Math.random() * 18).toFixed(0) + "px";
      el.style.color = cols[Math.floor(Math.random() * cols.length)];
      el.style.setProperty("--t", (9 + Math.random() * 9).toFixed(1) + "s");
      el.style.setProperty("--d", (-Math.random() * 16).toFixed(1) + "s");
      el.style.setProperty("--dx", ((Math.random() - 0.5) * 120).toFixed(0) + "px");
      lock.appendChild(el);
    }
  })();

  /* ---------- the ticking ---------- */
  const pad = n => String(n).padStart(2, "0");
  const shown = {};

  function put(key, value) {
    if (shown[key] === value) return;
    shown[key] = value;
    const el = nums[key];
    el.textContent = value;
    el.classList.remove("tick");
    void el.offsetWidth;
    el.classList.add("tick");
  }

  let timer = null;
  let unlocked = false;

  function render() {
    const left = UNLOCK_AT - now();

    if (left <= 0) {
      itsTime();
      return;
    }

    const s = Math.floor(left / 1000);
    put("d", pad(Math.floor(s / 86400)));
    put("h", pad(Math.floor(s / 3600) % 24));
    put("m", pad(Math.floor(s / 60) % 60));
    put("s", pad(s % 60));

    /* wake up right on the next whole second */
    timer = setTimeout(render, (left % 1000) || 1000);
  }

  /* ---------- the moment it opens ---------- */
  function itsTime() {
    if (unlocked) return;
    unlocked = true;
    clearTimeout(timer);

    /* if she opened the link after the time had already passed, just let her in */
    if (lock.dataset.fresh === "1") {
      reveal(true);
      return;
    }

    /* she is watching the clock hit zero: celebrate and let her tap in */
    lock.classList.add("ready");
    lock.querySelector(".lock-gift").textContent = "🎉";
    lock.querySelector(".lock-eyebrow").textContent = "and just like that…";
    lock.querySelector(".lock-title").innerHTML = "It's your <em>birthday</em>, Srijita!";
    lock.querySelector(".lock-sub").textContent = "Your surprise is ready.";
    openBtn.addEventListener("click", () => reveal(false), { once: true });
    openBtn.focus({ preventScroll: true });
  }

  function reveal(instant) {
    setInert(false);

    /* replay the opening page's intro, so it is fresh when the curtain lifts */
    try {
      const hero = document.querySelector(".hero");
      hero.classList.remove("go", "ready");
      goToScreen(0, { instant: true });
    } catch (e) {}

    if (instant) {
      lock.classList.add("gone");
      return;
    }
    lock.classList.add("leaving");
    setTimeout(() => lock.classList.add("gone"), 1300);
  }

  /* ---------- start ---------- */
  lock.dataset.fresh = "1";
  if (now() >= UNLOCK_AT) {
    /* clock says it's already time (device clock) – confirm with the server first */
    syncClock().then(() => {
      if (now() >= UNLOCK_AT) { itsTime(); }
      else { lock.dataset.fresh = "0"; setInert(true); render(); }
    });
    setInert(true);
  } else {
    lock.dataset.fresh = "0";
    setInert(true);
    render();
    syncClock().then(() => { clearTimeout(timer); if (!unlocked) render(); });
  }

  /* coming back to the tab after a long time: re-check */
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !unlocked) {
      syncClock().then(() => { clearTimeout(timer); render(); });
    }
  });
})();
