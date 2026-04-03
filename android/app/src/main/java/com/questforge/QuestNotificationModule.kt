package com.questforge

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class QuestNotificationModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    private const val CHANNEL_ID = "questforge_reminders"
    private const val CHANNEL_NAME = "Quest Reminders"
    private const val CHANNEL_DESCRIPTION = "Quest due soon and overdue reminders"
  }

  override fun getName(): String = "QuestNotificationModule"

  @ReactMethod
  fun sendNotification(title: String, message: String, notificationId: String?) {
    createNotificationChannel()

    val launchIntent =
      reactContext.packageManager.getLaunchIntentForPackage(reactContext.packageName)?.apply {
        flags =
          Intent.FLAG_ACTIVITY_NEW_TASK or
            Intent.FLAG_ACTIVITY_CLEAR_TOP or
            Intent.FLAG_ACTIVITY_SINGLE_TOP
      }

    val pendingIntent =
      launchIntent?.let {
        PendingIntent.getActivity(
          reactContext,
          (notificationId ?: "$title$message").hashCode(),
          it,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
      }

    val notification =
      NotificationCompat.Builder(reactContext, CHANNEL_ID)
        .setSmallIcon(R.mipmap.ic_launcher)
        .setContentTitle(title)
        .setContentText(message)
        .setStyle(NotificationCompat.BigTextStyle().bigText(message))
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setAutoCancel(true)
        .apply {
          if (pendingIntent != null) {
            setContentIntent(pendingIntent)
          }
        }
        .build()

    NotificationManagerCompat.from(reactContext).notify(
      (notificationId ?: "$title$message").hashCode(),
      notification,
    )
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }

    val notificationManager =
      reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val notificationChannel =
      NotificationChannel(
        CHANNEL_ID,
        CHANNEL_NAME,
        NotificationManager.IMPORTANCE_HIGH,
      ).apply {
        description = CHANNEL_DESCRIPTION
      }

    notificationManager.createNotificationChannel(notificationChannel)
  }
}
