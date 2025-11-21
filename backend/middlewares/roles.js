const auth = require("./auth");

const allowRoles = (...allowed) => {
  return (req, res, next) => {
    auth(req, res, () => {
      if (!allowed.includes(req.user.grade)) {
        return res.status(403).json({
          error: "Insufficient permissions",
          required: allowed,
          current: req.user.grade,
        });
      }
      next();
    });
  };
};

module.exports = {
  adminOnly: allowRoles("admin"),
  medecinOrAdmin: allowRoles("admin", "medecin"),
  allowRoles,
};
