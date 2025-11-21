const express = require("express");
const router = express.Router();
const MedicamentController = require("../controllers/medicamentController");

router.get("/all", MedicamentController.getMedicamentAll);
router.get("/", MedicamentController.getMedicaments);
router.get("/search", MedicamentController.searchMedicaments);
router.post("/", MedicamentController.createMedicament);
router.put("/:id", MedicamentController.updateMedicament);
router.delete("/:id", MedicamentController.deleteMedicament);

module.exports = router;
