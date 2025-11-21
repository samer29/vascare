const express = require("express");
const router = express.Router();
const ecgController = require("../controllers/ecgController");

router.get("/data", ecgController.getECGData);
router.post("/data", ecgController.saveECGData);

module.exports = router;
