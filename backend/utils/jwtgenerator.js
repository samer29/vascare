const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "./root.env" });

function jwtgenerator(user_id) {
  const payload = {
    user_id,
  };
  return jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "3h" });
}
module.exports = jwtgenerator;
