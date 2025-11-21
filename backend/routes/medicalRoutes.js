const express = require("express");
const consultationController = require("../controllers/consultationController");
const ordonnanceController = require("../controllers/ordonnanceController");


const router = express.Router();

// Consultation routes
router
  .route("/consultations")
  .get(consultationController.getConsultations)
  .post(consultationController.insertConsultation);
router
  .route("/consultations/:id")
  .put(consultationController.updateConsultation)
  .delete(consultationController.deleteConsultation);
router.post(
  "/consultations/:id/finish",
  consultationController.finishConsultation
);
router.post("/start-consultation", consultationController.startConsultation);
router.get("/all-consultations", consultationController.getAllConsultations);

// Ordonnance routes
router
  .route("/ordonnances")
  .get(ordonnanceController.getOrdonnances)
  .post(ordonnanceController.insertOrdonnance);
router
  .route("/ordonnances/:id")
  .put(ordonnanceController.updateOrdonnance)
  .delete(ordonnanceController.deleteOrdonnance);
module.exports = router;
