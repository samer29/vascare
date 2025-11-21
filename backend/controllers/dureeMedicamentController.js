const con = require("../config/db");

// 🔹 Get all durations
exports.getDurees = (req, res) => {
  try {
    con.query("SELECT * FROM DureeMedicament", (err, result) => {
      if (err) {
        console.error("Error fetching durations:", err.message);
        return res
          .status(500)
          .json({ error: "Fetch error", detail: err.message });
      }
      res.status(200).json(result);
    });
  } catch (error) {
    console.error("Unexpected error in getDurees:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// 🔹 Create duration
exports.createDuree = (req, res) => {
  try {
    const { duree } = req.body;
    if (!duree) return res.status(400).json({ error: "duree is required" });

    con.query(
      "INSERT INTO DureeMedicament (duree) VALUES (?)",
      [duree],
      (err, result) => {
        if (err) {
          console.error("Error inserting duree:", err.message);
          return res
            .status(500)
            .json({ error: "Insert error", detail: err.message });
        }
        res.status(201).json({ message: "Duree created", id: result.insertId });
      }
    );
  } catch (error) {
    console.error("Unexpected error in createDuree:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// 🔹 Delete duration
exports.deleteDuree = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    con.query(
      "DELETE FROM DureeMedicament WHERE ID = ?",
      [id],
      (err, result) => {
        if (err) {
          console.error("Error deleting duree:", err.message);
          return res
            .status(500)
            .json({ error: "Delete error", detail: err.message });
        }
        if (result.affectedRows === 0)
          return res.status(404).json({ error: "Duree not found" });
        res.status(200).json({ message: "Duree deleted" });
      }
    );
  } catch (error) {
    console.error("Unexpected error in deleteDuree:", error);
    res.status(500).json({ error: "Server Error" });
  }
};
