import admin from "./firebase";

interface FCMNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  tokens: string[]; // Can be single or multiple devices
}

export const sendFCMNotification = async ({
  title,
  body,
  data = {},
  tokens,
}: FCMNotificationPayload) => {
  if (!tokens || tokens.length === 0) return;

  const message = {
    notification: { title, body },
    data,
    tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log("FCM sent successfully:", response.successCount, "successes");
  } catch (err) {
    console.error("Error sending FCM:", err);
  }
};
