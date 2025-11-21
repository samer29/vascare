const express = require("express");
const router = express.Router();
const SettingsController = require("../controllers/settingsController");
const authMiddleware = require("../middlewares/authorization");
const {
  adminMiddleware,
  adminOrMedecinMiddleware,
} = require("../middlewares/adminAuth");

// Public routes
router.get("/health", SettingsController.healthCheck);
router.get("/test", SettingsController.publicTest);
router.get("/api-config.json", SettingsController.getPublicApiConfig);

// Protected routes (any authenticated user)
router.get("/", authMiddleware, SettingsController.getSettings);
router.post("/", authMiddleware, SettingsController.saveSetting);
router.post(
  "/multiple",
  authMiddleware,
  SettingsController.saveMultipleSettings
);

// Clinic info routes (admin and medecin only) - SIMPLIFIED
router.get(
  "/clinic-info",
  adminOrMedecinMiddleware,
  SettingsController.getClinicInfo
);
router.post(
  "/clinic-info",
  adminOrMedecinMiddleware,
  SettingsController.saveClinicInfo
);

// System config routes (admin only)
router.get(
  "/system-config",
  adminMiddleware,
  SettingsController.getSystemConfig
);
router.post(
  "/system-config",
  adminMiddleware,
  SettingsController.saveSystemConfig
);

// API config routes (admin only)
router.post("/api-config", adminMiddleware, SettingsController.saveApiConfig);
router.get("/api-config", adminMiddleware, SettingsController.getApiConfig);

// Emergency access (any authenticated user but with code verification)
router.post(
  "/emergency-access",
  authMiddleware,
  SettingsController.emergencyAccess
);

// Access logs (admin only)
router.get("/access-logs", adminMiddleware, SettingsController.getAccessLogs);
// Color settings routes (admin only)
router.get("/colors", adminMiddleware, SettingsController.getColorSettings);
router.post("/colors", adminMiddleware, SettingsController.saveColorSettings);
module.exports = router;
