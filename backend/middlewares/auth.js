const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "super_secret_key";

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(403).json({ error: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });

    req.user = decoded; // includes id, username, grade
    next();
  });
};
