const con = require("../config/db");
const fs = require("fs").promises;
const path = require("path");

// 🔹 Get all settings
exports.getSettings = (req, res) => {
  const sql = "SELECT * FROM settings";

  con.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching settings:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // Convertir les résultats en objet { key: value }
    const settings = {};
    results.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });

    res.json(settings);
  });
};

// 🔹 Save setting
exports.saveSetting = (req, res) => {
  const { key, value } = req.body;

  if (!key) {
    return res.status(400).json({ error: "Key is required" });
  }

  const sql = `
    INSERT INTO settings (setting_key, setting_value) 
    VALUES (?, ?) 
    ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = CURRENT_TIMESTAMP
  `;

  con.query(sql, [key, value, value], (err, result) => {
    if (err) {
      console.error("Error saving setting:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({ message: "Setting saved successfully" });
  });
};

// 🔹 Save multiple settings
exports.saveMultipleSettings = (req, res) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== "object") {
    return res.status(400).json({ error: "Settings object is required" });
  }

  const promises = Object.entries(settings).map(([key, value]) => {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO settings (setting_key, setting_value) 
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = CURRENT_TIMESTAMP
      `;

      con.query(sql, [key, value, value], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  });

  Promise.all(promises)
    .then(() => {
      res.json({ message: "All settings saved successfully" });
    })
    .catch((err) => {
      console.error("Error saving settings:", err);
      res.status(500).json({ error: "Database error" });
    });
};

// 🔹 Get clinic information - NOW ONLY FROM JSON FILE
exports.getClinicInfo = async (req, res) => {
  try {
    const filePath = path.join(__dirname, "..", "config", "clinicinfo.json");

    // Read from JSON file
    const fileData = await fs.readFile(filePath, "utf8");
    const clinicInfo = JSON.parse(fileData);

    //console.log("Clinic info loaded from JSON file:", clinicInfo);
    res.json(clinicInfo);
  } catch (error) {
    console.error("Error loading clinic info from JSON:", error);

    // Fallback to default values if JSON file doesn't exist or is invalid
    const defaultClinicInfo = {
      name: "Cabinet du Dr El bradai",
      fullName: "Cabinet Médical de Gastro-entérologie du Dr El bradai",
      address: "Mascara, Algérie",
      nif: "19129060271518602980",
      phone: "+213 555 12 34 56",
      email: "contact@cabinet-elbradai.dz",
      doctorName: "Dr. El bradai",
      doctorSpecialty: "Gastro-entérologue",
      doctorPhone: "+213 XXX XX XX XX",
    };

    // Try to create the JSON file with default values
    try {
      const filePath = path.join(__dirname, "..", "config", "clinicinfo.json");
      await fs.writeFile(filePath, JSON.stringify(defaultClinicInfo, null, 2));
      console.log("Created clinicinfo.json with default values");
    } catch (writeError) {
      console.error("Failed to create clinicinfo.json:", writeError);
    }

    res.json(defaultClinicInfo);
  }
};

// 🔹 Save clinic information - NOW ONLY TO JSON FILE
exports.saveClinicInfo = async (req, res) => {
  try {
    const clinicInfo = req.body;

    if (!clinicInfo || typeof clinicInfo !== "object") {
      return res.status(400).json({ error: "Clinic info object is required" });
    }

    // Validate required fields
    if (!clinicInfo.name || !clinicInfo.address) {
      return res.status(400).json({ error: "Name and address are required" });
    }

    const filePath = path.join(__dirname, "..", "config", "clinicinfo.json");

    // Ensure all fields are present with default values if missing
    const completeClinicInfo = {
      name: clinicInfo.name || "",
      fullName: clinicInfo.fullName || "",
      address: clinicInfo.address || "",
      nif: clinicInfo.nif || "",
      phone: clinicInfo.phone || "",
      email: clinicInfo.email || "",
      doctorName: clinicInfo.doctorName || "",
      doctorSpecialty: clinicInfo.doctorSpecialty || "",
      doctorPhone: clinicInfo.doctorPhone || "",
    };

    // Write to JSON file
    await fs.writeFile(filePath, JSON.stringify(completeClinicInfo, null, 2));

    console.log("Clinic info saved to JSON file:", completeClinicInfo);

    res.json({
      message: "Clinic information saved successfully to JSON file",
      clinicInfo: completeClinicInfo,
    });
  } catch (error) {
    console.error("Error saving clinic info to JSON:", error);
    res
      .status(500)
      .json({ error: "Failed to save clinic information to JSON file" });
  }
};

// 🔹 Get system configuration
exports.getSystemConfig = (req, res) => {
  const sql = "SELECT * FROM settings WHERE setting_key LIKE 'system_%'";

  con.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching system config:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const systemConfig = {};
    results.forEach((row) => {
      const key = row.setting_key.replace("system_", "");
      try {
        systemConfig[key] = JSON.parse(row.setting_value);
      } catch {
        systemConfig[key] = row.setting_value;
      }
    });

    res.json(systemConfig);
  });
};

// 🔹 Save system configuration
exports.saveSystemConfig = (req, res) => {
  const { config } = req.body;

  if (!config || typeof config !== "object") {
    return res.status(400).json({ error: "Config object is required" });
  }

  const promises = Object.entries(config).map(([key, value]) => {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO settings (setting_key, setting_value) 
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = CURRENT_TIMESTAMP
      `;

      const stringValue =
        typeof value === "object" ? JSON.stringify(value) : value;

      con.query(
        sql,
        [`system_${key}`, stringValue, stringValue],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  });

  Promise.all(promises)
    .then(() => {
      res.json({ message: "System configuration saved successfully" });
    })
    .catch((err) => {
      console.error("Error saving system config:", err);
      res.status(500).json({ error: "Database error" });
    });
};

// 🔹 Emergency backdoor access
exports.emergencyAccess = (req, res) => {
  const { code, userId } = req.body;

  if (!code || !userId) {
    return res.status(400).json({ error: "Code and user ID are required" });
  }

  // Valid emergency codes
  const validCodes = ["VascCare2024", "AdminBackdoor", "Elbradai2024", "911"];

  if (!validCodes.includes(code)) {
    return res.status(401).json({ error: "Invalid emergency code" });
  }

  // Log the emergency access attempt
  const logSql =
    "INSERT INTO access_logs (user_id, action, details) VALUES (?, ?, ?)";
  con.query(
    logSql,
    [userId, "EMERGENCY_ACCESS", `Used code: ${code}`],
    (err) => {
      if (err) console.error("Failed to log emergency access:", err);
    }
  );

  // Grant temporary admin privileges (update user grade)
  const updateSql = "UPDATE users SET grade = 'admin' WHERE id = ?";
  con.query(updateSql, [userId], (err, result) => {
    if (err) {
      console.error("Error granting emergency access:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Emergency admin access granted",
      temporary: true,
      note: "User privileges have been elevated to admin",
    });
  });
};

// 🔹 Health check endpoint
exports.healthCheck = (req, res) => {
  const sql = "SELECT 1 as health";

  con.query(sql, (err, results) => {
    if (err) {
      console.error("Database health check failed:", err);
      return res.status(503).json({
        status: "ERROR",
        database: "unhealthy",
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      status: "OK",
      database: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  });
};

// 🔹 Get access logs (admin only)
exports.getAccessLogs = (req, res) => {
  const { limit = 100 } = req.query;

  const sql = `
    SELECT al.*, u.username 
    FROM access_logs al 
    LEFT JOIN users u ON al.user_id = u.id 
    ORDER BY al.created_at DESC 
    LIMIT ?
  `;

  con.query(sql, [parseInt(limit)], (err, results) => {
    if (err) {
      console.error("Error fetching access logs:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
};

exports.publicTest = (req, res) => {
  res.json({
    message: "Settings API is working",
    timestamp: new Date().toISOString(),
  });
};

// 🔹 Save API config in system_config
exports.saveApiConfig = (req, res) => {
  const { baseURL, isOnline } = req.body;

  if (!baseURL) {
    return res.status(400).json({ error: "baseURL is required" });
  }

  const configValue = JSON.stringify({ baseURL, isOnline: !!isOnline });

  const sql = `
    INSERT INTO settings (setting_key, setting_value) 
    VALUES (?, ?) 
    ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = CURRENT_TIMESTAMP
  `;

  con.query(sql, ["system_api", configValue, configValue], (err, result) => {
    if (err) {
      console.error("Error saving API config:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({ message: "API config saved successfully" });
  });
};

// 🔹 Get API config
exports.getApiConfig = (req, res) => {
  const sql =
    "SELECT setting_value FROM settings WHERE setting_key = 'system_api'";

  con.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching API config:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.json({ baseURL: "http://localhost:4002", isOnline: false });
    }

    try {
      const config = JSON.parse(results[0].setting_value);
      res.json(config);
    } catch (e) {
      res.json({ baseURL: "http://localhost:4002", isOnline: false });
    }
  });
};

// GET: Lire config API (public) - IMPROVED VERSION
exports.getPublicApiConfig = async (req, res) => {
  try {
    const filePath = path.join(__dirname, "..", "public", "api-config.json");

    // Ensure public directory exists
    const publicDir = path.join(__dirname, "..", "public");
    try {
      await fs.access(publicDir);
    } catch {
      await fs.mkdir(publicDir, { recursive: true });
    }

    // Check if file exists, create if it doesn't
    try {
      await fs.access(filePath);
    } catch {
      // Create default config file
      const defaultConfig = {
        baseURL: "http://localhost:4002",
        isOnline: true,
      };
      await fs.writeFile(filePath, JSON.stringify(defaultConfig, null, 2));
      console.log("Created api-config.json with default values");
    }

    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error serving api-config.json:", error);
    // Fallback to JSON response if file serving fails
    res.json({
      baseURL: "http://localhost:4002",
      isOnline: false,
    });
  }
};

// POST: Sauvegarder config API (admin only)
exports.savePublicApiConfig = (req, res) => {
  const { baseURL, isOnline } = req.body;

  if (!baseURL) {
    return res.status(400).json({ error: "baseURL is required" });
  }

  const config = { baseURL, isOnline: !!isOnline };
  const filePath = path.join(__dirname, "..", "public", "api-config.json");

  fs.writeFile(filePath, JSON.stringify(config, null, 2), (err) => {
    if (err) {
      console.error("Error writing api-config.json:", err);
      return res.status(500).json({ error: "Failed to save config" });
    }
    res.json({ message: "API config saved to public file" });
  });
};
// 🔹 Get color settings
exports.getColorSettings = async (req, res) => {
  try {
    const sql =
      "SELECT setting_value FROM settings WHERE setting_key = 'color_settings'";

    con.query(sql, (err, results) => {
      if (err) {
        console.error("Error fetching color settings:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (results.length === 0) {
        return res.json({});
      }

      try {
        const colors = JSON.parse(results[0].setting_value);
        res.json(colors);
      } catch (parseError) {
        console.error("Error parsing color settings:", parseError);
        res.json({});
      }
    });
  } catch (error) {
    console.error("Error in getColorSettings:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 🔹 Save color settings
exports.saveColorSettings = async (req, res) => {
  try {
    const { colors } = req.body;

    if (!colors || typeof colors !== "object") {
      return res.status(400).json({ error: "Colors object is required" });
    }

    const sql = `
      INSERT INTO settings (setting_key, setting_value) 
      VALUES (?, ?) 
      ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = CURRENT_TIMESTAMP
    `;

    const colorsJSON = JSON.stringify(colors);

    con.query(
      sql,
      ["color_settings", colorsJSON, colorsJSON],
      (err, result) => {
        if (err) {
          console.error("Error saving color settings:", err);
          return res.status(500).json({ error: "Database error" });
        }

        res.json({
          message: "Color settings saved successfully",
          colors: colors,
        });
      }
    );
  } catch (error) {
    console.error("Error in saveColorSettings:", error);
    res.status(500).json({ error: "Server error" });
  }
};
