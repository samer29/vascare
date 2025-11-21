const express = require("express");
const router = express.Router();
const dynamicTemplatesController = require("../controllers/dynamicTemplatesController");

router.get("/categories", dynamicTemplatesController.getTemplateCategories);
router.get("/templates", dynamicTemplatesController.getTemplatesByCategory);
router.get("/template", dynamicTemplatesController.getTemplateByName);
router.post("/templates", dynamicTemplatesController.createTemplate);
router.put("/templates/:id", dynamicTemplatesController.updateTemplate);
router.delete("/templates/:id", dynamicTemplatesController.deleteTemplate);

module.exports = router;