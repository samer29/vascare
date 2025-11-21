const express = require("express");
const router = express.Router();
const dopplerController = require("../controllers/dopplerController");

// Doppler data routes
router.get("/data", dopplerController.getDopplerData);
router.post("/data", dopplerController.saveDopplerData);

module.exports = router;
