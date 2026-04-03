import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

type QuestNotificationModule = {
  sendNotification: (
    title: string,
    message: string,
    notificationId?: string,
  ) => void;
};

const questNotificationModule =
  NativeModules.QuestNotificationModule as QuestNotificationModule | undefined;

export async function ensureQuestNotificationPermission() {
  if (Platform.OS !== 'android') {
    return true;
  }

  if (typeof Platform.Version !== 'number' || Platform.Version < 33) {
    return true;
  }

  const permissionResult = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );

  return permissionResult === PermissionsAndroid.RESULTS.GRANTED;
}

export async function sendQuestReminderNotification(
  title: string,
  message: string,
  notificationId?: string,
) {
  const hasPermission = await ensureQuestNotificationPermission();

  if (!hasPermission || !questNotificationModule?.sendNotification) {
    return false;
  }

  questNotificationModule.sendNotification(title, message, notificationId);

  return true;
}
