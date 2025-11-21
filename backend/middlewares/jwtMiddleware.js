const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "super_secret_key";

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Token manquant" });

  // ✅ Remove "Bearer " prefix if present
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Token invalide" });
    req.user = decoded.user;
    next();
  });
}

module.exports = verifyToken;
