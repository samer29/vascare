// controllers/patientController.js
const con = require("../config/db");

// Helper: Normalize date safely (keeps same day regardless of timezone)
const normalizeDate = (dateStr) => {
  if (!dateStr) return null;

  // DD/MM/YYYY → YYYY-MM-DD
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split("/");
    return `${y}-${m}-${d}`;
  }

  // YYYY-MM-DD → keep as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  return null; // invalid format
};

// Helper: Calculate age from YYYY-MM-DD string
const computeAge = (dateStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const birth = new Date(y, m - 1, d);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const diffMonth = today.getMonth() - birth.getMonth();
  if (diffMonth < 0 || (diffMonth === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// ✅ INSERT PATIENT
exports.insertPatient = (req, res) => {
  const { nom, prenom, age, datenaissance, poids, atcd } = req.body;

  console.log("📦 Incoming body:", req.body);

  if (!nom || !prenom || !datenaissance || !poids) {
    return res.status(400).json({
      error: "nom, prenom, datenaissance et poids sont requis",
    });
  }

  const normalizedDate = normalizeDate(datenaissance);
  if (!normalizedDate) {
    return res.status(400).json({ error: "Format de date invalide" });
  }

  const calculatedAge = computeAge(normalizedDate);

  const sql = `
    INSERT INTO patients (Nom, Prenom, Age, DateNaissance, Poids, ATCD)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const values = [
    nom.trim(),
    prenom.trim(),
    calculatedAge,
    normalizedDate, // ✅ pure YYYY-MM-DD, no timezone effect
    Number(poids),
    atcd?.trim() || null,
  ];

  con.query(sql, values, (err, result) => {
    if (err) {
      console.error("❌ Error inserting patient:", err);
      return res.status(500).json({ error: "Erreur d'insertion patient" });
    }

    console.log("✅ Patient inserted:", result.insertId);
    return res.status(201).json({
      message: "Patient inséré avec succès",
      insertId: result.insertId,
    });
  });
};

// ✅ UPDATE PATIENT
exports.updatePatient = (req, res) => {
  const id = req.params.id;
  const { nom, prenom, datenaissance, poids, atcd } = req.body;

  if (!nom || !prenom || !datenaissance || !poids) {
    return res.status(400).json({
      error: "nom, prenom, datenaissance et poids sont requis",
    });
  }

  const normalizedDate = normalizeDate(datenaissance);
  if (!normalizedDate) {
    return res.status(400).json({ error: "Format de date invalide" });
  }

  const age = computeAge(normalizedDate);

  const sql = `
    UPDATE patients 
    SET Nom = ?, Prenom = ?, Age = ?, DateNaissance = ?, Poids = ?, ATCD = ?
    WHERE ID = ?
  `;

  const values = [
    nom.trim(),
    prenom.trim(),
    age,
    normalizedDate, // ✅ fixed date format
    Number(poids),
    atcd?.trim() || null,
    id,
  ];

  con.query(sql, values, (err, result) => {
    if (err) {
      console.error("❌ Error updating patient:", err);
      return res
        .status(500)
        .json({ error: "Erreur de mise à jour du patient" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Patient introuvable" });
    }

    return res.status(200).json({
      message: "Patient mis à jour avec succès",
      affectedRows: result.affectedRows,
    });
  });
};

// controllers/patientController.js
exports.getPatients = (req, res) => {
  try {
    const sql = `
      SELECT 
        p.*,
        MAX(c.DateConsultation) as derniere_visite
      FROM patients p
      LEFT JOIN consultation c ON p.ID = c.IDPatient
      GROUP BY p.ID
      ORDER BY derniere_visite DESC, p.ID DESC
    `;

    con.query(sql, (err, result) => {
      if (err) {
        console.error("Error fetching patients:", err.message);
        return res
          .status(500)
          .json({ error: "Fetch error", detail: err.message });
      }
      return res.status(200).json(result);
    });
  } catch (error) {
    console.error("Unexpected error in getPatients:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.deletePatient = (req, res) => {
  const id = req.params.id;

  // Start a transaction to ensure data consistency
  con.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const deleteQueries = [
      // First, delete all related records from various tables
      "DELETE FROM facture WHERE IDConsultation IN (SELECT ID FROM consultation WHERE IDPatient = ?)",
      "DELETE FROM facture_status WHERE ConsultationId IN (SELECT ID FROM consultation WHERE IDPatient = ?)",
      "DELETE FROM ordonnance WHERE IDConsultation IN (SELECT ID FROM consultation WHERE IDPatient = ?)",
      "DELETE FROM examenprescrit WHERE IDConsultation IN (SELECT ID FROM consultation WHERE IDPatient = ?)",
      "DELETE FROM echographie WHERE IDConsultation IN (SELECT ID FROM consultation WHERE IDPatient = ?)",
      "DELETE FROM certificats WHERE IDConsultation IN (SELECT ID FROM consultation WHERE IDPatient = ?)",
      "DELETE FROM orientation WHERE IDConsultation IN (SELECT ID FROM consultation WHERE IDPatient = ?)",
      "DELETE FROM doppler WHERE IDConsultation IN (SELECT ID FROM consultation WHERE IDPatient = ?)",
      "DELETE FROM ecg_data WHERE IDConsultation IN (SELECT ID FROM consultation WHERE IDPatient = ?)",
      "DELETE FROM thyroide WHERE IDConsultation IN (SELECT ID FROM consultation WHERE IDPatient = ?)",

      // Finally, delete consultations and the patient
      "DELETE FROM consultation WHERE IDPatient = ?",
      "DELETE FROM patients WHERE ID = ?",
    ];

    let completedQueries = 0;
    let hasError = false;

    deleteQueries.forEach((query, index) => {
      con.query(query, [id], (err, result) => {
        if (err && !hasError) {
          hasError = true;
          console.error(`Error in query ${index + 1}:`, err);
          con.rollback(() => {
            return res.status(500).json({
              error: "Delete error",
              detail: err.message,
            });
          });
          return;
        }

        completedQueries++;

        // When all queries are done, commit the transaction
        if (completedQueries === deleteQueries.length && !hasError) {
          con.commit((err) => {
            if (err) {
              console.error("Error committing transaction:", err);
              con.rollback(() => {
                return res.status(500).json({ error: "Transaction error" });
              });
              return;
            }

            return res.status(200).json({
              message: "Patient and all related data deleted successfully",
              affectedRows: result.affectedRows,
            });
          });
        }
      });
    });
  });
};
// controllers/patientController.js
exports.searchPatients = (req, res) => {
  const { nom, prenom } = req.query;

  if (!nom && !prenom) {
    return res.status(400).json({ error: "Nom ou prénom requis" });
  }

  const sql = `
    SELECT ID, Nom, Prenom, DateNaissance, Age 
    FROM patients 
    WHERE Nom LIKE ? OR Prenom LIKE ?
    ORDER BY Nom ASC
  `;
  const searchTerm = `%${nom || prenom}%`;

  con.query(sql, [searchTerm, searchTerm], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
};
