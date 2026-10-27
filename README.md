# 🛡️ blockWho · stop phone addiction

> A high-fidelity reverse engineering of **blockWho | stop phone addiction** ([Google Play Store: com.hypenet.focused](https://play.google.com/store/apps/details?id=com.hypenet.focused)), designed with an OLED midnight aesthetic, glassmorphic elevation, native Android APK packaging, and native desktop window testing capabilities.

---

## 📱 Android App (.apk)

Download the pre-compiled Android `.apk` directly from GitHub Releases:
👉 **[Download blockWho-v2.2.0.apk (Releases)](https://github.com/reonsaldanha1/blockWho/releases/latest)**

### Features on Android:
- **OLED Midnight Dark Theme**: Pitch-black status bar and navigation bar (`#131315`) saving battery on AMOLED screens.
- **Hardware-Accelerated WebView**: Ultra-smooth 60/120fps circular dial touch rotation and spring physics.
- **Web Audio Binaural Synthesizer**: Gamma 40Hz, Deep Cabin brown noise, and rain soundscapes built directly into the app.
- **Zero Distractions**: Local offline execution with zero tracker bloat.

---

## 🌟 Key Features Reverse Engineered

### 1. 🎛️ The Circular Focus Dial & Mode Presets
- **Draggable Circular Dial**: Dynamic SVG arc and knob with touch and mouse drag rotation, calculating angles and snapping to 5-minute increments.
- **Preset Modes**:
  - 📚 **Study Session**: 45 minutes default
  - 💼 **Deep Work Focus**: 90 minutes default
  - 🌙 **Sleep Rest**: 8 hours default (up to 10 hours)
  - ⚡ **Quick Reset**: 25 minutes default
- **Quick Increments**: One-tap adjustments (`-15m`, `+15m`, `+30m`, `+1 hr`).
- **Dynamic End Time Prediction**: Automatically calculates when your session will end (e.g., *"Ends at 10:26 PM"*).

---

### 2. 🧳 The Suitcase (Essential Allowed Apps)
In *blockWho*, strict lockdown means every distracting app is blocked. Only apps packed into **The Suitcase** are accessible.
- **Packed Apps Manager**: Toggle apps on/off with iOS-style glassmorphic switch controls.
- **Functional In-Session Mini-Apps**:
  - 🧮 **Calculator**: Complete responsive arithmetic calculator.
  - 📝 **Quick Scratchpad**: Distraction-free notes with live word/character counters and automatic local storage persistence.
  - 📞 **Emergency Contacts**: Emergency dialer directory (Family, Work Direct Line, Medical Dispatch).
  - 🎵 **Focus Soundscape**: Direct audio flow controls.

---

### 3. 🪂 The Parachute (Emergency Escape)
- **Controlled Escape**: You start with **2 Parachutes**.
- **15-Second Breathing Reflection**: Deploying a parachute initiates a 15-second breathing meditation countdown before the exit button unlocks, preventing impulsive urges.
- **Streak Accountability**: Using a parachute terminates the block but breaks your habit streak down to 0 days.

---

### 4. 🏙️ The Tower (Habit Visualization)
- **Gamified Skyscraper**: Every successful focus block adds a newly constructed floor to your tower.
- **Isometric Stacking**: Visual floors with illuminated windows, session duration tags, and construction timestamps.
- **Floor Inspector**: Tap any floor to inspect its session details, duration, and parachute metrics.
- **Milestone Tiers**: Ranks progress from Tier I (Cottage) to Tier II (Skyscraper) and beyond.

---

### 5. ⏰ Scheduled Routines
- Automate blocks with custom names (e.g. *Morning Deep Work*, *Night Sleep Lock*).
- Day-of-week multi-selection chips (M, T, W, T, F, S, S).
- Real-time active switches and deletion controls.

---

### 6. 📊 Focus Analytics & Insights
- **Key Metrics**: Today's Focus Hours, Urge Resistance Percentage, Total Sessions, and Urges Blocked.
- **Weekly Bar Chart**: 7-day focus chart highlighting today's progress with gradient columns.
- **Category Breakdown**: Proportional distribution between Deep Work, Study, and Night Rest.
- **Session History Log**: Chronological audit of recent focus blocks.

---

### 7. 🎧 Focus Soundscape Synthesizer (Web Audio API)
Procedural audio synthesis generated directly in real-time without external audio files:
- **40Hz Gamma**: Dual-sine binaural beats (200Hz L / 240Hz R) for brainwave entrainment.
- **Deep Cabin**: Integrated brown noise with low-pass filtering.
- **Gentle Rain**: Bandpass modulated pink/white noise simulating rainfall.
- **White Noise**: Gentle roll-off focus noise with smooth master volume slider.

---

### 8. 🛡️ Android Core Permissions & Onboarding
- **First-Run Permission Manager**: Prompts and guides the user to grant essential Android permissions:
  - **Usage Access (`PACKAGE_USAGE_STATS`)**: Inspects foreground applications to instantly detect and intercept restricted apps (Instagram, TikTok, YouTube).
  - **Display Over Other Apps (`SYSTEM_ALERT_WINDOW`)**: Renders the fullscreen OLED shield and floating HUD pill over unauthorized applications.
  - **Focus Notifications (`POST_NOTIFICATIONS`)**: Displays persistent countdown timers and scheduled routine alerts.
- **Native Android Bridge**: Full two-way communication between WebView and Kotlin Activity for checking live permission statuses and triggering tactile haptics.
- **Profile & Preferences Modal**: Custom settings for haptic vibration, synthesizer audio effects, streak metrics, and permission checks.

---

## 🚀 Getting Started

### Option A: Install on Android (.apk)
1. Download `blockWho-v2.2.0.apk` from [Releases](https://github.com/reonsaldanha1/blockWho/releases/latest).
2. Open the file on your Android device and tap Install (enable "Install unknown apps" if prompted).

Or compile from source:
```bash
git clone https://github.com/reonsaldanha1/blockWho.git
cd blockWho/android
./gradlew assembleDebug
```
The generated APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`.

### Option B: Native Desktop Window (Windows)
Double-click `run_native_window.bat` or run:
```powershell
pip install -r requirements.txt
python native_launcher.py
```

### Option C: Live Browser Web App
Open `index.html` directly in your browser or visit:
👉 **[Live Web Demo on GitHub Pages](https://reonsaldanha1.github.io/blockWho/)**


