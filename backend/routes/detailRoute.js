const express = require("express");
const router = express.Router();
const DetailController = require("../controllers/detailController");

router.get("/", DetailController.getDetails);
router.post("/", DetailController.createDetail);
router.put("/:id", DetailController.updateDetail);
router.delete("/:id", DetailController.deleteDetail);

module.exports = router;
