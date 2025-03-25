const express = require("express");
const router = express.Router();
const imageController = require("../controllers/imageController");
const upload = require("../middlewares/cloudinaryUpload"); // Usa solo este

// Ruta para subir imágenes
router.post("/upload", upload.single("image"), imageController.uploadImage);

// Ruta para obtener la última imagen
router.get("/latest-image", imageController.getLatestImage);

// Ruta para registrar descarga
router.post("/register-download", imageController.registerDownload);

module.exports = router;
