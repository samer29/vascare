const con = require("../config/db");

// Get invoices by consultation
exports.getFacturesByConsultation = (req, res) => {
  const { consultationId } = req.query;

  if (!consultationId) {
    return res.status(400).json({ error: "consultationId is required" });
  }

  const sql = `
    SELECT f.*, c.DateConsultation 
    FROM Facture f 
    LEFT JOIN consultation c ON f.IDConsultation = c.ID 
    WHERE f.IDConsultation = ? 
    ORDER BY f.DateCreation DESC
  `;

  con.query(sql, [consultationId], (err, result) => {
    if (err) {
      console.error("Error fetching factures:", err.message);
      return res.status(500).json({ error: err.message });
    }
    return res.status(200).json(result);
  });
};

// Create new invoice item
exports.createFacture = (req, res) => {
  const { IDConsultation, Act, PrixAct } = req.body;

  if (!IDConsultation || !Act || !PrixAct) {
    return res
      .status(400)
      .json({ error: "IDConsultation, Act, and PrixAct are required" });
  }

  const sql =
    "INSERT INTO Facture (IDConsultation, Act, PrixAct) VALUES (?, ?, ?)";

  con.query(sql, [IDConsultation, Act, PrixAct], (err, result) => {
    if (err) {
      console.error("Error creating facture:", err.message);
      return res.status(500).json({ error: err.message });
    }
    return res.status(201).json({
      message: "Facture item created successfully",
      insertId: result.insertId,
    });
  });
};

// Update invoice item
exports.updateFacture = (req, res) => {
  const id = req.params.id;
  const { Act, PrixAct } = req.body;

  if (!Act || !PrixAct) {
    return res.status(400).json({ error: "Act and PrixAct are required" });
  }

  const sql = "UPDATE Facture SET Act = ?, PrixAct = ? WHERE ID = ?";

  con.query(sql, [Act, PrixAct, id], (err, result) => {
    if (err) {
      console.error("Error updating facture:", err.message);
      return res.status(500).json({ error: err.message });
    }
    return res.status(200).json({
      message: "Facture item updated successfully",
      affectedRows: result.affectedRows,
    });
  });
};

// Delete invoice item
exports.deleteFacture = (req, res) => {
  const id = req.params.id;

  const sql = "DELETE FROM Facture WHERE ID = ?";

  con.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting facture:", err.message);
      return res.status(500).json({ error: err.message });
    }
    return res.status(200).json({
      message: "Facture item deleted successfully",
      affectedRows: result.affectedRows,
    });
  });
};

// Mark invoice as generated
exports.markAsGenerated = (req, res) => {
  const { consultationId } = req.body;

  if (!consultationId) {
    return res.status(400).json({ error: "consultationId is required" });
  }

  const sql = "UPDATE Facture SET IsGenerated = TRUE WHERE IDConsultation = ?";

  con.query(sql, [consultationId], (err, result) => {
    if (err) {
      console.error("Error marking facture as generated:", err.message);
      return res.status(500).json({ error: err.message });
    }
    return res.status(200).json({
      message: "Facture marked as generated successfully",
      affectedRows: result.affectedRows,
    });
  });
};
exports.getStatut = (req, res) => {
  const { consultationId } = req.query;

  try {
    const sql = `
      SELECT 
        Status,
        PaidAmount,
        PaymentDate,
        TotalAmount
      FROM facture_status 
      WHERE ConsultationId = ?
    `;

    con.query(sql, [consultationId], (err, result) => {
      if (err) {
        console.error("Error fetching facture status:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (result.length > 0) {
        res.json(result[0]);
      } else {
        // Default status
        res.json({
          status: "unpaid",
          paidAmount: 0,
          paymentDate: null,
          totalAmount: 0,
        });
      }
    });
  } catch (error) {
    console.error("Error in facture status:", error);
    res.status(500).json({ error: "Server error" });
  }
};
exports.updateStatut = (req, res) => {
  const { consultationId, status, paidAmount, paymentDate, totalAmount } =
    req.body;

  try {
    // Check if record exists
    const checkSql = "SELECT ID FROM facture_status WHERE ConsultationId = ?";

    con.query(checkSql, [consultationId], (err, result) => {
      if (err) {
        console.error("Error checking facture status:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (result.length > 0) {
        // Update existing
        const updateSql = `
          UPDATE facture_status 
          SET Status = ?, PaidAmount = ?, PaymentDate = ?, TotalAmount = ?, UpdatedAt = NOW()
          WHERE ConsultationId = ?
        `;
        con.query(
          updateSql,
          [status, paidAmount, paymentDate, totalAmount, consultationId],
          (err) => {
            if (err) {
              console.error("Error updating facture status:", err);
              return res.status(500).json({ error: "Update error" });
            }
            res.json({ message: "Payment status updated successfully" });
          }
        );
      } else {
        // Insert new
        const insertSql = `
          INSERT INTO facture_status (ConsultationId, Status, PaidAmount, PaymentDate, TotalAmount)
          VALUES (?, ?, ?, ?, ?)
        `;
        con.query(
          insertSql,
          [consultationId, status, paidAmount, paymentDate, totalAmount],
          (err) => {
            if (err) {
              console.error("Error inserting facture status:", err);
              return res.status(500).json({ error: "Insert error" });
            }
            res.json({ message: "Payment status created successfully" });
          }
        );
      }
    });
  } catch (error) {
    console.error("Error in update payment:", error);
    res.status(500).json({ error: "Server error" });
  }
};
exports.getFactureStats = (req, res) => {
  const { range } = req.query; // 'month' or 'year'

  let dateCondition = "";
  if (range === "month") {
    dateCondition =
      "WHERE YEAR(DateCreation) = YEAR(CURDATE()) AND MONTH(DateCreation) = MONTH(CURDATE())";
  } else if (range === "year") {
    dateCondition = "WHERE YEAR(DateCreation) = YEAR(CURDATE())";
  }

  const sql = `
    SELECT 
      COUNT(*) AS totalFactures,
      SUM(PrixAct) AS totalMontant,
      DATE_FORMAT(DateCreation, '%Y-%m') AS month
    FROM Facture
    ${dateCondition}
  `;

  con.query(sql, (err, result) => {
    if (err) {
      console.error("Error fetching facture stats:", err.message);
      return res.status(500).json({ error: "Database error" });
    }

    return res
      .status(200)
      .json(result[0] || { totalFactures: 0, totalMontant: 0 });
  });
};
