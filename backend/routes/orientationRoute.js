const express = require("express");
const router = express.Router();
const orientationController = require("../controllers/orientationController");

router.get("/", orientationController.getOrientations);
router.post("/", orientationController.addOrientation);
router.put("/:id", orientationController.updateOrientation);
router.delete("/:id", orientationController.deleteOrientation);
module.exports = router;