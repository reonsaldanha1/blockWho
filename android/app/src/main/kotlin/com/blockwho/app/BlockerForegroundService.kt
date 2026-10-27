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
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat

/**
 * BlockerForegroundService
 *
 * A foreground service that keeps the session alive even when the user
 * closes or minimizes the app during lockdown mode. It:
 * 1. Shows a persistent status-bar countdown notification.
 * 2. Holds a partial WakeLock to keep the session alive in the background.
 * 3. Survives task removal (closing from recent apps) via onTaskRemoved and AlarmManager.
 * 4. Runs a background watchdog thread that redirects back to blockWho if the
 *    home launcher or unauthorized apps are opened.
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
    private var wakeLock: PowerManager.WakeLock? = null
    private var lastNotifUpdateMs = 0L

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
                val endMs = intent.getLongExtra(EXTRA_SESSION_END_MS, 0L)
                val remainingMs = endMs - System.currentTimeMillis()
                acquireWakeLock(remainingMs)

                try {
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
                    releaseWakeLock()
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

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        Log.i(TAG, "onTaskRemoved: app closed in lockdown mode, maintaining background service")
        if (SharedPrefsManager.isSessionActive(this)) {
            val endMs = SharedPrefsManager.getSessionEndMs(this)
            if (endMs > System.currentTimeMillis()) {
                val restartIntent = Intent(applicationContext, BlockerForegroundService::class.java).apply {
                    action = ACTION_START
                    putExtra(EXTRA_SESSION_END_MS, endMs)
                    setPackage(packageName)
                }
                val pendingIntent = PendingIntent.getService(
                    applicationContext,
                    1006,
                    restartIntent,
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
                    } else {
                        PendingIntent.FLAG_ONE_SHOT
                    }
                )
                val alarmMgr = getSystemService(Context.ALARM_SERVICE) as? android.app.AlarmManager
                try {
                    alarmMgr?.setExactAndAllowWhileIdle(
                        android.app.AlarmManager.RTC_WAKEUP,
                        System.currentTimeMillis() + 1000,
                        pendingIntent
                    )
                } catch (e: Throwable) {
                    try {
                        alarmMgr?.set(
                            android.app.AlarmManager.RTC_WAKEUP,
                            System.currentTimeMillis() + 1000,
                            pendingIntent
                        )
                    } catch (ignored: Throwable) {}
                }
            }
        }
    }

    private fun acquireWakeLock(durationMs: Long) {
        try {
            val pm = getSystemService(Context.POWER_SERVICE) as? PowerManager
            if (wakeLock == null) {
                wakeLock = pm?.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "blockWho:LockdownWakeLock")?.apply {
                    setReferenceCounted(false)
                }
            }
            wakeLock?.let {
                if (!it.isHeld) {
                    val timeout = if (durationMs > 0) durationMs + 60_000L else 12 * 3600 * 1000L
                    it.acquire(timeout)
                    Log.i(TAG, "Acquired WakeLock for $timeout ms")
                }
            }
        } catch (e: Throwable) {
            Log.e(TAG, "Failed to acquire WakeLock", e)
        }
    }

    private fun releaseWakeLock() {
        try {
            wakeLock?.let {
                if (it.isHeld) {
                    it.release()
                    Log.i(TAG, "Released WakeLock")
                }
            }
        } catch (e: Throwable) {
            Log.e(TAG, "Failed to release WakeLock", e)
        }
    }

    /**
     * Dual-layer backup watchdog:
     * 1. Monitors foreground packages via UsageStatsManager.
     * 2. If the Home Launcher is open during lockdown, redirects back to blockWho.
     * 3. If an unauthorized app is open, closes/redirects.
     * 4. Updates the notification status countdown periodically.
     */
    private fun startWatcher() {
        if (isWatching) return
        isWatching = true
        watcherThread = Thread {
            Log.d(TAG, "Watchdog loop started")
            while (isWatching && SharedPrefsManager.isSessionActive(this)) {
                try {
                    Thread.sleep(500)
                    if (!isWatching || !SharedPrefsManager.isSessionActive(this)) break

                    val endMs = SharedPrefsManager.getSessionEndMs(this)
                    val now = System.currentTimeMillis()
                    if (endMs > 0 && now >= endMs) {
                        SharedPrefsManager.clearSession(this)
                        stopSelf()
                        break
                    }

                    // Periodically refresh notification timer (every 10 seconds)
                    if (now - lastNotifUpdateMs > 10_000) {
                        lastNotifUpdateMs = now
                        updateNotification(endMs)
                    }

                    val topPackage = getForegroundPackage()
                    if (topPackage != null) {
                        val ownPackage = SharedPrefsManager.getOwnPackage(this)
                        val allowed = SharedPrefsManager.getAllowedPackages(this)

                        // 1. Home Launcher opened during lockdown -> redirect back to blockWho!
                        if (BlockerLauncherHelper.isLauncherPackage(this, topPackage)) {
                            Log.w(TAG, "Watchdog detected launcher in foreground: $topPackage - redirecting to app")
                            BlockerLauncherHelper.bringBlockWhoToFront(this)
                        }
                        // 2. Unauthorized app opened
                        else if (!BlockerAccessibilityService.isRunning &&
                            topPackage != ownPackage &&
                            topPackage != "android" &&
                            topPackage != "com.android.systemui" &&
                            topPackage != "com.google.android.dialer" &&
                            topPackage != "com.android.dialer" &&
                            topPackage != "com.android.phone" &&
                            !allowed.contains(topPackage)) {
                            Log.w(TAG, "Watchdog found non-allowed foreground pkg: $topPackage")
                            BlockerLauncherHelper.bringBlockWhoToFront(this, topPackage)
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

    private fun updateNotification(sessionEndMs: Long) {
        try {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            val notification = buildSessionNotification(sessionEndMs)
            nm?.notify(NOTIFICATION_ID, notification)
        } catch (e: Throwable) {
            // ignore
        }
    }

    private fun buildSessionNotification(sessionEndMs: Long): Notification {
        val tapIntent = Intent(this, MainActivity::class.java).apply {
            action = Intent.ACTION_MAIN
            addCategory(Intent.CATEGORY_LAUNCHER)
            addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
                Intent.FLAG_ACTIVITY_SINGLE_TOP
            )
        }
        val pendingFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        else
            PendingIntent.FLAG_UPDATE_CURRENT
        val tapPending = PendingIntent.getActivity(this, 0, tapIntent, pendingFlags)

        val remainingMs = sessionEndMs - System.currentTimeMillis()
        val remainingMins = if (remainingMs > 0) (remainingMs / 60_000).toInt() else 0
        val remainingHours = remainingMins / 60
        val displayMins = remainingMins % 60

        val timeText = when {
            remainingHours > 0 -> "${remainingHours}h ${displayMins}m remaining · Lockdown active"
            remainingMins > 0 -> "$remainingMins min remaining · Lockdown active"
            else -> "Lockdown session active · Stay focused"
        }

        val iconRes = try {
            val resId = resources.getIdentifier("ic_launcher", "mipmap", packageName)
            if (resId != 0) resId else android.R.drawable.ic_lock_idle_lock
        } catch (e: Throwable) {
            android.R.drawable.ic_lock_idle_lock
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("\uD83D\uDD12 blockWho Lockdown Mode")
            .setContentText(timeText)
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
        releaseWakeLock()
        isRunning = false
        Log.i(TAG, "BlockerForegroundService destroyed")
    }
}
