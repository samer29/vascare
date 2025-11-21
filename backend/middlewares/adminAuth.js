const authMiddleware = require("./authorization");

// Middleware to check if user is admin
const adminMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user.grade !== "admin") {
      return res.status(403).json({
        error: "Admin access required.",
        required: "admin",
        current: req.user.grade,
      });
    }
    next();
  });
};

// Middleware to check if user is admin or medecin
const adminOrMedecinMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (!["admin", "medecin"].includes(req.user.grade)) {
      return res.status(403).json({
        error: "Admin or Medecin access required.",
        required: ["admin", "medecin"],
        current: req.user.grade,
      });
    }
    next();
  });
};

// Middleware for specific roles
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    authMiddleware(req, res, () => {
      if (!allowedRoles.includes(req.user.grade)) {
        return res.status(403).json({
          error: "Insufficient permissions.",
          required: allowedRoles,
          current: req.user.grade,
        });
      }
      next();
    });
  };
};

module.exports = {
  adminMiddleware,
  adminOrMedecinMiddleware,
  roleMiddleware,
};
