const con = require("../config/db");

// 🔹 Get all Formes
exports.getFormes = (req, res) => {
  try {
    con.query("SELECT * FROM Forme", (err, result) => {
      if (err) {
        console.error("Error fetching formes:", err.message);
        return res
          .status(500)
          .json({ error: "Fetch error", detail: err.message });
      }
      res.status(200).json(result);
    });
  } catch (error) {
    console.error("Unexpected error in getFormes:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// 🔹 Create Forme
exports.createForme = (req, res) => {
  try {
    const { NomForme } = req.body;
    if (!NomForme)
      return res.status(400).json({ error: "NomForme is required" });

    con.query(
      "INSERT INTO Forme (NomForme) VALUES (?)",
      [NomForme],
      (err, result) => {
        if (err) {
          console.error("Error inserting forme:", err.message);
          return res
            .status(500)
            .json({ error: "Insert error", detail: err.message });
        }
        res.status(201).json({ message: "Forme created", id: result.insertId });
      }
    );
  } catch (error) {
    console.error("Unexpected error in createForme:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// 🔹 Update Forme
exports.updateForme = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { NomForme } = req.body;
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    if (!NomForme)
      return res.status(400).json({ error: "NomForme is required" });

    con.query(
      "UPDATE Forme SET NomForme = ? WHERE ID = ?",
      [NomForme, id],
      (err, result) => {
        if (err) {
          console.error("Error updating forme:", err.message);
          return res
            .status(500)
            .json({ error: "Update error", detail: err.message });
        }
        if (result.affectedRows === 0)
          return res.status(404).json({ error: "Forme not found" });
        res.status(200).json({ message: "Forme updated" });
      }
    );
  } catch (error) {
    console.error("Unexpected error in updateForme:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// 🔹 Delete Forme
exports.deleteForme = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    con.query("DELETE FROM Forme WHERE ID = ?", [id], (err, result) => {
      if (err) {
        console.error("Error deleting forme:", err.message);
        return res
          .status(500)
          .json({ error: "Delete error", detail: err.message });
      }
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Forme not found" });
      res.status(200).json({ message: "Forme deleted" });
    });
  } catch (error) {
    console.error("Unexpected error in deleteForme:", error);
    res.status(500).json({ error: "Server Error" });
  }
};
