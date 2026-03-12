export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('[Push] Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  console.log('[Push] Notification permission:', permission);
  return permission;
};

export const subscribeToPushNotifications = async (
  vapidPublicKey: string
): Promise<PushSubscription | null> => {
  try {
    const permission = await requestNotificationPermission();

    if (permission !== 'granted') {
      console.warn('[Push] Notification permission not granted');
      return null;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('[Push] Service Worker not supported');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;

    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('[Push] Already subscribed');
      return existingSubscription;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });

    console.log('[Push] Successfully subscribed:', subscription);
    return subscription;
  } catch (error) {
    console.error('[Push] Failed to subscribe:', error);
    return null;
  }
};

export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
  try {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const unsubscribed = await subscription.unsubscribe();
      console.log('[Push] Unsubscribed:', unsubscribed);
      return unsubscribed;
    }

    return true;
  } catch (error) {
    console.error('[Push] Failed to unsubscribe:', error);
    return false;
  }
};

export const getPushSubscription = async (): Promise<PushSubscription | null> => {
  try {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    return subscription;
  } catch (error) {
    console.error('[Push] Failed to get subscription:', error);
    return null;
  }
};

export const serializePushSubscription = (subscription: PushSubscription): PushSubscriptionData => {
  const keys = subscription.toJSON();
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: keys.keys!.p256dh!,
      auth: keys.keys!.auth!,
    },
  };
};

export const sendTestNotification = async (
  title: string = 'Test Notification',
  body: string = 'This is a test notification'
): Promise<void> => {
  if (!('Notification' in window)) {
    console.warn('[Push] Notifications not supported');
    return;
  }

  if (Notification.permission !== 'granted') {
    await requestNotificationPermission();
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'test-notification',
      requireInteraction: false,
    });
  }
};

export const showLocalNotification = async (
  title: string,
  options: NotificationOptions = {}
): Promise<void> => {
  if (!('Notification' in window)) {
    console.warn('[Push] Notifications not supported');
    return;
  }

  if (Notification.permission !== 'granted') {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return;
    }
  }

  new Notification(title, {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    ...options,
  });
};

export const checkNotificationSupport = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
};

export const getNotificationPermissionStatus = (): NotificationPermission => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export interface NotificationTemplate {
  assignment_due: {
    title: string;
    body: string;
    icon?: string;
    data?: { url: string };
  };
  attendance_reminder: {
    title: string;
    body: string;
    icon?: string;
    data?: { url: string };
  };
  grade_posted: {
    title: string;
    body: string;
    icon?: string;
    data?: { url: string };
  };
  announcement: {
    title: string;
    body: string;
    icon?: string;
    data?: { url: string };
  };
}

export const notificationTemplates = {
  assignment_due: (assignmentTitle: string, dueDate: string) => ({
    title: 'Assignment Due Soon',
    body: `"${assignmentTitle}" is due on ${dueDate}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'assignment-due',
    data: { url: '/assignments' },
    actions: [
      { action: 'view', title: 'View Assignment' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }),

  attendance_reminder: (date: string) => ({
    title: 'Attendance Reminder',
    body: `Don't forget to mark attendance for ${date}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'attendance-reminder',
    data: { url: '/attendance' },
    actions: [
      { action: 'mark', title: 'Mark Now' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }),

  grade_posted: (assignmentTitle: string, grade: string) => ({
    title: 'New Grade Posted',
    body: `Your grade for "${assignmentTitle}" is ${grade}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'grade-posted',
    data: { url: '/assignments' },
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }),

  announcement: (title: string, message: string) => ({
    title: `Announcement: ${title}`,
    body: message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'announcement',
    data: { url: '/communications' },
    requireInteraction: true,
  }),

  sync_complete: (type: string, count: number) => ({
    title: 'Sync Complete',
    body: `${count} ${type} request(s) have been synced successfully`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'sync-complete',
  }),
};
