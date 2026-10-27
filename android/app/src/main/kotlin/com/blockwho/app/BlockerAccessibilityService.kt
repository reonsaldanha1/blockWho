package com.blockwho.app

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityEvent.TYPE_WINDOWS_CHANGED
import android.view.accessibility.AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
import android.view.inputmethod.InputMethodManager
import android.widget.Toast

/**
 * BlockerAccessibilityService
 *
 * The core enforcement engine of blockWho:
 * 1. Monitors foreground window transitions (TYPE_WINDOW_STATE_CHANGED / TYPE_WINDOWS_CHANGED).
 * 2. When lockdown mode is active, any app opened that is NOT in the Suitcase whitelist
 *    is IMMEDIATELY closed via GLOBAL_ACTION_HOME, and blockWho is brought back
 *    to the foreground with haptic feedback and a warning toast.
 * 3. When the home launcher is opened during lockdown mode, redirects immediately
 *    back to blockWho.
 * 4. Essential system services (System UI, active keyboards, emergency dialer,
 *    and system permission dialogs) are permitted so the device remains safe.
 */
class BlockerAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "BlockerService"
        @Volatile var isRunning = false
        private var lastLauncherToastMs = 0L
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        isRunning = true
        Log.i(TAG, "BlockerAccessibilityService connected and armed")

        serviceInfo = serviceInfo?.apply {
            eventTypes = TYPE_WINDOW_STATE_CHANGED or TYPE_WINDOWS_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                    AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
            notificationTimeout = 50
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        event ?: return

        val type = event.eventType
        if (type != TYPE_WINDOW_STATE_CHANGED && type != TYPE_WINDOWS_CHANGED) return

        // Only enforce during an active session
        if (!SharedPrefsManager.isSessionActive(this)) return

        // Check session expiry
        val endMs = SharedPrefsManager.getSessionEndMs(this)
        if (endMs > 0 && System.currentTimeMillis() >= endMs) {
            SharedPrefsManager.clearSession(this)
            return
        }

        val foregroundPackage = event.packageName?.toString() ?: return
        val ownPackage = SharedPrefsManager.getOwnPackage(this)
        val allowedPackages = SharedPrefsManager.getAllowedPackages(this)

        // 1. blockWho itself is always allowed
        if (foregroundPackage == ownPackage) return

        // 2. Essential system operations (System UI, keyboards, emergency phone dialer, permission dialogs)
        if (isEssentialSystemPackage(foregroundPackage)) return

        // 3. User allowed packages (Suitcase whitelist)
        if (allowedPackages.contains(foregroundPackage)) {
            Log.d(TAG, "Package $foregroundPackage is whitelisted in Suitcase - allowing")
            return
        }

        // 4. Default Home Launcher — redirect back to blockWho during lockdown mode!
        if (BlockerLauncherHelper.isLauncherPackage(this, foregroundPackage)) {
            Log.w(TAG, "Launcher opened during lockdown mode: $foregroundPackage - redirecting back to blockWho")
            BlockerLauncherHelper.bringBlockWhoToFront(this)

            // Feedback toast throttled to once every 2.5s
            val now = System.currentTimeMillis()
            if (now - lastLauncherToastMs > 2500) {
                lastLauncherToastMs = now
                Handler(Looper.getMainLooper()).post {
                    try {
                        Toast.makeText(
                            applicationContext,
                            "\uD83D\uDD12 Lockdown mode active · Returning to blockWho",
                            Toast.LENGTH_SHORT
                        ).show()
                    } catch (ignored: Throwable) {}
                }
            }
            return
        }

        // 5. UNAUTHORIZED APP OPENED — close it immediately and bring blockWho to front!
        Log.w(TAG, "BLOCKED unauthorized app: $foregroundPackage - closing app now")
        blockAndCloseApp(foregroundPackage)
    }

    /**
     * Closes the blocked application immediately and brings blockWho back to front.
     */
    private fun blockAndCloseApp(blockedPackage: String) {
        try {
            // 1. Dismiss unauthorized foreground app
            performGlobalAction(GLOBAL_ACTION_HOME)

            // 2. Bring blockWho back to foreground immediately
            BlockerLauncherHelper.bringBlockWhoToFront(this, blockedPackage)

            // 3. Haptic alert
            try {
                val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator?.vibrate(VibrationEffect.createOneShot(120, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator?.vibrate(120)
                }
            } catch (ignored: Throwable) {}

            // 4. User feedback toast on main thread
            Handler(Looper.getMainLooper()).post {
                try {
                    val appName = try {
                        val pm = packageManager
                        val info = pm.getApplicationInfo(blockedPackage, 0)
                        pm.getApplicationLabel(info).toString()
                    } catch (e: Throwable) {
                        blockedPackage
                    }
                    Toast.makeText(
                        applicationContext,
                        "\uD83D\uDD12 $appName is blocked! Only Suitcase apps are allowed.",
                        Toast.LENGTH_SHORT
                    ).show()
                } catch (ignored: Throwable) {}
            }
        } catch (e: Throwable) {
            Log.e(TAG, "Failed to block and close app", e)
        }
    }

    /**
     * Essential Android system components that must NEVER be blocked
     * to prevent bricking or preventing emergency communication.
     */
    private fun isEssentialSystemPackage(pkg: String): Boolean {
        // Framework core
        if (pkg == "android") return true

        // System UI (status bar, navigation bar, lockscreen PIN/pattern)
        if (pkg == "com.android.systemui") return true

        // Active Keyboards / Input Method Editors
        if (isImePackage(pkg)) return true

        // Emergency calling and telephony
        if (pkg == "com.android.phone" ||
            pkg == "com.android.server.telecom" ||
            pkg == "com.android.incallui" ||
            pkg == "com.google.android.dialer" ||
            pkg == "com.samsung.android.incallui" ||
            pkg == "com.samsung.android.dialer" ||
            pkg == "com.android.dialer") return true

        // Runtime permission dialogues & package installer
        if (pkg == "com.google.android.permissioncontroller" ||
            pkg == "com.android.permissioncontroller" ||
            pkg == "com.google.android.packageinstaller" ||
            pkg == "com.android.packageinstaller") return true

        return false
    }

    private fun isImePackage(pkg: String): Boolean {
        return try {
            val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
            imm?.inputMethodList?.any { it.packageName == pkg } ?: false
        } catch (e: Throwable) {
            pkg == "com.google.android.inputmethod.latin" ||
            pkg == "com.swiftkey.swiftkeyapp" ||
            pkg == "com.touchtype.swiftkey" ||
            pkg == "com.samsung.android.honeyboard" ||
            pkg == "com.sec.android.inputmethod"
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "BlockerAccessibilityService interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        Log.i(TAG, "BlockerAccessibilityService destroyed")
    }
}
