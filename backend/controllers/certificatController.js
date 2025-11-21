const con = require("../config/db");

// ✅ GET certificat by consultationId (main use)
exports.getCertificats = (req, res) => {
  const { consultationId } = req.query;

  if (consultationId) {
    con.query(
      "SELECT * FROM certificats WHERE IDConsultation = ?",
      [consultationId],
      (err, result) => {
        if (err) {
          console.error("Error fetching certificat:", err);
          return res.status(500).json({ error: "Database error" });
        }
        return res.json(result);
      }
    );
  } else {
    con.query("SELECT * FROM certificats", (err, result) => {
      if (err) {
        console.error("Error fetching certificats:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(result);
    });
  }
};

// ✅ INSERT OR UPDATE certificat automatically
exports.insertCertificat = (req, res) => {
  const { IDConsultation, DureeStop, DateDebut } = req.body;

  if (!IDConsultation || !DureeStop || !DateDebut) {
    return res
      .status(400)
      .json({ error: "IDConsultation, DureeStop, DateDebut required" });
  }

  // Check if certificat exists for this consultation
  con.query(
    "SELECT ID FROM certificats WHERE IDConsultation = ?",
    [IDConsultation],
    (err, rows) => {
      if (err) {
        console.error("Error checking certificat:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (rows.length > 0) {
        // Update existing
        const id = rows[0].ID;
        con.query(
          "UPDATE certificats SET DureeStop=?, DateDebut=? WHERE ID=?",
          [DureeStop, DateDebut, id],
          (err2) => {
            if (err2) {
              console.error("Error updating certificat:", err2);
              return res.status(500).json({ error: "Update failed" });
            }
            return res.json({
              message: "Certificat mis à jour avec succès ✅",
              updated: true,
              id,
            });
          }
        );
      } else {
        // Insert new
        con.query(
          "INSERT INTO certificats (IDConsultation, DureeStop, DateDebut) VALUES (?, ?, ?)",
          [IDConsultation, DureeStop, DateDebut],
          (err3, result) => {
            if (err3) {
              console.error("Error inserting certificat:", err3);
              return res.status(500).json({ error: "Insert failed" });
            }
            return res.status(201).json({
              message: "Certificat ajouté avec succès ✅",
              insertId: result.insertId,
            });
          }
        );
      }
    }
  );
};

// PUT /certificats/:id
exports.updateCertificat = (req, res) => {
  const id = req.params.id;
  const allowed = ["IDConsultation", "DureeStop", "DateDebut"];
  const updates = [];
  const values = [];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(req.body[key]);
    }
  }

  if (updates.length === 0) {
    return res
      .status(400)
      .json({ error: "No valid fields provided to update" });
  }

  values.push(id);

  const sql = `UPDATE certificats SET ${updates.join(", ")} WHERE ID = ?`;
  con.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to update certificat" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Certificat not found" });
    }
    con.query("SELECT * FROM certificats WHERE ID = ?", [id], (err2, rows) => {
      if (err2) {
        console.error(err2);
        return res
          .status(500)
          .json({ error: "Failed to fetch updated certificat" });
      }
      res.json(rows[0]);
    });
  });
};

// DELETE /certificats/:id
exports.deleteCertificat = (req, res) => {
  const id = req.params.id;
  con.query("DELETE FROM certificats WHERE ID = ?", [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to delete certificat" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Certificat not found" });
    }
    res.json({ message: "Certificat deleted successfully" });
  });
};
