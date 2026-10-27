package com.blockwho.app

import android.annotation.SuppressLint
import android.app.Activity
import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Process
import android.os.VibrationEffect
import android.os.Vibrator
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.view.WindowInsetsController
import android.view.WindowManager
import org.json.JSONArray
import org.json.JSONObject

class MainActivity : Activity() {

    private var webView: WebView? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // OLED midnight status and navigation bar styling with safe fallbacks
        try {
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS)
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION)
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
            window.statusBarColor = Color.parseColor("#131315")
            window.navigationBarColor = Color.parseColor("#131315")

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                window.insetsController?.setSystemBarsAppearance(
                    0,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS or WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
                )
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                @Suppress("DEPRECATION")
                window.decorView.systemUiVisibility = 0
            }
        } catch (e: Throwable) {
            e.printStackTrace()
        }

        // Store own package name in shared prefs so the accessibility service knows to allow it
        SharedPrefsManager.setOwnPackage(this, packageName)

        try {
            val wv = WebView(this)
            webView = wv
            wv.setBackgroundColor(Color.parseColor("#131315"))

            wv.settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                loadWithOverviewMode = true
                useWideViewPort = true
                displayZoomControls = false
                builtInZoomControls = false
                mediaPlaybackRequiresUserGesture = false
                cacheMode = WebSettings.LOAD_DEFAULT
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            }

            wv.webViewClient = object : WebViewClient() {
                @Deprecated("Deprecated in Java")
                override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                    return false
                }
            }

            wv.webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                    return super.onConsoleMessage(consoleMessage)
                }
            }

            // Expose Android Native Bridge for permission checks, session control, and haptics
            wv.addJavascriptInterface(WebAppInterface(this), "AndroidBridge")

            setContentView(wv)
            wv.loadUrl("file:///android_asset/index.html")
        } catch (e: Throwable) {
            e.printStackTrace()
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (SharedPrefsManager.isSessionActive(this)) {
            // Keep app alive in background during lockdown mode, do not destroy activity
            moveTaskToBack(true)
            return
        }
        val wv = webView
        if (wv != null && wv.canGoBack()) {
            wv.goBack()
        } else {
            @Suppress("DEPRECATION")
            super.onBackPressed()
        }
    }

    override fun onResume() {
        super.onResume()
        webView?.onResume()
        // Refresh permission badges and sync session progress
        webView?.evaluateJavascript(
            "if (window.refreshPermissionBadges) window.refreshPermissionBadges(); " +
            "if (window.refreshAccessibilityStatus) window.refreshAccessibilityStatus(); " +
            "if (window.syncSessionFromNative) window.syncSessionFromNative();",
            null
        )
    }

    override fun onPause() {
        super.onPause()
        webView?.onPause()
    }

    
    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        if (intent?.getBooleanExtra("FROM_BLOCKER", false) == true) {
            val blockedPkg = intent.getStringExtra("BLOCKED_PKG") ?: ""
            webView?.evaluateJavascript("if (typeof window.onNativeAppBlocked === 'function') { window.onNativeAppBlocked('$blockedPkg'); }", null)
        }
    }

    override fun onDestroy() {
        webView?.destroy()
        webView = null
        super.onDestroy()
    }

    // ============================================================
    // JavaScript Bridge
    // ============================================================
    class WebAppInterface(private val activity: Activity) {

        @JavascriptInterface
        fun isAndroid(): Boolean = true

        @JavascriptInterface
        fun getAppVersion(): String = "2.2.0"

        // ---- Permissions ----

        @JavascriptInterface
        fun hasUsageStatsPermission(): Boolean {
            return try {
                val appOps = activity.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager ?: return false
                val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    appOps.unsafeCheckOpNoThrow(
                        AppOpsManager.OPSTR_GET_USAGE_STATS,
                        Process.myUid(),
                        activity.packageName
                    )
                } else {
                    @Suppress("DEPRECATION")
                    appOps.checkOpNoThrow(
                        AppOpsManager.OPSTR_GET_USAGE_STATS,
                        Process.myUid(),
                        activity.packageName
                    )
                }
                mode == AppOpsManager.MODE_ALLOWED
            } catch (e: Throwable) {
                false
            }
        }

        @JavascriptInterface
        fun requestUsageStatsPermission() {
            try {
                val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                    data = Uri.parse("package:${activity.packageName}")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                activity.startActivity(intent)
            } catch (e: Throwable) {
                try {
                    activity.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    })
                } catch (err: Throwable) {
                    err.printStackTrace()
                }
            }
        }

        @JavascriptInterface
        fun hasOverlayPermission(): Boolean {
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    Settings.canDrawOverlays(activity)
                } catch (e: Throwable) {
                    false
                }
            } else {
                true
            }
        }

        @JavascriptInterface
        fun requestOverlayPermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    val intent = Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:${activity.packageName}")
                    ).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    activity.startActivity(intent)
                } catch (e: Throwable) {
                    try {
                        activity.startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK
                        })
                    } catch (err: Throwable) {
                        err.printStackTrace()
                    }
                }
            }
        }

        @JavascriptInterface
        fun hasNotificationPermission(): Boolean {
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                activity.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
            } else {
                try {
                    val nm = activity.getSystemService(Context.NOTIFICATION_SERVICE) as? android.app.NotificationManager
                    nm?.areNotificationsEnabled() ?: true
                } catch (e: Throwable) {
                    true
                }
            }
        }

        @JavascriptInterface
        fun requestNotificationPermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                try {
                    activity.requestPermissions(arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 1001)
                } catch (e: Throwable) {
                    openNotificationSettings()
                }
            } else {
                openNotificationSettings()
            }
        }

        @JavascriptInterface
        fun openNotificationSettings() {
            try {
                val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                    putExtra(Settings.EXTRA_APP_PACKAGE, activity.packageName)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                activity.startActivity(intent)
            } catch (e: Throwable) {
                try {
                    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                        data = Uri.parse("package:${activity.packageName}")
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    activity.startActivity(intent)
                } catch (err: Throwable) {
                    err.printStackTrace()
                }
            }
        }

        // ---- Accessibility Service ----

        /**
         * Returns true if the BlockerAccessibilityService is currently enabled
         * in Android Accessibility Settings.
         */
        @JavascriptInterface
        fun hasAccessibilityPermission(): Boolean {
            return try {
                val am = activity.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager
                    ?: return false
                val enabledServices = Settings.Secure.getString(
                    activity.contentResolver,
                    Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
                ) ?: ""
                enabledServices.contains(activity.packageName + "/" + BlockerAccessibilityService::class.java.name)
            } catch (e: Throwable) {
                false
            }
        }

        /**
         * Opens the Android Accessibility Settings page so the user can enable
         * the BlockerAccessibilityService.
         */
        @JavascriptInterface
        fun requestAccessibilityPermission() {
            try {
                val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                activity.startActivity(intent)
            } catch (e: Throwable) {
                e.printStackTrace()
            }
        }

        // ---- Session Control ----

        /**
         * Called by the JS layer when a lockdown session begins.
         * Activates the native blocking layer and starts the foreground service.
         *
         * @param durationSeconds Total session duration in seconds
         * @param allowedPackagesJson JSON array of package name strings that are whitelisted
         * @param parachutesCount Number of parachutes remaining
         */
        @JavascriptInterface
        fun startBlockingSession(durationSeconds: Int, allowedPackagesJson: String, parachutesCount: Int) {
            try {
                val endMs = System.currentTimeMillis() + (durationSeconds.toLong() * 1000L)

                // Parse allowed packages from JSON
                val allowed = mutableSetOf<String>()
                // Always allow our own package + essential dialer/emergency
                allowed.add(activity.packageName)
                allowed.add("com.android.dialer")
                allowed.add("com.google.android.dialer")
                allowed.add("com.android.phone")

                try {
                    val arr = JSONArray(allowedPackagesJson)
                    for (i in 0 until arr.length()) {
                        val pkg = arr.optString(i)
                        if (pkg.isNotEmpty()) allowed.add(pkg)
                    }
                } catch (e: Throwable) {
                    e.printStackTrace()
                }

                SharedPrefsManager.setAllowedPackages(activity, allowed)
                SharedPrefsManager.setSessionEndMs(activity, endMs)
                SharedPrefsManager.setParachutesCount(activity, parachutesCount)
                SharedPrefsManager.setSessionActive(activity, true)

                // Start foreground service on UI thread to ensure Activity foreground state
                activity.runOnUiThread {
                    try {
                        BlockerForegroundService.start(activity, endMs)
                    } catch (e: Throwable) {
                        e.printStackTrace()
                    }
                }
            } catch (e: Throwable) {
                e.printStackTrace()
            }
        }

        /**
         * Called by the JS layer when a session ends (timer complete or parachute used).
         */
        @JavascriptInterface
        fun stopBlockingSession() {
            try {
                SharedPrefsManager.clearSession(activity)
                activity.runOnUiThread {
                    try {
                        BlockerForegroundService.stop(activity)
                    } catch (e: Throwable) {
                        e.printStackTrace()
                    }
                }
            } catch (e: Throwable) {
                e.printStackTrace()
            }
        }

        /**
         * Launches an installed application by package name from the Suitcase dock.
         */
        @JavascriptInterface
        fun launchApp(packageName: String): Boolean {
            return try {
                val launchIntent = activity.packageManager.getLaunchIntentForPackage(packageName)
                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    activity.startActivity(launchIntent)
                    true
                } else {
                    false
                }
            } catch (e: Throwable) {
                e.printStackTrace()
                false
            }
        }

        /**
         * Returns true if a native blocking session is currently active
         * (used to restore state after app restart).
         */
        @JavascriptInterface
        fun isBlockingSessionActive(): Boolean {
            return SharedPrefsManager.isSessionActive(activity)
        }

        /**
         * Returns remaining seconds in the active native session (0 if none).
         */
        @JavascriptInterface
        fun getSessionRemainingSeconds(): Int {
            val endMs = SharedPrefsManager.getSessionEndMs(activity)
            if (endMs <= 0) return 0
            val remaining = (endMs - System.currentTimeMillis()) / 1000
            return if (remaining > 0) remaining.toInt() else 0
        }

        // ---- Installed Apps (for Suitcase packing) ----

        /**
         * Returns a JSON array of all launchable user apps installed on the device.
         * Each entry: { "pkg": "com.example.app", "name": "App Name" }
         */
        @JavascriptInterface
        fun getInstalledApps(): String {
            return try {
                val pm = activity.packageManager
                val launchableIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
                val resolveInfos = pm.queryIntentActivities(launchableIntent, 0)
                val seenPackages = mutableSetOf<String>()
                val result = JSONArray()

                val sorted = resolveInfos.sortedBy { it.loadLabel(pm).toString().lowercase() }

                for (resolveInfo in sorted) {
                    val pkg = resolveInfo.activityInfo?.packageName ?: continue
                    if (pkg == activity.packageName || pkg == "android" || pkg == "com.android.systemui") continue
                    if (seenPackages.contains(pkg)) continue
                    seenPackages.add(pkg)

                    try {
                        val name = resolveInfo.loadLabel(pm).toString()
                        val obj = JSONObject().apply {
                            put("pkg", pkg)
                            put("name", name)
                        }
                        result.put(obj)
                    } catch (ignored: Throwable) {}
                }

                result.toString()
            } catch (e: Throwable) {
                "[]"
            }
        }

        /**
         * Dynamically updates the allowed packages list in SharedPrefsManager
         * so adding or toggling apps in the Suitcase takes effect immediately.
         */
        @JavascriptInterface
        fun updateAllowedPackages(allowedPackagesJson: String) {
            try {
                val allowed = mutableSetOf<String>()
                allowed.add(activity.packageName)
                allowed.add("com.android.dialer")
                allowed.add("com.google.android.dialer")
                allowed.add("com.android.phone")

                try {
                    val arr = JSONArray(allowedPackagesJson)
                    for (i in 0 until arr.length()) {
                        val pkg = arr.optString(i)
                        if (pkg.isNotEmpty()) allowed.add(pkg)
                    }
                } catch (e: Throwable) {
                    e.printStackTrace()
                }

                SharedPrefsManager.setAllowedPackages(activity, allowed)
            } catch (e: Throwable) {
                e.printStackTrace()
            }
        }

        @JavascriptInterface
        fun setStrictMode(strict: Boolean) {
            SharedPrefsManager.setStrictMode(activity, strict)
        }

        // ---- Haptic Feedback ----

        @JavascriptInterface
        fun vibrate(milliseconds: Long) {
            try {
                val vibrator = activity.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator?.vibrate(VibrationEffect.createOneShot(milliseconds.coerceAtLeast(10), VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator?.vibrate(milliseconds.coerceAtLeast(10))
                }
            } catch (e: Throwable) {
                e.printStackTrace()
            }
        }
    }
}
