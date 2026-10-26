/**
 * ==============================================================================
 * blockWho · Zenith Monolith Lockdown Engine
 * Exact Google Stitch Design System (Pitch Black #131315, Stark White, Crimson Eject)
 * Reverse-Engineered from "blockit | stop phone addiction" (com.hypenet.focused)
 * ==============================================================================
 */

(function () {
  'use strict';

  // ==========================================
  // 1. DATA STATE & PERSISTENCE
  // ==========================================
  const STORAGE_KEY = 'blockwho_zenith_monolith_v3';

  const DEFAULT_STATE = {
    currentMinutes: 60,
    selectedMode: 'work',
    parachutesCount: 1,
    isLocked: false,
    lockSecondsRemaining: 0,
    lockTotalSeconds: 0,
    activeTab: 'focus',
    
    // The Suitcase Whitelisted Items
    suitcaseApps: [
      { id: 'maps', name: 'Google Maps', icon: 'map', desc: 'Transit routes & offline GPS navigation', packed: true },
      { id: 'audio', name: 'Focus Soundscape', icon: 'headphones', desc: '40Hz Gamma binaural beats & cabin noise', packed: true },
      { id: 'phone', name: 'Emergency Calls', icon: 'call', desc: 'Direct phone dialer & family contacts', packed: true },
      { id: 'scratchpad', name: 'Zenith Scratchpad', icon: 'edit_note', desc: 'Distraction-free quick thoughts & notes', packed: false },
      { id: 'calc', name: 'Calculator Utility', icon: 'calculate', desc: 'Essential math calculations & conversions', packed: false },
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

    scratchpadContent: "Zenith Monolith Principles:\n1. Zero bypass allowed until timer reaches zero.\n2. Protect dopamine reservoirs.\n3. The Parachute is for true emergencies only.\n"
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
        }
      } catch (e) {
        console.warn('Audio chime suppressed:', e);
      }
    }

    playDTMF(digit) {
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
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(t + 0.18);
        osc2.stop(t + 0.18);
      } catch (e) {}
    }
  }

  const sound = new SoundEngine();

  // ==========================================
  // 3. ROTARY DIAL MATH & ENGINE (SCREEN 1)
  // ==========================================
  const dialRadius = 112;
  const dialCircumference = 2 * Math.PI * dialRadius; // ~703.7
  const maxMinutes = 180;

  function generateDialTicks() {
    const ticksContainer = document.getElementById('dial-ticks');
    if (!ticksContainer) return;
    ticksContainer.innerHTML = '';
    const totalTicks = 36; // 36 intervals (10 deg each)

    for (let i = 0; i < totalTicks; i++) {
      const angle = (i * 360) / totalTicks;
      const rad = (angle * Math.PI) / 180;
      const x1 = 140 + 124 * Math.cos(rad);
      const y1 = 140 + 124 * Math.sin(rad);
      const isMajor = i % 3 === 0;
      const length = isMajor ? 5 : 2;
      const x2 = 140 + (124 - length) * Math.cos(rad);
      const y2 = 140 + (124 - length) * Math.sin(rad);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', 'currentColor');
      line.setAttribute('stroke-width', isMajor ? '1.5' : '1');
      line.setAttribute('opacity', isMajor ? '0.7' : '0.25');
      ticksContainer.appendChild(line);
    }
  }

  function updateTimerInterface() {
    const mins = state.currentMinutes;
    const ratio = Math.min(Math.max(mins / maxMinutes, 0), 1);
    const strokeOffset = dialCircumference * (1 - ratio);

    const arc = document.getElementById('progress-arc');
    if (arc) {
      arc.style.strokeDashoffset = strokeOffset;
    }

    // Head Indicator Knob Position
    const angleDeg = ratio * 360;
    const angleRad = (angleDeg - 90) * (Math.PI / 180);
    const knobX = 140 + dialRadius * Math.cos(angleRad);
    const knobY = 140 + dialRadius * Math.sin(angleRad);

    const knob = document.getElementById('dial-knob');
    const knobCore = document.getElementById('dial-knob-core');
    if (knob && knobCore) {
      knob.setAttribute('cx', knobX);
      knob.setAttribute('cy', knobY);
      knobCore.setAttribute('cx', knobX);
      knobCore.setAttribute('cy', knobY);
    }

    // Format Digital Display: HH:MM
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    const formatted = `${String(hours).padStart(2, '0')}:${String(remMins).padStart(2, '0')}`;
    const displayEl = document.getElementById('display-duration');
    if (displayEl) displayEl.innerText = formatted;

    // Calculate End Time
    const now = new Date();
    const future = new Date(now.getTime() + mins * 60000);
    let h = future.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const m = String(future.getMinutes()).padStart(2, '0');
    const endEl = document.getElementById('display-end-time');
    if (endEl) endEl.innerText = `UNTIL ${String(h).padStart(2, '0')}:${m} ${ampm}`;

    // Highlight Preset pill if exact match
    document.querySelectorAll('.preset-pill').forEach(btn => {
      const pMin = parseInt(btn.getAttribute('data-mins'), 10);
      if (pMin === mins) {
        btn.classList.add('bg-primary', 'text-on-primary', 'font-semibold');
        btn.classList.remove('bg-surface-container-low', 'text-on-surface-variant');
      } else {
        btn.classList.remove('bg-primary', 'text-on-primary', 'font-semibold');
        btn.classList.add('bg-surface-container-low', 'text-on-surface-variant');
      }
    });

    // Update Suitcase Badge Count
    const packedCount = state.suitcaseApps.filter(a => a.packed).length;
    const totalApps = state.suitcaseApps.length;
    const badgeEl = document.getElementById('focus-suitcase-fraction');
    if (badgeEl) badgeEl.innerText = `${packedCount}/${totalApps}`;
  }

  function setTime(mins) {
    state.currentMinutes = Math.min(Math.max(mins, 5), maxMinutes);
    saveState();
    updateTimerInterface();
  }

  function adjustTime(delta) {
    setTime(state.currentMinutes + delta);
  }

  // Dial Click and Drag to set angle
  const dial = document.getElementById('timer-dial');
  let isDraggingDial = false;

  function calculateDialAngle(e) {
    if (!dial) return;
    const rect = dial.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - cx;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - cy;

    // Angle clockwise from top (12 o'clock)
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    let targetMins = Math.round((angle / 360) * maxMinutes / 5) * 5;
    if (targetMins < 5) targetMins = 5;
    setTime(targetMins);
  }

  if (dial) {
    dial.addEventListener('mousedown', (e) => {
      isDraggingDial = true;
      calculateDialAngle(e);
    });
    window.addEventListener('mousemove', (e) => {
      if (isDraggingDial) calculateDialAngle(e);
    });
    window.addEventListener('mouseup', () => {
      isDraggingDial = false;
    });

    dial.addEventListener('touchstart', (e) => {
      isDraggingDial = true;
      calculateDialAngle(e);
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (isDraggingDial && e.touches.length > 0) calculateDialAngle(e);
    }, { passive: true });
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
      if (badgeEl) badgeEl.innerText = 'POMODORO 45';
    } else if (mode === 'work') {
      setTime(60);
      if (quoteEl) quoteEl.innerText = 'Unbroken flow sprint';
      if (badgeEl) badgeEl.innerText = 'DEEP WORK 1.0';
    } else if (mode === 'sleep') {
      setTime(180);
      if (quoteEl) quoteEl.innerText = 'Circadian sleep sanctuary';
      if (badgeEl) badgeEl.innerText = 'NIGHT RIGOR';
    }
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
    });
  }

  // ==========================================
  // 4. SCREEN 2: ACTIVE LOCKOUT CONTROLLER
  // ==========================================
  let countdownInterval = null;

  function triggerLockdown() {
    const btn = document.getElementById('lockdown-btn');
    if (!btn) return;
    sound.playChime('lock');

    btn.innerHTML = `<span class="material-symbols-outlined text-[20px] animate-spin">refresh</span><span>ENGAGING PROTOCOL...</span>`;
    btn.classList.add('opacity-80');

    setTimeout(() => {
      btn.innerHTML = `<span class="material-symbols-outlined text-[20px]">lock</span><span>Start Lockdown</span>`;
      btn.classList.remove('opacity-80');

      // Engage Lock
      state.isLocked = true;
      state.lockTotalSeconds = state.currentMinutes * 60;
      state.lockSecondsRemaining = state.lockTotalSeconds;
      saveState();

      enterLockoutScreen();
    }, 800);
  }

  const btnLockdown = document.getElementById('lockdown-btn');
  if (btnLockdown) btnLockdown.addEventListener('click', triggerLockdown);

  function enterLockoutScreen() {
    // Show Screen 2, Hide others
    document.querySelectorAll('.screen-view').forEach(s => s.classList.add('hidden'));
    const lockoutView = document.getElementById('view-lockout');
    if (lockoutView) lockoutView.classList.remove('hidden');

    // Update Header Status
    const statusText = document.getElementById('header-status-text');
    const statusDot = document.getElementById('header-status-dot');
    const headerTitle = document.getElementById('header-title');
    if (statusText) statusText.innerText = 'Locked';
    if (statusDot) {
      statusDot.className = 'w-1.5 h-1.5 rounded-full bg-error animate-ping';
    }
    if (headerTitle) headerTitle.innerText = 'Active Lockout';

    // Update Lockout Mode Indicator
    const modeIndicator = document.getElementById('lock-mode-indicator');
    if (modeIndicator) {
      const modeNames = { study: 'Session · Deep Academic', work: 'Session · Deep Work', sleep: 'Sanctuary · Sleep Lock' };
      modeIndicator.innerText = modeNames[state.selectedMode] || 'Session · Deep Work';
    }

    // Compute End Time Remark
    const targetTime = new Date(Date.now() + state.lockSecondsRemaining * 1000);
    let h = targetTime.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const m = String(targetTime.getMinutes()).padStart(2, '0');
    const remarkEl = document.getElementById('lock-ends-remark');
    if (remarkEl) remarkEl.innerText = `Ends strictly at ${h}:${m} ${ampm} · Stay disciplined`;

    // Render allowed suitcase dock
    renderLockSuitcaseDock();

    // Start Countdown
    startCountdown();
  }

  function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);

    function tick() {
      if (state.lockSecondsRemaining > 0) {
        state.lockSecondsRemaining--;
        updateCountdownDisplay();
      } else {
        // Complete Session
        clearInterval(countdownInterval);
        completeSession();
      }
    }

    updateCountdownDisplay();
    countdownInterval = setInterval(tick, 1000);
  }

  function updateCountdownDisplay() {
    const s = state.lockSecondsRemaining;
    const hrs = String(Math.floor(s / 3600)).padStart(2, '0');
    const mins = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const secs = String(s % 60).padStart(2, '0');

    const timerEl = document.getElementById('mainTimer');
    if (timerEl) timerEl.innerText = `${hrs}:${mins}:${secs}`;

    const pillCountdown = document.getElementById('pill-countdown');
    if (pillCountdown) {
      if (s >= 3600) {
        pillCountdown.innerText = `${hrs}:${mins} Left`;
      } else {
        pillCountdown.innerText = `${mins}:${secs} Left`;
      }
    }
  }

  function completeSession() {
    sound.playChime('success');
    state.isLocked = false;
    
    // Build New Tower Floor!
    state.tower.streakDays++;
    state.tower.floorsCount++;
    state.tower.totalFocusHours += Math.round((state.lockTotalSeconds / 3600) * 10) / 10;
    
    const newFloor = {
      floor: state.tower.floorsCount,
      mode: state.selectedMode === 'study' ? 'Study Sprint' : (state.selectedMode === 'work' ? 'Deep Work' : 'Night Sleep'),
      duration: Math.round(state.lockTotalSeconds / 60),
      date: 'Today',
      parachutes: 0
    };
    state.tower.floors.push(newFloor);
    saveState();

    alert(`🎉 FOCUS COMPLETE!\nFloor ${newFloor.floor} added to your Tower Skyscraper.`);
    exitLockoutToFocus();
  }

  function exitLockoutToFocus() {
    if (countdownInterval) clearInterval(countdownInterval);
    state.isLocked = false;
    saveState();

    // Restore Header Status
    const statusText = document.getElementById('header-status-text');
    const statusDot = document.getElementById('header-status-dot');
    const headerTitle = document.getElementById('header-title');
    if (statusText) statusText.innerText = 'Ready';
    if (statusDot) {
      statusDot.className = 'w-1.5 h-1.5 rounded-full bg-primary animate-pulse';
    }
    if (headerTitle) headerTitle.innerText = 'blockWho';

    navigateToTab('focus');
  }

  // ==========================================
  // 5. EXTEND TIME (+15M HOLD 3S MECHANIC)
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
    if (chuteProgress) {
      chuteProgress.style.transition = 'width 3000ms linear';
      chuteProgress.style.width = '100%';
    }

    // Invert contrast dynamically near halfway
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
    });
  }

  // ==========================================
  // 8. SUITCASE MANAGEMENT & MINI-APPS
  // ==========================================
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
      card.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
            <span class="material-symbols-outlined text-[20px]">${app.icon}</span>
          </div>
          <div>
            <div class="font-label-md text-primary font-bold">${app.name}</div>
            <div class="font-body-sm text-xs text-outline">${app.desc}</div>
          </div>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
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

    packed.slice(0, 3).forEach(app => {
      const btn = document.createElement('button');
      btn.className = 'flex flex-col items-center justify-center p-3 rounded-DEFAULT bg-surface-container-high hover:bg-surface-variant active:scale-95 transition-all';
      btn.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center mb-2">
          <span class="material-symbols-outlined text-[20px] text-primary">${app.icon}</span>
        </div>
        <span class="font-label-sm text-label-sm text-primary font-medium tracking-wide">${app.name.split(' ')[0]}</span>
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
    const modal = document.getElementById('modal-mini-app');
    const titleEl = document.getElementById('mini-app-title');
    const iconEl = document.getElementById('mini-app-icon');
    const contentEl = document.getElementById('mini-app-content');
    if (!modal || !contentEl) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    if (appId === 'maps') {
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
            <button class="sound-chip p-2.5 rounded-lg bg-white text-black font-label-sm text-xs font-semibold text-center transition-all" data-type="binaural">
              40Hz Gamma Beat
            </button>
            <button class="sound-chip p-2.5 rounded-lg bg-surface-container text-outline hover:text-white font-label-sm text-xs font-semibold text-center transition-all" data-type="brown">
              Cabin Brown Noise
            </button>
            <button class="sound-chip p-2.5 rounded-lg bg-surface-container text-outline hover:text-white font-label-sm text-xs font-semibold text-center transition-all" data-type="rain">
              Gentle Rain
            </button>
            <button class="sound-chip p-2.5 rounded-lg bg-surface-container text-outline hover:text-white font-label-sm text-xs font-semibold text-center transition-all" data-type="white">
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
          <button id="btn-toggle-soundscape" class="w-full py-3 rounded-full bg-primary text-on-primary font-label-md text-xs font-bold uppercase tracking-wider hover:bg-primary-container transition-all flex items-center justify-center gap-2">
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
            c.className = 'sound-chip p-2.5 rounded-lg bg-surface-container text-outline hover:text-white font-label-sm text-xs font-semibold text-center transition-all';
          });
          chip.className = 'sound-chip p-2.5 rounded-lg bg-white text-black font-label-sm text-xs font-semibold text-center transition-all';
          const type = chip.getAttribute('data-type');
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
      if (titleEl) titleEl.innerText = 'Distraction-Free Phone';
      if (iconEl) iconEl.innerText = 'call';
      contentEl.innerHTML = `
        <div class="flex-1 flex flex-col space-y-3">
          <div class="w-full h-12 rounded-xl bg-surface-container-lowest border border-white/10 px-4 flex items-center justify-end">
            <span class="font-mono text-xl text-primary font-bold tracking-widest" id="dial-screen"></span>
          </div>
          <div class="grid grid-cols-3 gap-2">
            ${['1','2','3','4','5','6','7','8','9','*','0','#'].map(d => `
              <button class="keypad-digit h-12 rounded-xl bg-surface-container hover:bg-surface-variant active:scale-95 text-lg font-mono font-bold text-white transition-all" data-key="${d}">
                ${d}
              </button>
            `).join('')}
          </div>
          <div class="flex gap-2 pt-1">
            <button class="flex-1 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-label-md text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5" onclick="alert('Calling: ' + (document.getElementById('dial-screen').innerText || 'Emergency Dispatch'))">
              <span class="material-symbols-outlined text-[18px]">call</span>
              <span>Dispatch Call</span>
            </button>
            <button class="w-12 h-12 rounded-full bg-surface-container-high hover:bg-surface-variant text-white flex items-center justify-center font-bold" id="btn-dial-backspace">
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
          if (screen) screen.innerText = (screen.innerText + k).slice(0, 14);
        });
      });

      const bsp = document.getElementById('btn-dial-backspace');
      if (bsp) {
        bsp.addEventListener('click', () => {
          if (screen) screen.innerText = screen.innerText.slice(0, -1);
        });
      }
    } else {
      // General scratchpad / fallback
      if (titleEl) titleEl.innerText = 'Zenith Scratchpad';
      if (iconEl) iconEl.innerText = 'edit_note';
      contentEl.innerHTML = `
        <div class="flex-1 flex flex-col space-y-2">
          <textarea id="scratch-textarea" class="w-full h-44 rounded-xl bg-surface-container-lowest border border-white/10 p-3 text-sm text-white font-mono outline-none resize-none focus:border-white/30" placeholder="Type thoughts here...">${state.scratchpadContent}</textarea>
          <div class="flex justify-between items-center text-[11px] font-label-sm text-outline">
            <span>Auto-saved to local memory</span>
            <span class="text-primary font-bold">Encrypted</span>
          </div>
        </div>
      `;
      const ta = document.getElementById('scratch-textarea');
      if (ta) {
        ta.addEventListener('input', (e) => {
          state.scratchpadContent = e.target.value;
          saveState();
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
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" data-id="${r.id}" ${r.active ? 'checked' : ''} class="sr-only peer">
          <div class="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      `;

      const input = card.querySelector('input');
      input.addEventListener('change', (e) => {
        r.active = e.target.checked;
        saveState();
      });

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
    });
  });

  // ==========================================
  // 12. DESKTOP HARNESS & TEST SHIELD INTERCEPT
  // ==========================================
  const viewToggle = document.getElementById('view-mode-toggle');
  const viewLabel = document.getElementById('view-mode-label');
  const frame = document.getElementById('mobile-frame');

  if (viewToggle && frame) {
    viewToggle.addEventListener('click', () => {
      const isEdge = frame.classList.toggle('edge-to-edge');
      if (viewLabel) {
        viewLabel.innerText = isEdge ? 'Edge-to-Edge' : 'Phone Frame';
      }
    });
  }

  // Simulate unauthorized app intercept
  const testShieldBtn = document.getElementById('test-shield-btn');
  const modalShield = document.getElementById('modal-shield');
  const btnDismissShield = document.getElementById('btn-dismiss-shield');

  if (testShieldBtn && modalShield) {
    testShieldBtn.addEventListener('click', () => {
      sound.playChime('alert');
      modalShield.classList.remove('hidden');
      modalShield.classList.add('flex');
    });
  }

  if (btnDismissShield && modalShield) {
    btnDismissShield.addEventListener('click', () => {
      modalShield.classList.add('hidden');
      modalShield.classList.remove('flex');
    });
  }

  // ==========================================
  // 13. INITIALIZATION
  // ==========================================
  generateDialTicks();
  updateTimerInterface();
  updateParachuteCounters();
  renderSuitcaseTab();
  renderTowerTab();
  renderRoutinesTab();

  if (state.isLocked && state.lockSecondsRemaining > 0) {
    enterLockoutScreen();
  } else {
    navigateToTab('focus');
  }

})();
