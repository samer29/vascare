const con = require("../config/db");

exports.getBiologicalGroups = (req, res) => {
  const sql = `
    SELECT g.id AS groupId, g.name AS groupName, i.id AS itemId, i.name AS itemName
    FROM biological_groups g
    LEFT JOIN biological_items i ON g.id = i.group_id
    ORDER BY g.id, i.id
  `;

  con.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching biological data:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // Transform rows → { id, name, items: [{ id, name }] }
    const groups = [];
    results.forEach((row) => {
      let group = groups.find((g) => g.id === row.groupId);
      if (!group) {
        group = {
          id: row.groupId,
          name: row.groupName,
          items: [],
        };
        groups.push(group);
      }
      if (row.itemId && row.itemName) {
        group.items.push({
          id: row.itemId,
          name: row.itemName,
        });
      }
    });

    res.json(groups);
  });
};

// Ajoutez ces fonctions pour la création/suppression
exports.createBiologicalGroup = (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const sql = "INSERT INTO biological_groups (name) VALUES (?)";
  con.query(sql, [name], (err, result) => {
    if (err) {
      console.error("Error creating biological group:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ id: result.insertId, name, items: [] });
  });
};

exports.deleteBiologicalGroup = (req, res) => {
  const { id } = req.params;

  // D'abord supprimer les items associés
  const deleteItemsSql = "DELETE FROM biological_items WHERE group_id = ?";
  con.query(deleteItemsSql, [id], (err) => {
    if (err) {
      console.error("Error deleting biological items:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // Puis supprimer le groupe
    const deleteGroupSql = "DELETE FROM biological_groups WHERE id = ?";
    con.query(deleteGroupSql, [id], (err, result) => {
      if (err) {
        console.error("Error deleting biological group:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "Group deleted successfully" });
    });
  });
};

exports.createBiologicalItem = (req, res) => {
  const { groupId, name } = req.body;
  if (!groupId || !name)
    return res.status(400).json({ error: "Group ID and name are required" });

  const sql = "INSERT INTO biological_items (group_id, name) VALUES (?, ?)";
  con.query(sql, [groupId, name], (err, result) => {
    if (err) {
      console.error("Error creating biological item:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ id: result.insertId, name });
  });
};

exports.deleteBiologicalItem = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM biological_items WHERE id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting biological item:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Item deleted successfully" });
  });
};
// Add these functions to biologicalController.js

exports.updateBiologicalGroup = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) return res.status(400).json({ error: "Name is required" });

  const sql = "UPDATE biological_groups SET name = ? WHERE id = ?";
  con.query(sql, [name, id], (err, result) => {
    if (err) {
      console.error("Error updating biological group:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.json({ message: "Group updated successfully" });
  });
};

exports.updateBiologicalItem = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) return res.status(400).json({ error: "Name is required" });

  const sql = "UPDATE biological_items SET name = ? WHERE id = ?";
  con.query(sql, [name, id], (err, result) => {
    if (err) {
      console.error("Error updating biological item:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json({ message: "Item updated successfully" });
  });
};
