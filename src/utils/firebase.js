const admin = require("firebase-admin");
const path = require("path");

// Ruta a tu archivo JSON
const serviceAccount = require(path.join(__dirname, "../config/firebase-service-account.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
