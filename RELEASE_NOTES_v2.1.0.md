# 🛡️ blockWho v2.1.0 — Crash Fixes, Dynamic Tower & Enhanced Suitcase

Welcome to **blockWho v2.1.0**! 🚀

This release resolves the critical Android 14 lockdown startup crash, introduces clean dynamic tower habit construction, ensures routines start in an inactive state, and overhauls Suitcase app management with full preview actions.

---

### ⚡ What's New in v2.1.0

#### 1. 🛡️ Critical Fix: Lockdown Startup Crash on Android 14+
- **Permission Fix**: Added missing `android.permission.FOREGROUND_SERVICE_DATA_SYNC` required by Android 14 (API 34) when starting foreground services with `dataSync`.
- **Foreground Type Parameter**: Explicitly specified `ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC` in `ServiceCompat.startForeground` to prevent `MissingForegroundServiceTypeException`.
- **UI Thread Dispatch**: Dispatched all native service start/stop triggers onto the main Activity thread (`activity.runOnUiThread`), eliminating `ForegroundServiceStartNotAllowedException`.
- **Safe Notification Drawables**: Replaced internal system icons with the app's native launcher icon (`R.mipmap.ic_launcher`), preventing `BadNotificationException` on Samsung and Xiaomi builds.

#### 2. 🧳 Suitcase Overhaul & Interactive Previews
- **Full Row Click-to-Toggle**: Tapping anywhere on an app's row or info area now toggles packing state smoothly.
- **Direct Preview / Test Action**: Added dedicated **Preview / Test** buttons (`visibility` icon) for every built-in tool and user application directly from the Suitcase page.
- **Pack All & Clear All**: One-tap quick actions to pack all apps or clear all whitelist entries in seconds.
- **Strict / Standard Mode Toggle**: Switch between strict zero-bypass enforcement and standard mode with one tap.
- **Native App Launcher**: Tapping an allowed user application from the Suitcase during lockdown now launches the native application via the Android package manager.
- **Full Document Reader**: Added complete offline reading view with `A+` and `A-` font zoom controls.
- **Full Document Scanner**: Added simulated offline camera viewfinder, flash toggle, shutter capture, and retake controls.

#### 3. 🏙️ Dynamic Habit Tower
- **Starts Empty at Tier 0**: New installations now start with zero floors at `Tier 0 Ground` (`0 Days`, `0h Focus Time`).
- **Dynamic Construction**: Every completed focus lockdown automatically constructs and illuminates a new floor slab (`FL 1`, `FL 2`, etc.), dynamically ascending to `Tier I Cottage`, `Tier II Townhouse`, and `Tier III Skyscraper`.
- **Dynamic Lockout Badge**: Active lockout screen now displays `"Floor 1 (in progress)"` on first sprint and `"Floor N (+1 in prog)"` subsequently.

#### 4. ⏰ Scheduled Routines Default to Inactive
- Autonomous routine cycles now start in the `disabled` (`active: false`) state so users have full intentional control over when automated locks occur.

---

### 📦 Downloads & Installation

- 📲 **Android APK**: Download **`blockWho-v2.1.0.apk`** below and install on Android 7.0+ (API 24 to 34+).
- 🌐 **Web Live Version**: [https://reonsaldanha1.github.io/blockWho/](https://reonsaldanha1.github.io/blockWho/)
