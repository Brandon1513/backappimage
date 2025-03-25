const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");

const SECRET_KEY = process.env.JWT_SECRET || "supersecreto";

// 📌 Registro de usuarios
exports.register = async (req, res) => {
    const { name, email, password, role = "user" } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Todos los campos son obligatorios." });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
        db.query(query, [name, email, hashedPassword, role], (err, result) => {
            if (err) return res.status(500).json({ error: "Error al registrar usuario" });
            res.json({ message: "Usuario registrado con éxito." });
        });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
};

// 📌 Login de usuarios
// 📌 Login de usuarios
exports.login = (req, res) => {
    const { email, password } = req.body;
    console.log("🔐 Intento de login:", email);
  
    if (!email || !password) {
      console.log("❌ Faltan credenciales");
      return res.status(400).json({ error: "Email y contraseña son obligatorios." });
    }
  
    const query = "SELECT id, name, email, password, role FROM users WHERE email = ?";
    db.query(query, [email], async (err, results) => {
      if (err) {
        console.error("❌ Error en la consulta:", err);
        return res.status(500).json({ error: "Error en el servidor" });
      }
  
      console.log("🧾 Resultados de la DB:", results);
  
      if (results.length === 0) {
        console.log("❌ Usuario no encontrado.");
        return res.status(401).json({ error: "Usuario no encontrado." });
      }
  
      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);
      console.log("🔑 Contraseña correcta?", isMatch);
  
      if (!isMatch) return res.status(401).json({ error: "Contraseña incorrecta." });
  
      if (!user.role) {
        console.log("❌ Usuario sin rol.");
        return res.status(500).json({ error: "No se encontró el rol del usuario." });
      }
  
      const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: "1h" });
      console.log("✅ Usuario autenticado:", user.name);
  
      res.json({
        message: "Inicio de sesión exitoso",
        token,
        role: user.role,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    });
  };
  


// **Obtener usuario autenticado**
exports.getUser = (req, res) => {
    const userId = req.user.id;

    const query = "SELECT id, name, email, role FROM users WHERE id = ?";
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: "Error en el servidor" });

        if (results.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json(results[0]);
    });
};