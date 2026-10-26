# 🛡️ blockWho v2.0.0 — Real App Blocking (BlockIt-Style)

Welcome to the major release of **blockWho v2.0.0**! 🚀

This update transforms **blockWho** into a true, real-world Android app blocker replicating the enforcement architecture of the **BlockIt** app from Google Play ([com.hypenet.focused](https://play.google.com/store/apps/details?id=com.hypenet.focused)).

---

### ⚡ What's New in v2.0.0

#### 1. 🛑 Real App Blocking Engine (`BlockerAccessibilityService`)
- Zero-bypass foreground app monitoring that detects whenever an unallowed app is opened during an active focus session.
- Automatically bounces the user back to **blockWho** with haptic feedback — preventing doom-scrolling, distractions, and impulsivity.
- Completely private: only inspects package names to verify allowlist status; no user data, screen content, or keystrokes are accessed.

#### 2. 🧳 Real Installed Apps in The Suitcase
- The Suitcase now automatically queries and loads the **real installed apps** from your Android device.
- Selectively pack or unpack apps to allow or block them during lockdown sessions.
- System apps and essential tools remain manageable with a single toggle.

#### 3. 🔔 Persistent Lockdown Notification (`BlockerForegroundService`)
- Keeps the session countdown active in the system status bar even when blockWho is minimized.
- Prevents Android OS from aggressively killing the focus lockdown service.
- State persistence: if the device reboots or the app restarts, the session timer seamlessly resumes from SharedPreferences.

#### 4. 🪂 Zero-Parachute Hard Lock
- When your parachute count reaches zero, emergency escape is completely disabled.
- True BlockIt-style discipline to break addictive phone usage habits.

#### 5. 🛡️ Permission Onboarding System
- First-launch permission modal clearly explaining and linking to the 4 required permissions:
  1. **Accessibility Service**: Real app blocking enforcement
  2. **Usage Access**: Foreground app monitoring
  3. **Display Over Other Apps**: Lock screen overlay
  4. **Notifications**: Persistent countdown service
- Dynamic "SETUP NEEDED" badge on the main screen if permissions are pending.

---

### 📦 Downloads & Installation

- 📲 **Android APK**: Download **`blockWho-v2.0.0.apk`** below and install on Android 7.0+ (API 24 to 34+).
- 🌐 **Web Live Version**: [https://reonsaldanha1.github.io/blockWho/](https://reonsaldanha1.github.io/blockWho/)
