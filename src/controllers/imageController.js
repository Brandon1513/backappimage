const path = require("path");
const multer = require("multer");
const fs = require("fs");
const db = require("../config/database");
const { sendPushNotification } = require("../utils/notifications");

// Configuración para URLs de imágenes
const SERVER_URL = process.env.SERVER_URL || "https://backapp-kappa.vercel.app";

// 📦 Configurar almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Crear nombre único para evitar colisiones
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `image-${uniqueSuffix}${extension}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    // Validar tipos de archivo permitidos
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Tipo de archivo no permitido. Solo se aceptan JPG, PNG y WebP.'));
    }
    cb(null, true);
  }
});

exports.upload = upload;

// 📷 Subir imagen
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: "No se subió ninguna imagen." });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname || "sin_nombre.jpg";
    
    // Prepara la ruta relativa para almacenar en la base de datos
    const relativePath = filePath.replace(path.join(__dirname, '..'), '');

    // Construir URL para acceso web
    const imageUrl = `${SERVER_URL}${relativePath.replace(/\\/g, '/')}`;

    db.query(
      "INSERT INTO images (filename, filepath, uploaded_at) VALUES (?, ?, NOW())",
      [originalName, imageUrl],
      async (err, result) => {
        if (err) {
          console.error("❌ Error al guardar en MySQL:", err);
          return res.status(500).json({ error: "Error al guardar en la base de datos." });
        }

        console.log("✅ Imagen subida y registrada en BD:", imageUrl);
        const imageId = result.insertId;

        // 🔔 OBTENER TOKENS EXPO Y ENVIAR NOTIFICACIONES
        db.query("SELECT token FROM expo_tokens", async (err, rows) => {
          if (err) {
            console.error("❌ Error obteniendo tokens:", err);
            // Continuamos con la respuesta aunque haya error en notificaciones
          } else {
            const tokens = rows.map(row => row.token).filter(Boolean);
            
            if (tokens.length > 0) {
              console.log("🔔 Enviando notificaciones a:", tokens.length, "usuarios");
              
              try {
                await sendPushNotification(
                  tokens, 
                  "Nueva imagen disponible", 
                  "Tu nueva imagen de perfil de WhatsApp ya está lista.",
                  { imageId, type: 'new_image' }
                );
              } catch (notifError) {
                console.error("❌ Error al enviar notificaciones:", notifError);
                // Continuamos con la respuesta aunque haya error en notificaciones
              }
            } else {
              console.warn("⚠️ No hay tokens registrados para notificar.");
            }
          }

          // Respondemos con éxito independientemente del estado de las notificaciones
          res.json({ 
            success: true,
            message: "Imagen subida correctamente",
            imageUrl, 
            imageId 
          });
        });
      }
    );
  } catch (error) {
    console.error("❌ Error al subir imagen:", error);
    res.status(500).json({ error: "Error interno al subir imagen" });
  }
};

// 📦 Obtener última imagen
exports.getLatestImage = (req, res) => {
  const query = "SELECT id, filepath FROM images ORDER BY uploaded_at DESC LIMIT 1";

  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error al obtener la última imagen:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "No hay imágenes disponibles" });
    }

    const imageUrl = results[0].filepath;
    const imageId = results[0].id;

    res.json({ imageUrl, imageId });
  });
};

// 📦 Registrar descarga
exports.registerDownload = (req, res) => {
  const { userId, imageId } = req.body;

  if (!userId || !imageId) {
    return res.status(400).json({ error: "Faltan datos." });
  }

  const query = "INSERT INTO downloads (user_id, image_id, downloaded_at) VALUES (?, ?, NOW())";

  db.query(query, [userId, imageId], (err, result) => {
    if (err) {
      console.error("❌ Error al registrar la descarga:", err.sqlMessage || err.message || err);
      return res.status(500).json({ error: "Error en el servidor" });
    }

    res.json({ message: "Descarga registrada correctamente" });
  });
};