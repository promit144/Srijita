/* =========================================
   SCREEN NAVIGATION
========================================= */

const screens = [
  ...document.querySelectorAll(".screen")
];

let currentScreen = 0;


/* -----------------------------------------
   SHOW SCREEN
----------------------------------------- */

function goToScreen(number) {

  currentScreen =
    (number + screens.length) % screens.length;

  screens.forEach((screen, index) => {

    screen.classList.toggle(
      "active",
      index === currentScreen
    );

  });

}


/* =========================================
   TAP ANYWHERE TO CONTINUE
========================================= */

screens.forEach((screen, index) => {

  screen.addEventListener("click", function(event) {

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


    /*
      Opening screen has the heart.
    */

    if (index === 0) {
      return;
    }


    /*
      Tap anywhere → next screen
    */

    goToScreen(index + 1);

  });

});


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

    if (song.paused) {

      playMusic();

    } else {

      pauseMusic();

    }

  }
);


/* =========================================
   OPENING HEART
========================================= */

const openingHeart =
  document.getElementById(
    "openingHeart"
  );


openingHeart.addEventListener(
  "click",
  async function(event) {

    event.stopPropagation();


    /*
      Start music after the user's
      first interaction.
    */

    if (song.paused) {

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


    /*
      Go to birthday screen.
    */

    goToScreen(1);

  }
);


/* =========================================
   BALLOON POP SOUND
========================================= */

let audioContext = null;


function playPopSound()  {
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
   BALLOONS
========================================= */

const balloons = [
  ...document.querySelectorAll(".balloon")
];


const reasonBox =
  document.getElementById(
    "reasonBox"
  );


const reasonCount =
  document.getElementById(
    "reasonCount"
  );


balloons.forEach(balloon => {

  balloon.addEventListener(
    "click",
    function(event) {

      /*
        Don't go to next screen.
      */

      event.stopPropagation();


      /*
        Don't pop twice.
      */

      if (
        balloon.classList.contains(
          "popped"
        )
      ) {

        return;

      }


      /*
        🔊 PLAY POP SOUND
      */

      playPopSound();


      /*
        POP BALLOON
      */

      balloon.classList.add(
        "popped"
      );


      /*
        SHOW REASON
      */

      reasonBox.textContent =
        balloon.dataset.text;


      reasonBox.classList.remove(
        "hidden"
      );


      /*
        COUNT REMAINING
      */

      const remaining =
        balloons.filter(
          balloon =>
            !balloon.classList.contains(
              "popped"
            )
        ).length;


      if (remaining > 0) {

        reasonCount.textContent =
          `${remaining} little ${
            remaining === 1
              ? "thing"
              : "things"
          } left…`;

      }

      else {

        reasonCount.textContent =
          "…and a thousand more reasons. ♡";

      }

    }
  );

});


/* =========================================
   CAKE
========================================= */

const cake =
  document.getElementById(
    "cake"
  );


const cakeMessage =
  document.getElementById(
    "cakeMessage"
  );


let wished = false;


cake.addEventListener(
  "click",
  function(event) {

    /*
      Don't move to next screen.
    */

    event.stopPropagation();


    wished = !wished;


    /*
      Turn candles on/off.
    */

    cake
      .querySelectorAll(".flame")
      .forEach(flame => {

        flame.style.display =
          wished
            ? "none"
            : "block";

      });


    /*
      Change message.
    */

    if (wished) {

      cakeMessage.textContent =
        "Wish made. Now let life surprise you. ✨";


      createSparkles();

    }

    else {

      cakeMessage.textContent =
        "A wish this beautiful deserves to come true.";

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

goToScreen(0);
