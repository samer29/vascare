const crypto = require("crypto");

const SECRET = "12345678901234567890123456789012"; // exactly your secret
const IV = Buffer.alloc(16, 0); // zeros, same as your code

function encrypt(text) {
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(SECRET), IV);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

// Change these dates to whatever you want (must be YYYY-MM-DD)
const startDate = "2025-01-01";
const expiryDate = "2027-12-31"; // ← give yourself 2 years

const plaintext = `${startDate}|${expiryDate}`;
const licenseKey = encrypt(plaintext);

console.log("Your license key → copy this:");
console.log(licenseKey);
