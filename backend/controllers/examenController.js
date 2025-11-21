const con = require("../config/db");

exports.saveExamensBio = (req, res) => {
  const { IDConsultation, type, selectedTests } = req.body;

  if (
    !IDConsultation ||
    !type ||
    !selectedTests ||
    !Array.isArray(selectedTests)
  ) {
    return res.status(400).json({ error: "Invalid request data" });
  }

  try {
    // First delete old entries for that consultation + type
    const deleteSQL =
      "DELETE FROM examenprescrit WHERE IDConsultation = ? AND type = ?";
    con.query(deleteSQL, [IDConsultation, type], (delErr) => {
      if (delErr) return res.status(500).json({ error: delErr.message });

      // Insert new selections
      const insertSQL =
        "INSERT INTO examenprescrit (IDConsultation, type, group_name, detail) VALUES ?";
      const values = selectedTests.map((test) => [
        IDConsultation,
        type,
        test.group,
        test.detail,
      ]);

      con.query(insertSQL, [values], (insErr) => {
        if (insErr) return res.status(500).json({ error: insErr.message });
        res
          .status(201)
          .json({ message: "Examens biologiques sauvegardés avec succès" });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getExamensBio = (req, res) => {
  const consultationId = req.params.id; // ✅ use params not query
  if (!consultationId)
    return res.status(400).json({ error: "consultationId is required" });

  const sql =
    "SELECT group_name, detail FROM examenprescrit WHERE IDConsultation = ? AND type = 'biologique'";
  con.query(sql, [consultationId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};
exports.getExamensExploration = (req, res) => {
  const { consultationId } = req.query;
  if (!consultationId)
    return res.status(400).json({ error: "consultationId is required" });

  const sql = `
    SELECT group_name, detail 
    FROM examenprescrit 
    WHERE IDConsultation = ? AND type = 'exploration'
  `;
  con.query(sql, [consultationId], (err, results) => {
    if (err) {
      console.error("Erreur lors du chargement des explorations:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
};

exports.insertExamenPrescrit = (req, res) => {
  const { IDConsultation, type, group_name, detail } = req.body;
  if (!IDConsultation || !type || !group_name || !detail) {
    return res
      .status(400)
      .json({ error: "IDConsultation and examen are required" });
  }

  try {
    const sql =
      "INSERT INTO examenprescrit (IDConsultation, type,group_name,detail) VALUES (?,?,?,?)";
    con.query(
      sql,
      [IDConsultation, type, group_name, detail],
      (err, result) => {
        if (err) {
          console.error("Error inserting examen prescrit:", err.message);
          return res
            .status(500)
            .json({ error: "Insert error", detail: err.message });
        }
        return res.status(201).json({
          message: "Examen prescrit inserted successfully",
          insertId: result.insertId,
        });
      }
    );
  } catch (error) {
    console.error("Unexpected error in insertExamenPrescrit:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.updateExamenPrescrit = (req, res) => {
  const id = req.params.id;
  const { IDConsultation, type, details } = req.body;

  if (!IDConsultation || !type || !details) {
    return res.status(400).json({ error: "IDPatient and examen are required" });
  }

  try {
    const sql =
      "UPDATE examenprescrit SET IDConsultation=? type = ? ,details=? WHERE ID = ?";
    con.query(sql, [type, details, id], (err, result) => {
      if (err) {
        console.error("Error updating examen prescrit:", err.message);
        return res
          .status(500)
          .json({ error: "Update error", detail: err.message });
      }
      return res.status(200).json({
        message: "Examen prescrit updated successfully",
        affectedRows: result.affectedRows,
      });
    });
  } catch (error) {
    console.error("Unexpected error in updateExamenPrescrit:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.deleteExamenPrescrit = (req, res) => {
  const id = req.params.id;
  try {
    con.query(
      "DELETE FROM examenprescrit WHERE ID = ?",
      [id],
      (err, result) => {
        if (err) {
          console.error("Error deleting examen prescrit:", err.message);
          return res
            .status(500)
            .json({ error: "Delete error", detail: err.message });
        }
        return res.status(200).json({
          message: "Examen prescrit deleted successfully",
          affectedRows: result.affectedRows,
        });
      }
    );
  } catch (error) {
    console.error("Unexpected error in deleteExamenPrescrit:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};
