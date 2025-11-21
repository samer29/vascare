const con = require("../config/db");

// ================= GET THYROIDE DATA =================
exports.getThyroideData = (req, res) => {
  const { consultationId } = req.query;
  if (!consultationId)
    return res.status(400).json({ error: "consultationId is required" });

  const sql = `
    SELECT t.*, c.DateConsultation
    FROM thyroide t
    LEFT JOIN consultation c ON t.IDConsultation = c.ID
    WHERE t.IDConsultation = ?
  `;
  con.query(sql, [consultationId], (err, result) => {
    if (err) {
      console.error("Error fetching thyroide data:", err.message);
      return res.status(500).json({ error: err.message });
    }

    // Parse the JSON fields for the frontend
    const parsedResults = result.map((item) => {
      const parsedItem = { ...item };

      // Parse all thyroide fields
      const thyroideFields = [
        "Indication",
        "Technique",
        "Resultats",
        "Conclusion",
        "CAT",
      ];

      thyroideFields.forEach((field) => {
        if (parsedItem[field]) {
          try {
            const parsedData = JSON.parse(parsedItem[field]);

            // Handle both array of objects {desc: "text"} and array of strings
            if (Array.isArray(parsedData)) {
              parsedItem[field] = parsedData
                .map((obj) => {
                  if (
                    obj &&
                    typeof obj === "object" &&
                    obj.desc !== undefined
                  ) {
                    return obj.desc; // Extract the desc property
                  }
                  return obj; // Return as is if it's already a string
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

// ================= INSERT or UPDATE THYROIDE =================
exports.saveThyroideData = (req, res) => {
  const {
    IDConsultation,
    ThyroideType = "avec_schema",
    Indication,
    Technique,
    Resultats,
    Conclusion,
    CAT,
  } = req.body;

  console.log("🔍 Saving thyroide - Type:", ThyroideType);

  if (!IDConsultation) {
    return res.status(400).json({ error: "IDConsultation is required" });
  }

  // Updated field preparation - store as simple strings, not objects
  const prepareField = (value) => {
    if (!value) return JSON.stringify([]);

    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        // Filter out empty strings and return as simple array
        const nonEmptyValues = parsed
          .filter((item) => {
            if (item && typeof item === "object" && item.desc !== undefined) {
              return item.desc && item.desc.trim() !== "";
            }
            return item && item.toString().trim() !== "";
          })
          .map((item) => {
            if (item && typeof item === "object" && item.desc !== undefined) {
              return item.desc; // Extract desc for objects
            }
            return item.toString(); // Convert to string for simple values
          });
        return JSON.stringify(nonEmptyValues.length > 0 ? nonEmptyValues : []);
      }
    } catch (e) {
      // If it's not JSON, handle as string
      if (value && value.trim() !== "") {
        return JSON.stringify([value]);
      }
    }
    return JSON.stringify([]);
  };

  // Check if exists first
  con.query(
    "SELECT ID FROM thyroide WHERE IDConsultation = ?",
    [IDConsultation],
    (err, rows) => {
      if (err) {
        console.error("❌ Database check error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      // Build the query dynamically
      const fieldsToUpdate = {
        ThyroideType,
        Indication: prepareField(Indication),
        Technique: prepareField(Technique),
        Resultats: prepareField(Resultats),
        Conclusion: prepareField(Conclusion),
        CAT: prepareField(CAT),
      };

      console.log("📝 Thyroide fields to save:", Object.keys(fieldsToUpdate));

      const fieldNames = Object.keys(fieldsToUpdate);
      const fieldValues = Object.values(fieldsToUpdate);

      if (rows.length > 0) {
        // UPDATE
        const updateClause = fieldNames
          .map((field) => `${field} = ?`)
          .join(", ");
        const sql = `UPDATE thyroide SET ${updateClause} WHERE IDConsultation = ?`;

        console.log("🔄 Updating existing thyroide");
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
          return res.status(200).json({ message: "Thyroïde mis à jour" });
        });
      } else {
        // INSERT
        const columns = ["IDConsultation", ...fieldNames].join(", ");
        const placeholders = ["?", ...fieldNames.map(() => "?")].join(", ");
        const sql = `INSERT INTO thyroide (${columns}) VALUES (${placeholders})`;

        console.log("🆕 Inserting new thyroide");
        con.query(sql, [IDConsultation, ...fieldValues], (err3, result) => {
          if (err3) {
            console.error("❌ INSERT Error:", err3);
            return res.status(500).json({
              error: "Insert failed",
              sqlError: err3.message,
            });
          }
          console.log("✅ INSERT Success - Insert ID:", result.insertId);
          return res.status(201).json({ message: "Thyroïde créé" });
        });
      }
    }
  );
};

// ================= GET DEFAULT THYROIDE TEMPLATES =================
exports.getDefaultThyroideTemplates = async (req, res) => {
  const { type } = req.query;

  console.log("Fetching default thyroide templates for type:", type);

  try {
    // Get templates from database
    const sql =
      "SELECT SectionName, DefaultLines FROM proceduretemplates WHERE ProcedureType = 'thyroide'";
    con.query(sql, (err, result) => {
      if (err) {
        console.error("Error fetching templates from database:", err);
        return res.status(500).json({ error: "Database error" });
      }

      // Transform the data into the format expected by frontend
      const templatesByType = {
        avec_schema: {},
        sans_schema: {},
        thyroidectomie: {},
        thyroidite: {},
      };

      // Field mapping from database sections to thyroide types
      const fieldMapping = {
        avec_schema: [
          "Indication",
          "Technique",
          "Resultats",
          "Conclusion",
          "CAT",
        ],
        sans_schema: ["Technique", "Resultats", "Conclusion", "CAT"],
        thyroidectomie: ["Technique", "Resultats", "Conclusion", "CAT"],
        thyroidite: ["Technique", "Resultats", "Conclusion", "CAT"],
      };

      // Process each template from database
      result.forEach((template) => {
        try {
          const lines = JSON.parse(template.DefaultLines);

          // Add to each type that uses this section
          Object.keys(fieldMapping).forEach((thyroideType) => {
            if (fieldMapping[thyroideType].includes(template.SectionName)) {
              templatesByType[thyroideType][template.SectionName] = lines;
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
      Object.keys(templatesByType).forEach((thyroideType) => {
        fieldMapping[thyroideType].forEach((field) => {
          if (!templatesByType[thyroideType][field]) {
            templatesByType[thyroideType][field] = [""];
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
    console.error("Error in getDefaultThyroideTemplates:", err);
    res.status(500).json({ error: "Server error" });
  }
};
