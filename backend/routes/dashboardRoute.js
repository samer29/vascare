const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const router = express.Router();

router.get("/revenue", dashboardController.getRevenue);
router.get("/activity", dashboardController.getActivity);
router.get("/today-appointments", dashboardController.getTodayAppointments);
router.get("/stats", dashboardController.getDashboardStats);
router.get("/financial-stats", dashboardController.getFinancialStats); // NEW
router.get("/test", dashboardController.testConnection);

module.exports = router;