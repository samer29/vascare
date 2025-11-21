const express = require("express");
const router = express.Router();
const PrescriptionDurationsController = require("../controllers/prescriptionDurationsController");

// All routes are protected and admin-only
router.get("/", PrescriptionDurationsController.getDurations);
router.post("/", PrescriptionDurationsController.createDuration);
router.put("/:id", PrescriptionDurationsController.updateDuration);
router.delete("/:id", PrescriptionDurationsController.deleteDuration);

module.exports = router;
