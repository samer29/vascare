const con = require("../config/db");

// ================= GET ECG DATA =================
exports.getECGData = (req, res) => {
  const { consultationId } = req.query;
  if (!consultationId)
    return res.status(400).json({ error: "consultationId is required" });

  const sql = `
    SELECT e.*, c.DateConsultation
    FROM ecg_data e
    LEFT JOIN consultation c ON e.IDConsultation = c.ID
    WHERE e.IDConsultation = ?
  `;

  con.query(sql, [consultationId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const parsedResults = result.map((item) => {
      const parsedItem = { ...item };

      // Parse JSON fields or return empty arrays
      const fields = ["Examen", "Electrocardiogramme", "Conclusion"];
      fields.forEach((field) => {
        if (parsedItem[field]) {
          try {
            const data = JSON.parse(parsedItem[field]);
            parsedItem[field] = Array.isArray(data) ? data : [data];
          } catch {
            parsedItem[field] = [parsedItem[field]];
          }
        } else {
          parsedItem[field] = [""];
        }
      });

      return parsedItem;
    });

    res.status(200).json(parsedResults);
  });
};

// ================= SAVE ECG DATA =================
exports.saveECGData = (req, res) => {
  const {
    IDConsultation,
    Examen,
    Electrocardiogramme,
    Conclusion,
  } = req.body;

  if (!IDConsultation)
    return res.status(400).json({ error: "IDConsultation requis" });

  const prepareField = (val) => {
    if (!val) return JSON.stringify([]);
    try {
      const arr = JSON.parse(val);
      const clean = Array.isArray(arr)
        ? arr.filter((l) => l && l.trim())
        : [val.trim()];
      return JSON.stringify(clean.length ? clean : []);
    } catch {
      return val.trim() ? JSON.stringify([val.trim()]) : JSON.stringify([]);
    }
  };

  const data = {
    Examen: prepareField(Examen),
    Electrocardiogramme: prepareField(Electrocardiogramme),
    Conclusion: prepareField(Conclusion),
  };

  con.query(
    "SELECT ID FROM ecg_data WHERE IDConsultation = ?",
    [IDConsultation],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const fields = Object.keys(data)
        .map((k) => `${k} = ?`)
        .join(", ");
      const values = Object.values(data);

      if (rows.length > 0) {
        // UPDATE
        const sql = `UPDATE ecg_data SET ${fields} WHERE IDConsultation = ?`;
        con.query(sql, [...values, IDConsultation], (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: "ECG mis à jour" });
        });
      } else {
        // INSERT
        const cols = ["IDConsultation", ...Object.keys(data)].join(", ");
        const placeholders = "?,"
          .repeat(Object.keys(data).length + 1)
          .slice(0, -1);
        const sql = `INSERT INTO ecg_data (${cols}) VALUES (${placeholders})`;
        con.query(sql, [IDConsultation, ...values], (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.status(201).json({ message: "ECG créé" });
        });
      }
    }
  );
};