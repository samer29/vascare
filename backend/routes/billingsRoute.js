const express = require("express");
const router = express.Router();
const BillingsController = require("../controllers/billingsController");

router.get("/", BillingsController.getBillings);
router.get("/stats", BillingsController.getBillingStats); // Added stats route
router.get("/:id", BillingsController.getBillingById); // Added get by ID
router.post("/", BillingsController.createBilling);
router.put("/:id", BillingsController.updateBilling);
router.delete("/:id", BillingsController.deleteBilling);

module.exports = router;
