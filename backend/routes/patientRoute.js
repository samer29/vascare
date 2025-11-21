const express = require("express");
const patientController = require("../controllers/patientController");
const router = express.Router();

router
  .route("/")
  .get(patientController.getPatients)
  .post(patientController.insertPatient); // Changed from .put to .post

router
  .route("/:id")
  .put(patientController.updatePatient) // Moved .put to /:id
  .delete(patientController.deletePatient);
router.get("/search", patientController.searchPatients);

module.exports = router;
