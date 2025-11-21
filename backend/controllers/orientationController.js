const con = require("../config/db");

// ✅ GET /orientations?consultationId=xx
exports.getOrientations = (req, res) => {
  const { consultationId } = req.query;

  if (consultationId) {
    const sql = "SELECT * FROM Orientation WHERE IDConsultation = ?";
    con.query(sql, [consultationId], (err, results) => {
      if (err) {
        console.error("Error fetching orientation:", err);
        return res.status(500).json({ error: "Database error" });
      }
      return res.status(200).json(results);
    });
  } else {
    con.query("SELECT * FROM Orientation", (err, results) => {
      if (err) {
        console.error("Error fetching orientations:", err);
        return res.status(500).json({ error: "Database error" });
      }
      return res.status(200).json(results);
    });
  }
};

// ✅ POST /orientations  (auto-insert or update if exists)
exports.addOrientation = (req, res) => {
  const { IDConsultation, ATCD, Presente, Pour } = req.body;

  if (!IDConsultation) {
    return res.status(400).json({ error: "IDConsultation is required" });
  }

  con.query(
    "SELECT ID FROM Orientation WHERE IDConsultation = ?",
    [IDConsultation],
    (err, rows) => {
      if (err) {
        console.error("Error checking orientation:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (rows.length > 0) {
        // Update if exists
        const id = rows[0].ID;
        const updateSql =
          "UPDATE Orientation SET ATCD=?, Presente=?, Pour=? WHERE ID=?";
        con.query(updateSql, [ATCD, Presente, Pour, id], (err2) => {
          if (err2) {
            console.error("Error updating orientation:", err2);
            return res.status(500).json({ error: "Update failed" });
          }
          return res.json({
            message: "Orientation mise à jour avec succès ✅",
            updated: true,
            id,
          });
        });
      } else {
        // Insert if not exists
        const insertSql =
          "INSERT INTO Orientation (IDConsultation, ATCD, Presente, Pour) VALUES (?, ?, ?, ?)";
        con.query(
          insertSql,
          [IDConsultation, ATCD, Presente, Pour],
          (err3, result) => {
            if (err3) {
              console.error("Error inserting orientation:", err3);
              return res.status(500).json({ error: "Insert failed" });
            }
            return res.status(201).json({
              message: "Orientation ajoutée avec succès ✅",
              insertId: result.insertId,
            });
          }
        );
      }
    }
  );
};

exports.updateOrientation = (req, res) => {
  const id = req.params.id;
  const { IDConsultation, ATCD, Presente, Pour } = req.body;
  const sql =
    "UPDATE Orientation SET IDConsultation = ?, ATCD = ?, Presente = ?, Pour = ? WHERE ID = ?";
  con.query(sql, [IDConsultation, ATCD, Presente, Pour, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Orientation not found" });
    res.status(200).json({ message: "Orientation updated" });
  });
};

exports.deleteOrientation = (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM Orientation WHERE ID = ?";
  con.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Orientation not found" });
    res.status(200).json({ message: "Orientation deleted" });
  });
};
