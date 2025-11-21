const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET; // ← chargé depuis .env

if (!SECRET) {
  throw new Error("JWT_SECRET is missing in environment variables");
}

module.exports = function jwtGenerator(user) {
  // user.ID vient de MySQL (colonne ID en majuscule)
  const payload = { user: user.ID, grade: user.grade || "user" };
  return jwt.sign(payload, SECRET, { expiresIn: "6h" });
};
