const admin = require("firebase-admin");
const path = require("path");

// Ruta a tu archivo JSON
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
