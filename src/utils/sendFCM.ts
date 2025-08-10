import admin from "./firebase";

interface FCMNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  tokens: string[] | string; // single token or array
}

export const sendFCMNotification = async ({
  title,
  body,
  data = {},
  tokens,
}: FCMNotificationPayload) => {
  const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

  if (tokenArray.length === 0) {
    console.warn("No FCM tokens provided.");
    return;
  }

  const message: admin.messaging.MulticastMessage = {
    notification: { title, body },
    data,
    tokens: tokenArray,
    android: {
      priority: "high",
      notification: { sound: "default" },
    },
    apns: {
      payload: { aps: { sound: "default" } },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);

    if (response.failureCount > 0) {
      response.responses.forEach((res, idx) => {
        if (!res.success) {
          console.error(`Token ${tokenArray[idx]} failed:`, res.error);
        }
      });
    }
  } catch (err) {
    console.error("Error sending FCM:", err);
  }
};
