// routes/examenPrescritRoutes.js
const express = require("express");
const router = express.Router();
const examenController = require("../controllers/examenController");

router.post("/", examenController.insertExamenPrescrit);
router.put("/:id", examenController.updateExamenPrescrit);
router.delete("/:id", examenController.deleteExamenPrescrit);
router.post("/save-bio", examenController.saveExamensBio);
router.get("/by-consultation/:id", examenController.getExamensBio);
router.get(
  "/by-consultation-exploration",
  examenController.getExamensExploration
);

module.exports = router;
