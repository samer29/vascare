const express = require("express");
const router = express.Router();
const ExplorationController = require("../controllers/explorationController");

router.get("/exploration-groups", ExplorationController.getExplorationGroups);
router.post(
  "/exploration-groups",
  ExplorationController.createExplorationGroup
);
router.put(
  "/exploration-groups/:id",
  ExplorationController.updateExplorationGroup
);
router.delete(
  "/exploration-groups/:id",
  ExplorationController.deleteExplorationGroup
);
router.post("/exploration-items", ExplorationController.createExplorationItem);
router.put(
  "/exploration-items/:id",
  ExplorationController.updateExplorationItem
);
router.delete(
  "/exploration-items/:id",
  ExplorationController.deleteExplorationItem
);

module.exports = router;
