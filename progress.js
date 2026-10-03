/* =========================================
   JOURNEY PROGRESS BAR
   Fills as she moves through the pages and
   needs no changes to script.js: it watches
   which screen is currently "active".
========================================= */
(function () {
"use strict";

const screens = [...document.querySelectorAll("#app .screen")];
if (!screens.length) return;

const bar = document.createElement("div");
bar.id = "journey";
bar.setAttribute("role", "progressbar");
bar.setAttribute("aria-label", "Progress through the surprise");
bar.setAttribute("aria-valuemin", "1");
bar.setAttribute("aria-valuemax", String(screens.length));
bar.innerHTML =
  '<div class="jr-fill"></div><div class="jr-head"></div><div class="jr-ticks">' +
  screens.map(() => "<i></i>").join("") + "</div>";
document.body.appendChild(bar);

/* pages with a light background (opening + finale) need a darker track */
const LIGHT = [0, screens.length - 1];
let shown = -1;

function update() {
  /* the page that is arriving has .go; during a transition, prefer the newest one */
  let idx = -1;
  screens.forEach((s, i) => { if (s.classList.contains("active") && s.classList.contains("go")) idx = i; });
  if (idx < 0) screens.forEach((s, i) => { if (s.classList.contains("active")) idx = i; });
  if (idx < 0 || idx === shown) return;
  shown = idx;

  const p = idx / (screens.length - 1);
  bar.style.setProperty("--p", p.toFixed(4));
  bar.setAttribute("aria-valuenow", String(idx + 1));
  bar.classList.toggle("light", LIGHT.includes(idx));
}

const mo = new MutationObserver(update);
screens.forEach(s => mo.observe(s, { attributes: true, attributeFilter: ["class"] }));
update();
})();
