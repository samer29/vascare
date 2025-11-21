const express = require("express");
const router = express.Router();
const FormeController = require("../controllers/formeController");

router.get("/", FormeController.getFormes);
router.post("/", FormeController.createForme);
router.put("/:id", FormeController.updateForme);
router.delete("/:id", FormeController.deleteForme);

module.exports = router;
