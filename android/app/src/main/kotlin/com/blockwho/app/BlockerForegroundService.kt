package com.blockwho.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat

/**
 * BlockerForegroundService
 *
 * A foreground service that keeps the session alive even when the user
 * minimizes the app. It:
 * 1. Shows a persistent status-bar notification ("Session in progress").
 * 2. Holds a WakeLock-equivalent priority so Android doesn't kill the process.
 * 3. Includes an active background watchdog thread that verifies the foreground app
 *    against the Suitcase allowed packages as a dual-layer backup to AccessibilityService.
 */
class BlockerForegroundService : Service() {

    companion object {
        private const val TAG = "BlockerForegroundSvc"
        const val CHANNEL_ID = "blockwho_session_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "com.blockwho.app.ACTION_START_SESSION"
        const val ACTION_STOP = "com.blockwho.app.ACTION_STOP_SESSION"
        const val EXTRA_SESSION_END_MS = "session_end_ms"

        @Volatile var isRunning = false

        fun start(ctx: Context, sessionEndMs: Long) {
            try {
                val intent = Intent(ctx, BlockerForegroundService::class.java).apply {
                    action = ACTION_START
                    putExtra(EXTRA_SESSION_END_MS, sessionEndMs)
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    ctx.startForegroundService(intent)
                } else {
                    ctx.startService(intent)
                }
            } catch (e: Throwable) {
                Log.e(TAG, "Failed to start BlockerForegroundService", e)
            }
        }

        fun stop(ctx: Context) {
            try {
                val intent = Intent(ctx, BlockerForegroundService::class.java).apply {
                    action = ACTION_STOP
                }
                ctx.startService(intent)
            } catch (e: Throwable) {
                Log.e(TAG, "Failed to stop BlockerForegroundService", e)
            }
        }
    }

    private var watcherThread: Thread? = null
    @Volatile private var isWatching = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        isRunning = true
        Log.i(TAG, "BlockerForegroundService created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                try {
                    val endMs = intent.getLongExtra(EXTRA_SESSION_END_MS, 0L)
                    val notification = buildSessionNotification(endMs)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        ServiceCompat.startForeground(
                            this,
                            NOTIFICATION_ID,
                            notification,
                            ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
                        )
                    } else {
                        startForeground(NOTIFICATION_ID, notification)
                    }
                    Log.i(TAG, "Session foreground service started, ends at $endMs")
                    startWatcher()
                } catch (e: Throwable) {
                    Log.e(TAG, "Failed to start foreground service", e)
                    try {
                        val endMs = intent.getLongExtra(EXTRA_SESSION_END_MS, 0L)
                        val notification = buildSessionNotification(endMs)
                        startForeground(NOTIFICATION_ID, notification)
                        startWatcher()
                    } catch (err: Throwable) {
                        Log.e(TAG, "Fallback startForeground also failed", err)
                    }
                }
            }
            ACTION_STOP -> {
                try {
                    isWatching = false
                    watcherThread?.interrupt()
                    watcherThread = null
                    ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
                    stopSelf()
                    isRunning = false
                    Log.i(TAG, "Session foreground service stopped")
                } catch (e: Throwable) {
                    Log.e(TAG, "Failed to stop foreground service", e)
                }
            }
        }
        return START_STICKY
    }

    /**
     * Dual-layer backup watchdog:
     * Periodically queries UsageStatsManager to catch and close unauthorized apps
     * if the Accessibility Service is temporarily inactive.
     */
    private fun startWatcher() {
        if (isWatching) return
        isWatching = true
        watcherThread = Thread {
            Log.d(TAG, "Watchdog loop started")
            while (isWatching && SharedPrefsManager.isSessionActive(this)) {
                try {
                    Thread.sleep(600)
                    if (!isWatching || !SharedPrefsManager.isSessionActive(this)) break

                    val endMs = SharedPrefsManager.getSessionEndMs(this)
                    if (endMs > 0 && System.currentTimeMillis() >= endMs) {
                        SharedPrefsManager.clearSession(this)
                        stopSelf()
                        break
                    }

                    // Only run watchdog fallback if accessibility service is not active
                    if (!BlockerAccessibilityService.isRunning) {
                        val topPackage = getForegroundPackage()
                        if (topPackage != null) {
                            val ownPackage = SharedPrefsManager.getOwnPackage(this)
                            val allowed = SharedPrefsManager.getAllowedPackages(this)
                            if (topPackage != ownPackage &&
                                topPackage != "android" &&
                                topPackage != "com.android.systemui" &&
                                topPackage != "com.google.android.dialer" &&
                                topPackage != "com.android.dialer" &&
                                topPackage != "com.android.phone" &&
                                !allowed.contains(topPackage)) {
                                Log.w(TAG, "Watchdog found non-allowed foreground pkg: $topPackage")
                                val bringIntent = Intent(applicationContext, MainActivity::class.java).apply {
                                    addFlags(
                                        Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
                                        Intent.FLAG_ACTIVITY_NEW_TASK or
                                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                                    )
                                    putExtra("FROM_BLOCKER", true)
                                    putExtra("BLOCKED_PKG", topPackage)
                                }
                                applicationContext.startActivity(bringIntent)
                            }
                        }
                    }
                } catch (e: InterruptedException) {
                    break
                } catch (e: Throwable) {
                    // ignore
                }
            }
            isWatching = false
        }.apply {
            isDaemon = true
            start()
        }
    }

    private fun getForegroundPackage(): String? {
        return try {
            val usm = getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager ?: return null
            val time = System.currentTimeMillis()
            val events = usm.queryEvents(time - 2500, time)
            var lastPkg: String? = null
            val event = UsageEvents.Event()
            while (events.hasNextEvent()) {
                events.getNextEvent(event)
                if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED ||
                    event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                    lastPkg = event.packageName
                }
            }
            lastPkg
        } catch (e: Throwable) {
            null
        }
    }

    private fun buildSessionNotification(sessionEndMs: Long): Notification {
        val tapIntent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        val pendingFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        else
            PendingIntent.FLAG_UPDATE_CURRENT
        val tapPending = PendingIntent.getActivity(this, 0, tapIntent, pendingFlags)

        val remainingMs = sessionEndMs - System.currentTimeMillis()
        val remainingMins = if (remainingMs > 0) (remainingMs / 60_000).toInt() else 0

        val iconRes = try {
            val resId = resources.getIdentifier("ic_launcher", "mipmap", packageName)
            if (resId != 0) resId else android.R.drawable.ic_lock_idle_lock
        } catch (e: Throwable) {
            android.R.drawable.ic_lock_idle_lock
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("\uD83D\uDD12 blockWho Session Active")
            .setContentText(
                if (remainingMins > 0) "$remainingMins min remaining · Stay focused"
                else "Session in progress · Stay focused"
            )
            .setSmallIcon(iconRes)
            .setOngoing(true)
            .setShowWhen(false)
            .setContentIntent(tapPending)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Active Focus Session",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows progress during active focus lockdown"
                setShowBadge(false)
                enableVibration(false)
            }
            val nm = getSystemService(NotificationManager::class.java)
            nm?.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        isWatching = false
        watcherThread?.interrupt()
        isRunning = false
        Log.i(TAG, "BlockerForegroundService destroyed")
    }
}
