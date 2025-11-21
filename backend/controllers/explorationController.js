const con = require("../config/db");

exports.getExplorationGroups = (req, res) => {
  const sql = `
    SELECT g.id AS groupId, g.name AS groupName, i.id AS itemId, i.name AS itemName
    FROM exploration_groups g
    LEFT JOIN exploration_items i ON g.id = i.group_id
    ORDER BY g.id, i.id
  `;

  con.query(sql, (err, results) => {
    if (err) {
      console.error("Erreur lors du chargement des explorations:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    // Transformer les résultats → [{ id, name, items: [{ id, name }] }]
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
exports.createExplorationGroup = (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const sql = "INSERT INTO exploration_groups (name) VALUES (?)";
  con.query(sql, [name], (err, result) => {
    if (err) {
      console.error("Error creating exploration group:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ id: result.insertId, name, items: [] });
  });
};

exports.deleteExplorationGroup = (req, res) => {
  const { id } = req.params;

  // D'abord supprimer les items associés
  const deleteItemsSql = "DELETE FROM exploration_items WHERE group_id = ?";
  con.query(deleteItemsSql, [id], (err) => {
    if (err) {
      console.error("Error deleting exploration items:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // Puis supprimer le groupe
    const deleteGroupSql = "DELETE FROM exploration_groups WHERE id = ?";
    con.query(deleteGroupSql, [id], (err, result) => {
      if (err) {
        console.error("Error deleting exploration group:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "Group deleted successfully" });
    });
  });
};

exports.createExplorationItem = (req, res) => {
  const { groupId, name } = req.body;
  if (!groupId || !name)
    return res.status(400).json({ error: "Group ID and name are required" });

  const sql = "INSERT INTO exploration_items (group_id, name) VALUES (?, ?)";
  con.query(sql, [groupId, name], (err, result) => {
    if (err) {
      console.error("Error creating exploration item:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ id: result.insertId, name });
  });
};
exports.deleteExplorationItem = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM exploration_items WHERE id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting exploration item:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Item deleted successfully" });
  });
};
// 🔹 UPDATE: Update exploration group
exports.updateExplorationGroup = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) return res.status(400).json({ error: "Name is required" });

  const sql = "UPDATE exploration_groups SET name = ? WHERE id = ?";
  con.query(sql, [name, id], (err, result) => {
    if (err) {
      console.error("Error updating exploration group:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.json({ message: "Group updated successfully" });
  });
};

// 🔹 UPDATE: Update exploration item
exports.updateExplorationItem = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) return res.status(400).json({ error: "Name is required" });

  const sql = "UPDATE exploration_items SET name = ? WHERE id = ?";
  con.query(sql, [name, id], (err, result) => {
    if (err) {
      console.error("Error updating exploration item:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json({ message: "Item updated successfully" });
  });
};
