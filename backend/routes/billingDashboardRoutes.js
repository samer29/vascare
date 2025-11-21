const express = require("express");
const router = express.Router();
const BillingDashboardController = require("../controllers/billingDashboardController");

// Optimized billing dashboard routes
router.get("/", BillingDashboardController.getBillingDashboard);
router.get("/stats", BillingDashboardController.getBillingStats);
router.get("/revenue-by-act", BillingDashboardController.getRevenueByAct);

module.exports = router;
