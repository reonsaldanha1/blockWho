package com.blockwho.app

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Intent
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
import android.view.accessibility.AccessibilityEvent.TYPE_WINDOWS_CHANGED

/**
 * BlockerAccessibilityService
 *
 * This is the heart of blockWho's enforcement mechanism — exactly how the
 * BlockIt app works. When a focus session is active:
 *
 * 1. We listen for TYPE_WINDOW_STATE_CHANGED / TYPE_WINDOWS_CHANGED events.
 * 2. We check the foreground package name.
 * 3. If the package is NOT in the allowed list AND is NOT our own app,
 *    we immediately launch blockWho back to the foreground (zero-bypass).
 * 4. If the session has expired (time ran out), we clear session state.
 *
 * The allowed list is managed via SharedPrefsManager (set from MainActivity
 * when the user configures their Suitcase and starts a session).
 */
class BlockerAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "BlockerService"
        // Static flag so MainActivity can query if service is running
        @Volatile var isRunning = false
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        isRunning = true
        Log.i(TAG, "BlockerAccessibilityService connected")

        serviceInfo = serviceInfo?.apply {
            eventTypes = TYPE_WINDOW_STATE_CHANGED or TYPE_WINDOWS_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                    AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
            notificationTimeout = 100
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
            // Session has timed out naturally — clear enforcement
            SharedPrefsManager.clearSession(this)
            return
        }

        val foregroundPackage = event.packageName?.toString() ?: return
        val ownPackage = SharedPrefsManager.getOwnPackage(this)
        val allowedPackages = SharedPrefsManager.getAllowedPackages(this)

        // System UI, launchers and our own app are always allowed through
        if (foregroundPackage == ownPackage) return
        if (isSystemPackage(foregroundPackage)) return

        // Check if user has explicitly allowed this package in their Suitcase
        if (allowedPackages.contains(foregroundPackage)) return

        // BLOCKED — bring blockWho back to foreground immediately
        Log.d(TAG, "Blocking foreground package: $foregroundPackage")
        bringBlockWhoToFront()
    }

    private fun bringBlockWhoToFront() {
        try {
            val intent = Intent(applicationContext, MainActivity::class.java).apply {
                addFlags(
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
                    Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
                )
                putExtra("FROM_BLOCKER", true)
            }
            applicationContext.startActivity(intent)
        } catch (e: Throwable) {
            Log.e(TAG, "Failed to bring blockWho to front", e)
        }
    }

    /**
     * Allow through any package that is a core Android system component,
     * launcher, or input method. We do NOT want to trap the user in a
     * boot loop or prevent emergency system dialogs.
     */
    private fun isSystemPackage(pkg: String): Boolean {
        return pkg.startsWith("com.android.") ||
               pkg.startsWith("android") ||
               pkg == "com.google.android.launcher" ||
               pkg.startsWith("com.sec.android.") || // Samsung
               pkg.startsWith("com.samsung.android.") ||
               pkg.startsWith("com.miui.") || // Xiaomi
               pkg.startsWith("com.huawei.") ||
               pkg.startsWith("com.oppo.") ||
               pkg.startsWith("com.oneplus.") ||
               pkg.startsWith("com.nothing.") ||
               pkg == "com.google.android.inputmethod.latin" ||
               pkg == "com.swiftkey.swiftkeyapp" ||
               pkg == "com.google.android.packageinstaller" ||
               pkg == "com.android.phone" ||
               pkg == "com.android.dialer" ||
               pkg == "com.google.android.dialer"
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
