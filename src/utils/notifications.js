// src/utils/notifications.js
const { Expo } = require("expo-server-sdk");

// Crear instancia de Expo
let expo = new Expo();

// Función para enviar notificación
const sendPushNotification = async (pushTokens, message) => {
  const messages = [];

  for (let token of pushTokens) {
    if (!Expo.isExpoPushToken(token)) {
      console.error(`❌ Token inválido: ${token}`);
      continue;
    }

    messages.push({
      to: token,
      sound: "default",
      title: "Imagen Lista",
      body: message,
    });
  }

  try {
    let ticketChunk = await expo.sendPushNotificationsAsync(messages);
    console.log("✅ Notificación enviada:", ticketChunk);
  } catch (error) {
    console.error("❌ Error enviando notificación:", error);
  }
};

module.exports = {
  sendPushNotification,
};
