package com.blockwho.app

import android.content.Context
import android.content.SharedPreferences

/**
 * Central shared preferences manager.
 * Bridges state between the WebView JS layer and native Android services
 * (AccessibilityService, ForegroundService) that cannot access localStorage.
 */
object SharedPrefsManager {

    private const val PREFS_NAME = "blockwho_native_prefs"

    // Keys
    const val KEY_SESSION_ACTIVE = "session_active"
    const val KEY_SESSION_END_MS = "session_end_ms"
    const val KEY_ALLOWED_PACKAGES = "allowed_packages" // comma-separated
    const val KEY_PARACHUTES_COUNT = "parachutes_count"
    const val KEY_OWN_PACKAGE = "own_package"

    private fun prefs(ctx: Context): SharedPreferences =
        ctx.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun setSessionActive(ctx: Context, active: Boolean) {
        prefs(ctx).edit().putBoolean(KEY_SESSION_ACTIVE, active).apply()
    }

    fun isSessionActive(ctx: Context): Boolean =
        prefs(ctx).getBoolean(KEY_SESSION_ACTIVE, false)

    fun setSessionEndMs(ctx: Context, endMs: Long) {
        prefs(ctx).edit().putLong(KEY_SESSION_END_MS, endMs).apply()
    }

    fun getSessionEndMs(ctx: Context): Long =
        prefs(ctx).getLong(KEY_SESSION_END_MS, 0L)

    fun setAllowedPackages(ctx: Context, packages: Set<String>) {
        prefs(ctx).edit().putString(KEY_ALLOWED_PACKAGES, packages.joinToString(",")).apply()
    }

    fun getAllowedPackages(ctx: Context): Set<String> {
        val raw = prefs(ctx).getString(KEY_ALLOWED_PACKAGES, "") ?: ""
        return if (raw.isEmpty()) emptySet()
        else raw.split(",").map { it.trim() }.filter { it.isNotEmpty() }.toSet()
    }

    fun setParachutesCount(ctx: Context, count: Int) {
        prefs(ctx).edit().putInt(KEY_PARACHUTES_COUNT, count).apply()
    }

    fun getParachutesCount(ctx: Context): Int =
        prefs(ctx).getInt(KEY_PARACHUTES_COUNT, 1)

    fun setOwnPackage(ctx: Context, pkg: String) {
        prefs(ctx).edit().putString(KEY_OWN_PACKAGE, pkg).apply()
    }

    fun getOwnPackage(ctx: Context): String =
        prefs(ctx).getString(KEY_OWN_PACKAGE, "com.blockwho.app") ?: "com.blockwho.app"

    fun clearSession(ctx: Context) {
        prefs(ctx).edit()
            .putBoolean(KEY_SESSION_ACTIVE, false)
            .putLong(KEY_SESSION_END_MS, 0L)
            .apply()
    }
}
