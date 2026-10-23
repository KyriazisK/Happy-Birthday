/**
 * Happy Birthday Irene - Interactive Experience Script
 * Web Audio API Music Box + Starry Canvas + Progressive Stage Navigation
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     1. Starry Canvas & Floating Particles
     ========================================================================== */
  const canvas = document.getElementById('sky-canvas');
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initStars();
  });

  const stars = [];
  const numStars = Math.min(Math.floor((width * height) / 3500), 220);

  function initStars() {
    stars.length = 0;
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleDir: Math.random() > 0.5 ? 1 : -1,
        color: ['#ffffff', '#fff8e7', '#f6d365', '#ffd1dc'][Math.floor(Math.random() * 4)]
      });
    }
  }

  // Shooting star
  let shootingStar = null;
  function triggerShootingStar() {
    shootingStar = {
      x: Math.random() * width * 0.8,
      y: Math.random() * (height * 0.4),
      length: Math.random() * 80 + 50,
      speed: Math.random() * 8 + 8,
      angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1),
      alpha: 1
    };
    const nextInterval = Math.random() * 5000 + 4000;
    setTimeout(triggerShootingStar, nextInterval);
  }
  setTimeout(triggerShootingStar, 2500);

  function drawSky() {
    ctx.clearRect(0, 0, width, height);

    // Draw twinkling stars
    for (let star of stars) {
      star.alpha += star.twinkleSpeed * star.twinkleDir;
      if (star.alpha > 0.95) {
        star.alpha = 0.95;
        star.twinkleDir = -1;
      } else if (star.alpha < 0.2) {
        star.alpha = 0.2;
        star.twinkleDir = 1;
      }

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = star.alpha;
      ctx.shadowBlur = star.radius * 3;
      ctx.shadowColor = star.color;
      ctx.fill();
    }

    // Draw shooting star
    if (shootingStar) {
      ctx.save();
      ctx.beginPath();
      const endX = shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.length;
      const endY = shootingStar.y - Math.sin(shootingStar.angle) * shootingStar.length;

      const grad = ctx.createLinearGradient(
        shootingStar.x, shootingStar.y,
        endX, endY
      );
      grad.addColorStop(0, `rgba(255, 255, 255, ${shootingStar.alpha})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.moveTo(shootingStar.x, shootingStar.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed;
      shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed;
      shootingStar.alpha -= 0.02;

      if (shootingStar.alpha <= 0 || shootingStar.x > width || shootingStar.y > height) {
        shootingStar = null;
      }
      ctx.restore();
    }

    ctx.globalAlpha = 1.0;
    requestAnimationFrame(drawSky);
  }

  initStars();
  drawSky();

  /* ==========================================================================
     2. Music Player (Custom MP3 with Synthetic Music Box Fallback)
     ========================================================================== */
  let audioCtx = null;
  let isPlayingMusic = false;
  let melodyTimeout = null;
  let customAudio = null;
  let useCustomAudio = false;

  // Try loading custom song.mp3 if provided
  try {
    const testAudio = new Audio('song.mp3');
    testAudio.preload = 'metadata';
    testAudio.addEventListener('canplaythrough', () => {
      useCustomAudio = true;
      customAudio = testAudio;
      customAudio.loop = true;
    });
    testAudio.addEventListener('error', () => {
      useCustomAudio = false;
      customAudio = null;
    });
  } catch (e) {
    useCustomAudio = false;
  }

  // Notes frequency in Hz for Happy Birthday
  const NOTES = {
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.00,
    A4: 440.00,
    Bb4: 466.16,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    F5: 698.46
  };

  // Score: [note, duration in seconds]
  const birthdayScore = [
    ['C4', 0.4], ['C4', 0.2], ['D4', 0.6], ['C4', 0.6], ['F4', 0.6], ['E4', 1.0],
    ['C4', 0.4], ['C4', 0.2], ['D4', 0.6], ['C4', 0.6], ['G4', 0.6], ['F4', 1.0],
    ['C4', 0.4], ['C4', 0.2], ['C5', 0.6], ['A4', 0.6], ['F4', 0.6], ['E4', 0.6], ['D4', 0.9],
    ['Bb4', 0.4], ['Bb4', 0.2], ['A4', 0.6], ['F4', 0.6], ['G4', 0.6], ['F4', 1.3]
  ];

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, duration = 0.5, type = 'sine') {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Music box bell envelope: fast attack, gentle bell decay
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio play error", e);
    }
  }

  function playChimeEffect() {
    const chimes = [523.25, 659.25, 783.99, 1046.50];
    chimes.forEach((f, i) => {
      setTimeout(() => playTone(f, 0.7, 'triangle'), i * 90);
    });
  }

  function playExtinguishPuff() {
    try {
      const ctx = getAudioContext();
      const node = ctx.createBufferSource();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
      }
      node.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, ctx.currentTime);

      node.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      node.start();
    } catch (e) {}
  }

  function playMelodySequence(noteIndex = 0) {
    if (!isPlayingMusic) return;

    if (noteIndex >= birthdayScore.length) {
      melodyTimeout = setTimeout(() => playMelodySequence(0), 1800);
      return;
    }

    const [note, duration] = birthdayScore[noteIndex];
    if (NOTES[note]) {
      playTone(NOTES[note], duration * 1.2, 'triangle');
    }

    melodyTimeout = setTimeout(() => {
      playMelodySequence(noteIndex + 1);
    }, duration * 1000);
  }

  // Vinyl widget controls
  const vinylWidget = document.getElementById('vinylWidget');
  const vinylRecord = document.getElementById('vinylRecord');
  const toneArm = document.getElementById('toneArm');
  const musicHint = document.getElementById('musicHint');

  function toggleMusic() {
    getAudioContext();
    if (isPlayingMusic) {
      isPlayingMusic = false;
      if (customAudio && useCustomAudio) {
        customAudio.pause();
      }
      clearTimeout(melodyTimeout);
      vinylRecord.classList.remove('playing');
      toneArm.classList.remove('playing');
      musicHint.textContent = 'Tap to Play ♫';
    } else {
      isPlayingMusic = true;
      vinylRecord.classList.add('playing');
      toneArm.classList.add('playing');
      musicHint.textContent = 'Playing ♫';

      if (customAudio && useCustomAudio) {
        customAudio.play().catch(() => {
          // Fall back to synth if audio play fails
          useCustomAudio = false;
          playMelodySequence(0);
        });
      } else {
        playMelodySequence(0);
      }
    }
  }

  vinylWidget.addEventListener('click', toggleMusic);

  /* ==========================================================================
     3. Experience Flow Navigation (Step 1 -> Step 2 -> Step 3)
     ========================================================================== */
  const stepEnvelope = document.getElementById('stepEnvelope');
  const stepCake = document.getElementById('stepCake');
  const stepLetter = document.getElementById('stepLetter');

  function goToStep(currentSection, nextSection) {
    currentSection.style.opacity = '0';
    currentSection.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      currentSection.classList.remove('active');
      nextSection.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 700);
  }

  /* --- Step 1: Open the Envelope --- */
  const waxSeal = document.getElementById('waxSeal');
  const envelope = document.getElementById('envelope');
  let envelopeOpened = false;

  function openEnvelope() {
    if (envelopeOpened) return;
    envelopeOpened = true;

    // Start music on first interaction if not yet started
    if (!isPlayingMusic) {
      toggleMusic();
    }

    waxSeal.classList.add('broken');
    envelope.classList.add('open');
    playChimeEffect();

    if (window.confetti) {
      window.confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }

    setTimeout(() => {
      goToStep(stepEnvelope, stepCake);
    }, 1200);
  }

  waxSeal.addEventListener('click', openEnvelope);
  envelope.addEventListener('click', openEnvelope);

  /* --- Step 2: The Birthday Cake & Candles --- */
  const candles = document.querySelectorAll('.candle');
  const blowBtn = document.getElementById('blowBtn');
  const cakeHint = document.getElementById('cakeHint');
  let blownCount = 0;
  let cakeCompleted = false;

  function blowCandle(candleEl) {
    if (candleEl.classList.contains('blown')) return;
    candleEl.classList.add('blown');
    playExtinguishPuff();
    blownCount++;

    if (blownCount === candles.length) {
      onAllCandlesBlown();
    }
  }

  candles.forEach(candle => {
    candle.addEventListener('click', () => blowCandle(candle));
  });

  blowBtn.addEventListener('click', () => {
    candles.forEach((c, idx) => {
      setTimeout(() => blowCandle(c), idx * 120);
    });
  });

  function onAllCandlesBlown() {
    if (cakeCompleted) return;
    cakeCompleted = true;

    playChimeEffect();
    cakeHint.textContent = "Your wish is cast into the stars, Irene! ✨";
    cakeHint.style.color = "#f6d365";
    blowBtn.style.display = 'none';

    // Grand celebration confetti
    triggerCelebrationConfetti();

    setTimeout(() => {
      goToStep(stepCake, stepLetter);
    }, 2200);
  }

  function triggerCelebrationConfetti() {
    if (!window.confetti) return;

    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio, opts) {
      window.confetti(Object.assign({}, defaults, opts, {
        particleCount: Math.floor(count * particleRatio)
      }));
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#f6d365', '#ffd700', '#ffffff']
    });
    fire(0.2, {
      spread: 60,
      colors: ['#ff8da1', '#ffc0cb', '#f6d365']
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45
    });
  }

  /* --- Step 3: Sky Lanterns & Wishes --- */
  const lanternBtns = document.querySelectorAll('.lantern-btn');
  const skyLanternsContainer = document.getElementById('skyLanternsContainer');
  const lanternCounter = document.getElementById('lanternCounter');
  let totalLanterns = 0;

  lanternBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const wish = btn.getAttribute('data-wish');
      launchSkyLantern(wish);
      playTone(880, 0.4, 'sine');

      totalLanterns++;
      lanternCounter.textContent = `${totalLanterns} lantern${totalLanterns === 1 ? '' : 's'} floating in the sky ✨`;

      // Sparkle on button
      btn.style.transform = 'scale(0.95)';
      setTimeout(() => (btn.style.transform = ''), 200);
    });
  });

  function launchSkyLantern(wishText) {
    const lantern = document.createElement('div');
    lantern.className = 'sky-lantern';

    // Random horizontal position across screen
    const xPos = Math.random() * 75 + 10;
    lantern.style.left = `${xPos}vw`;

    // Slight duration variance
    const duration = Math.random() * 4 + 10;
    lantern.style.animationDuration = `${duration}s`;

    lantern.innerHTML = `
      <div class="lantern-body-glow"></div>
      <div class="lantern-wish-text">${wishText}</div>
    `;

    skyLanternsContainer.appendChild(lantern);

    // Remove from DOM after floating away
    setTimeout(() => {
      lantern.remove();
    }, duration * 1000);
  }

  /* --- Reset / Relive Experience --- */
  const restartBtn = document.getElementById('restartBtn');
  restartBtn.addEventListener('click', () => {
    // Reset candle state
    blownCount = 0;
    cakeCompleted = false;
    candles.forEach(c => c.classList.remove('blown'));
    blowBtn.style.display = 'flex';
    cakeHint.textContent = "Close your eyes, think of something you truly wish for, and tap the candles to blow them out!";
    cakeHint.style.color = "";

    // Reset envelope state
    envelopeOpened = false;
    waxSeal.classList.remove('broken');
    envelope.classList.remove('open');

    // Go back to start
    stepLetter.classList.remove('active');
    stepLetter.style.opacity = '0';
    stepEnvelope.classList.add('active');
    stepEnvelope.style.opacity = '1';
    stepEnvelope.style.transform = 'translateY(0)';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

});
