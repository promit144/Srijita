# A Birthday Surprise ♡

A small, mobile-first birthday website built as an interactive story. It is plain HTML, CSS and JavaScript, with no framework, no build step and no dependencies to install.

It opens on a countdown lock screen and unlocks at a set moment. After that the story plays as eight pages, each with its own animation, sound and transition.

> Built for **Srijita**. Names, dates and messages are all easy to change; see [Customising](#customising).

---

## The journey

| # | Page | What happens |
|---|------|--------------|
| – | **Countdown lock** | Covers everything until the unlock time. A live clock counts down; when it hits zero, the lock celebrates and she taps in. |
| 1 | **Opening: bow & arrow** | She presses the bow, **pulls the string back** and lets go. The arrow flies at the heart, which shatters into the next page. |
| 2 | **Happy Birthday** | Animated title, her name, her photo, balloons, fireworks and light rays. |
| 3 | **The letter** | Tap the envelope; the seal cracks, the flap opens and the letter slides out. |
| 4 | **Why you're loved** | Five floating balloons. Pop each one to reveal a message; the finale plays after the fifth. |
| 5 | **Make a wish** | Tap the cake to light the candles, tap again to blow them out. Confetti and a wish star follow. Tapping the cake once the candles are out moves on. |
| 6 | **A tree full of wishes** | A heart tree grows, with fireflies, falling petals, a moon and shooting stars. |
| 7 | **Out of this world** | A warp jump into space, then a spinning galaxy and planets. One star shines brighter; tap it and a heart constellation is drawn with her name. |
| 8 | **Finale** | A heart of stars, fireworks and a **Replay** button, which also restarts the song. |

A thin **progress bar** along the top shows how far through the surprise she is.

Navigation is "tap anywhere to continue". Each page waits until its own moment is finished before a tap moves on.

---

## Project structure

```
.
├── index.html        # all eight pages + the lock screen (markup only)
├── style.css         # base styles, every page, cinematic transitions
├── enhance.css       # extra effects, "lite mode" overrides for phones
├── bow.css           # opening page: pull cue, draw feedback
├── cosmos.css        # space page
├── progress.css      # top progress bar
├── countdown.css     # lock screen
│
├── script.js         # core: navigation, transitions, sound, opening bow,
│                     #   letter, balloons, cake, tree, replay, music
├── enhance.js        # sound effects + canvas scenes (fireworks, fireflies, finale)
├── cosmos.js         # space page: warp, galaxy, her star, constellation
├── progress.js       # progress bar (watches which page is active)
├── countdown.js      # lock screen + unlock time
│
└── assets/
    ├── cutie.jpg     # her photo, shown on page 2     (you provide this)
    └── blue.mp3      # the song, loops all the way through (you provide this)
```

**Load order matters.** `index.html` loads CSS in this order: `style` → `enhance` → `bow` → `cosmos` → `progress` → `countdown`. It loads JS in this order: `script` → `enhance` → `cosmos` → `progress` → `countdown`. Later files build on, or override, earlier ones. `enhance.js` and `cosmos.js` reuse helpers from `script.js` (`ensureAudio`, `screenTimer`, `transitioning`), so `script.js` must come first.

---

## Running it

You need two files that are **not** part of the code: a photo at `assets/cutie.jpg` and a song at `assets/blue.mp3`. The page works without them, but the photo will be blank and there will be no music.

### Locally

Open `index.html` in a browser, or serve the folder (recommended):

```bash
# any static server works, for example:
python3 -m http.server 8000
# then open http://localhost:8000
```

Serving over `http://` is better than opening the file directly: the countdown checks the **server's** clock rather than the phone's (see [Countdown](#the-countdown-lock)), and that check only works over HTTP(S).

### Previewing past the lock screen

The lock covers everything until `UNLOCK_AT`. To work on the pages, set `UNLOCK_AT` in `countdown.js` to a time in the past; the lock is then skipped instantly. Set it back to the real time before you publish.

### Testing the phone version on a computer

Phones and low-power devices automatically get a "lite" mode: fewer particles and no heavy blur or glow effects. To force it on a computer, add `?lite=1` to the address. Use `?lite=0` to force the full version.

```
http://localhost:8000/?lite=1
```

---

## Customising

### The unlock time

In `countdown.js`:

```js
const UNLOCK_AT = new Date("2026-10-06T00:00:00+05:30").getTime();
```

The `+05:30` makes it **India time**, whatever time zone her phone is in. Change the date, time and offset to suit.

> ⚠️ **Keep the text in sync.** The lock screen's visible caption ("6 October · 12:00 AM") is typed by hand in `index.html`, inside `.lock-date`. Changing `UNLOCK_AT` does not update it. Edit both.

### Names, messages and text

Everything she reads is plain text in `index.html`:

| What | Where in `index.html` |
|------|-----------------------|
| Browser tab title | `<title>` |
| Lock screen title, subtitle and date caption | `#lock` section |
| "It's your birthday, Srijita!" (shown when the clock hits zero) | `countdown.js`, in `itsTime()` |
| Birthday page title and name | `.birthday` section |
| The letter and signature ("A well-wisher") | `.letter-screen` → `article.letter` |
| The five balloon messages | `data-text="…"` on each `.bl` button in `.reasons-screen` |
| Cake page text | `.cake-screen` |
| Tree page text | `.tree-screen` |
| Space page text and the star's name | `.cosmos-screen` (`.cosmos-sub`, `.st-name`); the second line is `SUB_2` at the top of `cosmos.js` |
| Finale text, e.g. "27 looks beautiful on you." | `.final-screen` |

### The photo and the song

- Replace `assets/cutie.jpg` with her photo. It is shown as a circle, so a square-ish photo with the face near the centre works best.
- Replace `assets/blue.mp3` with your song, or point `src` on the `<audio id="song">` tag to a different file. The music pill's label ("Blue") is in the `#musicPill` block.

### Colours and fonts

Fonts (**Playfair Display** and **DM Sans**) load from Google Fonts in the `<head>`. Colours are plain CSS values inside the stylesheets: the pinks `#ec3270` / `#ff5d91` and the gold `#f0a72c` / `#ffc044` are used throughout.

### Tuning the bow

At the top of the draw logic in `script.js`:

| Constant | Default | Meaning |
|----------|---------|---------|
| `GRAB_R` | `78` | How close (px) a press must be to the bow or arrow to grab it |
| `FULL_DRAG` | `120` | How far (px) she must drag back for a full draw |
| `MIN_POWER` | `0.42` | Weaker draws than this just spring back |

The arrow always flies at the heart, so the shot cannot miss.

---

## The countdown lock

`countdown.js` shows the lock screen and keeps everything behind it **inert**, so it cannot be tabbed into, tapped or scrolled before the time.

- **Server time, not phone time.** A phone's clock can be wrong or changed on purpose, so the page asks the web server what time it is (a `HEAD` request reading the `Date` header). If that fails, for example when opened from a local file, it falls back to the device clock.
- **Opened late?** If she opens the link after the unlock time, she is let straight in with no lock screen.
- **Watching it hit zero?** If she is looking at the clock when it reaches zero, the lock celebrates ("It's your birthday…") and she taps **Open your surprise** to go in.
- **Coming back to the tab** re-checks the time.

> This is a gift-friendly lock, not security. The page's files are still downloadable by anyone who knows the address, so don't put anything secret in it.

---

## Sound and music

- The **song** starts on her first touch of the opening page. Browsers require a user gesture before audio can play, and the first press on the bow provides it. The music pill (top right) pauses and resumes it, and **Replay restarts it from the beginning**.
- The song **pauses automatically** when the tab is hidden or the phone is locked, and resumes when she comes back (unless she paused it by hand).
- **Sound effects** (bow creak and twang, fireworks, balloon pops, the warp jump, constellation notes and so on) are all generated live with the Web Audio API. There are no audio files for them.
- **Vibration** is used lightly on phones that support it.

---

## Adding or removing a page

Pages are the `<section class="screen">` blocks in `index.html`, shown in order. Most things adapt automatically (the tap-to-continue rule, the progress bar and the canvases), but `script.js` has a few **hard-coded page numbers** (counting from 0). If you add, remove or reorder a page, update these:

| Place in `script.js` | What it does |
|----------------------|--------------|
| `preEnter(n)` | Resets a page before it appears (opening, letter, balloons, tree, space) |
| `startIntro(n)` | Starts each page's own intro animation, including the space page (6) and finale (7) |
| `READY_AFTER` | How long some pages wait before showing "tap to continue" |
| `runTransition()` → `switch (to)` | The unique transition into each page |
| Tap handler (`screens.forEach(… "click" …)`) | Which pages wait for their moment to finish (`is-done`) before a tap moves on |

The progress bar (`progress.js`) and the "last page = finale" logic read the page list themselves and need no changes.

---

## Performance notes

- Heavy effects use sprites that are drawn once and stamped each frame, canvases cap their resolution, and only `transform` and `opacity` are animated on phones.
- In lite mode, canvas scenes draw at about 30 fps and **wait until the page transition has finished**, so the transition itself stays smooth.
- Everyone who has **"reduce motion"** turned on in their device settings gets calmer, mostly static versions of the animations.

---

## Publishing

It is a static site: upload the whole folder (including `assets/`) to any static host, such as GitLab Pages, GitHub Pages, Netlify or Cloudflare Pages. A few things to remember:

- Host over **HTTPS**, so audio and the server-time check behave.
- Fonts come from Google Fonts, so she needs an internet connection for the exact typefaces; otherwise a similar system font is used.
- Share the link shortly before the unlock time, or just send it early. The lock screen does the waiting.
- Keep **`.git`** and any notes out of the published folder if your host serves everything it finds.

**GitLab Pages**, as an example. Add a `.gitlab-ci.yml` at the project root:

```yaml
pages:
  stage: deploy
  script:
    - mkdir public
    - cp -r index.html *.css *.js assets public/
  artifacts:
    paths:
      - public
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

---

## Browser support

Any recent Chrome, Safari, Firefox or Edge, on phone or desktop. It uses standard web features only: CSS custom properties, the Web Animations API, Pointer Events, `<canvas>` and the Web Audio API. It is designed **phone first**, in portrait.

---

## Credits

Made with care, as a small gift. 🎂
