const con = require("../config/db");

// 🔹 Get all details (or by Forme ID)
exports.getDetails = (req, res) => {
  try {
    const { formeId } = req.query;
    const sql = formeId
      ? "SELECT * FROM DetailsForme WHERE IDForme = ?"
      : "SELECT * FROM DetailsForme";
    const params = formeId ? [formeId] : [];

    con.query(sql, params, (err, result) => {
      if (err) {
        console.error("Error fetching details:", err.message);
        return res
          .status(500)
          .json({ error: "Fetch error", detail: err.message });
      }
      res.status(200).json(result);
    });
  } catch (error) {
    console.error("Unexpected error in getDetails:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// 🔹 Create new detail
exports.createDetail = (req, res) => {
  try {
    const { IDForme, NomDetail } = req.body;
    if (!IDForme || !NomDetail)
      return res
        .status(400)
        .json({ error: "IDForme and NomDetail are required" });

    con.query(
      "INSERT INTO DetailsForme (IDForme, NomDetail) VALUES (?, ?)",
      [IDForme, NomDetail],
      (err, result) => {
        if (err) {
          console.error("Error inserting detail:", err.message);
          return res
            .status(500)
            .json({ error: "Insert error", detail: err.message });
        }
        res
          .status(201)
          .json({ message: "Detail created", id: result.insertId });
      }
    );
  } catch (error) {
    console.error("Unexpected error in createDetail:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// 🔹 Update detail
exports.updateDetail = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { NomDetail } = req.body;

    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    if (!NomDetail)
      return res.status(400).json({ error: "NomDetail is required" });

    con.query(
      "UPDATE DetailsForme SET NomDetail = ? WHERE ID = ?", // Only update NomDetail
      [NomDetail, id],
      (err, result) => {
        if (err) {
          console.error("Error updating detail:", err.message);
          return res
            .status(500)
            .json({ error: "Update error", detail: err.message });
        }
        if (result.affectedRows === 0)
          return res.status(404).json({ error: "Detail not found" });
        res.status(200).json({ message: "Detail updated" });
      }
    );
  } catch (error) {
    console.error("Unexpected error in updateDetail:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// 🔹 Delete detail
exports.deleteDetail = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    con.query("DELETE FROM DetailsForme WHERE ID = ?", [id], (err, result) => {
      if (err) {
        console.error("Error deleting detail:", err.message);
        return res
          .status(500)
          .json({ error: "Delete error", detail: err.message });
      }
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Detail not found" });
      res.status(200).json({ message: "Detail deleted" });
    });
  } catch (error) {
    console.error("Unexpected error in deleteDetail:", error);
    res.status(500).json({ error: "Server Error" });
  }
};
