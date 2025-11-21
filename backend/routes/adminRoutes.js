const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/adminController");

router.get("/export/sql", AdminController.exportDatabaseSQL);
router.get("/export/csv", AdminController.exportDatabaseCSV);
router.get("/export/json", AdminController.exportDatabaseJSON);
router.get("/stats", AdminController.getDatabaseStats);

module.exports = router;
