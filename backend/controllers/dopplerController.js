const con = require("../config/db");

// ================= GET DOPPLER DATA =================
exports.getDopplerData = (req, res) => {
  const { consultationId } = req.query;
  if (!consultationId)
    return res.status(400).json({ error: "consultationId is required" });

  const sql = `
    SELECT d.*, c.DateConsultation
    FROM doppler d
    LEFT JOIN consultation c ON d.IDConsultation = c.ID
    WHERE d.IDConsultation = ?
  `;

  con.query(sql, [consultationId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const parsedResults = result.map((item) => {
      const parsedItem = { ...item };

      // Handle both old static fields and new dynamic field data
      const staticFields = [
        "MI",
        "MS",
        "Porte",
        "Renal",
        "TSA",
        "Conclusion",
        "CAT",
      ];
      const dynamicFieldData = {};

      // Parse static fields
      staticFields.forEach((field) => {
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

      // Parse dynamic field data if it exists
      if (parsedItem.FieldData) {
        try {
          const fieldData = JSON.parse(parsedItem.FieldData);
          Object.keys(fieldData).forEach((fieldName) => {
            try {
              dynamicFieldData[fieldName] = JSON.parse(fieldData[fieldName]);
            } catch {
              dynamicFieldData[fieldName] = [fieldData[fieldName]];
            }
          });
        } catch (e) {
          console.error("Error parsing FieldData:", e);
        }
      }

      // Combine both static and dynamic data
      parsedItem.dynamicFields = dynamicFieldData;

      return parsedItem;
    });

    res.status(200).json(parsedResults);
  });
};

// ================= DÉTECTION DE TITRE DYNAMIQUE =================
const detectDynamicTitle = (lines) => {
  if (!Array.isArray(lines) || lines.length === 0) return null;
  const first = lines[0].trim().toLowerCase();
  const titleKeywords = {
    Conclusion: ["conclusion", "résumé", "impression", "diagnostic", "avis"],
    CAT: [
      "conduite à tenir",
      "cat",
      "recommandations",
      "plan",
      "suivi",
      "traitement",
    ],
  };

  for (const [category, keywords] of Object.entries(titleKeywords)) {
    if (
      keywords.some(
        (k) => first.includes(k) || first === k || first.startsWith(k + ":")
      )
    ) {
      return {
        category,
        title: lines[0].trim().replace(/:$/, "").trim(),
        content: lines.slice(1).filter((l) => l.trim() !== ""),
      };
    }
  }
  return null;
};

// ================= CRÉATION AUTO DE TEMPLATE =================
const createTemplateFromLines = (category, subType, title, contentLines) => {
  const safeTitle = title.replace(/[^a-zA-Z0-9áéíóúñü]/g, "_").substring(0, 30);
  const templateName =
    `${category}_${subType}_${safeTitle}_${Date.now()}`.toUpperCase();

  const checkSql = `SELECT ID FROM dynamic_templates WHERE Category = ? AND SubType = ? AND DisplayName = ?`;
  con.query(checkSql, [category, subType, title], (err, rows) => {
    if (err || rows.length > 0) return;

    const insertSql = `
      INSERT INTO dynamic_templates 
      (Category, SubType, TemplateName, DisplayName, Content, DisplayOrder) 
      VALUES (?, ?, ?, ?, ?, 999)
    `;
    con.query(
      insertSql,
      [category, subType, templateName, title, JSON.stringify(contentLines)],
      (err) => {
        if (!err)
          console.log(
            `Template auto-créé → ${category}/${subType}: "${title}"`
          );
      }
    );
  });
};

// ================= SAVE DOPPLER DATA (avec intelligence) =================
exports.saveDopplerData = (req, res) => {
  const {
    IDConsultation,
    DopplerType = "MI",
    DopplerSubType = "normal",
    MI,
    MS,
    Porte,
    Renal,
    TSA,
    Conclusion: rawConclusion,
    CAT: rawCAT,
    FieldData, // New field for dynamic data
  } = req.body;

  if (!IDConsultation)
    return res.status(400).json({ error: "IDConsultation requis" });

  const prepare = (val) => {
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

  let Conclusion = rawConclusion ? prepare(rawConclusion) : JSON.stringify([]);
  let CAT = rawCAT ? prepare(rawCAT) : JSON.stringify([]);

  // DÉTECTION & CRÉATION AUTO DE TEMPLATES
  if (rawConclusion) {
    const lines = JSON.parse(rawConclusion);
    const detected = detectDynamicTitle(lines);
    if (detected && detected.content.length > 0) {
      createTemplateFromLines(
        "Conclusion",
        DopplerSubType,
        detected.title,
        detected.content
      );
      Conclusion = JSON.stringify(detected.content);
    }
  }

  if (rawCAT) {
    const lines = JSON.parse(rawCAT);
    const detected = detectDynamicTitle(lines);
    if (detected && detected.content.length > 0) {
      createTemplateFromLines(
        "CAT",
        DopplerSubType,
        detected.title,
        detected.content
      );
      CAT = JSON.stringify(detected.content);
    }
  }

  const data = {
    DopplerType,
    DopplerSubType,
    MI: prepare(MI),
    MS: prepare(MS),
    Porte: prepare(Porte),
    Renal: prepare(Renal),
    TSA: prepare(TSA),
    Conclusion,
    CAT,
    FieldData: FieldData || null, // Store dynamic field data
  };

  con.query(
    "SELECT ID FROM doppler WHERE IDConsultation = ?",
    [IDConsultation],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const fields = Object.keys(data)
        .map((k) => `${k} = ?`)
        .join(", ");
      const values = Object.values(data);

      if (rows.length > 0) {
        // UPDATE
        const sql = `UPDATE doppler SET ${fields} WHERE IDConsultation = ?`;
        con.query(sql, [...values, IDConsultation], (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: "Doppler mis à jour" });
        });
      } else {
        // INSERT
        const cols = ["IDConsultation", ...Object.keys(data)].join(", ");
        const placeholders = "?,"
          .repeat(Object.keys(data).length + 1)
          .slice(0, -1);
        const sql = `INSERT INTO doppler (${cols}) VALUES (${placeholders})`;
        con.query(sql, [IDConsultation, ...values], (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.status(201).json({ message: "Doppler créé" });
        });
      }
    }
  );
};
