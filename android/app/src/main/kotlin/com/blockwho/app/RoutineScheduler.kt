package com.blockwho.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import org.json.JSONArray
import java.util.Calendar

object RoutineScheduler {
    private const val TAG = "RoutineScheduler"
    private const val ALARM_REQUEST_CODE = 4401

    fun scheduleRoutines(context: Context, routinesJson: String) {
        SharedPrefsManager.setRoutinesJson(context, routinesJson)
        reschedule(context)
    }

    fun reschedule(context: Context) {
        val rawJson = SharedPrefsManager.getRoutinesJson(context)
        if (rawJson.isEmpty()) {
            cancelAlarm(context)
            return
        }

        try {
            val arr = JSONArray(rawJson)
            var earliestTriggerMs = Long.MAX_VALUE
            var nextRoutineName = ""
            var nextRoutineDuration = 60

            val now = Calendar.getInstance()

            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val active = obj.optBoolean("active", false)
                if (!active) continue

                val name = obj.optString("name", "Focus Routine")
                val timeStr = obj.optString("time", "09:00") // "HH:MM"
                val duration = obj.optInt("duration", 60)
                val daysArr = obj.optJSONArray("days") ?: JSONArray()
                val daysSet = mutableSetOf<String>()
                for (d in 0 until daysArr.length()) {
                    daysSet.add(daysArr.optString(d))
                }

                val timeParts = timeStr.split(":")
                if (timeParts.size != 2) continue
                val rHour = timeParts[0].toIntOrNull() ?: 9
                val rMinute = timeParts[1].toIntOrNull() ?: 0

                val nextMs = getNextOccurrence(now, rHour, rMinute, daysSet)
                if (nextMs in (now.timeInMillis + 1000)..earliestTriggerMs) {
                    earliestTriggerMs = nextMs
                    nextRoutineName = name
                    nextRoutineDuration = duration
                }
            }

            if (earliestTriggerMs != Long.MAX_VALUE) {
                setAlarm(context, earliestTriggerMs, nextRoutineName, nextRoutineDuration)
                Log.i(TAG, "Scheduled next routine '$nextRoutineName' ($nextRoutineDuration min) for timestamp $earliestTriggerMs")
            } else {
                cancelAlarm(context)
            }
        } catch (e: Throwable) {
            Log.e(TAG, "Error in reschedule", e)
        }
    }

    private fun getNextOccurrence(now: Calendar, hour: Int, minute: Int, daysSet: Set<String>): Long {
        val dayMap = mapOf(
            Calendar.SUNDAY to "Sun",
            Calendar.MONDAY to "Mon",
            Calendar.TUESDAY to "Tue",
            Calendar.WEDNESDAY to "Wed",
            Calendar.THURSDAY to "Thu",
            Calendar.FRIDAY to "Fri",
            Calendar.SATURDAY to "Sat"
        )

        // Check the next 14 days for the nearest matching scheduled time
        for (offset in 0..14) {
            val candidate = Calendar.getInstance().apply {
                timeInMillis = now.timeInMillis
                add(Calendar.DAY_OF_YEAR, offset)
                set(Calendar.HOUR_OF_DAY, hour)
                set(Calendar.MINUTE, minute)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }

            val dayName = dayMap[candidate.get(Calendar.DAY_OF_WEEK)] ?: ""
            if (daysSet.isEmpty() || daysSet.contains(dayName)) {
                if (candidate.timeInMillis > now.timeInMillis + 5000) {
                    return candidate.timeInMillis
                }
            }
        }
        return Long.MAX_VALUE
    }

    private fun setAlarm(context: Context, triggerMs: Long, routineName: String, durationMinutes: Int) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val intent = Intent(context, RoutineAlarmReceiver::class.java).apply {
            putExtra("ROUTINE_NAME", routineName)
            putExtra("ROUTINE_DURATION", durationMinutes)
        }
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        val pendingIntent = PendingIntent.getBroadcast(context, ALARM_REQUEST_CODE, intent, flags)

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerMs, pendingIntent)
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerMs, pendingIntent)
            }
        } catch (e: SecurityException) {
            // Android 12+ fallback if SCHEDULE_EXACT_ALARM is not granted
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerMs, pendingIntent)
        } catch (e: Throwable) {
            alarmManager.set(AlarmManager.RTC_WAKEUP, triggerMs, pendingIntent)
        }
    }

    fun cancelAlarm(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val intent = Intent(context, RoutineAlarmReceiver::class.java)
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        val pendingIntent = PendingIntent.getBroadcast(context, ALARM_REQUEST_CODE, intent, flags)
        alarmManager.cancel(pendingIntent)
    }
}
