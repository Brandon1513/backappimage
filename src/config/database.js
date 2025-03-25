const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "195.179.238.154",
  user: process.env.DB_USER || "u382452705_appbrandon",
  password: process.env.DB_PASSWORD || "Comidadeperro1.",
  database: process.env.DB_NAME || "u382452705_backapp",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error conectando a MySQL:", err);
    process.exit(1);
  } else {
    console.log("✅ Conectado a MySQL");
    connection.release(); // Liberar la conexión al pool
  }
});

module.exports = pool;
