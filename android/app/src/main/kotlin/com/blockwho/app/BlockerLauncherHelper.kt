package com.blockwho.app

import android.app.ActivityOptions
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log

object BlockerLauncherHelper {

    private const val TAG = "BlockerLauncherHelper"
    @Volatile private var lastBringToFrontMs = 0L

    /**
     * Known home launcher package names across Android OEM and third-party launchers.
     */
    private val KNOWN_LAUNCHERS = setOf(
        "com.google.android.apps.nexuslauncher", // Pixel launcher
        "com.android.launcher",
        "com.android.launcher2",
        "com.android.launcher3",
        "com.sec.android.app.launcher",          // Samsung One UI Home
        "com.miui.home",                         // Xiaomi MIUI / HyperOS
        "com.mi.android.globallauncher",         // POCO Launcher
        "com.huawei.android.launcher",           // Huawei EMUI / HarmonyOS
        "com.oppo.launcher",                     // Oppo ColorOS
        "com.coloros.launcher",
        "com.oneplus.launcher",                  // OnePlus OxygenOS
        "com.motorola.launcher3",                // Motorola
        "com.motorola.motozit",
        "com.nothing.launcher",                  // Nothing OS
        "com.transsion.hilauncher",              // Tecno HiOS
        "com.transsion.xoslauncher",              // Infinix XOS
        "com.smartisanos.launcher",
        "com.asus.launcher",                     // ASUS ZenUI
        "com.lge.launcher2",                     // LG Home
        "com.lge.launcher3",
        "com.sonymobile.home",                   // Sony Xperia Home
        "com.teslacoilsw.launcher",              // Nova Launcher
        "ch.deletescape.lawnchair",              // Lawnchair
        "ch.deletescape.lawnchair.plah",
        "app.lawnchair",
        "com.microsoft.launcher",                // Microsoft Launcher
        "com.niagara.launcher",                  // Niagara Launcher
        "bitpit.launcher",                       // Niagara Launcher
        "com.actionlauncher.playstore",          // Action Launcher
        "com.smartlauncher",                     // Smart Launcher
        "ginlemon.flowerfree",                   // Smart Launcher 3
        "com.google.android.googlequicksearchbox" // Google Feed integration inside home
    )

    /**
     * Returns true if the package is a home launcher.
     */
    fun isLauncherPackage(ctx: Context, pkg: String?): Boolean {
        if (pkg.isNullOrEmpty()) return false
        if (KNOWN_LAUNCHERS.contains(pkg)) return true

        return try {
            val pm = ctx.packageManager
            val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)

            // 1. Current resolved default launcher
            val defaultLauncher = pm.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY)
            if (defaultLauncher?.activityInfo?.packageName == pkg) return true

            // 2. Query all activities handling home intent
            val resolveInfos = pm.queryIntentActivities(intent, 0)
            for (info in resolveInfos) {
                if (info.activityInfo?.packageName == pkg) return true
            }
            false
        } catch (e: Throwable) {
            false
        }
    }

    /**
     * Brings blockWho to the foreground.
     * Uses PendingIntent and ActivityOptions where supported to reliably bypass
     * background activity start restrictions on Android 10-14+.
     */
    fun bringBlockWhoToFront(ctx: Context, blockedPkg: String? = null) {
        val now = System.currentTimeMillis()
        if (now - lastBringToFrontMs < 400) {
            // Debounce to prevent intent spamming
            return
        }
        lastBringToFrontMs = now

        try {
            val appContext = ctx.applicationContext
            val intent = Intent(appContext, MainActivity::class.java).apply {
                action = Intent.ACTION_MAIN
                addCategory(Intent.CATEGORY_LAUNCHER)
                addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP
                )
                putExtra("FROM_BLOCKER", true)
                if (!blockedPkg.isNullOrEmpty()) {
                    putExtra("BLOCKED_PKG", blockedPkg)
                }
            }

            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }

            val pendingIntent = PendingIntent.getActivity(appContext, 1005, intent, flags)

            // On Android 14+ (API 34+), request MODE_BACKGROUND_ACTIVITY_START_ALLOWED
            if (Build.VERSION.SDK_INT >= 34) {
                try {
                    val options = ActivityOptions.makeBasic()
                    val method = options.javaClass.getMethod(
                        "setPendingIntentBackgroundActivityStartMode",
                        Int::class.javaPrimitiveType
                    )
                    method.invoke(options, 1) // 1 = MODE_BACKGROUND_ACTIVITY_START_ALLOWED
                    pendingIntent.send(appContext, 0, null, null, null, null, options.toBundle())
                    Log.d(TAG, "Brought blockWho to front via PendingIntent with ActivityOptions")
                    return
                } catch (t: Throwable) {
                    // Fallback to standard pendingIntent.send()
                }
            }

            try {
                pendingIntent.send()
                Log.d(TAG, "Brought blockWho to front via PendingIntent")
            } catch (e: Throwable) {
                appContext.startActivity(intent)
                Log.d(TAG, "Brought blockWho to front via startActivity fallback")
            }
        } catch (e: Throwable) {
            Log.e(TAG, "Failed to bring blockWho to front", e)
        }
    }
}
