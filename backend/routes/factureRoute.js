const express = require("express");
const router = express.Router();
const factureController = require("../controllers/factureController");

// Existing routes
router
  .route("/")
  .get(factureController.getFacturesByConsultation)
  .post(factureController.createFacture);

router.post("/mark-generated", factureController.markAsGenerated);

// ✅ move these before router.route("/:id")
router.get("/status", factureController.getStatut);
router.post("/update-payment", factureController.updateStatut);

// Must come last
router
  .route("/:id")
  .put(factureController.updateFacture)
  .delete(factureController.deleteFacture);
router.get("/stats", factureController.getFactureStats);

module.exports = router;
