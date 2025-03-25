// src/routes/notificationsRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/database");

// Ruta para registrar el token
router.post("/register-token", (req, res) => {
  const { token, userId } = req.body;

  if (!token || !userId) {
    return res.status(400).json({ error: "Token y userId requeridos" });
  }

  db.query(
    "INSERT INTO expo_tokens (user_id, token) VALUES (?, ?)",
    [userId, token],
    (err) => {
      if (err) {
        console.error("Error al guardar token:", err);
        return res.status(500).json({ error: "Error al guardar token" });
      }
      res.json({ message: "Token registrado" });
    }
  );
});

module.exports = router;
