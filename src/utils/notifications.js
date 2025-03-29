const admin = require("firebase-admin");
const path = require("path");
const db = require("../config/database");

// Cargar credenciales del servicio (usa la ruta correcta donde guardaste el archivo JSON)
const serviceAccount = require(path.join(__dirname, "../config/firebase-service-account.json"));

// Inicializar Firebase Admin solo una vez
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/**
 * Registra o actualiza un token FCM
 */
exports.registerToken = async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ message: "Faltan datos requeridos." });
    }

    await db.query(
      `INSERT INTO expo_tokens (user_id, token)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE token = VALUES(token), updated_at = CURRENT_TIMESTAMP`,
      [userId, token]
    );

    console.log("✅ Token FCM registrado o actualizado correctamente.");
    res.status(200).json({ message: "Token registrado" });
  } catch (error) {
    console.error("❌ Error al registrar token FCM:", error);
    res.status(500).json({ message: "Error al registrar el token" });
  }
};

/**
 * Enviar notificación push a múltiples tokens usando Firebase
 */
exports.sendPushNotification = async (tokens, title, body, data = {}) => {
  if (!tokens || tokens.length === 0) {
    console.warn("⚠️ No hay tokens válidos para enviar notificaciones.");
    return;
  }

  const message = {
    notification: {
      title,
      body,
    },
    data,
    tokens,
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log("📨 Notificaciones enviadas:", response.successCount);
    return response;
  } catch (error) {
    console.error("❌ Error al enviar notificaciones FCM:", error);
  }
};

/**
 * Notificar a todos los usuarios de la tabla expo_tokens
 */
exports.notifyAllUsers = async (db, title, body, data = {}) => {
  return new Promise((resolve, reject) => {
    db.query("SELECT token FROM expo_tokens", async (err, results) => {
      if (err) {
        console.error("❌ Error al obtener tokens:", err);
        return reject(err);
      }

      const tokens = results.map((row) => row.token).filter(Boolean);
      if (tokens.length === 0) {
        return resolve({ message: "No hay tokens registrados" });
      }

      try {
        const result = await exports.sendPushNotification(tokens, title, body, data);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  });
};
