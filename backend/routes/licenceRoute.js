const express = require("express");
const LicenceController = require("../controllers/licenceController");
const router = express.Router();

router.get("/", LicenceController.getLicences);
router.post("/register", LicenceController.registerLicence);

module.exports = router;
