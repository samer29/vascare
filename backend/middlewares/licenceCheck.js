const con = require("../config/db");
const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  console.error("JWT_SECRET manquant dans .env !");
}

module.exports = function licenseCheck(req, res, next) {
  //  console.log("\n=== LICENCE CHECK DÉBUT ===");
  //console.log("URL demandée :", req.method, req.originalUrl);
  // console.log(
  //   "Authorization header :",
  //   req.headers.authorization?.substring(0, 30) + "..."
  // );

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  // 1. Cas : pas de token
  if (!token) {
    console.log("Aucun token → vérification normale de licence");
    performLicenseCheck();
    return;
  }

  // 2. On a un token → on essaie de le décoder (même expiré)
  jwt.verify(token, SECRET, { ignoreExpiration: true }, (err, payload) => {
    if (err) {
      //console.log("Token invalide ou malformé :", err.message);
      performLicenseCheck();
      return;
    }

    //console.log("Token décodé avec succès → payload :", payload);

    // Vérifie que le grade est bien "admin"
    if (payload && payload.grade === "admin") {
      //console.log("ADMIN DÉTECTÉ → bypass complet de la licence !");
      return next(); // ADMIN PASS TOUJOURS
    } else {
      // console.log(
      //   "Utilisateur non-admin (grade =",
      //   payload.grade || "inconnu",
      //   ") → vérification licence"
      // );
      performLicenseCheck();
    }
  });

  // Fonction de vérification classique (pour non-admin)
  function performLicenseCheck() {
    // console.log("Début vérification base de données licence...");

    con.query("SELECT * FROM license ORDER BY id DESC LIMIT 1", (err, rows) => {
      if (err) {
        //console.error("Erreur SQL licence :", err.message);
        return res.status(500).json({ error: "Database error" });
      }

      if (rows.length === 0) {
        //console.log("AUCUNE licence trouvée dans la table → bloqué");
        return res.status(403).json({ error: "Application not activated" });
      }

      const lic = rows[0];
      // console.log("Licence trouvée :", {
      //   id: lic.id,
      //   start: lic.start_date,
      //   expiry: lic.expiry_date,
      //   key: lic.key_value?.substring(0, 20) + "...",
      // });

      const now = new Date();
      const expiry = new Date(lic.expiry_date);

      //console.log("Date actuelle :", now.toISOString());
      //console.log("Date expiration :", expiry.toISOString());

      if (now > expiry) {
        //console.log("LICENCE EXPIRÉE → bloqué");
        return res.status(403).json({ error: "License expired" });
      }

      //console.log("Licence VALIDE → accès autorisé");
      next();
    });
  }
};
