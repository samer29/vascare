const con = require("../config/db");
// 🔹 Get medicaments with pagination and search
exports.getMedicamentAll = (req, res) => {
  try {
    con.query("SELECT * FROM medicaments", (err, result) => {
      if (err) {
        console.error("Error fetching medicaments:", err.message);
        return res
          .status(500)
          .json({ error: "Fetch error", detail: err.message });
      }
      return res.status(200).json(result);
    });
  } catch (error) {
    console.error("Unexpected error in getMedicamet:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};
exports.getMedicaments = (req, res) => {
  try {
    const { page = 1, limit = 50, search = "" } = req.query;
    const offset = (page - 1) * limit;

    let sql = "SELECT * FROM medicaments";
    let countSql = "SELECT COUNT(*) as total FROM medicaments";
    let params = [];
    let countParams = [];

    // Add search filter if provided
    if (search) {
      sql += " WHERE NomMed LIKE ?";
      countSql += " WHERE NomMed LIKE ?";
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    // Add pagination
    sql += " ORDER BY NomMed LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);

    // First get total count
    con.query(countSql, countParams, (countErr, countResult) => {
      if (countErr) {
        console.error("Error counting medicaments:", countErr.message);
        return res
          .status(500)
          .json({ error: "Count error", detail: countErr.message });
      }

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      // Then get paginated data
      con.query(sql, params, (err, result) => {
        if (err) {
          console.error("Error fetching medicaments:", err.message);
          return res
            .status(500)
            .json({ error: "Fetch error", detail: err.message });
        }

        res.status(200).json({
          medicaments: result,
          pagination: {
            currentPage: parseInt(page),
            totalPages: totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        });
      });
    });
  } catch (error) {
    console.error("Unexpected error in getMedicaments:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// 🔹 Quick search for autocomplete (returns only IDs and names)
exports.searchMedicaments = (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res
        .status(400)
        .json({ error: "Search query must be at least 2 characters" });
    }

    const sql =
      "SELECT ID, NomMed FROM medicaments WHERE NomMed LIKE ? LIMIT ?";
    const params = [`%${q}%`, parseInt(limit)];

    con.query(sql, params, (err, result) => {
      if (err) {
        console.error("Error searching medicaments:", err.message);
        return res
          .status(500)
          .json({ error: "Search error", detail: err.message });
      }

      res.status(200).json(result);
    });
  } catch (error) {
    console.error("Unexpected error in searchMedicaments:", error);
    res.status(500).json({ error: "Server Error" });
  }
};
exports.createMedicament = (req, res) => {
  try {
    const { NomMed } = req.body;
    if (!NomMed) {
      return res.status(400).json({ error: "NomMed is required" });
    }
    con.query(
      "INSERT INTO medicaments (NomMed) VALUES (?)",
      [NomMed],
      (err, result) => {
        if (err) {
          console.error("Error inserting medicament:", err.message);
          return res
            .status(500)
            .json({ error: "Insert error", detail: err.message });
        }
        return res
          .status(201)
          .json({ message: "Medicament created", id: result.insertId });
      }
    );
  } catch (error) {
    console.error("Unexpected error in createMedicament:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.updateMedicament = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { NomMed } = req.body;
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    if (!NomMed) {
      return res.status(400).json({ error: "NomMed is required" });
    }
    con.query(
      "UPDATE medicaments SET NomMed = ? WHERE ID = ?",
      [NomMed, id],
      (err, result) => {
        if (err) {
          console.error("Error updating medicament:", err.message);
          return res
            .status(500)
            .json({ error: "Update error", detail: err.message });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Medicament not found" });
        }
        return res.status(200).json({ message: "Medicament updated" });
      }
    );
  } catch (error) {
    console.error("Unexpected error in updateMedicament:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.deleteMedicament = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    con.query("DELETE FROM medicaments WHERE ID = ?", [id], (err, result) => {
      if (err) {
        console.error("Error deleting medicament:", err.message);
        return res
          .status(500)
          .json({ error: "Delete error", detail: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Medicament not found" });
      }
      return res.status(200).json({ message: "Medicament deleted" });
    });
  } catch (error) {
    console.error("Unexpected error in deleteMedicament:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};
