const express = require("express");
const router = express.Router();
const userController = require("../controllers/user");
const auth = require("../auth");
const { verify, verifyAdmin } = auth;


// Registration - Krisha
router.post("/register", userController.registerUser);

// Log-in Krisha
router.post("/login", userController.loginUser);

// Retrieve User Dale
router.get("/details", verify, userController.retrieveUser);

// Set As Admin Dale
router.patch("/:id/set-as-admin", verify, verifyAdmin, userController.setAsAdmin);

// Update Password Dale

router.patch("/update-password", verify, userController.updatePassword);

module.exports = router;