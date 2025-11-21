const express = require("express");
const router = express.Router();
const thyroideController = require("../controllers/thyroideController");

// Thyroide data routes
router.get("/data", thyroideController.getThyroideData);
router.post("/data", thyroideController.saveThyroideData);
router.get(
  "/templates/default",
  thyroideController.getDefaultThyroideTemplates
);

module.exports = router;
