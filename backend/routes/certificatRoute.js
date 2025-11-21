const express = require("express");
const router = express.Router();
const certificatController = require("../controllers/certificatController");

router.get("/", certificatController.getCertificats);
router.post("/", certificatController.insertCertificat);
router.put("/:id", certificatController.updateCertificat);
router.delete("/:id", certificatController.deleteCertificat);

module.exports = router;
