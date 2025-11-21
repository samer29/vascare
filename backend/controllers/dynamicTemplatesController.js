const con = require("../config/db");

// Get all template categories
exports.getTemplateCategories = (req, res) => {
  const sql =
    "SELECT DISTINCT Category FROM dynamic_templates ORDER BY Category";

  con.query(sql, (err, result) => {
    if (err) {
      console.error("Error fetching template categories:", err);
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(result.map((row) => row.Category));
  });
};

// Helper function to safely parse JSON content from DB
const parseContent = (content) => {
  if (!content) return [];
  if (Array.isArray(content)) return content;
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      return [content];
    }
  }
  return [];
};

// Get templates by category and subType
exports.getTemplatesByCategory = (req, res) => {
  const { category, subType } = req.query;

  if (!category) {
    return res.status(400).json({ error: "Category is required" });
  }

  let sql = "SELECT * FROM dynamic_templates WHERE Category = ?";
  const params = [category];

  // Add subType filter if provided
  if (subType && subType !== "all") {
    sql += " AND SubType = ?";
    params.push(subType);
  }

  sql += " ORDER BY DisplayOrder, TemplateName";

  con.query(sql, params, (err, result) => {
    if (err) {
      console.error("Error fetching templates:", err);
      return res.status(500).json({ error: err.message });
    }

    const templates = result.map((template) => ({
      ...template,
      Content: parseContent(template.Content),
    }));

    res.status(200).json(templates);
  });
};

// Create new template with SubType support
exports.createTemplate = (req, res) => {
  const {
    Category,
    SubType,
    TemplateName,
    DisplayName,
    Content,
    DisplayOrder,
  } = req.body;

  if (!Category || !TemplateName || !DisplayName) {
    return res
      .status(400)
      .json({ error: "Category, TemplateName and DisplayName are required" });
  }

  let contentToSave = Content;
  if (Array.isArray(Content)) {
    contentToSave = JSON.stringify(Content);
  } else if (typeof Content === "string") {
    try {
      JSON.parse(Content);
    } catch {
      contentToSave = JSON.stringify([Content]);
    }
  } else {
    contentToSave = JSON.stringify([]);
  }

  const sql = `
    INSERT INTO dynamic_templates (Category, SubType, TemplateName, DisplayName, Content, DisplayOrder) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  con.query(
    sql,
    [
      Category,
      SubType || "normal",
      TemplateName,
      DisplayName,
      contentToSave,
      DisplayOrder || 0,
    ],
    (err, result) => {
      if (err) {
        console.error("Error creating template:", err);
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        message: "Template créé avec succès",
        id: result.insertId,
      });
    }
  );
};

// Update template with SubType support
exports.updateTemplate = (req, res) => {
  const { id } = req.params;
  const { DisplayName, Content, DisplayOrder, SubType } = req.body;

  let contentToSave = Content;
  if (Array.isArray(Content)) {
    contentToSave = JSON.stringify(Content);
  } else if (typeof Content === "string") {
    try {
      JSON.parse(Content);
    } catch {
      contentToSave = JSON.stringify([Content]);
    }
  } else {
    contentToSave = JSON.stringify([]);
  }

  const sql = `
    UPDATE dynamic_templates 
    SET DisplayName = ?, Content = ?, DisplayOrder = ?, SubType = ?, UpdatedAt = NOW() 
    WHERE ID = ?
  `;

  con.query(
    sql,
    [DisplayName, contentToSave, DisplayOrder || 0, SubType || "normal", id],
    (err, result) => {
      if (err) {
        console.error("Error updating template:", err);
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Template non trouvé" });
      }
      res.status(200).json({ message: "Template mis à jour avec succès" });
    }
  );
};

// Delete template
exports.deleteTemplate = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM dynamic_templates WHERE ID = ?";

  con.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting template:", err);
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Template non trouvé" });
    }
    res.status(200).json({ message: "Template supprimé avec succès" });
  });
};

// Get template by name with SubType support
exports.getTemplateByName = (req, res) => {
  const { category, templateName, subType } = req.query;

  let sql =
    "SELECT * FROM dynamic_templates WHERE Category = ? AND TemplateName = ?";
  const params = [category, templateName];

  if (subType) {
    sql += " AND SubType = ?";
    params.push(subType);
  }

  con.query(sql, params, (err, result) => {
    if (err) {
      console.error("Error fetching template:", err);
      return res.status(500).json({ error: err.message });
    }
    if (!result[0])
      return res.status(404).json({ error: "Template non trouvé" });

    const template = result[0];
    template.Content = parseContent(template.Content);

    res.status(200).json(template);
  });
};
