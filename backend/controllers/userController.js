const con = require("../config/db");
const jwtGenerator = require("../config/jwtgenerator");
const bcrypt = require("bcrypt");

// ✅ Register user
exports.insertUser = async (req, res) => {
  console.log("Registering");
  try {
    const { username, password, email, avatar, grade } = req.body;
    if (!username || !password)
      return res
        .status(400)
        .json({ error: "Nom d'utilisateur et mot de passe requis" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const sql =
      "INSERT INTO users (username, password, grade, email, avatar) VALUES (?, ?, ?, ?, ?)";
    con.query(
      sql,
      [username, hashedPassword, grade || "user", email || "", avatar || ""],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        res.json({ message: "Utilisateur ajouté", id: result.insertId });
      }
    );
  } catch (error) {
    console.log(error);
    console.log("Register request:", req.body);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Login
exports.loginUser = (req, res) => {
  const { username, password } = req.body;

  const sql = "SELECT * FROM users WHERE username = ?";
  con.query(sql, [username], async (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur serveur" });
    if (rows.length === 0) {
      return res.status(401).json({ error: "Utilisateur introuvable" });
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    const token = jwtGenerator(user); // ← passe l'objet complet
    res.json({
      token,
      user: {
        ID: user.ID,
        username: user.username,
        grade: user.grade,
        email: user.email,
      },
    });
  });
};

// ✅ Verify token
exports.verifyUser = (req, res) => {
  res.json({ isValid: true, user: req.user });
};

// ✅ Get all users
exports.getAllUsers = (req, res) => {
  con.query(
    "SELECT ID, username, grade, email, avatar,last_login FROM users",
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Erreur serveur" });
      res.json(rows);
    }
  );
};

// ✅ Edit user
exports.editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, grade, email, avatar } = req.body;

    let fields = [];
    let values = [];

    if (username) {
      fields.push("username = ?");
      values.push(username);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      fields.push("password = ?");
      values.push(hashedPassword);
    }
    if (grade) {
      fields.push("grade = ?");
      values.push(grade);
    }
    if (email !== undefined) {
      fields.push("email = ?");
      values.push(email);
    }
    if (avatar !== undefined) {
      fields.push("avatar = ?");
      values.push(avatar);
    }

    if (fields.length === 0) {
      return res
        .status(400)
        .json({ error: "Aucune donnée fournie pour la mise à jour" });
    }

    values.push(id);
    const sql = `UPDATE users SET ${fields.join(", ")} WHERE ID = ?`;
    con.query(sql, values, (err, result) => {
      if (err) return res.status(500).json({ error: "Erreur de mise à jour" });
      res.json({ message: "Utilisateur mis à jour avec succès" });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Delete user
exports.deleteUser = (req, res) => {
  const { id } = req.params;
  con.query("DELETE FROM users WHERE ID = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: "Erreur suppression" });
    res.json({ message: "Utilisateur supprimé" });
  });
};
exports.getCurrentUser = (req, res) => {
  // User info is already attached by auth middleware
  res.json({
    id: req.user.id,
    username: req.user.username,
    grade: req.user.grade,
    email: req.user.email,
  });
};
