const fetch = require("node-fetch");

exports.sendPushNotification = async (expoPushTokens, message) => {
  const messages = expoPushTokens.map(token => ({
    to: token,
    sound: "default",
    body: message,
  }));

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const data = await response.json();
    console.log("📨 Notificaciones enviadas:", data);
  } catch (error) {
    console.error("❌ Error enviando notificaciones:", error);
  }
};
