const fetch = require("node-fetch");

/**
 * Registra o actualiza un token de notificación para un usuario
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.registerToken = async (req, res) => {
    try {
      const { userId, token } = req.body;
  
      if (!userId || !token) {
        return res.status(400).json({ message: "Faltan datos requeridos." });
      }
  
      await db.query(`
        INSERT INTO expo_tokens (user_id, token)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE token = VALUES(token), updated_at = CURRENT_TIMESTAMP
      `, [userId, token]);
  
      console.log("✅ Token registrado o actualizado correctamente.");
      res.status(200).json({ message: "Token registrado" });
    } catch (error) {
      console.error("❌ Error al registrar token:", error);
      res.status(500).json({ message: "Error al registrar el token" });
    }
  };
  

/**
 * Envía notificaciones push a los tokens de Expo proporcionados
 * @param {string[]} expoPushTokens - Array de tokens de Expo
 * @param {string} title - Título de la notificación
 * @param {string} body - Contenido de la notificación
 * @param {Object} [data={}] - Datos adicionales para la notificación
 * @returns {Promise<Object>} - Respuesta del servidor de Expo
 */
exports.sendPushNotification = async (expoPushTokens, title, body, data = {}) => {
  // Validar que tengamos tokens para enviar
  if (!expoPushTokens || !expoPushTokens.length) {
    console.warn("⚠️ No hay tokens para enviar notificaciones");
    return { error: "No hay tokens disponibles" };
  }

  // Filtrar tokens inválidos o vacíos
  const validTokens = expoPushTokens.filter(token => 
    token && 
    typeof token === 'string' && 
    token.trim() !== ''
  );

  if (validTokens.length === 0) {
    console.warn("⚠️ No hay tokens válidos para enviar notificaciones");
    return { error: "No hay tokens válidos" };
  }

  console.log(`🔔 Preparando notificación para ${validTokens.length} dispositivos`);

  // Construir los mensajes para cada token
  const messages = validTokens.map(token => ({
    to: token,
    sound: "default",
    title: title,
    body: body,
    data: data,
    badge: 1,
    priority: "high", // alta prioridad para Android
    channelId: "default", // usar el canal predeterminado
  }));

  try {
    console.log(`📤 Enviando ${messages.length} notificaciones push...`);
    
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error en API de Expo (${response.status}):`, errorText);
      return { error: `Error en API de Expo: ${response.status}`, details: errorText };
    }

    const data = await response.json();
    console.log("✅ Notificaciones enviadas correctamente:", data);
    
    return data;
  } catch (error) {
    console.error("❌ Error enviando notificaciones:", error);
    return { error: error.message || "Error desconocido" };
  }
};

/**
 * Envía una notificación a todos los usuarios registrados
 * @param {Object} db - Instancia de la base de datos
 * @param {string} title - Título de la notificación
 * @param {string} body - Contenido de la notificación
 * @param {Object} [data={}] - Datos adicionales para la notificación
 */
exports.notifyAllUsers = async (db, title, body, data = {}) => {
  return new Promise((resolve, reject) => {
    db.query("SELECT token FROM expo_tokens", async (err, results) => {
      if (err) {
        console.error("❌ Error obteniendo tokens:", err);
        return reject(err);
      }
      
      const tokens = results.map(row => row.token).filter(Boolean);
      
      if (tokens.length === 0) {
        console.warn("⚠️ No hay tokens registrados para notificar");
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