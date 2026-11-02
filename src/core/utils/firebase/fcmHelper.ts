import notifee, {EventType} from '@notifee/react-native';
import {
  getMessaging,
  getToken,
  deleteToken,
  registerDeviceForRemoteMessages,
  unregisterDeviceForRemoteMessages,
  isDeviceRegisteredForRemoteMessages,
  requestPermission,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';

export const getFcmToken = async () => {
  let token = null;
  await checkApplicationNotificationPermission();
  await registerAppWithFCM();
  try {
    const messaging = getMessaging();
    token = await getToken(messaging);
    console.log('getFcmToken-->', token);
  } catch (error) {
    console.log('getFcmToken Device Token error ', error);
  }
  return token;
};

export async function registerAppWithFCM() {
  const messaging = getMessaging();
  console.log(
    'registerAppWithFCM status',
    isDeviceRegisteredForRemoteMessages(messaging),
  );
  if (!isDeviceRegisteredForRemoteMessages(messaging)) {
    try {
      const status = await registerDeviceForRemoteMessages(messaging);
      console.log('registerDeviceForRemoteMessages status', status);
    } catch (error) {
      console.log('registerDeviceForRemoteMessages error ', error);
    }
  }
}

export async function unRegisterAppWithFCM() {
  const messaging = getMessaging();
  console.log(
    'unRegisterAppWithFCM status',
    isDeviceRegisteredForRemoteMessages(messaging),
  );

  if (isDeviceRegisteredForRemoteMessages(messaging)) {
    try {
      const status = await unregisterDeviceForRemoteMessages(messaging);
      console.log('unregisterDeviceForRemoteMessages status', status);
    } catch (error) {
      console.log('unregisterDeviceForRemoteMessages error ', error);
    }
  }
  await deleteToken(messaging);
  console.log(
    'unRegisterAppWithFCM status',
    isDeviceRegisteredForRemoteMessages(messaging),
  );
}

export const checkApplicationNotificationPermission = async () => {
  const messaging = getMessaging();
  const authStatus = await requestPermission(messaging);
  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
  }
};

export function registerListenerWithFCM() {
  const messaging = getMessaging();
  const unsubscribe = onMessage(messaging, async (remoteMessage: any) => {
    console.log('onMessage Received : ', JSON.stringify(remoteMessage));
    if (
      remoteMessage?.notification?.title &&
      remoteMessage?.notification?.body
    ) {
      onDisplayNotification(
        remoteMessage.notification?.title,
        remoteMessage.notification?.body,
        remoteMessage?.data,
      );
    }
  });

  notifee.onForegroundEvent(({type, detail}: any) => {
    switch (type) {
      case EventType.DISMISSED:
        console.log('User dismissed notification', detail.notification);
        break;
      case EventType.PRESS:
        console.log('User pressed notification', detail.notification);
        break;
    }
  });

  onNotificationOpenedApp(messaging, async (remoteMessage: any) => {
    console.log(
      'onNotificationOpenedApp Received',
      JSON.stringify(remoteMessage),
    );
  });

  getInitialNotification(messaging)
    .then((remoteMessage: any) => {
      if (remoteMessage) {
        console.log(
          'Notification caused app to open from quit state:',
          remoteMessage.notification,
        );
      }
    })
    .catch((error: any) => {
      console.log('getInitialNotification error', error);
    });

  return unsubscribe;
}

async function onDisplayNotification(
  title: string,
  body: string,
  data:
    | {
        [key: string]: string | number | object;
      }
    | undefined,
) {
  console.log('onDisplayNotification: ', JSON.stringify(data));

  await notifee.requestPermission();
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
  });

  await notifee.displayNotification({
    title: title,
    body: body,
    data: data,
    android: {
      channelId,
      pressAction: {
        id: 'default',
      },
    },
  });
}
