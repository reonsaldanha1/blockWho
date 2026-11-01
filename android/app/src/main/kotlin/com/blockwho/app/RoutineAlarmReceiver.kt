package com.blockwho.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.PowerManager
import android.util.Log

class RoutineAlarmReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "RoutineAlarmReceiver"
    }

    override fun onReceive(context: Context, intent: Intent?) {
        Log.i(TAG, "RoutineAlarmReceiver fired!")

        val pm = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
        val wakeLock = pm?.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "blockwho:routine_alarm_lock")
        try {
            wakeLock?.acquire(15000)
        } catch (ignored: Throwable) {}

        try {
            val routineName = intent?.getStringExtra("ROUTINE_NAME") ?: "Focus Routine"
            val durationMinutes = intent?.getIntExtra("ROUTINE_DURATION", 60) ?: 60

            val isAlreadyLocked = SharedPrefsManager.isSessionActive(context)
            if (!isAlreadyLocked) {
                // Activate native blocking session immediately
                val durationSeconds = durationMinutes * 60
                val endMs = System.currentTimeMillis() + (durationSeconds.toLong() * 1000L)

                SharedPrefsManager.setSessionEndMs(context, endMs)
                SharedPrefsManager.setSessionActive(context, true)
                BlockerForegroundService.start(context, endMs)

                // Launch MainActivity to show lockout UI
                val launchIntent = Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                    putExtra("FROM_ROUTINE", true)
                    putExtra("ROUTINE_NAME", routineName)
                    putExtra("ROUTINE_DURATION", durationMinutes)
                }
                context.startActivity(launchIntent)
            }

            // Schedule the subsequent routine
            RoutineScheduler.reschedule(context)
        } catch (e: Throwable) {
            Log.e(TAG, "Error handling routine alarm", e)
        } finally {
            try {
                if (wakeLock?.isHeld == true) wakeLock.release()
            } catch (ignored: Throwable) {}
        }
    }
}
