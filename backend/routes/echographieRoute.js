const express = require("express");
const router = express.Router();
const echographieController = require("../controllers/echographieController");

router
  .route("/")
  .get(echographieController.getEchographies)
  .post(echographieController.insertEchographie);

router
  .route("/:id")
  .put(echographieController.insertEchographie) // Add this for updates
  .delete(echographieController.deleteEchographie);

router
  .route("/templates/default")
  .get(echographieController.getDefaultEchoTemplates);

module.exports = router;
