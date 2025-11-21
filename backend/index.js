require("dotenv").config(); // ← charge .env à la racine
const app = require("./app");
const cors = require("cors");
const bodyParser = require("body-parser");

app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 4002;
console.log("JWT_SECRET loaded:", !!process.env.JWT_SECRET);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});
