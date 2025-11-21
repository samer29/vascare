const express = require("express");
const router = express.Router();
const ProcedureTemplatesController = require("../controllers/procedureTemplatesController");

// Get templates by procedure type and subtype
router.get("/", ProcedureTemplatesController.getTemplatesByType);

// Get default data for procedure
router.get("/default-data", ProcedureTemplatesController.getDefaultData);

// Create new template
router.post("/", ProcedureTemplatesController.createTemplate);

// Update template
router.put("/:id", ProcedureTemplatesController.updateTemplate);

module.exports = router;
