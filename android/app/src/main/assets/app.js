/**
 * ==============================================================================
 * blockWho · Focus & App Lockdown Engine
 * Exact Material 3 OLED Design System (#131315 Pitch Black, Stark White, Crimson Eject)
 * Pure Zero-Bypass Digital Detox Platform
 * ==============================================================================
 */

(function () {
  'use strict';

  // ==========================================
  // 1. DATA STATE & PERSISTENCE
  // ==========================================
  const STORAGE_KEY = 'blockwho_app_state_v1';

  const DEFAULT_STATE = {
    currentMinutes: 60,
    selectedMode: 'work',
    parachutesCount: 1,
    isLocked: false,
    lockSecondsRemaining: 0,
    lockTotalSeconds: 0,
    activeTab: 'focus',
    hapticsEnabled: true,
    audioEnabled: true,
    
    // The Suitcase Whitelisted Items
    suitcaseApps: [
      { id: 'calc', name: 'Calculator Utility', icon: 'calculate', desc: 'Essential math calculations & conversions', packed: true },
      { id: 'scratchpad', name: 'Quick Scratchpad', icon: 'edit_note', desc: 'Distraction-free quick thoughts & notes', packed: true },
      { id: 'maps', name: 'Google Maps', icon: 'map', desc: 'Transit routes & offline GPS navigation', packed: true },
      { id: 'audio', name: 'Focus Soundscape', icon: 'headphones', desc: '40Hz Gamma binaural beats & cabin noise', packed: true },
      { id: 'phone', name: 'Emergency Calls', icon: 'call', desc: 'Direct phone dialer & family contacts', packed: true },
      { id: 'reader', name: 'Document Reader', icon: 'menu_book', desc: 'Offline PDF references and reading', packed: false },
      { id: 'camera', name: 'Document Scanner', icon: 'photo_camera', desc: 'Quick document capture without social media', packed: false }
    ],

    // The Tower (Habit Skyscraper)
    tower: {
      streakDays: 14,
      floorsCount: 14,
      totalFocusHours: 32.5,
      floors: [
        { floor: 1, mode: 'Quick Reset', duration: 25, date: 'Oct 12, 2026', parachutes: 0 },
        { floor: 2, mode: 'Study Sprint', duration: 45, date: 'Oct 13, 2026', parachutes: 0 },
        { floor: 3, mode: 'Deep Work', duration: 90, date: 'Oct 14, 2026', parachutes: 0 },
        { floor: 4, mode: 'Deep Work', duration: 60, date: 'Oct 15, 2026', parachutes: 0 },
        { floor: 5, mode: 'Night Rest', duration: 180, date: 'Oct 16, 2026', parachutes: 0 },
        { floor: 6, mode: 'Study Sprint', duration: 45, date: 'Oct 17, 2026', parachutes: 0 },
        { floor: 7, mode: 'Deep Work', duration: 90, date: 'Oct 18, 2026', parachutes: 0 },
        { floor: 8, mode: 'Deep Work', duration: 60, date: 'Oct 19, 2026', parachutes: 0 },
        { floor: 9, mode: 'Study Sprint', duration: 45, date: 'Oct 20, 2026', parachutes: 0 },
        { floor: 10, mode: 'Deep Work', duration: 90, date: 'Oct 21, 2026', parachutes: 0 },
        { floor: 11, mode: 'Study Sprint', duration: 45, date: 'Oct 22, 2026', parachutes: 0 },
        { floor: 12, mode: 'Deep Work', duration: 60, date: 'Oct 23, 2026', parachutes: 0 },
        { floor: 13, mode: 'Night Sanctuary', duration: 180, date: 'Oct 24, 2026', parachutes: 0 },
        { floor: 14, mode: 'Deep Work Sprint', duration: 90, date: 'Oct 25, 2026', parachutes: 0 }
      ]
    },

    // Scheduled Routines
    routines: [
      { id: 'r1', name: 'Morning Deep Work', time: '09:00', duration: 90, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], active: true },
      { id: 'r2', name: 'Afternoon Study Sprint', time: '14:30', duration: 45, days: ['Mon', 'Tue', 'Wed', 'Thu'], active: true },
      { id: 'r3', name: 'Night Sleep Sanctuary', time: '23:00', duration: 180, days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], active: true }
    ],

    scratchpadContent: "blockWho Focus Principles:\n1. Zero bypass allowed until timer reaches zero.\n2. Protect dopamine reservoirs.\n3. The Parachute is for true emergencies only.\n"
  };

  let state = loadState();

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return Object.assign({}, DEFAULT_STATE, JSON.parse(saved));
    } catch (e) {
      console.warn('Could not read saved state, resetting to default:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }

  // ==========================================
  // HAPTIC FEEDBACK & NATIVE VIBRATION
  // ==========================================
  function hapticFeedback(ms = 20) {
    if (state.hapticsEnabled === false) return;
    try {
      if (window.AndroidBridge && typeof window.AndroidBridge.vibrate === 'function') {
        window.AndroidBridge.vibrate(ms);
      } else if (navigator.vibrate) {
        navigator.vibrate(ms);
      }
    } catch (e) {}
  }

  // ==========================================
  // 2. SOUNDSCAPE SYNTHESIZER (WEB AUDIO API)
  // ==========================================
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.isPlaying = false;
      this.currentSound = 'binaural';
      this.nodes = [];
      this.volume = 0.5;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    setVolume(val) {
      this.volume = Math.max(0, Math.min(1, val));
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
      }
    }

    startSoundscape(soundType) {
      this.init();
      this.stopSoundscape();
      if (soundType) this.currentSound = soundType;
      this.isPlaying = true;
      const t = this.ctx.currentTime;

      if (this.currentSound === 'binaural') {
        // 40Hz Gamma Focus Binaural Beat (Left 200Hz, Right 240Hz)
        const merger = this.ctx.createChannelMerger(2);

        const oscL = this.ctx.createOscillator();
        oscL.type = 'sine';
        oscL.frequency.setValueAtTime(200, t);
        const gainL = this.ctx.createGain();
        gainL.gain.setValueAtTime(0.25, t);
        oscL.connect(gainL);
        gainL.connect(merger, 0, 0);

        const oscR = this.ctx.createOscillator();
        oscR.type = 'sine';
        oscR.frequency.setValueAtTime(240, t);
        const gainR = this.ctx.createGain();
        gainR.gain.setValueAtTime(0.25, t);
        oscR.connect(gainR);
        gainR.connect(merger, 0, 1);

        merger.connect(this.masterGain);
        oscL.start();
        oscR.start();
        this.nodes.push(oscL, oscR, gainL, gainR, merger);

      } else if (this.currentSound === 'brown') {
        // Deep Cabin Brown Noise
        const bufferSize = 2 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, t);

        source.connect(filter);
        filter.connect(this.masterGain);
        source.start();
        this.nodes.push(source, filter);

      } else if (this.currentSound === 'rain') {
        // Gentle Rain Noise
        const bufferSize = 2 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100, t);
        filter.Q.setValueAtTime(1.2, t);

        const subFilter = this.ctx.createBiquadFilter();
        subFilter.type = 'lowpass';
        subFilter.frequency.setValueAtTime(4500, t);

        source.connect(filter);
        filter.connect(subFilter);
        subFilter.connect(this.masterGain);
        source.start();
        this.nodes.push(source, filter, subFilter);

      } else {
        // Pure White Noise
        const bufferSize = 2 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.35;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(7500, t);

        source.connect(filter);
        filter.connect(this.masterGain);
        source.start();
        this.nodes.push(source, filter);
      }
    }

    stopSoundscape() {
      this.nodes.forEach(node => {
        try {
          if (node.stop) node.stop();
          if (node.disconnect) node.disconnect();
        } catch (e) {}
      });
      this.nodes = [];
      this.isPlaying = false;
    }

    playChime(type = 'success') {
      if (state.audioEnabled === false) return;
      try {
        this.init();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        if (type === 'success') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, t); // D5
          osc.frequency.exponentialRampToValueAtTime(880.00, t + 0.15); // A5
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(t + 0.5);
        } else if (type === 'lock') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, t);
          osc.frequency.exponentialRampToValueAtTime(110, t + 0.4);
          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(t + 0.4);
        } else if (type === 'alert') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(320, t);
          osc.frequency.setValueAtTime(220, t + 0.15);
          gain.gain.setValueAtTime(0.35, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(t + 0.4);
        } else if (type === 'click') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, t);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(t + 0.05);
        }
      } catch (e) {
        console.warn('Audio chime suppressed:', e);
      }
    }

    playDTMF(digit) {
      if (state.audioEnabled === false) return;
      try {
        this.init();
        const dtmfMap = {
          '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
          '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
          '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
          '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
        };
        const freqs = dtmfMap[digit] || [440, 440];
        const t = this.ctx.currentTime;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.frequency.setValueAtTime(freqs[0], t);
        osc2.frequency.setValueAtTime(freqs[1], t);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(t + 0.12);
        osc2.stop(t + 0.12);
      } catch (e) {}
    }
  }

  const sound = new SoundEngine();

  // Unlock AudioContext on first user interaction
  window.addEventListener('click', () => sound.init(), { once: true });
  window.addEventListener('touchstart', () => sound.init(), { once: true });

  // ==========================================
  // 3. SCREEN 1: FOCUS ROTARY DIAL
  // ==========================================
  const dialSvg = document.getElementById('timer-dial');
  const progressArc = document.getElementById('progress-arc');
  const dialKnob = document.getElementById('dial-knob');
  const dialKnobCore = document.getElementById('dial-knob-core');
  const durationDisplay = document.getElementById('display-duration');
  const endTimeDisplay = document.getElementById('display-end-time');

  const CIRCLE_RADIUS = 112;
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS; // 703.716
  const MAX_MINUTES = 180; // 3 Hours max on standard dial cycle

  function generateDialTicks() {
    const ticksGroup = document.getElementById('dial-ticks');
    if (!ticksGroup) return;
    ticksGroup.innerHTML = '';

    const TOTAL_TICKS = 48;
    for (let i = 0; i < TOTAL_TICKS; i++) {
      const angleDeg = (i / TOTAL_TICKS) * 360;
      const angleRad = (angleDeg * Math.PI) / 180;
      const isMajor = i % 4 === 0;

      const rInner = isMajor ? 122 : 124;
      const rOuter = 127;

      const x1 = 140 + rInner * Math.cos(angleRad);
      const y1 = 140 + rInner * Math.sin(angleRad);
      const x2 = 140 + rOuter * Math.cos(angleRad);
      const y2 = 140 + rOuter * Math.sin(angleRad);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1.toFixed(2));
      line.setAttribute('y1', y1.toFixed(2));
      line.setAttribute('x2', x2.toFixed(2));
      line.setAttribute('y2', y2.toFixed(2));
      line.setAttribute('stroke', isMajor ? '#ffffff' : '#6b7280');
      line.setAttribute('stroke-width', isMajor ? '1.5' : '0.8');
      line.setAttribute('opacity', isMajor ? '0.7' : '0.35');
      ticksGroup.appendChild(line);
    }
  }

  function updateTimerInterface() {
    const mins = state.currentMinutes;
    const fraction = Math.min(1, Math.max(0, mins / MAX_MINUTES));

    // Update Arc Stroke Offset
    const offset = CIRCLE_CIRCUMFERENCE * (1 - fraction);
    if (progressArc) {
      progressArc.style.strokeDasharray = CIRCLE_CIRCUMFERENCE.toFixed(1);
      progressArc.style.strokeDashoffset = offset.toFixed(1);
    }

    // Update Knob Indicator Coordinates (Dial SVG is rotated -90deg, 0 rad is at Top)
    const angleRad = fraction * 2 * Math.PI;
    const knobX = 140 + CIRCLE_RADIUS * Math.cos(angleRad);
    const knobY = 140 + CIRCLE_RADIUS * Math.sin(angleRad);

    if (dialKnob) {
      dialKnob.setAttribute('cx', knobX.toFixed(2));
      dialKnob.setAttribute('cy', knobY.toFixed(2));
    }
    if (dialKnobCore) {
      dialKnobCore.setAttribute('cx', knobX.toFixed(2));
      dialKnobCore.setAttribute('cy', knobY.toFixed(2));
    }

    // Formatted Text Displays
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    const formatted = `${String(hours).padStart(2, '0')}:${String(remainingMins).padStart(2, '0')}`;
    if (durationDisplay) durationDisplay.innerText = formatted;

    // Calculate End Time
    const targetDate = new Date(Date.now() + mins * 60 * 1000);
    const timeStr = targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (endTimeDisplay) endTimeDisplay.innerText = `UNTIL ${timeStr}`;

    // Update Suitcase Fraction in Card
    const packedCount = state.suitcaseApps.filter(a => a.packed).length;
    const totalApps = state.suitcaseApps.length;
    const fractionEl = document.getElementById('focus-suitcase-fraction');
    if (fractionEl) fractionEl.innerText = `${packedCount}/${totalApps}`;

    // Update Preset Pills Highlight
    document.querySelectorAll('.preset-pill').forEach(btn => {
      const pMins = parseInt(btn.getAttribute('data-mins'), 10);
      if (pMins === mins) {
        btn.classList.add('bg-primary', 'text-on-primary', 'font-semibold');
        btn.classList.remove('bg-surface-container-low', 'text-on-surface-variant');
      } else {
        btn.classList.remove('bg-primary', 'text-on-primary', 'font-semibold');
        btn.classList.add('bg-surface-container-low', 'text-on-surface-variant');
      }
    });
  }

  function setTime(mins) {
    state.currentMinutes = Math.min(720, Math.max(5, mins));
    saveState();
    updateTimerInterface();
    sound.playChime('click');
    hapticFeedback(15);
  }

  function adjustTime(deltaMins) {
    setTime(state.currentMinutes + deltaMins);
  }

  // Dial Drag / Pointer Interaction
  let isDraggingDial = false;

  function handleDialPointer(e) {
    if (!dialSvg) return;
    const rect = dialSvg.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // Angle in degrees clockwise from 12 o'clock
    let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angleDeg < 0) angleDeg += 360;

    let computedMins = Math.round((angleDeg / 360) * MAX_MINUTES);
    // Snap to 5-minute increments
    computedMins = Math.round(computedMins / 5) * 5;
    if (computedMins === 0) computedMins = 5;

    if (computedMins !== state.currentMinutes) {
      state.currentMinutes = computedMins;
      saveState();
      updateTimerInterface();
      hapticFeedback(10);
    }
  }

  if (dialSvg) {
    dialSvg.addEventListener('mousedown', (e) => {
      isDraggingDial = true;
      handleDialPointer(e);
    });
    window.addEventListener('mousemove', (e) => {
      if (isDraggingDial) handleDialPointer(e);
    });
    window.addEventListener('mouseup', () => {
      isDraggingDial = false;
    });

    dialSvg.addEventListener('touchstart', (e) => {
      isDraggingDial = true;
      handleDialPointer(e);
    }, { passive: false });
    window.addEventListener('touchmove', (e) => {
      if (isDraggingDial) handleDialPointer(e);
    }, { passive: false });
    window.addEventListener('touchend', () => {
      isDraggingDial = false;
    });
  }

  // Steppers
  const btnMinus = document.getElementById('btn-dial-minus');
  const btnPlus = document.getElementById('btn-dial-plus');
  if (btnMinus) btnMinus.addEventListener('click', () => adjustTime(-15));
  if (btnPlus) btnPlus.addEventListener('click', () => adjustTime(15));

  // Presets
  document.querySelectorAll('.preset-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const mins = parseInt(btn.getAttribute('data-mins'), 10);
      setTime(mins);
    });
  });

  // Mode Switcher
  function switchMode(mode) {
    state.selectedMode = mode;
    saveState();

    const modes = ['study', 'work', 'sleep'];
    modes.forEach(m => {
      const btn = document.getElementById(`mode-${m}`);
      if (!btn) return;
      if (m === mode) {
        btn.classList.add('bg-surface-container-highest', 'text-primary');
        btn.classList.remove('text-outline');
      } else {
        btn.classList.remove('bg-surface-container-highest', 'text-primary');
        btn.classList.add('text-outline');
      }
    });

    const quoteEl = document.getElementById('mode-quote');
    const badgeEl = document.getElementById('session-badge');

    if (mode === 'study') {
      setTime(45);
      if (quoteEl) quoteEl.innerText = 'Deep academic focus';
      if (badgeEl) badgeEl.innerText = 'STRICT 0.9';
    } else if (mode === 'work') {
      setTime(60);
      if (quoteEl) quoteEl.innerText = 'Cognitive flow state';
      if (badgeEl) badgeEl.innerText = 'FLOW ACTIVE';
    } else if (mode === 'sleep') {
      setTime(180);
      if (quoteEl) quoteEl.innerText = 'Night sanctuary · Zero bypass';
      if (badgeEl) badgeEl.innerText = 'SANCTUARY';
    }

    sound.playChime('click');
    hapticFeedback(20);
  }

  ['study', 'work', 'sleep'].forEach(m => {
    const btn = document.getElementById(`mode-${m}`);
    if (btn) btn.addEventListener('click', () => switchMode(m));
  });

  // Pack Suitcase trigger
  const btnPackTrigger = document.getElementById('btn-pack-suitcase-trigger');
  if (btnPackTrigger) {
    btnPackTrigger.addEventListener('click', () => {
      navigateToTab('suitcase');
      sound.playChime('click');
      hapticFeedback(15);
    });
  }

  // ==========================================
  // 4. SCREEN 2: ACTIVE LOCKOUT CONTROLLER
  // ==========================================
  let countdownInterval = null;

  function triggerLockdown() {
    const btn = document.getElementById('lockdown-btn');
    if (!btn) return;
    try { sound.playChime('lock'); } catch (e) {}
    try { hapticFeedback(50); } catch (e) {}

    // Initial state transition
    state.isLocked = true;
    state.lockTotalSeconds = Math.max(60, (state.currentMinutes || 45) * 60);
    state.lockSecondsRemaining = state.lockTotalSeconds;
    saveState();

    // === NATIVE BLOCKING LAYER (BlockIt-style) ===
    // Activate the Android AccessibilityService blocking layer.
    // Build the allowed packages list from suitcase apps that have real package names.
    if (window.AndroidBridge && typeof window.AndroidBridge.startBlockingSession === 'function') {
      try {
        const allowedPkgs = state.suitcaseApps
          .filter(a => a.packed && a.pkg)
          .map(a => a.pkg);
        window.AndroidBridge.startBlockingSession(
          state.lockTotalSeconds,
          JSON.stringify(allowedPkgs),
          state.parachutesCount
        );
      } catch (e) {
        console.warn('Failed to start native blocking session:', e);
      }
    }

    try {
      enterLockoutScreen();
    } catch (e) {
      console.error('Error entering lockout screen:', e);
    }
    try {
      startCountdownTimer();
    } catch (e) {
      console.error('Error starting countdown timer:', e);
    }
  }

  const lockdownBtn = document.getElementById('lockdown-btn');
  if (lockdownBtn) {
    lockdownBtn.addEventListener('click', triggerLockdown);
  }

  function enterLockoutScreen() {
    document.querySelectorAll('.screen-view').forEach(s => s.classList.add('hidden'));
    const lockoutView = document.getElementById('view-lockout');
    if (lockoutView) lockoutView.classList.remove('hidden');

    const nav = document.getElementById('app-bottom-nav');
    if (nav) nav.classList.add('hidden');

    const headerTitle = document.getElementById('header-title');
    const headerStatusDot = document.getElementById('header-status-dot');
    const headerStatusText = document.getElementById('header-status-text');

    if (headerTitle) headerTitle.innerText = 'LOCKED';
    if (headerStatusDot) {
      headerStatusDot.className = 'w-1.5 h-1.5 rounded-full bg-error animate-ping';
    }
    if (headerStatusText) {
      headerStatusText.className = 'font-label-sm text-label-sm uppercase text-error font-bold';
      headerStatusText.innerText = 'ARMED';
    }

    const modeIndicator = document.getElementById('lock-mode-indicator');
    if (modeIndicator) {
      modeIndicator.innerText = `SESSION · ${state.selectedMode.toUpperCase()} SPRINT`;
    }

    renderLockSuitcaseDock();
    updateLockoutDisplay();
  }

  function exitLockoutToFocus() {
    state.isLocked = false;
    state.lockSecondsRemaining = 0;
    saveState();

    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }

    // === NATIVE BLOCKING LAYER — stop enforcement ===
    if (window.AndroidBridge && typeof window.AndroidBridge.stopBlockingSession === 'function') {
      try { window.AndroidBridge.stopBlockingSession(); } catch (e) {}
    }

    const nav = document.getElementById('app-bottom-nav');
    if (nav) nav.classList.remove('hidden');

    const headerTitle = document.getElementById('header-title');
    const headerStatusDot = document.getElementById('header-status-dot');
    const headerStatusText = document.getElementById('header-status-text');

    if (headerTitle) headerTitle.innerText = 'blockWho';
    if (headerStatusDot) {
      headerStatusDot.className = 'w-1.5 h-1.5 rounded-full bg-primary animate-pulse';
    }
    if (headerStatusText) {
      headerStatusText.className = 'font-label-sm text-label-sm uppercase text-on-surface-variant';
      headerStatusText.innerText = 'READY';
    }

    navigateToTab('focus');
  }

  function startCountdownTimer() {
    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
      if (state.lockSecondsRemaining <= 1) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        completeLockoutSession();
      } else {
        state.lockSecondsRemaining--;
        saveState();
        updateLockoutDisplay();
      }
    }, 1000);
  }

  function updateLockoutDisplay() {
    const totalSecs = state.lockSecondsRemaining;
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const timerStr = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const mainTimer = document.getElementById('mainTimer');
    const pillCountdown = document.getElementById('pill-countdown');

    if (mainTimer) mainTimer.innerText = timerStr;
    if (pillCountdown) pillCountdown.innerText = `${mins}m ${secs}s Left`;

    const targetDate = new Date(Date.now() + totalSecs * 1000);
    const timeStr = targetDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const lockRemark = document.getElementById('lock-ends-remark');
    if (lockRemark) lockRemark.innerText = `Ends strictly at ${timeStr} · Stay disciplined`;
  }

  function completeLockoutSession() {
    sound.playChime('success');
    hapticFeedback(60);

    // Build new tower floor
    const newFloorNum = state.tower.floors.length + 1;
    const sessionHours = state.lockTotalSeconds / 3600;

    state.tower.floorsCount = newFloorNum;
    state.tower.streakDays += 1;
    state.tower.totalFocusHours = Math.round((state.tower.totalFocusHours + sessionHours) * 10) / 10;

    const todayStr = new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    state.tower.floors.push({
      floor: newFloorNum,
      mode: state.selectedMode === 'study' ? 'Study Sprint' : state.selectedMode === 'sleep' ? 'Sleep Sanctuary' : 'Deep Work',
      duration: Math.round(state.lockTotalSeconds / 60),
      date: todayStr,
      parachutes: 0
    });

    saveState();
    renderTowerTab();
    exitLockoutToFocus();
    alert('Session complete! Tower floor added.');
  }

  // ==========================================
  // 5. EXTEND LOCKOUT (+15M HOLD MECHANIC)
  // ==========================================
  const addTimeBtn = document.getElementById('addTimeBtn');
  const addTimeProgress = document.getElementById('addTimeProgress');
  const addTimeLabel = document.getElementById('addTimeLabel');
  let extendTimer = null;

  function startExtend(e) {
    e.preventDefault();
    if (!state.isLocked) return;
    if (addTimeProgress) {
      addTimeProgress.style.transition = 'width 3000ms linear';
      addTimeProgress.style.width = '100%';
    }

    extendTimer = setTimeout(() => {
      state.lockSecondsRemaining += 15 * 60;
      state.lockTotalSeconds += 15 * 60;
      saveState();

      if (addTimeProgress) {
        addTimeProgress.style.transition = 'none';
        addTimeProgress.style.width = '0%';
      }
      sound.playChime('success');
      hapticFeedback(40);
      if (addTimeLabel) {
        const originalText = addTimeLabel.innerText;
        addTimeLabel.innerText = "+15M EXTENDED!";
        setTimeout(() => { addTimeLabel.innerText = originalText; }, 1800);
      }
    }, 3000);
  }

  function cancelExtend() {
    if (extendTimer) {
      clearTimeout(extendTimer);
      extendTimer = null;
      if (addTimeProgress) {
        addTimeProgress.style.transition = 'width 150ms ease-out';
        addTimeProgress.style.width = '0%';
      }
    }
  }

  if (addTimeBtn) {
    addTimeBtn.addEventListener('mousedown', startExtend);
    addTimeBtn.addEventListener('touchstart', startExtend, { passive: false });
    window.addEventListener('mouseup', cancelExtend);
    window.addEventListener('touchend', cancelExtend);
  }

  // ==========================================
  // 6. EMERGENCY PARACHUTE EJECT (HOLD 3S)
  // ==========================================
  const chuteBtn = document.getElementById('parachuteBtn');
  const chuteProgress = document.getElementById('parachuteProgress');
  const chuteLabel = document.getElementById('parachuteLabel');
  const chuteIcon = document.getElementById('parachuteIcon');
  const streakWarning = document.getElementById('streakWarning');
  let chuteTimer = null;

  function startChuteHold(e) {
    e.preventDefault();
    if (!state.isLocked) return;

    // === ZERO PARACHUTES = NO EXIT (BlockIt strict mode) ===
    if (state.parachutesCount <= 0) {
      hapticFeedback(30);
      if (chuteLabel) {
        const orig = chuteLabel.innerText;
        chuteLabel.innerText = '⚠ No Parachutes Left';
        setTimeout(() => { chuteLabel.innerText = orig; }, 1800);
      }
      sound.playChime('alert');
      return;
    }

    if (chuteProgress) {
      chuteProgress.style.transition = 'width 3000ms linear';
      chuteProgress.style.width = '100%';
    }

    setTimeout(() => {
      if (chuteTimer && chuteLabel && chuteIcon) {
        chuteLabel.classList.remove('text-primary');
        chuteLabel.classList.add('text-on-primary');
        chuteIcon.classList.remove('text-primary');
        chuteIcon.classList.add('text-on-primary');
      }
    }, 1200);

    chuteTimer = setTimeout(() => {
      // Completed full 3-second hold!
      sound.playChime('alert');
      hapticFeedback(80);
      if (chuteLabel) chuteLabel.innerText = "PARACHUTE DEPLOYED";
      if (streakWarning) {
        streakWarning.innerText = "Session unlocked via parachute";
        streakWarning.classList.add('text-error');
      }
      
      // Decrement parachute
      if (state.parachutesCount > 0) {
        state.parachutesCount--;
      }
      saveState();
      updateParachuteCounters();

      setTimeout(() => {
        exitLockoutToFocus();
        cancelChuteHold();
      }, 1000);
    }, 3000);
  }

  function cancelChuteHold() {
    if (chuteTimer) {
      clearTimeout(chuteTimer);
      chuteTimer = null;
      if (chuteProgress) {
        chuteProgress.style.transition = 'width 200ms ease-out';
        chuteProgress.style.width = '0%';
      }
      if (chuteLabel) {
        chuteLabel.innerText = "Hold 3s to Emergency Eject";
        chuteLabel.classList.remove('text-on-primary');
        chuteLabel.classList.add('text-primary');
      }
      if (chuteIcon) {
        chuteIcon.classList.remove('text-on-primary');
        chuteIcon.classList.add('text-primary');
      }
    }
  }

  if (chuteBtn) {
    chuteBtn.addEventListener('mousedown', startChuteHold);
    chuteBtn.addEventListener('touchstart', startChuteHold, { passive: false });
    window.addEventListener('mouseup', cancelChuteHold);
    window.addEventListener('touchend', cancelChuteHold);
  }

  function updateParachuteCounters() {
    const topCount = document.getElementById('top-parachute-count');
    const cardLeft = document.getElementById('card-parachute-left');
    const lockBadge = document.getElementById('lock-eject-badge');

    if (topCount) topCount.innerText = state.parachutesCount;
    if (cardLeft) cardLeft.innerText = `${state.parachutesCount} left`;
    if (lockBadge) lockBadge.innerText = `${state.parachutesCount} Left This Cycle`;
  }

  // ==========================================
  // 7. DRAGGABLE FLOATING HUD PILL
  // ==========================================
  const floatingPill = document.getElementById('floatingPill');
  const snapClasses = ['-translate-x-20', 'translate-x-0', 'translate-x-20'];
  let currentSnapIdx = 1;

  if (floatingPill) {
    floatingPill.addEventListener('click', () => {
      floatingPill.classList.remove(...snapClasses);
      currentSnapIdx = (currentSnapIdx + 1) % snapClasses.length;
      floatingPill.classList.add(snapClasses[currentSnapIdx]);
      sound.playChime('click');
      hapticFeedback(15);
    });
  }

  // ==========================================
  // 8. SUITCASE MANAGEMENT & MINI-APPS
  // ==========================================
  // Load real installed apps from the device (Android only)
  function loadInstalledAppsIntoSuitcase() {
    if (!window.AndroidBridge || typeof window.AndroidBridge.getInstalledApps !== 'function') return;
    if (state._appsLoaded) return; // already fetched
    try {
      const raw = window.AndroidBridge.getInstalledApps();
      const apps = JSON.parse(raw);
      if (!Array.isArray(apps) || apps.length === 0) return;

      // Keep our built-in mini-app tools at top, then append real installed apps
      const existingIds = new Set(state.suitcaseApps.map(a => a.id));
      apps.forEach(app => {
        if (!existingIds.has(app.pkg)) {
          state.suitcaseApps.push({
            id: app.pkg,
            pkg: app.pkg,
            name: app.name,
            icon: 'apps',
            desc: app.pkg,
            packed: false
          });
          existingIds.add(app.pkg);
        }
      });

      // Tag our built-in mini-apps with a null pkg so they are always whitelisted
      state.suitcaseApps.forEach(a => {
        if (!a.pkg) a.pkg = null;
      });

      state._appsLoaded = true;
      saveState();
      renderSuitcaseTab();
    } catch (e) {
      console.warn('getInstalledApps failed:', e);
    }
  }

  function renderSuitcaseTab() {
    const container = document.getElementById('suitcase-apps-list');
    if (!container) return;
    container.innerHTML = '';

    const packedCount = state.suitcaseApps.filter(a => a.packed).length;
    const counterEl = document.getElementById('suitcase-active-counter');
    if (counterEl) counterEl.innerText = packedCount;

    state.suitcaseApps.forEach(app => {
      const card = document.createElement('div');
      card.className = 'p-3.5 rounded-lg bg-surface-container-low flex items-center justify-between border border-white/5';

      // Show package name for real device apps, or a mini-app label for built-ins
      const subtitle = app.pkg && !['calc','scratchpad','maps','audio','phone','reader','camera'].includes(app.id)
        ? `<span class="font-mono text-[9px] text-outline/60 truncate max-w-[160px]">${app.pkg}</span>`
        : `<span class="font-body-sm text-xs text-outline">${app.desc || ''}</span>`;

      const iconHtml = (app.pkg && !['calc','scratchpad','maps','audio','phone','reader','camera'].includes(app.id))
        ? `<span class="material-symbols-outlined text-[20px]">android</span>`
        : `<span class="material-symbols-outlined text-[20px]">${app.icon || 'apps'}</span>`;

      card.innerHTML = `
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <div class="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary flex-shrink-0">
            ${iconHtml}
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-label-md text-primary font-bold truncate">${app.name}</div>
            ${subtitle}
          </div>
        </div>
        <label class="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-2">
          <input type="checkbox" data-id="${app.id}" ${app.packed ? 'checked' : ''} class="sr-only peer">
          <div class="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      `;

      const input = card.querySelector('input');
      input.addEventListener('change', (e) => {
        app.packed = e.target.checked;
        saveState();
        renderSuitcaseTab();
        updateTimerInterface();
        renderLockSuitcaseDock();
        sound.playChime('click');
        hapticFeedback(15);
      });

      container.appendChild(card);
    });
  }

  function renderLockSuitcaseDock() {
    const dockContainer = document.getElementById('dock-allowed-apps');
    if (!dockContainer) return;
    dockContainer.innerHTML = '';

    const packed = state.suitcaseApps.filter(a => a.packed);
    const badge = document.getElementById('lock-suitcase-allowed-badge');
    if (badge) badge.innerText = `${packed.length} Allowed`;

    packed.forEach(app => {
      const btn = document.createElement('button');
      btn.className = 'flex flex-col items-center justify-center p-3 rounded-DEFAULT bg-surface-container-high hover:bg-surface-variant active:scale-95 transition-all cursor-pointer';
      const displayName = ((app.name || app.pkg || 'App') + '').split(' ')[0];
      btn.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center mb-2">
          <span class="material-symbols-outlined text-[20px] text-primary">${app.icon || 'apps'}</span>
        </div>
        <span class="font-label-sm text-label-sm text-primary font-medium tracking-wide truncate max-w-[80px]">${displayName}</span>
        <div class="flex items-center gap-0.5 mt-1">
          <span class="font-label-sm text-[9px] text-outline">LAUNCH</span>
          <span class="material-symbols-outlined text-[10px] text-outline">arrow_outward</span>
        </div>
      `;
      btn.addEventListener('click', () => openMiniApp(app.id));
      dockContainer.appendChild(btn);
    });
  }

  // Mini-App Modal Controller
  window.openMiniApp = function(appId) {
    // If it's a real Android package name, try launching via native bridge
    if (window.AndroidBridge && typeof window.AndroidBridge.launchApp === 'function') {
      const foundApp = state.suitcaseApps.find(a => a.id === appId || a.pkg === appId);
      if (foundApp && foundApp.pkg && !['calc', 'scratchpad', 'maps', 'audio', 'phone', 'reader', 'camera'].includes(foundApp.id)) {
        try {
          const launched = window.AndroidBridge.launchApp(foundApp.pkg);
          if (launched) return;
        } catch (e) {
          console.warn('Native launch failed:', e);
        }
      }
    }

    const modal = document.getElementById('modal-mini-app');
    const titleEl = document.getElementById('mini-app-title');
    const iconEl = document.getElementById('mini-app-icon');
    const contentEl = document.getElementById('mini-app-content');
    if (!modal || !contentEl) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    sound.playChime('click');
    hapticFeedback(20);

    if (appId === 'calc') {
      // Functional Calculator
      if (titleEl) titleEl.innerText = 'Calculator';
      if (iconEl) iconEl.innerText = 'calculate';
      contentEl.innerHTML = `
        <div class="flex-1 flex flex-col space-y-3">
          <!-- Calculator Screen Display -->
          <div class="w-full rounded-xl bg-surface-container-lowest border border-white/10 p-3 flex flex-col justify-end text-right">
            <div class="font-mono text-xs text-outline tracking-wider h-5 overflow-hidden" id="calc-history"></div>
            <div class="font-mono text-2xl font-bold text-white tracking-tight h-8 overflow-hidden select-all" id="calc-display">0</div>
          </div>
          <!-- Calculator Keypad (4x5 Grid) -->
          <div class="grid grid-cols-4 gap-1.5">
            <button class="calc-key h-11 rounded-lg bg-surface-container-high hover:bg-surface-variant active:scale-95 text-sm font-mono font-bold text-error transition-all" data-action="clear">C</button>
            <button class="calc-key h-11 rounded-lg bg-surface-container-high hover:bg-surface-variant active:scale-95 text-sm font-mono font-bold text-white transition-all" data-action="negate">±</button>
            <button class="calc-key h-11 rounded-lg bg-surface-container-high hover:bg-surface-variant active:scale-95 text-sm font-mono font-bold text-white transition-all" data-action="percent">%</button>
            <button class="calc-key h-11 rounded-lg bg-surface-container-highest hover:bg-white hover:text-black active:scale-95 text-base font-mono font-bold text-primary transition-all" data-action="op" data-val="/">÷</button>

            <button class="calc-key h-11 rounded-lg bg-surface-container hover:bg-surface-variant active:scale-95 text-base font-mono font-bold text-white transition-all" data-action="num" data-val="7">7</button>
            <button class="calc-key h-11 rounded-lg bg-surface-container hover:bg-surface-variant active:scale-95 text-base font-mono font-bold text-white transition-all" data-action="num" data-val="8">8</button>
            <button class="calc-key h-11 rounded-lg bg-surface-container hover:bg-surface-variant active:scale-95 text-base font-mono font-bold text-white transition-all" data-action="num" data-val="9">9</button>
            <button class="calc-key h-11 rounded-lg bg-surface-container-highest hover:bg-white hover:text-black active:scale-95 text-base font-mono font-bold text-primary transition-all" data-action="op" data-val="*">×</button>

            <button class="calc-key h-11 rounded-lg bg-surface-container hover:bg-surface-variant active:scale-95 text-base font-mono font-bold text-white transition-all" data-action="num" data-val="4">4</button>
            <button class="calc-key h-11 rounded-lg bg-surface-container hover:bg-surface-variant active:scale-95 text-base font-mono font-bold text-white transition-all" data-action="num" data-val="5">5</button>
            <button class="calc-key h-11 rounded-lg bg-surface-container hover:bg-surface-variant active:scale-95 text-base font-mono font-bold text-white transition-all" data-action="num" data-val="6">6</button>
            <button class="calc-key h-11 rounded-lg bg-surface-container-highest hover:bg-white hover:text-black active:scale-95 text-base font-mono font-bold text-primary transition-all" data-action="op" data-val="-">-</button>

            <button class="calc-key h-11 rounded-lg bg-surface-container hover:bg-surface-variant active:scale-95 text-base font-mono font-bold text-white transition-all" data-action="num" data-val="1">1</button>
            <button class="calc-key h-11 rounded-lg bg-surface-container hover:bg-surface-variant active:scale-95 text-base font-mono font-bold text-white transition-all" data-action="num" data-val="2">2</button>
            <button class="calc-key h-11 rounded-lg bg-surface-container hover:bg-surface-variant active:scale-95 text-base font-mono font-bold text-white transition-all" data-action="num" data-val="3">3</button>
            <button class="calc-key h-11 rounded-lg bg-surface-container-highest hover:bg-white hover:text-black active:scale-95 text-base font-mono font-bold text-primary transition-all" data-action="op" data-val="+">+</button>

            <button class="calc-key h-11 rounded-lg bg-surface-container hover:bg-surface-variant active:scale-95 text-base font-mono font-bold text-white col-span-2 transition-all" data-action="num" data-val="0">0</button>
            <button class="calc-key h-11 rounded-lg bg-surface-container hover:bg-surface-variant active:scale-95 text-base font-mono font-bold text-white transition-all" data-action="dot">.</button>
            <button class="calc-key h-11 rounded-lg bg-primary text-black font-bold hover:bg-white active:scale-95 text-base font-mono transition-all" data-action="equals">=</button>
          </div>
        </div>
      `;

      let currentInput = '0';
      let previousInput = '';
      let currentOp = null;
      let shouldResetDisplay = false;

      function updateCalcUI() {
        const display = document.getElementById('calc-display');
        const history = document.getElementById('calc-history');
        if (display) display.innerText = currentInput;
        if (history) {
          history.innerText = previousInput + (currentOp ? ' ' + currentOp : '');
        }
      }

      function compute() {
        const prev = parseFloat(previousInput);
        const curr = parseFloat(currentInput);
        if (isNaN(prev) || isNaN(curr)) return;
        let res = 0;
        if (currentOp === '+') res = prev + curr;
        else if (currentOp === '-') res = prev - curr;
        else if (currentOp === '*') res = prev * curr;
        else if (currentOp === '/') res = curr === 0 ? 'Error' : prev / curr;
        currentInput = typeof res === 'number' ? String(Math.round(res * 100000000) / 100000000) : res;
      }

      document.querySelectorAll('.calc-key').forEach(btn => {
        btn.addEventListener('click', () => {
          sound.playChime('click');
          hapticFeedback(15);
          const action = btn.getAttribute('data-action');
          const val = btn.getAttribute('data-val');

          if (action === 'num') {
            if (currentInput === '0' || shouldResetDisplay) {
              currentInput = val;
              shouldResetDisplay = false;
            } else {
              if (currentInput.length < 12) currentInput += val;
            }
          } else if (action === 'dot') {
            if (shouldResetDisplay) {
              currentInput = '0.';
              shouldResetDisplay = false;
            } else if (!currentInput.includes('.')) {
              currentInput += '.';
            }
          } else if (action === 'clear') {
            currentInput = '0';
            previousInput = '';
            currentOp = null;
            shouldResetDisplay = false;
          } else if (action === 'negate') {
            if (currentInput !== '0') {
              currentInput = currentInput.startsWith('-') ? currentInput.slice(1) : '-' + currentInput;
            }
          } else if (action === 'percent') {
            const num = parseFloat(currentInput);
            if (!isNaN(num)) currentInput = String(num / 100);
          } else if (action === 'op') {
            if (currentOp && !shouldResetDisplay) {
              compute();
            }
            previousInput = currentInput;
            currentOp = val;
            shouldResetDisplay = true;
          } else if (action === 'equals') {
            if (currentOp && previousInput) {
              compute();
              currentOp = null;
              previousInput = '';
              shouldResetDisplay = true;
            }
          }
          updateCalcUI();
        });
      });

    } else if (appId === 'maps') {
      if (titleEl) titleEl.innerText = 'Google Maps & Transit';
      if (iconEl) iconEl.innerText = 'navigation';
      contentEl.innerHTML = `
        <div class="flex-1 flex flex-col space-y-3">
          <div class="relative w-full h-40 rounded-xl bg-surface-container-lowest overflow-hidden border border-white/10 flex items-center justify-center">
            <svg class="w-full h-full opacity-40" viewBox="0 0 300 160">
              <path d="M10,80 Q90,20 150,70 T290,90" fill="none" stroke="#555" stroke-width="6" />
              <path d="M40,150 L120,10 L220,150" fill="none" stroke="#444" stroke-width="4" />
              <path d="M10,80 Q90,20 150,70 T290,90" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="6 4" />
              <circle cx="150" cy="70" r="7" fill="#ffffff" />
              <circle cx="150" cy="70" r="16" fill="none" stroke="#ffffff" stroke-width="1.5" class="animate-ping" />
            </svg>
            <div class="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-surface-container/90 text-[10px] font-label-sm text-primary flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              GPS ACTIVE · TRANSIT ROUTE
            </div>
          </div>
          <div class="p-3 rounded-lg bg-surface-container text-xs space-y-1">
            <div class="font-bold text-white flex items-center justify-between">
              <span>Main Library ➔ Tech Innovation Hall</span>
              <span class="text-primary font-mono">12 min walk</span>
            </div>
            <p class="text-outline text-[11px]">Walk 400m North along West Campus Arcade, proceed to Hall 4.</p>
          </div>
        </div>
      `;
    } else if (appId === 'audio') {
      if (titleEl) titleEl.innerText = 'Focus Soundscape Synthesizer';
      if (iconEl) iconEl.innerText = 'headphones';
      contentEl.innerHTML = `
        <div class="flex-1 flex flex-col space-y-4">
          <div class="grid grid-cols-2 gap-2" id="soundscape-types">
            <button class="sound-chip p-2.5 rounded-lg bg-white text-black font-label-sm text-xs font-semibold text-center transition-all cursor-pointer" data-type="binaural">
              40Hz Gamma Beat
            </button>
            <button class="sound-chip p-2.5 rounded-lg bg-surface-container text-outline hover:text-white font-label-sm text-xs font-semibold text-center transition-all cursor-pointer" data-type="brown">
              Cabin Brown Noise
            </button>
            <button class="sound-chip p-2.5 rounded-lg bg-surface-container text-outline hover:text-white font-label-sm text-xs font-semibold text-center transition-all cursor-pointer" data-type="rain">
              Gentle Rain
            </button>
            <button class="sound-chip p-2.5 rounded-lg bg-surface-container text-outline hover:text-white font-label-sm text-xs font-semibold text-center transition-all cursor-pointer" data-type="white">
              Pure White Noise
            </button>
          </div>
          <div>
            <div class="flex justify-between text-xs text-outline font-label-sm mb-1">
              <span>MASTER VOLUME</span>
              <span id="vol-display">50%</span>
            </div>
            <input type="range" min="0" max="100" value="50" id="sound-vol-slider" class="w-full accent-white h-1.5 bg-surface-container-highest rounded-lg cursor-pointer">
          </div>
          <button id="btn-toggle-soundscape" class="w-full py-3 rounded-full bg-primary text-on-primary font-label-md text-xs font-bold uppercase tracking-wider hover:bg-primary-container transition-all flex items-center justify-center gap-2 cursor-pointer">
            <span class="material-symbols-outlined text-[18px]">play_arrow</span>
            <span id="soundscape-btn-label">Start Soundscape</span>
          </button>
        </div>
      `;

      // Wire soundscape buttons
      const toggleBtn = document.getElementById('btn-toggle-soundscape');
      const label = document.getElementById('soundscape-btn-label');
      const chips = document.querySelectorAll('.sound-chip');
      const slider = document.getElementById('sound-vol-slider');
      const volDisplay = document.getElementById('vol-display');

      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          chips.forEach(c => {
            c.className = 'sound-chip p-2.5 rounded-lg bg-surface-container text-outline hover:text-white font-label-sm text-xs font-semibold text-center transition-all cursor-pointer';
          });
          chip.className = 'sound-chip p-2.5 rounded-lg bg-white text-black font-label-sm text-xs font-semibold text-center transition-all cursor-pointer';
          const type = chip.getAttribute('data-type');
          sound.playChime('click');
          hapticFeedback(15);
          if (sound.isPlaying) {
            sound.startSoundscape(type);
          } else {
            sound.currentSound = type;
          }
        });
      });

      if (slider) {
        slider.addEventListener('input', (e) => {
          const val = e.target.value;
          if (volDisplay) volDisplay.innerText = `${val}%`;
          sound.setVolume(val / 100);
        });
      }

      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          sound.init();
          hapticFeedback(25);
          if (sound.isPlaying) {
            sound.stopSoundscape();
            if (label) label.innerText = 'Start Soundscape';
            toggleBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]">play_arrow</span><span>Start Soundscape</span>`;
          } else {
            sound.startSoundscape();
            toggleBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]">stop</span><span>Stop Soundscape</span>`;
          }
        });
      }

    } else if (appId === 'phone') {
      if (titleEl) titleEl.innerText = 'Emergency Calls';
      if (iconEl) iconEl.innerText = 'call';
      contentEl.innerHTML = `
        <div class="flex-1 flex flex-col space-y-3">
          <div class="w-full h-12 rounded-xl bg-surface-container-lowest border border-white/10 px-4 flex items-center justify-end">
            <span class="font-mono text-xl text-primary font-bold tracking-widest" id="dial-screen"></span>
          </div>
          <div class="grid grid-cols-3 gap-2">
            ${['1','2','3','4','5','6','7','8','9','*','0','#'].map(d => `
              <button class="keypad-digit h-12 rounded-xl bg-surface-container hover:bg-surface-variant active:scale-95 text-lg font-mono font-bold text-white transition-all cursor-pointer" data-key="${d}">
                ${d}
              </button>
            `).join('')}
          </div>
          <div class="flex gap-2 pt-1">
            <button class="flex-1 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-label-md text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer" id="btn-dispatch-call">
              <span class="material-symbols-outlined text-[18px]">call</span>
              <span>Dispatch Call</span>
            </button>
            <button class="w-12 h-12 rounded-full bg-surface-container-high hover:bg-surface-variant text-white flex items-center justify-center font-bold active:scale-95 cursor-pointer" id="btn-dial-backspace">
              ⌫
            </button>
          </div>
        </div>
      `;

      const screen = document.getElementById('dial-screen');
      document.querySelectorAll('.keypad-digit').forEach(btn => {
        btn.addEventListener('click', () => {
          const k = btn.getAttribute('data-key');
          sound.playDTMF(k);
          hapticFeedback(15);
          if (screen) screen.innerText = (screen.innerText + k).slice(0, 14);
        });
      });

      const bsp = document.getElementById('btn-dial-backspace');
      if (bsp) {
        bsp.addEventListener('click', () => {
          hapticFeedback(15);
          if (screen) screen.innerText = screen.innerText.slice(0, -1);
        });
      }

      const dispatchCall = document.getElementById('btn-dispatch-call');
      if (dispatchCall) {
        dispatchCall.addEventListener('click', () => {
          hapticFeedback(30);
          const num = screen.innerText || '911';
          window.location.href = `tel:${num}`;
        });
      }

    } else {
      // Quick Scratchpad
      if (titleEl) titleEl.innerText = 'Quick Scratchpad';
      if (iconEl) iconEl.innerText = 'edit_note';
      contentEl.innerHTML = `
        <div class="flex-1 flex flex-col space-y-2">
          <textarea id="scratch-textarea" class="w-full h-44 rounded-xl bg-surface-container-lowest border border-white/10 p-3 text-sm text-white font-mono outline-none resize-none focus:border-white/30" placeholder="Type thoughts here...">${state.scratchpadContent}</textarea>
          <div class="flex justify-between items-center text-[11px] font-label-sm text-outline">
            <span id="scratch-char-count">${state.scratchpadContent.length} chars</span>
            <div class="flex items-center gap-2">
              <button id="btn-copy-scratch" class="px-2.5 py-1 rounded-md bg-surface-container hover:bg-surface-variant text-white flex items-center gap-1 text-[11px] cursor-pointer">
                <span class="material-symbols-outlined text-[13px]">content_copy</span>
                <span id="copy-scratch-label">Copy</span>
              </button>
              <button id="btn-clear-scratch" class="px-2.5 py-1 rounded-md bg-surface-container hover:bg-surface-variant text-error flex items-center gap-1 text-[11px] cursor-pointer">
                <span class="material-symbols-outlined text-[13px]">delete</span>
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>
      `;

      const ta = document.getElementById('scratch-textarea');
      const charCount = document.getElementById('scratch-char-count');
      if (ta) {
        ta.addEventListener('input', (e) => {
          state.scratchpadContent = e.target.value;
          if (charCount) charCount.innerText = `${state.scratchpadContent.length} chars`;
          saveState();
        });
      }

      const copyBtn = document.getElementById('btn-copy-scratch');
      const copyLabel = document.getElementById('copy-scratch-label');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(state.scratchpadContent || '');
          sound.playChime('click');
          hapticFeedback(20);
          if (copyLabel) {
            copyLabel.innerText = 'Copied!';
            setTimeout(() => { copyLabel.innerText = 'Copy'; }, 1500);
          }
        });
      }

      const clearBtn = document.getElementById('btn-clear-scratch');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          if (confirm('Clear scratchpad content?')) {
            state.scratchpadContent = '';
            if (ta) ta.value = '';
            if (charCount) charCount.innerText = '0 chars';
            saveState();
            sound.playChime('click');
            hapticFeedback(20);
          }
        });
      }
    }
  };

  const btnCloseMiniApp = document.getElementById('btn-close-mini-app');
  if (btnCloseMiniApp) {
    btnCloseMiniApp.addEventListener('click', () => {
      const modal = document.getElementById('modal-mini-app');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      sound.playChime('click');
      hapticFeedback(15);
    });
  }

  // ==========================================
  // 9. THE TOWER TAB (HABIT SKYSCRAPER)
  // ==========================================
  function renderTowerTab() {
    const stack = document.getElementById('tower-floors-stack');
    if (!stack) return;
    stack.innerHTML = '';

    const streakEl = document.getElementById('tower-streak-number');
    const floorsEl = document.getElementById('tower-floors-total');
    const hoursEl = document.getElementById('tower-hours-total');

    if (streakEl) streakEl.innerText = state.tower.streakDays;
    if (floorsEl) floorsEl.innerText = state.tower.floorsCount;
    if (hoursEl) hoursEl.innerText = `${state.tower.totalFocusHours}h`;

    // Render floor slabs (stacked from floor 1 to N)
    state.tower.floors.forEach((f, idx) => {
      const slab = document.createElement('div');
      const isTop = idx === state.tower.floors.length - 1;
      slab.className = `w-full h-8 rounded-md flex items-center justify-between px-3 text-xs font-mono transition-all cursor-pointer ${
        isTop ? 'bg-primary text-black font-bold shadow-md' : 'bg-surface-container-high hover:bg-surface-variant text-white border border-white/5'
      }`;
      slab.innerHTML = `
        <span class="flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[14px]">${isTop ? 'star' : 'apartment'}</span>
          <span>FL ${f.floor}</span>
        </span>
        <span class="text-[10px] ${isTop ? 'text-black/80' : 'text-outline'}">${f.duration}m · ${f.mode.split(' ')[0]}</span>
      `;

      slab.addEventListener('click', () => {
        inspectFloor(f);
        sound.playChime('click');
        hapticFeedback(15);
      });

      stack.appendChild(slab);
    });

    if (state.tower.floors.length > 0) {
      inspectFloor(state.tower.floors[state.tower.floors.length - 1]);
    }
  }

  function inspectFloor(f) {
    const nameEl = document.getElementById('inspect-floor-name');
    const detailsEl = document.getElementById('inspect-floor-details');
    if (nameEl) nameEl.innerText = `Floor ${f.floor}: ${f.mode}`;
    if (detailsEl) detailsEl.innerText = `Constructed ${f.date} · ${f.duration} Minutes · ${f.parachutes} Parachutes Used`;
  }

  // ==========================================
  // 10. SCHEDULED ROUTINES TAB
  // ==========================================
  function renderRoutinesTab() {
    const container = document.getElementById('routines-container');
    if (!container) return;
    container.innerHTML = '';

    state.routines.forEach(r => {
      const card = document.createElement('div');
      card.className = 'p-3.5 rounded-lg bg-surface-container-low flex items-center justify-between border border-white/5';
      card.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
            <span class="material-symbols-outlined text-[20px]">alarm</span>
          </div>
          <div>
            <div class="font-label-md text-primary font-bold">${r.name}</div>
            <div class="font-body-sm text-xs text-outline mt-0.5 flex items-center gap-2">
              <span class="text-white font-mono">${r.time}</span>
              <span>·</span>
              <span>${r.duration}m lock</span>
              <span>·</span>
              <span class="text-[10px] text-primary/80">${r.days.join(', ')}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-delete-routine w-8 h-8 rounded-full bg-surface-container-high hover:bg-error/20 hover:text-error text-outline flex items-center justify-center transition-colors cursor-pointer" data-id="${r.id}" title="Delete routine">
            <span class="material-symbols-outlined text-[16px]">delete</span>
          </button>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" data-id="${r.id}" ${r.active ? 'checked' : ''} class="sr-only peer">
            <div class="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      `;

      const input = card.querySelector('input');
      input.addEventListener('change', (e) => {
        r.active = e.target.checked;
        saveState();
        sound.playChime('click');
        hapticFeedback(15);
      });

      const delBtn = card.querySelector('.btn-delete-routine');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          state.routines = state.routines.filter(item => item.id !== r.id);
          saveState();
          renderRoutinesTab();
          sound.playChime('click');
          hapticFeedback(20);
        });
      }

      container.appendChild(card);
    });
  }

  // Routine Modal
  const btnAddRoutineModal = document.getElementById('btn-add-routine-modal');
  const modalRoutine = document.getElementById('modal-routine');
  const btnCloseRoutineModal = document.getElementById('btn-close-routine-modal');
  const formRoutine = document.getElementById('form-routine');

  if (btnAddRoutineModal) {
    btnAddRoutineModal.addEventListener('click', () => {
      if (modalRoutine) {
        modalRoutine.classList.remove('hidden');
        modalRoutine.classList.add('flex');
        sound.playChime('click');
        hapticFeedback(15);
      }
    });
  }

  if (btnCloseRoutineModal) {
    btnCloseRoutineModal.addEventListener('click', () => {
      if (modalRoutine) {
        modalRoutine.classList.add('hidden');
        modalRoutine.classList.remove('flex');
      }
    });
  }

  // Day chip toggles in routine modal
  document.querySelectorAll('.day-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      chip.classList.toggle('bg-white');
      chip.classList.toggle('text-black');
      chip.classList.toggle('text-white');
      chip.classList.toggle('bg-surface-container-high');
      sound.playChime('click');
      hapticFeedback(10);
    });
  });

  if (formRoutine) {
    formRoutine.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('routine-input-name').value;
      const time = document.getElementById('routine-input-time').value;
      const duration = parseInt(document.getElementById('routine-input-duration').value, 10);
      
      const activeDays = [];
      document.querySelectorAll('.day-chip.active').forEach(c => {
        activeDays.push(c.getAttribute('data-day'));
      });

      state.routines.push({
        id: 'r_' + Date.now(),
        name: name || 'Focus Cycle',
        time: time || '09:00',
        duration: duration || 60,
        days: activeDays.length > 0 ? activeDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        active: true
      });

      saveState();
      renderRoutinesTab();

      if (modalRoutine) {
        modalRoutine.classList.add('hidden');
        modalRoutine.classList.remove('flex');
      }
      formRoutine.reset();
      sound.playChime('success');
      hapticFeedback(30);
    });
  }

  // ==========================================
  // 11. TAB NAVIGATION & VIEW SWITCHER
  // ==========================================
  function navigateToTab(tabId) {
    state.activeTab = tabId;
    saveState();

    // If currently locked and user clicks focus, show lockout screen
    if (tabId === 'focus' && state.isLocked) {
      enterLockoutScreen();
      updateNavHighlight('focus');
      return;
    }

    // Hide all screens
    document.querySelectorAll('.screen-view').forEach(s => s.classList.add('hidden'));

    const targetScreen = document.getElementById(`view-${tabId}`);
    if (targetScreen) {
      targetScreen.classList.remove('hidden');
    }

    updateNavHighlight(tabId);

    // Tab-specific renders
    if (tabId === 'focus') {
      updateTimerInterface();
    } else if (tabId === 'suitcase') {
      renderSuitcaseTab();
    } else if (tabId === 'tower') {
      renderTowerTab();
    } else if (tabId === 'routines') {
      renderRoutinesTab();
    }
  }

  function updateNavHighlight(tabId) {
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      const tab = btn.getAttribute('data-tab');
      if (tab === tabId) {
        btn.classList.add('text-primary', 'bg-surface-container-highest');
        btn.classList.remove('text-on-surface-variant');
      } else {
        btn.classList.remove('text-primary', 'bg-surface-container-highest');
        btn.classList.add('text-on-surface-variant');
      }
    });
  }

  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = btn.getAttribute('data-tab');
      navigateToTab(tab);
      sound.playChime('click');
      hapticFeedback(15);
    });
  });

  // Shield Intercept Alert Dismissal
  const modalShield = document.getElementById('modal-shield');
  const btnDismissShield = document.getElementById('btn-dismiss-shield');
  if (btnDismissShield && modalShield) {
    btnDismissShield.addEventListener('click', () => {
      modalShield.classList.add('hidden');
      modalShield.classList.remove('flex');
      sound.playChime('click');
      hapticFeedback(15);
    });
  }

  // ==========================================
  // 12. PERMISSIONS SETUP & FIRST-RUN ONBOARDING
  // ==========================================
  function showPermissionsModal() {
    const modal = document.getElementById('modal-permissions');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      window.refreshPermissionBadges();
      sound.playChime('click');
      hapticFeedback(20);
    }
  }

  function checkAndShowPermissionsOnboarding() {
    const configured = localStorage.getItem('blockwho_permissions_configured');
    if (!configured) {
      // First-time app open: trigger permissions onboarding modal
      setTimeout(showPermissionsModal, 400);
    }
    // On Android: load real installed apps into suitcase
    if (window.AndroidBridge) {
      setTimeout(loadInstalledAppsIntoSuitcase, 1200);
    }
    // On Android: also check if we need to restore a session that was running
    // when the app was killed and restarted
    if (window.AndroidBridge && typeof window.AndroidBridge.isBlockingSessionActive === 'function') {
      try {
        if (window.AndroidBridge.isBlockingSessionActive() && !state.isLocked) {
          const remaining = window.AndroidBridge.getSessionRemainingSeconds();
          if (remaining > 30) {
            state.isLocked = true;
            state.lockSecondsRemaining = remaining;
            state.lockTotalSeconds = remaining;
            saveState();
            enterLockoutScreen();
            startCountdownTimer();
          } else {
            // Session expired during downtime — clean it up
            if (typeof window.AndroidBridge.stopBlockingSession === 'function') {
              window.AndroidBridge.stopBlockingSession();
            }
          }
        }
      } catch (e) {
        console.warn('Session restore check failed:', e);
      }
    }
  }

  window.refreshPermissionBadges = function() {
    const isAndroid = !!window.AndroidBridge;
    const grantedCls = 'px-2 py-0.5 rounded-full text-[10px] font-label-sm font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    const requiredCls = 'px-2 py-0.5 rounded-full text-[10px] font-label-sm font-bold bg-error-container/30 text-error border border-error/30';
    const optionalCls = 'px-2 py-0.5 rounded-full text-[10px] font-label-sm font-bold bg-surface-container-high text-outline';

    // 1. Accessibility Service — MOST CRITICAL (actual app blocking)
    const accessGranted = isAndroid && typeof window.AndroidBridge.hasAccessibilityPermission === 'function'
      ? window.AndroidBridge.hasAccessibilityPermission() : false;
    const badgeAccess = document.getElementById('badge-perm-access');
    const labelAccess = document.getElementById('label-grant-access');
    if (badgeAccess) {
      badgeAccess.className = accessGranted ? grantedCls : requiredCls;
      badgeAccess.innerText = accessGranted ? '✓ Enabled' : 'Required';
    }
    if (labelAccess) {
      labelAccess.innerText = accessGranted ? 'App Blocking Active' : 'Enable App Blocking';
    }
    // Also update the inline header accessibility status dot
    window.refreshAccessibilityStatus && window.refreshAccessibilityStatus();

    // 2. Usage stats
    const usageGranted = isAndroid && typeof window.AndroidBridge.hasUsageStatsPermission === 'function'
      ? window.AndroidBridge.hasUsageStatsPermission() : false;
    const badgeUsage = document.getElementById('badge-perm-usage');
    const labelUsage = document.getElementById('label-grant-usage');
    if (badgeUsage) {
      badgeUsage.className = usageGranted ? grantedCls : requiredCls;
      badgeUsage.innerText = usageGranted ? '✓ Granted' : 'Required';
    }
    if (labelUsage) {
      labelUsage.innerText = usageGranted ? 'Usage Access Active' : 'Grant Usage Access';
    }

    // 3. Overlay
    const overlayGranted = isAndroid && typeof window.AndroidBridge.hasOverlayPermission === 'function'
      ? window.AndroidBridge.hasOverlayPermission() : false;
    const badgeOverlay = document.getElementById('badge-perm-overlay');
    const labelOverlay = document.getElementById('label-grant-overlay');
    if (badgeOverlay) {
      badgeOverlay.className = overlayGranted ? grantedCls : requiredCls;
      badgeOverlay.innerText = overlayGranted ? '✓ Granted' : 'Required';
    }
    if (labelOverlay) {
      labelOverlay.innerText = overlayGranted ? 'Overlay Access Active' : 'Grant Overlay Access';
    }

    // 4. Notifications
    const notifGranted = isAndroid && typeof window.AndroidBridge.hasNotificationPermission === 'function'
      ? window.AndroidBridge.hasNotificationPermission() : false;
    const badgeNotif = document.getElementById('badge-perm-notif');
    const labelNotif = document.getElementById('label-grant-notif');
    if (badgeNotif) {
      badgeNotif.className = notifGranted ? grantedCls : optionalCls;
      badgeNotif.innerText = notifGranted ? '✓ Granted' : 'Recommended';
    }
    if (labelNotif) {
      labelNotif.innerText = notifGranted ? 'Notifications Active' : 'Allow Notifications';
    }
  };

  // Accessibility service live status in header
  window.refreshAccessibilityStatus = function() {
    const isAndroid = !!window.AndroidBridge;
    const accessGranted = isAndroid && typeof window.AndroidBridge.hasAccessibilityPermission === 'function'
      ? window.AndroidBridge.hasAccessibilityPermission() : false;
    const headerStatusDot = document.getElementById('header-status-dot');
    const headerStatusText = document.getElementById('header-status-text');
    if (headerStatusDot && headerStatusText && !state.isLocked) {
      if (accessGranted) {
        headerStatusDot.className = 'w-1.5 h-1.5 rounded-full bg-primary animate-pulse';
        headerStatusText.innerText = 'READY';
      } else {
        headerStatusDot.className = 'w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse';
        headerStatusText.innerText = 'SETUP NEEDED';
      }
    }
  };

  const btnGrantAccess = document.getElementById('btn-grant-access');
  if (btnGrantAccess) {
    btnGrantAccess.addEventListener('click', () => {
      sound.playChime('click');
      hapticFeedback(20);
      if (window.AndroidBridge && typeof window.AndroidBridge.requestAccessibilityPermission === 'function') {
        window.AndroidBridge.requestAccessibilityPermission();
      } else {
        alert('Accessibility permission is required on Android to enable app blocking. Go to Settings > Accessibility > blockWho > Enable.');
      }
    });
  }

  const btnGrantUsage = document.getElementById('btn-grant-usage');
  if (btnGrantUsage) {
    btnGrantUsage.addEventListener('click', () => {
      sound.playChime('click');
      hapticFeedback(20);
      if (window.AndroidBridge && typeof window.AndroidBridge.requestUsageStatsPermission === 'function') {
        window.AndroidBridge.requestUsageStatsPermission();
      } else {
        alert('Usage stats permission opens system settings on Android devices.');
      }
    });
  }

  const btnGrantOverlay = document.getElementById('btn-grant-overlay');
  if (btnGrantOverlay) {
    btnGrantOverlay.addEventListener('click', () => {
      sound.playChime('click');
      hapticFeedback(20);
      if (window.AndroidBridge && typeof window.AndroidBridge.requestOverlayPermission === 'function') {
        window.AndroidBridge.requestOverlayPermission();
      } else {
        alert('Overlay permission opens system settings on Android devices.');
      }
    });
  }

  const btnGrantNotif = document.getElementById('btn-grant-notif');
  if (btnGrantNotif) {
    btnGrantNotif.addEventListener('click', () => {
      sound.playChime('click');
      hapticFeedback(20);
      if (window.AndroidBridge && typeof window.AndroidBridge.requestNotificationPermission === 'function') {
        window.AndroidBridge.requestNotificationPermission();
      } else if ('Notification' in window) {
        Notification.requestPermission().then(() => window.refreshPermissionBadges());
      }
    });
  }

  const btnCompletePermissions = document.getElementById('btn-complete-permissions');
  const btnClosePermissionsModal = document.getElementById('btn-close-permissions-modal');

  function dismissPermissionsModal() {
    localStorage.setItem('blockwho_permissions_configured', 'true');
    const modal = document.getElementById('modal-permissions');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    sound.playChime('success');
    hapticFeedback(30);
  }

  if (btnCompletePermissions) btnCompletePermissions.addEventListener('click', dismissPermissionsModal);
  if (btnClosePermissionsModal) btnClosePermissionsModal.addEventListener('click', dismissPermissionsModal);

  // ==========================================
  // 13. PROFILE & SYSTEM SETTINGS MODAL
  // ==========================================
  const btnHeaderProfile = document.getElementById('btn-header-profile');
  const modalProfile = document.getElementById('modal-profile');
  const btnCloseProfile = document.getElementById('btn-close-profile-modal');

  if (btnHeaderProfile && modalProfile) {
    btnHeaderProfile.addEventListener('click', () => {
      const streakVal = document.getElementById('profile-streak-val');
      const hoursVal = document.getElementById('profile-hours-val');
      const chuteVal = document.getElementById('profile-parachute-count');

      if (streakVal) streakVal.innerText = `${state.tower.streakDays} Days`;
      if (hoursVal) hoursVal.innerText = `${state.tower.totalFocusHours}h`;
      if (chuteVal) chuteVal.innerText = `${state.parachutesCount} remaining`;

      modalProfile.classList.remove('hidden');
      modalProfile.classList.add('flex');
      sound.playChime('click');
      hapticFeedback(20);
    });
  }

  if (btnCloseProfile && modalProfile) {
    btnCloseProfile.addEventListener('click', () => {
      modalProfile.classList.add('hidden');
      modalProfile.classList.remove('flex');
      sound.playChime('click');
      hapticFeedback(15);
    });
  }

  const toggleHaptics = document.getElementById('toggle-haptics');
  if (toggleHaptics) {
    toggleHaptics.checked = state.hapticsEnabled !== false;
    toggleHaptics.addEventListener('change', (e) => {
      state.hapticsEnabled = e.target.checked;
      saveState();
      hapticFeedback(30);
    });
  }

  const toggleAudio = document.getElementById('toggle-audio-effects');
  if (toggleAudio) {
    toggleAudio.checked = state.audioEnabled !== false;
    toggleAudio.addEventListener('change', (e) => {
      state.audioEnabled = e.target.checked;
      saveState();
      sound.playChime('click');
    });
  }

  const btnOpenPermManager = document.getElementById('btn-open-perm-manager');
  if (btnOpenPermManager) {
    btnOpenPermManager.addEventListener('click', () => {
      if (modalProfile) {
        modalProfile.classList.add('hidden');
        modalProfile.classList.remove('flex');
      }
      showPermissionsModal();
    });
  }

  const btnResetAppData = document.getElementById('btn-reset-app-data');
  if (btnResetAppData) {
    btnResetAppData.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all streak progress, routines, and app data? This cannot be undone.')) {
        localStorage.clear();
        location.reload();
      }
    });
  }

  // ==========================================
  // 14. EMERGENCY PARACHUTE INFO DIALOG
  // ==========================================
  const btnHeaderParachute = document.getElementById('btn-header-parachute');
  const modalParachuteInfo = document.getElementById('modal-parachute-info');
  const btnCloseParachuteInfo = document.getElementById('btn-close-parachute-info');
  const btnDismissParachuteInfo = document.getElementById('btn-dismiss-parachute-info');

  if (btnHeaderParachute) {
    btnHeaderParachute.addEventListener('click', () => {
      if (state.isLocked) {
        // If locked, scroll smoothly to the parachute long-press button
        const chuteBtnEl = document.getElementById('parachuteBtn');
        if (chuteBtnEl) {
          chuteBtnEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          chuteBtnEl.classList.add('ring-2', 'ring-white/50');
          setTimeout(() => chuteBtnEl.classList.remove('ring-2', 'ring-white/50'), 1500);
        }
      } else {
        if (modalParachuteInfo) {
          const statusEl = document.getElementById('parachute-info-status');
          if (statusEl) statusEl.innerText = `${state.parachutesCount} Available`;
          modalParachuteInfo.classList.remove('hidden');
          modalParachuteInfo.classList.add('flex');
        }
      }
      sound.playChime('click');
      hapticFeedback(20);
    });
  }

  function dismissParachuteInfo() {
    if (modalParachuteInfo) {
      modalParachuteInfo.classList.add('hidden');
      modalParachuteInfo.classList.remove('flex');
    }
    sound.playChime('click');
    hapticFeedback(15);
  }

  if (btnCloseParachuteInfo) btnCloseParachuteInfo.addEventListener('click', dismissParachuteInfo);
  if (btnDismissParachuteInfo) btnDismissParachuteInfo.addEventListener('click', dismissParachuteInfo);

  // ==========================================
  // 15. INITIALIZATION
  // ==========================================
  generateDialTicks();
  updateTimerInterface();
  updateParachuteCounters();
  renderSuitcaseTab();
  renderTowerTab();
  renderRoutinesTab();

  if (state.isLocked && state.lockSecondsRemaining > 0) {
    enterLockoutScreen();
    startCountdownTimer();
  } else {
    navigateToTab('focus');
  }

  // Expose global helpers for testing, WebView bridge and inspection
  window.state = state;
  window.navigateToTab = navigateToTab;
  window.triggerLockdown = triggerLockdown;
  window.exitLockoutToFocus = exitLockoutToFocus;
  window.blockWho = {
    state,
    navigateToTab,
    triggerLockdown,
    exitLockoutToFocus,
    saveState,
    updateTimerInterface
  };

  // Check first run permissions
  checkAndShowPermissionsOnboarding();

})();
