const express = require("express");
const authController = require("../controllers/authController");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/user", verifyToken, authController.getUser);

module.exports = router;
