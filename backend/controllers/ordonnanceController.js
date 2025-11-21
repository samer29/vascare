const con = require("../config/db");

exports.getOrdonnances = (req, res) => {
  const { consultationId } = req.query;
  if (!consultationId) {
    return res.status(400).json({ error: "consultationId is required" });
  }

  try {
    const sql = `
      SELECT 
        o.ID,
        o.Article,
        o.Quantite,
        o.Forme,
        o.Detail,
        o.Duree,
        c.DateConsultation
      FROM ordonnance o
      JOIN consultation c ON o.IDConsultation = c.ID
      WHERE o.IDConsultation = ?
    `;

    con.query(sql, [consultationId], (err, result) => {
      if (err) {
        console.error("Error fetching ordonnances:", err.message);
        return res
          .status(500)
          .json({ error: "Fetch error", detail: err.message });
      }
      return res.status(200).json(result);
    });
  } catch (error) {
    console.error("Unexpected error in getOrdonnances:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.insertOrdonnance = (req, res) => {
  const { IDConsultation, Article, Quantite, Forme, Detail, Duree } = req.body;

  // Updated validation - Duree is now optional
  if (!IDConsultation || !Article || !Quantite || !Forme || !Detail) {
    return res.status(400).json({
      error:
        "IDConsultation, Article, Quantite, Forme, and Detail are required",
    });
  }

  try {
    const sql =
      "INSERT INTO ordonnance (IDConsultation, Article, Quantite, Forme, Detail, Duree) VALUES (?, ?, ?, ?, ?, ?)";
    con.query(
      sql,
      [IDConsultation, Article, Quantite, Forme, Detail, Duree || ""], // Handle empty Duree
      (err, result) => {
        if (err) {
          console.error("Error inserting ordonnance:", err.message);
          return res
            .status(500)
            .json({ error: "Insert error", detail: err.message });
        }
        return res.status(201).json({
          message: "Ordonnance inserted successfully",
          insertId: result.insertId,
        });
      }
    );
  } catch (error) {
    console.error("Unexpected error in insertOrdonnance:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.updateOrdonnance = (req, res) => {
  const id = req.params.id;
  const { IDConsultation, Article, Quantite, Forme, Detail, Duree } = req.body;

  // Updated validation - Duree is optional
  if (!IDConsultation || !Article || !Quantite || !Forme || !Detail) {
    return res.status(400).json({
      error:
        "IDConsultation, Article, Quantite, Forme, and Detail are required",
    });
  }

  try {
    const sql =
      "UPDATE ordonnance SET IDConsultation = ?, Article = ?, Quantite = ?, Forme = ?, Detail = ?, Duree = ? WHERE ID = ?";
    con.query(
      sql,
      [IDConsultation, Article, Quantite, Forme, Detail, Duree || "", id],
      (err, result) => {
        if (err) {
          console.error("Error updating ordonnance:", err.message);
          return res
            .status(500)
            .json({ error: "Update error", detail: err.message });
        }
        return res.status(200).json({
          message: "Ordonnance updated successfully",
          affectedRows: result.affectedRows,
        });
      }
    );
  } catch (error) {
    console.error("Unexpected error in updateOrdonnance:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};
exports.deleteOrdonnance = (req, res) => {
  const id = req.params.id;
  try {
    con.query("DELETE FROM ordonnance WHERE ID = ?", [id], (err, result) => {
      if (err) {
        console.error("Error deleting ordonnance:", err.message);
        return res
          .status(500)
          .json({ error: "Delete error", detail: err.message });
      }
      return res.status(200).json({
        message: "Ordonnance deleted successfully",
        affectedRows: result.affectedRows,
      });
    });
  } catch (error) {
    console.error("Unexpected error in deleteOrdonnance:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};
