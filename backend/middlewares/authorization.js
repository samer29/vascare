// middlewares/authorization.js
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization; // <-- "Authorization"
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(403).json("NOT AUTHORIZED");
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET); // <-- même clé
    req.user = payload; // on garde tout le payload (user_id + grade)
    next();
  } catch (err) {
    return res.status(403).json("NOT AUTHORIZED");
  }
};
