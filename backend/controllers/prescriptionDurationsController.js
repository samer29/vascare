const con = require("../config/db");

// 🔹 Get all prescription durations
exports.getDurations = (req, res) => {
  const sql = "SELECT * FROM prescription_durations ORDER BY IsCustom, Days";

  con.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching prescription durations:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
};

// 🔹 Create new prescription duration
exports.createDuration = (req, res) => {
  const { DisplayText, Days } = req.body;

  if (!DisplayText || !Days) {
    return res.status(400).json({ error: "DisplayText and Days are required" });
  }

  // Validate days is a positive number
  if (isNaN(Days) || Days <= 0) {
    return res.status(400).json({ error: "Days must be a positive number" });
  }

  const sql = `
    INSERT INTO prescription_durations (DisplayText, Days, IsCustom) 
    VALUES (?, ?, TRUE)
  `;

  con.query(sql, [DisplayText.trim(), parseInt(Days)], (err, result) => {
    if (err) {
      console.error("Error creating prescription duration:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({
      message: "Duration created successfully",
      id: result.insertId,
      DisplayText,
      Days: parseInt(Days),
      IsCustom: true,
    });
  });
};

// 🔹 Update prescription duration
exports.updateDuration = (req, res) => {
  const { id } = req.params;
  const { DisplayText, Days } = req.body;

  if (!DisplayText || !Days) {
    return res.status(400).json({ error: "DisplayText and Days are required" });
  }

  if (isNaN(Days) || Days <= 0) {
    return res.status(400).json({ error: "Days must be a positive number" });
  }

  // Check if duration exists and is custom (don't allow editing default durations)
  const checkSql = "SELECT IsCustom FROM prescription_durations WHERE ID = ?";

  con.query(checkSql, [id], (err, results) => {
    if (err) {
      console.error("Error checking duration:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Duration not found" });
    }

    if (!results[0].IsCustom) {
      return res.status(403).json({ error: "Cannot modify default durations" });
    }

    // Update the duration
    const updateSql = `
      UPDATE prescription_durations 
      SET DisplayText = ?, Days = ?, UpdatedAt = CURRENT_TIMESTAMP 
      WHERE ID = ?
    `;

    con.query(
      updateSql,
      [DisplayText.trim(), parseInt(Days), id],
      (err, result) => {
        if (err) {
          console.error("Error updating prescription duration:", err);
          return res.status(500).json({ error: "Database error" });
        }

        res.json({
          message: "Duration updated successfully",
          id: parseInt(id),
          DisplayText,
          Days: parseInt(Days),
          IsCustom: true,
        });
      }
    );
  });
};

// 🔹 Delete prescription duration
exports.deleteDuration = (req, res) => {
  const { id } = req.params;

  // Check if duration exists and is custom (don't allow deleting default durations)
  const checkSql = "SELECT IsCustom FROM prescription_durations WHERE ID = ?";

  con.query(checkSql, [id], (err, results) => {
    if (err) {
      console.error("Error checking duration:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Duration not found" });
    }

    if (!results[0].IsCustom) {
      return res.status(403).json({ error: "Cannot delete default durations" });
    }

    // Delete the duration
    const deleteSql = "DELETE FROM prescription_durations WHERE ID = ?";

    con.query(deleteSql, [id], (err, result) => {
      if (err) {
        console.error("Error deleting prescription duration:", err);
        return res.status(500).json({ error: "Database error" });
      }

      res.json({ message: "Duration deleted successfully" });
    });
  });
};
