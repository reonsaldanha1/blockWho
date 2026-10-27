# 🛡️ blockWho v2.2.0 — Background Lockdown, Launcher Redirection & 3h Tower Habit Standard

Welcome to **blockWho v2.2.0**! 🚀

This release introduces seamless background lockdown execution, zero-bypass Home Launcher redirection, and a meaningful 3-hour habit threshold for constructing Tower floors with live progress tracking.

---

### ⚡ What's New in v2.2.0

#### 1. 🔄 True Background Lockdown Execution
- **Non-Destructive Back Press**: Pressing the Android back button during an active lockdown session now moves the app smoothly into the background (`moveTaskToBack(true)`) instead of destroying or finishing the activity.
- **WakeLock Power Management**: `BlockerForegroundService` now acquires and manages an active `PowerManager.PARTIAL_WAKE_LOCK` for the duration of the lockdown session, preventing CPU sleep states from pausing the timer or killing watchdog enforcement.
- **Task Removal & Auto-Restart**: When blockWho is closed or swiped away from the Android Recent Apps list, `onTaskRemoved()` ensures the foreground service continues running, preserves the ongoing session notification, and schedules an exact `AlarmManager` wake-up fallback.
- **Wall-Clock State Synchronization**: The timer now tracks real-world wall-clock timestamps (`state.lockEndTime`). Time elapsed while the phone was locked, closed, or running in the background is preserved and seamlessly synchronized across `visibilitychange`, `focus`, `pageshow`, and native `onResume`.
- **Live Notification Countdown**: The persistent Android status bar notification dynamically updates with remaining time.

#### 2. 🏠 Home Launcher Redirection
- **Immediate Bounce Back**: If the home button is pressed or any launcher is opened during an active lockdown session, blockWho intercepts the transition and redirects the user immediately back to the app.
- **Broad Launcher Compatibility**: Includes `BlockerLauncherHelper` with detection for default resolved home launchers, `CATEGORY_HOME` intent handlers, and OEM launchers across Google Pixel, Samsung One UI, Xiaomi/HyperOS, Oppo ColorOS, OnePlus OxygenOS, Motorola, Nothing OS, Huawei EMUI, Nova, Lawnchair, and Microsoft Launcher.
- **Dual-Layer Enforcement**: Both `BlockerAccessibilityService` and the background watchdog thread in `BlockerForegroundService` monitor for launcher packages, bypassing background activity start limits via `PendingIntent.send()` with Android 14+ background activity start privileges.
- **UX Debouncing & Throttled Alerts**: Includes an intelligent 400ms debounce and throttled feedback toast to prevent intent looping.

#### 3. 🏙️ Tower Page: 3-Hour Minimum to Build a Floor
- **3-Hour Construction Milestone**: Building a skyscraper floor now requires a minimum of **3 hours (180 minutes)** of cumulative focus work. Quick sprints now contribute towards completing the current floor rather than building arbitrary floors.
- **Live Construction Progress Card**: Added a real-time Floor Construction Card to the Tower view:
  - Shows which floor is currently under construction (e.g. *Floor 1 Construction*).
  - Displays progress against the 3-hour minimum (e.g. *1.5 / 3.0h*).
  - Animated progress bar and hours remaining counter (*1.5h remaining*).
- **Floor Inspection & Badge Updates**: Floor details and active session badges now display the 3-hour minimum standard.

---

### 📦 Downloads & Installation

- 📲 **Android APK**: Download **`blockWho-v2.2.0.apk`** below and install on Android 7.0+ (API 24 to 34+).
- 🌐 **Web Live Version**: [https://reonsaldanha1.github.io/blockWho/](https://reonsaldanha1.github.io/blockWho/)
