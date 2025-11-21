const express = require("express");
const router = express.Router();
const medicalActController = require("../controllers/medicalActController");

router.get("/", medicalActController.getMedicalActs);
router.post("/", medicalActController.createMedicalAct);
router.put("/:id", medicalActController.updateMedicalAct);
router.delete("/:id", medicalActController.deleteMedicalAct);

module.exports = router;
