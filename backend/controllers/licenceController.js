const con = require("../config/db");
const crypto = require("crypto");

const SECRET = "12345678901234567890123456789012"; // 32 bytes

// AES encryption
function encrypt(text) {
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(SECRET),
    Buffer.alloc(16, 0)
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function decrypt(encryptedText) {
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(SECRET),
    Buffer.alloc(16, 0)
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// ---------------------------
// GET licence status
// ---------------------------
exports.getLicences = (req, res) => {
  con.query(
    "SELECT * FROM license ORDER BY id DESC LIMIT 1",
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      if (rows.length === 0) {
        return res.status(404).json({ error: "No licences found" });
      }

      const lic = rows[0];
      const now = new Date();
      const expiry = new Date(lic.expiry_date);

      if (now > expiry) {
        return res.status(403).json({ error: "Licence has expired" });
      }

      return res.status(200).json({
        message: "Licence is valid",
        licence: lic
      });
    }
  );
};

// ---------------------------
// Register licence
// ---------------------------
exports.registerLicence = (req, res) => {
  try {
    const { key } = req.body;
    const decrypted = decrypt(key);

    const [start, end] = decrypted.split("|");

    con.query(
      "INSERT INTO license (start_date, expiry_date, key_value) VALUES (?, ?, ?)",
      [start, end, key],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        return res.status(201).json({
          message: "Licence registered successfully"
        });
      }
    );
  } catch (error) {
    return res.status(400).json({ error: "Invalid licence key" });
  }
};
