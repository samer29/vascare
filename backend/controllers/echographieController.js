const con = require("../config/db");

// Helper functions
function ensureJsonString(value) {
  if (Array.isArray(value) || (value && typeof value === "object")) {
    return JSON.stringify(value);
  }
  if (!value) return JSON.stringify([""]);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(Array.isArray(parsed) ? parsed : [parsed]);
    } catch {
      return JSON.stringify([value]);
    }
  }
  return JSON.stringify([String(value)]);
}

function safeParseDbJson(value) {
  if (!value) return [""];
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "string") {
      try {
        const parsed2 = JSON.parse(parsed);
        return Array.isArray(parsed2) ? parsed2 : [parsed2];
      } catch {
        return [parsed];
      }
    }
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [value];
  }
}

// ================= GET =================
exports.getEchographies = (req, res) => {
  const { consultationId } = req.query;
  if (!consultationId)
    return res.status(400).json({ error: "consultationId is required" });

  const sql = `
    SELECT e.*, c.DateConsultation
    FROM echographie e
    LEFT JOIN consultation c ON e.IDConsultation = c.ID
    WHERE e.IDConsultation = ?
  `;
  con.query(sql, [consultationId], (err, result) => {
    if (err) {
      console.error("Error fetching echographies:", err.message);
      return res.status(500).json({ error: err.message });
    }

    // Parse the JSON fields for the frontend
    const parsedResults = result.map((item) => {
      const parsedItem = { ...item };
      // Parse all potential JSON fields
      const jsonFields = [
        "Foie",
        "Vesicule_biliaire",
        "Voies_biliaires",
        "TP_VCI_VSH",
        "Reins",
        "Pancreas",
        "Rate",
        "Vessie",
        "Conclusion",
        "Prostate",
        "Utérus",
        "Aérocolie_diffuse",
      ];

      jsonFields.forEach((field) => {
        if (parsedItem[field]) {
          try {
            const parsedData = JSON.parse(parsedItem[field]);
            if (Array.isArray(parsedData)) {
              // Extract just the text values from {desc: "text"} objects
              parsedItem[field] = parsedData
                .map((obj) => {
                  if (
                    obj &&
                    typeof obj === "object" &&
                    obj.desc !== undefined
                  ) {
                    return obj.desc;
                  }
                  return obj; // Fallback to the object itself if no desc property
                })
                .filter((item) => item !== undefined && item !== null);
            } else {
              parsedItem[field] = [""];
            }
          } catch (e) {
            // If it's not valid JSON, treat it as a string
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

// ================= INSERT or UPDATE =================
exports.insertEchographie = (req, res) => {
  const {
    IDConsultation,
    TypeEcho = "normal_h",
    // All possible fields
    Foie,
    Vesicule_biliaire,
    Voies_biliaires,
    TP_VCI_VSH,
    Reins,
    Pancreas,
    Rate,
    Vessie,
    Conclusion,
    Prostate,
    Utérus,
    Aérocolie_diffuse,
  } = req.body;

  console.log("🔍 Saving echographie - Type:", TypeEcho);

  if (!IDConsultation) {
    return res.status(400).json({ error: "IDConsultation is required" });
  }

  // Improved field preparation
  const prepareField = (value) => {
    if (!value) return JSON.stringify([]);

    try {
      // If it's already a stringified JSON array, parse it first to check structure
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        // If it's already an array of objects with desc, return as is
        if (
          parsed.length > 0 &&
          typeof parsed[0] === "object" &&
          parsed[0].desc !== undefined
        ) {
          return value;
        }
        // If it's an array of strings, convert to objects
        const objectsArray = parsed
          .filter((item) => item && item.trim() !== "")
          .map((item) => ({ desc: item }));
        return JSON.stringify(objectsArray.length > 0 ? objectsArray : []);
      }
    } catch (e) {
      // If it's not JSON, wrap single string in array of objects
      if (value && value.trim() !== "") {
        return JSON.stringify([{ desc: value }]);
      }
    }

    return JSON.stringify([]);
  };

  // Check if exists first
  con.query(
    "SELECT ID FROM echographie WHERE IDConsultation = ?",
    [IDConsultation],
    (err, rows) => {
      if (err) {
        console.error("❌ Database check error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      // Build the query dynamically
      const fieldsToUpdate = {
        TypeEcho,
        Foie: prepareField(Foie),
        Vesicule_biliaire: prepareField(Vesicule_biliaire),
        Voies_biliaires: prepareField(Voies_biliaires),
        TP_VCI_VSH: prepareField(TP_VCI_VSH),
        Reins: prepareField(Reins),
        Pancreas: prepareField(Pancreas),
        Rate: prepareField(Rate),
        Vessie: prepareField(Vessie),
        Conclusion: prepareField(Conclusion),
        Prostate: prepareField(Prostate),
        Utérus: prepareField(Utérus),
        Aérocolie_diffuse: prepareField(Aérocolie_diffuse),
      };

      console.log("📝 Fields to save:", Object.keys(fieldsToUpdate));

      const fieldNames = Object.keys(fieldsToUpdate);
      const fieldValues = Object.values(fieldsToUpdate);

      if (rows.length > 0) {
        // UPDATE
        const updateClause = fieldNames
          .map((field) => `${field} = ?`)
          .join(", ");
        const sql = `UPDATE echographie SET ${updateClause} WHERE IDConsultation = ?`;

        console.log("🔄 Updating existing echographie");
        con.query(sql, [...fieldValues, IDConsultation], (err2, result) => {
          if (err2) {
            console.error("❌ UPDATE Error:", err2);
            return res.status(500).json({
              error: "Update failed",
              sqlError: err2.message,
            });
          }
          console.log(
            "✅ UPDATE Success - Rows affected:",
            result.affectedRows
          );
          return res.status(200).json({ message: "Échographie mise à jour" });
        });
      } else {
        // INSERT
        const columns = ["IDConsultation", ...fieldNames].join(", ");
        const placeholders = ["?", ...fieldNames.map(() => "?")].join(", ");
        const sql = `INSERT INTO echographie (${columns}) VALUES (${placeholders})`;

        console.log("🆕 Inserting new echographie");
        con.query(sql, [IDConsultation, ...fieldValues], (err3, result) => {
          if (err3) {
            console.error("❌ INSERT Error:", err3);
            return res.status(500).json({
              error: "Insert failed",
              sqlError: err3.message,
            });
          }
          console.log("✅ INSERT Success - Insert ID:", result.insertId);
          return res.status(201).json({ message: "Échographie créée" });
        });
      }
    }
  );
};

// ================= GET DEFAULT TEMPLATES =================
exports.getDefaultEchoTemplates = async (req, res) => {
  const { type } = req.query;

  console.log("Fetching default templates for type:", type);

  try {
    // Get templates from database
    const sql =
      "SELECT SectionName, DefaultLines FROM proceduretemplates WHERE ProcedureType = 'echographie'";
    con.query(sql, (err, result) => {
      if (err) {
        console.error("Error fetching templates from database:", err);
        return res.status(500).json({ error: "Database error" });
      }

      // Transform the data into the format expected by frontend
      const templatesByType = {
        normal_h: {},
        normal_f: {},
        lithiase_h: {},
        lithiase_f: {},
      };

      // Field mapping from database sections to echo types
      const fieldMapping = {
        normal_h: [
          "Foie",
          "Vésicule_biliaire",
          "Voies_biliaires",
          "TP_VCI_VSH",
          "Rein_droite",
          "Rein_gauche",
          "Pancreas",
          "Rate",
          "Vessie",
          "Prostate",
          "Conclusion",
          "CAT",
        ],
        normal_f: [
          "Foie",
          "Vésicule_biliaire",
          "Voies_biliaires",
          "TP_VCI_VSH",
          "Rein_droite",
          "Rein_gauche",
          "Pancreas",
          "Rate",
          "Vessie",
          "Utérus",
          "Conclusion",
          "CAT",
        ],
        lithiase_h: [
          "Aérocolie_diffuse",
          "Rein_gauche",
          "Rein_droite",
          "Vessie",
          "Prostate",
          "Foie",
          "Rate",
          "Pancreas",
          "Conclusion",
          "CAT",
        ],
        lithiase_f: [
          "Aérocolie_diffuse",
          "Rein_gauche",
          "Rein_droite",
          "Vessie",
          "Utérus",
          "Foie",
          "Rate",
          "Pancreas",
          "Conclusion",
          "CAT",
        ],
      };

      // Process each template from database
      result.forEach((template) => {
        try {
          const lines = JSON.parse(template.DefaultLines);

          // Add to each type that uses this section
          Object.keys(fieldMapping).forEach((echoType) => {
            if (fieldMapping[echoType].includes(template.SectionName)) {
              // Map database section names to frontend field names
              const frontendFieldName = mapSectionToField(template.SectionName);
              if (frontendFieldName) {
                templatesByType[echoType][frontendFieldName] = lines;
              }
            }
          });
        } catch (e) {
          console.error(
            `Error parsing template for ${template.SectionName}:`,
            e
          );
        }
      });

      // Fill in any missing fields with empty arrays
      Object.keys(templatesByType).forEach((echoType) => {
        fieldMapping[echoType].forEach((field) => {
          const frontendFieldName = mapSectionToField(field);
          if (
            frontendFieldName &&
            !templatesByType[echoType][frontendFieldName]
          ) {
            templatesByType[echoType][frontendFieldName] = [""];
          }
        });
      });

      if (type && templatesByType[type]) {
        res.json(templatesByType[type]);
      } else {
        res.json(templatesByType);
      }
    });
  } catch (err) {
    console.error("Error in getDefaultEchoTemplates:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Helper function to map database section names to frontend field names
function mapSectionToField(sectionName) {
  const mapping = {
    Foie: "Foie",
    Vésicule_biliaire: "Vesicule_biliaire",
    Voies_biliaires: "Voies_biliaires",
    TP_VCI_VSH: "TP_VCI_VSH",
    Rein_droite: "Rein_droite",
    Rein_gauche: "Rein_gauche",
    Pancreas: "Pancreas",
    Rate: "Rate",
    Vessie: "Vessie",
    Prostate: "Prostate",
    Utérus: "Utérus",
    Aérocolie_diffuse: "Aérocolie_diffuse",
    Conclusion: "Conclusion",
    CAT: "Conclusion", // Map CAT to Conclusion for now
  };
  return mapping[sectionName];
}
// ================= DELETE =================
exports.deleteEchographie = (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Echographie ID is required" });

  const sql = "DELETE FROM echographie WHERE ID = ?";
  con.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting echographie:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ message: "Échographie deleted successfully" });
  });
};
