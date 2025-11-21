const con = require("../config/db"); // Ceci doit pointer vers votre connexion 'con'
const fs = require("fs");
const path = require("path");
const os = require("os");

// Fonction utilitaire pour échapper les valeurs SQL
function escapeSQL(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") return value.toString();
  if (value instanceof Date) return `'${value.toISOString().split("T")[0]}'`;

  // Échapper les guillemets simples et autres caractères spéciaux
  return (
    "'" + value.toString().replace(/'/g, "''").replace(/\\/g, "\\\\") + "'"
  );
}

// Fonction utilitaire pour convertir en CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return "No data";

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = headers.map((header) => {
      let value = row[header];

      // Gérer les valeurs spéciales
      if (value === null || value === undefined) return "";
      if (typeof value === "object") return JSON.stringify(value);

      // Échapper les virgules et guillemets
      const stringValue = String(value);
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
      ) {
        return '"' + stringValue.replace(/"/g, '""') + '"';
      }

      return stringValue;
    });

    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

// Export SQL complet - Version corrigée
exports.exportDatabaseSQL = async (req, res) => {
  try {
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `mediconnect_backup_${timestamp}.sql`;

    let sqlContent = `-- phpMyAdmin SQL Dump\n`;
    sqlContent += `-- version 5.2.1\n`;
    sqlContent += `-- https://www.phpmyadmin.net/\n`;
    sqlContent += `--\n`;
    sqlContent += `-- Hôte : 127.0.0.1\n`;
    sqlContent += `-- Généré le : ${new Date().toLocaleDateString("fr-FR", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}\n`;
    sqlContent += `-- Version du serveur : 10.4.32-MariaDB\n`;
    sqlContent += `-- Version de PHP : 8.0.30\n\n`;

    sqlContent += `SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n`;
    sqlContent += `START TRANSACTION;\n`;
    sqlContent += `SET time_zone = "+00:00";\n\n`;

    sqlContent += `/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;\n`;
    sqlContent += `/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;\n`;
    sqlContent += `/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;\n`;
    sqlContent += `/*!40101 SET NAMES utf8mb4 */;\n\n`;

    sqlContent += `--\n`;
    sqlContent += `-- Base de données : \`${
      process.env.DB_NAME || "mediconnectmc"
    }\`\n`;
    sqlContent += `--\n\n`;

    // D'abord, récupérer la liste réelle des tables depuis la base de données
    let actualTables = [];
    try {
      const [tables] = await new Promise((resolve, reject) => {
        con.query(`SHOW TABLES`, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      actualTables = tables.map((row) => Object.values(row)[0]);
      console.log(
        `Found ${actualTables.length} tables in database:`,
        actualTables
      );
    } catch (error) {
      console.error("Error fetching table list:", error);
      // Si on ne peut pas récupérer la liste, utiliser la liste statique
      actualTables = [
        "doppler",
        "billing",
        "biological_groups",
        "biological_items",
        "certificats",
        "consultation",
        "detailsforme",
        "dureemedicament",
        "echographie",
        "examenprescrit",
        "exploration_groups",
        "exploration_items",
        "facture",
        "facture_status",
        "forme",
        "license",
        "ligneordonance",
        "medical_acts",
        "medicaments",
        "ordonnance",
        "orientation",
        "patients",
        "prescription_durations",
        "proceduretemplates",
        "settings",
        "users",
        "ecg_data",
        "thyroide",
      ];
    }

    console.log(`Starting SQL export for ${actualTables.length} tables...`);

    // Exporter table par table
    for (const table of actualTables) {
      console.log(`Exporting table: ${table}`);

      try {
        // Structure de la table
        const [structureRows] = await new Promise((resolve, reject) => {
          con.query(`SHOW CREATE TABLE \`${table}\``, (err, results) => {
            if (err) {
              console.error(`Error getting structure for table ${table}:`, err);
              reject(err);
            } else {
              resolve(results);
            }
          });
        });

        if (structureRows && structureRows.length > 0) {
          sqlContent += `-- --------------------------------------------------------\n\n`;
          sqlContent += `--\n`;
          sqlContent += `-- Structure de la table \`${table}\`\n`;
          sqlContent += `--\n\n`;
          sqlContent += `DROP TABLE IF EXISTS \`${table}\`;\n`;
          sqlContent += `${structureRows[0]["Create Table"]};\n\n`;

          // Données de la table
          const [dataRows] = await new Promise((resolve, reject) => {
            con.query(`SELECT * FROM \`${table}\``, (err, results) => {
              if (err) {
                console.error(`Error getting data for table ${table}:`, err);
                reject(err);
              } else {
                resolve(results);
              }
            });
          });

          if (dataRows && dataRows.length > 0) {
            sqlContent += `--\n`;
            sqlContent += `-- Déchargement des données de la table \`${table}\`\n`;
            sqlContent += `--\n\n`;

            // Récupérer les noms des colonnes
            const columns = Object.keys(dataRows[0]);

            sqlContent += `INSERT INTO \`${table}\` (\`${columns.join(
              "`, `"
            )}\`) VALUES\n`;

            const values = dataRows.map((row, index) => {
              const rowValues = columns.map((column) => escapeSQL(row[column]));
              return `(${rowValues.join(", ")})`;
            });

            // Écrire par blocs de 50 valeurs
            for (let i = 0; i < values.length; i += 50) {
              const chunk = values.slice(i, i + 50);
              sqlContent += chunk.join(",\n");
              if (i + 50 < values.length) {
                sqlContent += ",\n";
              } else {
                sqlContent += ";\n\n";
              }
            }
          } else {
            sqlContent += `-- La table \`${table}\` est vide\n\n`;
          }
        }
      } catch (tableError) {
        console.error(`Error exporting table ${table}:`, tableError);
        sqlContent += `-- Erreur lors de l'export de la table ${table}: ${tableError.message}\n\n`;
      }
    }

    sqlContent += `/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;\n`;
    sqlContent += `/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;\n`;
    sqlContent += `/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;\n`;
    sqlContent += `COMMIT;\n\n`;
    sqlContent += `-- Export terminé avec succès\n`;

    // Créer un fichier temporaire
    const tempFilePath = path.join(os.tmpdir(), filename);
    fs.writeFileSync(tempFilePath, sqlContent, "utf8");

    console.log(`SQL export completed: ${tempFilePath}`);
    console.log(`File size: ${fs.statSync(tempFilePath).size} bytes`);

    // Définir les en-têtes pour le téléchargement
    res.setHeader("Content-Type", "application/sql");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", fs.statSync(tempFilePath).size);

    // Envoyer le fichier
    const fileStream = fs.createReadStream(tempFilePath);
    fileStream.pipe(res);

    // Nettoyer le fichier temporaire après l'envoi
    fileStream.on("end", () => {
      setTimeout(() => {
        fs.unlink(tempFilePath, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting temp file:", unlinkErr);
          else console.log("Temp file cleaned up");
        });
      }, 5000);
    });

    fileStream.on("error", (streamError) => {
      console.error("Error streaming file:", streamError);
      res.status(500).json({ error: "Erreur lors de l'envoi du fichier" });

      // Nettoyer en cas d'erreur
      setTimeout(() => {
        fs.unlink(tempFilePath, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting temp file:", unlinkErr);
        });
      }, 1000);
    });
  } catch (error) {
    console.error("Error in SQL export:", error);
    res.status(500).json({
      error: "Erreur lors de l'export de la base de données",
      details: error.message,
    });
  }
};

// Export CSV - Version simplifiée sans archiver
exports.exportDatabaseCSV = async (req, res) => {
  try {
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `mediconnect_backup_${timestamp}.csv`;

    // Récupérer les tables réelles
    let actualTables = [];
    try {
      const [tables] = await new Promise((resolve, reject) => {
          con.query(`SHOW TABLES`, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      actualTables = tables.map((row) => Object.values(row)[0]);
    } catch (error) {
      actualTables = [
        "patients",
        "consultation",
        "facture",
        "medicaments",
        "ligneordonance",
        "users",
        "settings",
      ];
    }

    let csvContent = `Mediconnect Database CSV Export\n`;
    csvContent += `Generated: ${new Date().toISOString()}\n`;
    csvContent += `Database: ${process.env.DB_NAME || "mediconnectmc"}\n\n`;

    // Exporter chaque table en CSV dans un seul fichier
    for (const table of actualTables) {
      try {
        const [rows] = await new Promise((resolve, reject) => {
          con.query(`SELECT * FROM \`${table}\``, (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });

        if (rows && rows.length > 0) {
          csvContent += `\n=== TABLE: ${table} (${rows.length} records) ===\n`;
          csvContent += convertToCSV(rows);
          csvContent += `\n\n`;
        }
      } catch (tableError) {
        console.error(`Error exporting table ${table} to CSV:`, tableError);
        csvContent += `\n=== TABLE: ${table} (ERROR: ${tableError.message}) ===\n\n`;
      }
    }

    // Créer un fichier temporaire
    const tempFilePath = path.join(os.tmpdir(), filename);
    fs.writeFileSync(tempFilePath, csvContent, "utf8");

    // Envoyer le fichier CSV directement (sans ZIP)
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", fs.statSync(tempFilePath).size);

    const fileStream = fs.createReadStream(tempFilePath);
    fileStream.pipe(res);

    // Nettoyer après envoi
    fileStream.on("end", () => {
      setTimeout(() => {
        fs.unlink(tempFilePath, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting temp file:", unlinkErr);
        });
      }, 5000);
    });
  } catch (error) {
    console.error("Error in CSV export:", error);
    res.status(500).json({
      error: "Erreur lors de l'export CSV de la base de données",
      details: error.message,
    });
  }
};

// Export JSON
exports.exportDatabaseJSON = async (req, res) => {
  try {
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `mediconnect_backup_${timestamp}.json`;

    // Récupérer les tables réelles
    let actualTables = [];
    try {
      const [tables] = await new Promise((resolve, reject) => {
        con.query(`SHOW TABLES`, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      actualTables = tables.map((row) => Object.values(row)[0]);
    } catch (error) {
      actualTables = [
        "patients",
        "consultation",
        "facture",
        "medicaments",
        "ligneordonance",
        "users",
        "settings",
      ];
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      database: process.env.DB_NAME || "mediconnectmc",
      version: "1.0",
      tables: {},
    };

    // Récupérer les données de chaque table
    for (const table of actualTables) {
      try {
        const [rows] = await new Promise((resolve, reject) => {
          con.query(`SELECT * FROM \`${table}\``, (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });

        exportData.tables[table] = {
          count: rows ? rows.length : 0,
          data: rows || [],
        };
      } catch (tableError) {
        console.error(`Error exporting table ${table} to JSON:`, tableError);
        exportData.tables[table] = {
          count: 0,
          data: [],
          error: tableError.message,
        };
      }
    }

    // Créer un fichier temporaire
    const tempFilePath = path.join(os.tmpdir(), filename);
    fs.writeFileSync(tempFilePath, JSON.stringify(exportData, null, 2), "utf8");

    // Envoyer le fichier
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", fs.statSync(tempFilePath).size);

    const fileStream = fs.createReadStream(tempFilePath);
    fileStream.pipe(res);

    // Nettoyer après envoi
    fileStream.on("end", () => {
      setTimeout(() => {
        fs.unlink(tempFilePath, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting temp file:", unlinkErr);
        });
      }, 5000);
    });
  } catch (error) {
    console.error("Error in JSON export:", error);
    res.status(500).json({
      error: "Erreur lors de l'export JSON de la base de données",
      details: error.message,
    });
  }
};

// Statistiques de la base de données
exports.getDatabaseStats = async (req, res) => {
  try {
    // Récupérer les tables réelles
    let actualTables = [];
    try {
      const [tables] = await new Promise((resolve, reject) => {
        con.query(`SHOW TABLES`, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      actualTables = tables.map((row) => Object.values(row)[0]);
    } catch (error) {
      actualTables = [
        "patients",
        "consultation",
        "facture",
        "medicaments",
        "ligneordonance",
        "users",
        "settings",
      ];
    }

    const stats = {};
    let totalRows = 0;

    for (const table of actualTables) {
      try {
        // Compter les lignes
        const [countResult] = await new Promise((resolve, reject) => {
          con.query(
            `SELECT COUNT(*) as count FROM \`${table}\``,
            (err, results) => {
              if (err) reject(err);
              else resolve(results);
            }
          );
        });

        const rowCount = countResult[0].count;
        totalRows += parseInt(rowCount);

        stats[table] = {
          rows: rowCount,
          size: "N/A",
        };
      } catch (error) {
        console.error(`Error getting stats for table ${table}:`, error);
        stats[table] = { rows: 0, size: 0, error: error.message };
      }
    }

    res.json({
      totalTables: Object.keys(stats).length,
      totalRows: totalRows,
      tables: stats,
      exportFormats: ["SQL (Recommandé)", "CSV", "JSON"],
    });
  } catch (error) {
    console.error("Error getting database stats:", error);
    res.status(500).json({
      error: "Erreur lors de la récupération des statistiques",
      details: error.message,
    });
  }
};
