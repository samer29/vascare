const db = require("../config/db"); // Fixed: use db instead of con

exports.getBillings = async (req, res) => {
  // Fixed: function name consistency
  try {
    const [results] = await db.execute(`
      SELECT b.*, p.Nom, p.Prenom, c.Motif, c.DateConsultation 
      FROM billing b
      JOIN patients p ON b.IDPatient = p.ID
      JOIN consultations c ON b.IDConsultation = c.ID
      ORDER BY b.CreatedAt DESC
    `);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createBilling = async (req, res) => {
  // Fixed: function name consistency
  try {
    const { IDConsultation, IDPatient, Amount, Status, PaymentMethod, Notes } =
      req.body;

    // Validate required fields
    if (!IDConsultation || !IDPatient || Amount === undefined) {
      return res
        .status(400)
        .json({ error: "IDConsultation, IDPatient, and Amount are required" });
    }

    const [result] = await db.execute(
      `INSERT INTO billing (IDConsultation, IDPatient, Amount, Status, PaymentMethod, Notes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        IDConsultation,
        IDPatient,
        Amount,
        Status || "unpaid",
        PaymentMethod || "cash",
        Notes || "",
      ]
    );

    res.status(201).json({
      message: "Billing record created successfully",
      id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateBilling = async (req, res) => {
  try {
    const { Status, PaymentMethod, PaymentDate, Notes } = req.body;

    // Check if billing record exists
    const [existing] = await db.execute(`SELECT ID FROM billing WHERE ID = ?`, [
      req.params.id,
    ]);

    if (existing.length === 0) {
      return res.status(404).json({ error: "Billing record not found" });
    }

    await db.execute(
      `UPDATE billing SET Status = ?, PaymentMethod = ?, PaymentDate = ?, Notes = ? 
       WHERE ID = ?`,
      [Status, PaymentMethod, PaymentDate, Notes, req.params.id]
    );

    res.json({ message: "Billing record updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBilling = async (req, res) => {
  try {
    // Check if billing record exists
    const [existing] = await db.execute(`SELECT ID FROM billing WHERE ID = ?`, [
      req.params.id,
    ]);

    if (existing.length === 0) {
      return res.status(404).json({ error: "Billing record not found" });
    }

    await db.execute(`DELETE FROM billing WHERE ID = ?`, [req.params.id]);
    res.json({ message: "Billing record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Additional useful endpoints
exports.getBillingById = async (req, res) => {
  try {
    const [results] = await db.execute(
      `
      SELECT b.*, p.Nom, p.Prenom, c.Motif, c.DateConsultation 
      FROM billing b
      JOIN patients p ON b.IDPatient = p.ID
      JOIN consultations c ON b.IDConsultation = c.ID
      WHERE b.ID = ?
    `,
      [req.params.id]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: "Billing record not found" });
    }

    res.json(results[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBillingStats = async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as totalInvoices,
        SUM(Amount) as totalAmount,
        SUM(CASE WHEN Status = 'paid' THEN Amount ELSE 0 END) as paidAmount,
        SUM(CASE WHEN Status = 'unpaid' THEN Amount ELSE 0 END) as unpaidAmount,
        SUM(CASE WHEN Status = 'partial' THEN Amount ELSE 0 END) as partialAmount,
        COUNT(CASE WHEN Status = 'paid' THEN 1 END) as paidCount,
        COUNT(CASE WHEN Status = 'unpaid' THEN 1 END) as unpaidCount,
        COUNT(CASE WHEN Status = 'partial' THEN 1 END) as partialCount
      FROM billing
    `);

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
