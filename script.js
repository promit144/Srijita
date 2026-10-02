const screens = [...document.querySelectorAll(".screen")];
const dots = document.getElementById("dots");
let index = 0;

screens.forEach((_, i) => {
  const d = document.createElement("i");
  d.className = "dot" + (i === 0 ? " active" : "");
  d.onclick = () => go(i);
  dots.appendChild(d);
});

function go(n) {
  index = (n + screens.length) % screens.length;
  screens.forEach((s, i) => s.classList.toggle("active", i === index));
  [...dots.children].forEach((d, i) => d.classList.toggle("active", i === index));
  window.scrollTo(0,0);
}

document.getElementById("next").onclick = () => go(index + 1);
document.getElementById("prev").onclick = () => go(index - 1);

let touchX = 0;
document.addEventListener("touchstart", e => touchX = e.changedTouches[0].clientX, {passive:true});
document.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 55) go(index + (dx < 0 ? 1 : -1));
}, {passive:true});

document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight" || e.key === " ") go(index + 1);
  if (e.key === "ArrowLeft") go(index - 1);
});

const song = document.getElementById("song");
const musicBtn = document.getElementById("musicBtn");
const musicPill = document.getElementById("musicPill");

async function toggleMusic() {
  try {
    if (song.paused) {
      await song.play();
      musicPill.classList.add("playing");
      musicBtn.textContent = "Ⅱ";
    } else {
      song.pause();
      musicPill.classList.remove("playing");
      musicBtn.textContent = "♫";
    }
  } catch {
    alert("Add your song as assets/blue.mp3, then tap the music button again.");
  }
}
musicBtn.onclick = toggleMusic;

// Start music after the first deliberate tap, because mobile browsers block autoplay.
document.querySelector(".heart").addEventListener("click", async () => {
  if (song.paused) {
    try { await song.play(); musicPill.classList.add("playing"); musicBtn.textContent = "Ⅱ"; } catch {}
  }
  go(1);
});

const balloons = [...document.querySelectorAll(".balloon")];
const reasonBox = document.getElementById("reasonBox");
const reasonCount = document.getElementById("reasonCount");
balloons.forEach(b => b.addEventListener("click", () => {
  if (b.classList.contains("popped")) return;
  b.classList.add("popped");
  reasonBox.textContent = b.dataset.text;
  reasonBox.classList.remove("hidden");
  const left = balloons.filter(x => !x.classList.contains("popped")).length;
  reasonCount.textContent = left ? `${left} little ${left === 1 ? "thing" : "things"} left…` : "…and a thousand more reasons. ♡";
}));

const cake = document.getElementById("cake");
const cakeMessage = document.getElementById("cakeMessage");
let wished = false;
cake.onclick = () => {
  wished = !wished;
  cake.querySelectorAll(".flame").forEach(f => f.style.display = wished ? "none" : "block");
  cakeMessage.textContent = wished
    ? "Wish made. Now let life surprise you. ✨"
    : "A wish this beautiful deserves to come true.";
  if (wished) {
    for (let i=0;i<18;i++) {
      const h = document.createElement("span");
      h.textContent = "✨";
      h.style.position = "fixed";
      h.style.left = `${45 + Math.random()*10}%`;
      h.style.top = `${45 + Math.random()*10}%`;
      h.style.zIndex = 50;
      h.style.transition = "1.2s ease";
      document.body.appendChild(h);
      requestAnimationFrame(() => {
        h.style.transform = `translate(${(Math.random()-.5)*280}px,${-100-Math.random()*220}px)`;
        h.style.opacity = "0";
      });
      setTimeout(()=>h.remove(),1300);
    }
  }
};

document.getElementById("replay").onclick = () => go(0);
