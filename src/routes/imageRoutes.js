const express = require("express");
const router = express.Router();
const imageController = require("../controllers/imageController");
const multer = require("multer");
const upload = require("../middlewares/cloudinaryUpload");

// Configurar Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Ruta para subir imágenes
router.post("/upload", upload.single("image"), uploadImage);

// Ruta para obtener la última imagen
router.get("/latest-image", imageController.getLatestImage);

router.post("/register-download", imageController.registerDownload);

module.exports = router;
