package com.blockwho.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action == Intent.ACTION_BOOT_COMPLETED || intent?.action == Intent.ACTION_MY_PACKAGE_REPLACED) {
            Log.i("BootReceiver", "Device rebooted or package replaced — rescheduling routines")
            RoutineScheduler.reschedule(context)
        }
    }
}
