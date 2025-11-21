const express = require("express");
const router = express.Router();
const DureeController = require("../controllers/dureeMedicamentController");

router.get("/", DureeController.getDurees);
router.post("/", DureeController.createDuree);
router.delete("/:id", DureeController.deleteDuree);

module.exports = router;
