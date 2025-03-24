const path = require("path");
const multer = require("multer");
const fs = require("fs");
const db = require("../config/database");
const SERVER_IP = process.env.SERVER_IP || "127.0.0.1"; 
const PORT = process.env.PORT || 4000;
// Configurar almacenamiento de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Subir imagen
exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se subió ninguna imagen." });
  }

  const filename = req.file.filename;
  const filepath = `/uploads/${filename}`;
  const fullUrl = `http://${SERVER_IP}:${PORT}${filepath}`;
  console.log("Imagen guardada en:", fullUrl); // Debug para verificar la IP generada

  db.query("INSERT INTO images (filename, filepath) VALUES (?, ?)", [filename, fullUrl], (err, result) => {
    if (err) {
      console.error("Error al guardar en MySQL:", err);
      return res.status(500).json({ error: "Error al guardar en MySQL" });
    }

    res.json({ imageUrl: fullUrl, imageId: result.insertId });
  });
};

// Obtener última imagen
exports.getLatestImage = (req, res) => {
  const query = "SELECT id, filepath FROM images ORDER BY uploaded_at DESC LIMIT 1";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener la última imagen:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "No hay imágenes disponibles" });
    }

    const baseUrl = "http://192.168.100.12:4000";
    const filepath = results[0].filepath;

    const imageUrl = filepath.startsWith("http")
      ? filepath
      : `${baseUrl}/${filepath}`;

    const imageId = results[0].id;

    res.json({ imageUrl, imageId });
  });
};


  // Obtener registro de quien descargo la imagen
  // Registrar descarga
exports.registerDownload = (req, res) => {
  const { userId, imageId } = req.body;

  if (!userId || !imageId) {
    return res.status(400).json({ error: "Faltan datos." });
  }

  const query = "INSERT INTO downloads (user_id, image_id, downloaded_at) VALUES (?, ?, NOW())";


  db.query(query, [userId, imageId], (err, result) => {
    if (err) {
      console.error("Error al registrar la descarga:", err.sqlMessage || err.message || err);
      return res.status(500).json({ error: "Error en el servidor" });
    }

    res.json({ message: "Descarga registrada correctamente" });
  });
};
