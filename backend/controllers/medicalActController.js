const con = require("../config/db");

// ✅ GET all medical acts
exports.getMedicalActs = (req, res) => {
  con.query("SELECT * FROM medical_acts ORDER BY name", (err, rows) => {
    if (err) {
      console.error("Error fetching medical acts:", err);
      return res.status(500).json({ error: "Error fetching medical acts" });
    }
    res.json(rows);
  });
};

// ✅ CREATE new medical act
exports.createMedicalAct = (req, res) => {
  const { name, defaultPrice, description } = req.body;

  if (!name || defaultPrice === undefined) {
    return res
      .status(400)
      .json({ error: "Name and defaultPrice are required" });
  }

  con.query(
    "INSERT INTO medical_acts (name, default_price, description) VALUES (?, ?, ?)",
    [name, defaultPrice, description],
    (err, result) => {
      if (err) {
        console.error("Error creating medical act:", err);
        return res.status(500).json({ error: "Error creating medical act" });
      }

      con.query(
        "SELECT * FROM medical_acts WHERE id = ?",
        [result.insertId],
        (err2, rows) => {
          if (err2) {
            console.error("Error fetching new medical act:", err2);
            return res.status(500).json({ error: "Fetch after insert failed" });
          }
          res.status(201).json(rows[0]);
        }
      );
    }
  );
};

// ✅ UPDATE medical act
exports.updateMedicalAct = (req, res) => {
  const { id } = req.params;
  const { name, defaultPrice, description } = req.body;

  con.query(
    "UPDATE medical_acts SET name = ?, default_price = ?, description = ? WHERE id = ?",
    [name, defaultPrice, description, id],
    (err, result) => {
      if (err) {
        console.error("Error updating medical act:", err);
        return res.status(500).json({ error: "Error updating medical act" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Medical act not found" });
      }

      con.query(
        "SELECT * FROM medical_acts WHERE id = ?",
        [id],
        (err2, rows) => {
          if (err2) {
            console.error("Error fetching updated act:", err2);
            return res.status(500).json({ error: "Fetch after update failed" });
          }
          res.json(rows[0]);
        }
      );
    }
  );
};

// ✅ DELETE medical act
exports.deleteMedicalAct = (req, res) => {
  const { id } = req.params;

  con.query("DELETE FROM medical_acts WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Error deleting medical act:", err);
      return res.status(500).json({ error: "Error deleting medical act" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Medical act not found" });
    }

    res.json({ message: "Medical act deleted successfully ✅" });
  });
};
