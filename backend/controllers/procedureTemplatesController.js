const con = require("../config/db");

// Get all templates for a procedure type with subtype support
exports.getTemplatesByType = (req, res) => {
  const { procedureType, subType } = req.query;

  if (!procedureType) {
    return res.status(400).json({ error: "procedureType is required" });
  }

  let sql = "SELECT * FROM ProcedureTemplates WHERE ProcedureType = ?";
  const params = [procedureType];

  // Add subtype filter if provided
  if (subType && subType !== "all") {
    sql += " AND SubType = ?";
    params.push(subType);
  }

  sql += " ORDER BY SectionName";

  con.query(sql, params, (err, result) => {
    if (err) {
      console.error("Error fetching templates:", err.message);
      return res.status(500).json({ error: err.message });
    }
    return res.status(200).json(result);
  });
};

// Update template with subtype support
exports.updateTemplate = (req, res) => {
  const id = req.params.id;
  const { DefaultLines, SubType } = req.body;

  if (!DefaultLines) {
    return res.status(400).json({ error: "DefaultLines is required" });
  }

  const sql =
    "UPDATE ProcedureTemplates SET DefaultLines = ?, SubType = ?, UpdatedAt = NOW() WHERE ID = ?";

  con.query(
    sql,
    [JSON.stringify(DefaultLines), SubType || "standard", id],
    (err, result) => {
      if (err) {
        console.error("Error updating template:", err.message);
        return res.status(500).json({ error: err.message });
      }
      return res.status(200).json({
        message: "Template updated successfully",
        affectedRows: result.affectedRows,
      });
    }
  );
};

// Get default data for a procedure with subtype support
exports.getDefaultData = (req, res) => {
  const { procedureType, subType } = req.query;

  if (!procedureType) {
    return res.status(400).json({ error: "procedureType is required" });
  }

  let sql =
    "SELECT SectionName, DefaultLines FROM ProcedureTemplates WHERE ProcedureType = ?";
  const params = [procedureType];

  // Add subtype filter if provided
  if (subType && subType !== "all") {
    sql += " AND SubType = ?";
    params.push(subType);
  }

  con.query(sql, params, (err, result) => {
    if (err) {
      console.error("Error fetching default data:", err.message);
      return res.status(500).json({ error: err.message });
    }

    // Transform the data into a more usable format
    const defaultData = {};
    result.forEach((row) => {
      try {
        defaultData[row.SectionName] = JSON.parse(row.DefaultLines);
      } catch (e) {
        defaultData[row.SectionName] = [row.DefaultLines];
      }
    });

    return res.status(200).json(defaultData);
  });
};

// Create new template with subtype support
exports.createTemplate = (req, res) => {
  const { ProcedureType, SubType, SectionName, DefaultLines } = req.body;

  if (!ProcedureType || !SectionName) {
    return res
      .status(400)
      .json({ error: "ProcedureType and SectionName are required" });
  }

  const sql = `
    INSERT INTO ProcedureTemplates (ProcedureType, SubType, SectionName, DefaultLines, CreatedAt, UpdatedAt) 
    VALUES (?, ?, ?, ?, NOW(), NOW())
  `;

  con.query(
    sql,
    [
      ProcedureType,
      SubType || "standard",
      SectionName,
      JSON.stringify(DefaultLines || [""]),
    ],
    (err, result) => {
      if (err) {
        console.error("Error creating template:", err.message);
        return res.status(500).json({ error: err.message });
      }

      return res.status(201).json({
        message: "Template created successfully",
        id: result.insertId,
      });
    }
  );
};
