const express = require("express");
const router = express.Router();

const verifyToken = require("../middlewares/jwtMiddleware");
const userController = require("../controllers/userController");

// Auth routes
router.post("/login", userController.loginUser);
router.post("/register", userController.insertUser);

// Verify session
router.get("/isverify", verifyToken, userController.verifyUser);

// Current logged-in user
router.get("/me", verifyToken, userController.getCurrentUser);

// Users CRUD (protected)
router.route("/").get(verifyToken, userController.getAllUsers);

router
  .route("/:id")
  .put(verifyToken, userController.editUser)
  .delete(verifyToken, userController.deleteUser);

module.exports = router;
