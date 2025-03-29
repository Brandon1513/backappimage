const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { sendPushNotification } = require("../utils/notifications");

// Registrar o actualizar token de notificaciones
router.post("/register-token", (req, res) => {
  const { token, userId } = req.body;

  if (!token || !userId) {
    console.log("❌ Token o userId faltantes:", req.body);
    return res.status(400).json({ error: "Token y userId requeridos" });
  }

  console.log("✏️ Enviando token al servidor:", { token, userId });

  // Usar ON DUPLICATE KEY UPDATE para evitar duplicados
  const query = `
    INSERT INTO expo_tokens (user_id, token, created_at, updated_at)
    VALUES (?, ?, NOW(), NOW())
    ON DUPLICATE KEY UPDATE token = VALUES(token), updated_at = NOW()
  `;

  db.query(query, [userId, token], (err) => {
    if (err) {
      console.error("❌ Error al guardar token:", err);
      return res.status(500).json({ error: "Error al guardar token" });
    }

    console.log("✅ Token registrado o actualizado correctamente en DB");
    res.json({ message: "Token registrado" });
  });
});

// Obtener todos los tokens para enviar notificaciones
router.get("/tokens", (req, res) => {
  db.query("SELECT token FROM expo_tokens", (err, results) => {
    if (err) {
      console.error("❌ Error al obtener tokens:", err);
      return res.status(500).json({ error: "Error al obtener tokens" });
    }

    const tokens = results.map(row => row.token).filter(Boolean);
    res.json({ tokens });
  });
});

// Ruta de prueba para enviar notificación FCM desde Postman
router.post("/test-send", async (req, res) => {
  const { tokens, title, body, data } = req.body;

  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
    return res.status(400).json({ error: "Debes proporcionar al menos un token válido." });
  }

  try {
    const response = await sendPushNotification(tokens, title, body, data || {});
    console.log("✅ Resultado del envío:", response);
    res.json({ message: "Notificación enviada correctamente", response });
  } catch (error) {
    console.error("❌ Error al enviar notificación de prueba:", error);
    res.status(500).json({ error: "Fallo al enviar notificación" });
  }
});

module.exports = router;
