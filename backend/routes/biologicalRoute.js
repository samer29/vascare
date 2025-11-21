const express = require("express");
const router = express.Router();
const BiologicalController = require("../controllers/biologicalController");

router.get("/biological-groups", BiologicalController.getBiologicalGroups);
router.post("/biological-groups", BiologicalController.createBiologicalGroup);
router.put(
  "/biological-groups/:id",
  BiologicalController.updateBiologicalGroup
); 
router.delete(
  "/biological-groups/:id",
  BiologicalController.deleteBiologicalGroup
);
router.post("/biological-items", BiologicalController.createBiologicalItem);
router.put("/biological-items/:id", BiologicalController.updateBiologicalItem);
router.delete(
  "/biological-items/:id",
  BiologicalController.deleteBiologicalItem
);

module.exports = router;
