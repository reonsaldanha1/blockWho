package com.blockwho.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat

/**
 * BlockerForegroundService
 *
 * A foreground service that keeps the session alive even when the user
 * minimizes the app. It:
 * 1. Shows a persistent status-bar notification ("Session in progress").
 * 2. Holds a WakeLock-equivalent priority so Android doesn't kill the process.
 * 3. Receives START/STOP intents from MainActivity/WebView bridge.
 *
 * This mirrors how BlockIt ensures sessions survive app minimization.
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
            val intent = Intent(ctx, BlockerForegroundService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_SESSION_END_MS, sessionEndMs)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ctx.startForegroundService(intent)
            } else {
                ctx.startService(intent)
            }
        }

        fun stop(ctx: Context) {
            val intent = Intent(ctx, BlockerForegroundService::class.java).apply {
                action = ACTION_STOP
            }
            ctx.startService(intent)
        }
    }

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
                val notification = buildSessionNotification(endMs)
                startForeground(NOTIFICATION_ID, notification)
                Log.i(TAG, "Session foreground service started, ends at $endMs")
            }
            ACTION_STOP -> {
                stopForeground(true)
                stopSelf()
                isRunning = false
                Log.i(TAG, "Session foreground service stopped")
            }
        }
        return START_STICKY
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

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("🔒 blockWho Session Active")
            .setContentText(
                if (remainingMins > 0) "$remainingMins min remaining · Stay focused"
                else "Session in progress · Stay focused"
            )
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setOngoing(true)
            .setShowWhen(false)
            .setContentIntent(tapPending)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "blockWho Session",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Persistent notification during active focus sessions"
                setShowBadge(false)
                enableLights(false)
                enableVibration(false)
            }
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            nm?.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        Log.i(TAG, "BlockerForegroundService destroyed")
    }
}
