// src/config/firebase.js
const admin = require("firebase-admin");

let serviceAccount;

try {
  // Intenta cargar desde la variable de entorno
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (error) {
  console.error("❌ Error al parsear la variable FIREBASE_SERVICE_ACCOUNT", error);
  throw error;
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
