const con = require("../config/db");

const normalizeDate = (dateStr) => {
  if (!dateStr) return null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split("/");
    return `${y}-${m}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed)) return parsed.toISOString().split("T")[0];
  return null;
};

// ✅ Get consultations by patient
exports.getConsultations = (req, res) => {
  const { patientId } = req.query;
  if (!patientId)
    return res.status(400).json({ error: "patientId is required" });

  try {
    const sql = `
      SELECT 
        c.ID, 
        c.IDPatient, 
        c.DateConsultation, 
        c.Motif, 
        c.Prix, 
        c.Conclusion,
        f.Status AS FactureStatus,
        f.PaidAmount,
        f.TotalAmount,
        f.PaymentDate
      FROM consultation c
      LEFT JOIN facture_status f ON c.ID = f.ConsultationId
      WHERE c.IDPatient = ?
      ORDER BY c.DateConsultation DESC
    `;

    con.query(sql, [patientId], (err, result) => {
      if (err) {
        console.error("Error fetching consultations:", err.message);
        return res
          .status(500)
          .json({ error: "Fetch error", detail: err.message });
      }
      return res.status(200).json(result);
    });
  } catch (error) {
    console.error("Unexpected error in getConsultations:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};

// ✅ Insert new consultation (with optional motif + conclusion)
exports.insertConsultation = (req, res) => {
  const { IDPatient, DateConsultation, Motif, Prix, Conclusion } = req.body;
  if (!IDPatient || !DateConsultation) {
    return res
      .status(400)
      .json({ error: "IDPatient and DateConsultation are required" });
  }

  try {
    const normalized = normalizeDate(DateConsultation);
    if (!normalized)
      return res.status(400).json({ error: "Invalid DateConsultation format" });

    const sql = `
      INSERT INTO consultation (IDPatient, DateConsultation, Motif, Prix, Conclusion)
      VALUES (?, ?, ?, ?, ?)
    `;
    con.query(
      sql,
      [
        IDPatient,
        normalized,
        Motif || "Consultation en cours",
        Prix || 0,
        Conclusion || null,
      ],
      (err, result) => {
        if (err) {
          console.error("Error inserting consultation:", err.message);
          return res
            .status(500)
            .json({ error: "Insert error", detail: err.message });
        }
        return res.status(201).json({
          message: "Consultation inserted successfully",
          insertId: result.insertId,
        });
      }
    );
  } catch (error) {
    console.error("Unexpected error in insertConsultation:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};

// ✅ Start new consultation (Motif only, rest null)
exports.startConsultation = (req, res) => {
  const { IDPatient, Motif } = req.body;
  if (!IDPatient) {
    return res.status(400).json({ error: "IDPatient is required" });
  }

  try {
    const now = new Date();
    const formattedDate = now.toISOString().split("T")[0]; // YYYY-MM-DD

    const sql = `
      INSERT INTO consultation (IDPatient, DateConsultation, Motif, Prix, Conclusion)
      VALUES (?, ?, ?, NULL, NULL)
    `;
    con.query(
      sql,
      [IDPatient, formattedDate, Motif || "Consultation en cours"],
      (err, result) => {
        if (err) {
          console.error("Error starting consultation:", err.message);
          return res
            .status(500)
            .json({ error: "Insert error", detail: err.message });
        }
        res.status(201).json({
          message: "Consultation démarrée avec succès",
          consultationId: result.insertId,
        });
      }
    );
  } catch (error) {
    console.error("Unexpected error in startConsultation:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// ✅ Finish consultation
exports.finishConsultation = (req, res) => {
  const id = req.params.id;
  const { Prix } = req.body;
  if (typeof Prix === "undefined") {
    return res
      .status(400)
      .json({ error: "Prix is required to finish consultation" });
  }

  try {
    const sqlTry =
      "UPDATE consultation SET Prix = ?, IsClosed = 1 WHERE ID = ?";
    con.query(sqlTry, [Prix, id], (err, result) => {
      if (err) {
        const sqlFallback = "UPDATE consultation SET Prix = ? WHERE ID = ?";
        con.query(sqlFallback, [Prix, id], (err2, result2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          return res.status(200).json({
            message: "Consultation finished (prix updated)",
            affectedRows: result2.affectedRows,
          });
        });
      } else {
        res.status(200).json({
          message: "Consultation finished",
          affectedRows: result.affectedRows,
        });
      }
    });
  } catch (error) {
    console.error("Unexpected error in finishConsultation:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};

// ✅ Update consultation (includes Conclusion)
exports.updateConsultation = (req, res) => {
  const id = req.params.id;
  const { IDPatient, DateConsultation, Motif, Prix, Conclusion } = req.body;

  if (!Motif && !Prix && !Conclusion) {
    return res.status(400).json({
      error: "At least one of Motif, Prix or Conclusion must be provided",
    });
  }

  try {
    const sql = `
      UPDATE consultation 
      SET 
        Motif = COALESCE(?, Motif),
        Prix = COALESCE(?, Prix),
        Conclusion = COALESCE(?, Conclusion)
      WHERE ID = ?
    `;
    con.query(sql, [Motif, Prix, Conclusion, id], (err, result) => {
      if (err) {
        console.error("Error updating consultation:", err.message);
        return res
          .status(500)
          .json({ error: "Update error", detail: err.message });
      }
      res.status(200).json({
        message: "Consultation updated successfully",
        affectedRows: result.affectedRows,
      });
    });
  } catch (error) {
    console.error("Unexpected error in updateConsultation:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};

// ✅ Delete
// ✅ Simplified delete consultation
exports.deleteConsultation = (req, res) => {
  const id = req.params.id;
  
  try {
    // First, delete from all child tables
    const deleteChildTables = () => {
      const queries = [
        "DELETE FROM billing WHERE IDConsultation = ?",
        "DELETE FROM facture WHERE IDConsultation = ?",
        "DELETE FROM ligneordonance WHERE IDOrdonnance = ?",
        "DELETE FROM examenprescrit WHERE IDConsultation = ?",
        "DELETE FROM echographie WHERE IDConsultation = ?",
        "DELETE FROM doppler WHERE IDConsultation = ?",
        "DELETE FROM ecg_data WHERE IDConsultation = ?",
        "DELETE FROM thyroide WHERE IDConsultation = ?",
        "DELETE FROM certificats WHERE IDConsultation = ?"
      ];

      let completed = 0;
      const total = queries.length;

      if (total === 0) {
        deleteConsultation();
        return;
      }

      queries.forEach((sql) => {
        con.query(sql, [id], (err) => {
          // Ignore errors for tables that might not exist
          completed++;
          if (completed === total) {
            deleteConsultation();
          }
        });
      });
    };

    // Then delete the consultation
    const deleteConsultation = () => {
      con.query("DELETE FROM consultation WHERE ID = ?", [id], (err, result) => {
        if (err) {
          console.error("Error deleting consultation:", err.message);
          return res.status(500).json({ error: "Delete error", detail: err.message });
        }
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Consultation not found" });
        }

        return res.status(200).json({
          message: "Consultation deleted successfully",
          affectedRows: result.affectedRows
        });
      });
    };

    deleteChildTables();
  } catch (error) {
    console.error("Unexpected error in deleteConsultation:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};
// Add this function to get all consultations
exports.getAllConsultations = async (req, res) => {
  try {
    const query = `
      SELECT c.*, p.Nom, p.Prenom 
      FROM consultations c 
      LEFT JOIN patients p ON c.IDPatient = p.ID 
      ORDER BY c.DateConsultation DESC
    `;

    con.query(query, (err, result) => {
      if (err) {
        console.error("Error fetching all consultations:", err.message);
        return res
          .status(500)
          .json({ error: "Database error", detail: err.message });
      }
      return res.status(200).json(result);
    });
  } catch (error) {
    console.error("Unexpected error in getAllConsultations:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};
