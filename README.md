# 🛡️ blockit · stop phone addiction

> A high-fidelity reverse engineering of **blockit | stop phone addiction** ([Google Play Store: com.hypenet.focused](https://play.google.com/store/apps/details?id=com.hypenet.focused)), designed with an OLED midnight aesthetic, glassmorphic elevation, and native desktop window testing capabilities.

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
In *blockit*, strict lockdown means every distracting app is blocked. Only apps packed into **The Suitcase** are accessible.
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

### 8. 📱 Native Desktop Window & Test Harness
- **Edge WebView2 Native Window**: Packaged with `pywebview` for native Windows desktop execution.
- **Shell Controls**:
  - **Phone Frame / Edge-to-Edge Toggle**: Switch between realistic phone bezel and full desktop view.
  - **App Intercept Simulator**: Simulates what happens when a user attempts to open an unauthorized app (e.g., Instagram/TikTok) during lockdown, triggering the animated shield bounce-back.
  - **Dynamic Island**: Displays real-time status notifications (`blockit ready`, `lockdown active`, `Intercepted`).

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+ (optional, for native desktop window)
- Modern web browser (Chrome, Edge, Firefox, Safari)

### Installation
Clone the repository:
```bash
git clone https://github.com/reonsaldanha1/blockit.git
cd blockit
```

### Method 1: Native Desktop Window (Recommended)
Install dependencies and launch:
```powershell
pip install -r requirements.txt
python native_launcher.py
```
*(Or simply double-click `run_native_window.bat` on Windows)*

### Method 2: In Any Browser / Live Web
Open `index.html` directly in your browser, or visit the live deployment:
👉 **[Live Demo on GitHub Pages](https://reonsaldanha1.github.io/blockit/)**

Or serve locally with any static server:
```powershell
python -m http.server 5173
```
Then visit `http://127.0.0.1:5173/index.html`.

