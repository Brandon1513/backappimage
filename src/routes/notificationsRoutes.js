const express = require("express");
const router = express.Router();
const db = require("../config/database");

router.post("/register-token", (req, res) => {
  const { token, userId } = req.body;

  if (!token || !userId) {
    return res.status(400).json({ error: "Token y userId requeridos" });
  }

  const query = "INSERT INTO expo_tokens (user_id, token) VALUES (?, ?)";

  db.query(query, [userId, token], (err, result) => {
    if (err) {
      console.error("❌ Error al guardar token:", err);
      return res.status(500).json({ error: "Error al guardar token" });
    }

    console.log("✅ Token guardado en DB:", token);
    res.json({ message: "Token registrado" });
  });
});

module.exports = router;
