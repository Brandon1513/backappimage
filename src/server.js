const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");


// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());
// import rutas usuarios
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// Importar rutas
const imageRoutes = require("./routes/imageRoutes"); 
//Obtener la ruta de la imagen
app.use("/uploads", express.static("src/uploads"));

// Usar las rutas con prefijo `/api/images`
app.use("/api/images", imageRoutes);
//Ruta para ver el usuario a descargado la imagen
app.use("/api/downloads", imageRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://192.168.70.67:${PORT} 🚀`);
});
