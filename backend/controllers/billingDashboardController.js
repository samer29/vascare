const db = require("../config/db");

// Optimized billing dashboard data
exports.getBillingDashboard = (req, res) => {
  try {
    const {
      timeRange = "today",
      patientId = "all",
      page = 1,
      limit = 50,
    } = req.query;

    // Calculate date range based on timeRange
    let dateCondition = "";
    const params = [];

    const now = new Date();

    if (timeRange === "today") {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      dateCondition = "AND c.DateConsultation >= ? AND c.DateConsultation < ?";
      params.push(today, tomorrow);
    } else if (timeRange === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateCondition = "AND c.DateConsultation >= ?";
      params.push(weekAgo);
    } else if (timeRange === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateCondition = "AND c.DateConsultation >= ?";
      params.push(monthAgo);
    } else if (timeRange === "year") {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      dateCondition = "AND c.DateConsultation >= ?";
      params.push(yearAgo);
    }
    // "all" - no date condition

    // Patient filter
    if (patientId !== "all") {
      dateCondition += " AND c.IDPatient = ?";
      params.push(patientId);
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Main query to get invoices with facture data
    const query = `
      SELECT 
        c.ID as consultationId,
        c.DateConsultation,
        c.Motif,
        p.ID as patientId,
        p.Nom,
        p.Prenom,
        p.DateNaissance,
        COALESCE(SUM(f.PrixAct), 0) as totalAmount,
        COALESCE(fs.PaidAmount, 0) as paidAmount,
        COALESCE(fs.Status, 'unpaid') as paymentStatus,
        COUNT(f.ID) as factureItemCount,
        GROUP_CONCAT(DISTINCT f.Act) as acts
      FROM consultation c
      LEFT JOIN patients p ON c.IDPatient = p.ID
      LEFT JOIN facture f ON c.ID = f.IDConsultation
      LEFT JOIN facture_status fs ON c.ID = fs.ConsultationId
      WHERE 1=1 ${dateCondition}
      GROUP BY c.ID, p.ID, fs.PaidAmount, fs.Status
      ORDER BY c.DateConsultation DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), offset);

    db.query(query, params, (err, invoices) => {
      if (err) {
        console.error("Error in billing dashboard query:", err);
        return res.status(500).json({
          error:
            "Erreur serveur lors de la récupération des données de facturation",
        });
      }

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(DISTINCT c.ID) as total
        FROM consultation c
        WHERE 1=1 ${dateCondition}
      `;

      const countParams = params.slice(0, -2); // Remove limit and offset

      db.query(countQuery, countParams, (countErr, countResult) => {
        if (countErr) {
          console.error("Error in count query:", countErr);
          return res.status(500).json({
            error: "Erreur serveur lors du comptage des données",
          });
        }

        const total = countResult[0]?.total || 0;

        // Format the response
        const formattedInvoices = invoices.map((invoice) => {
          const status =
            invoice.paymentStatus === "paid"
              ? "paid"
              : invoice.paymentStatus === "partial"
              ? "partial"
              : invoice.totalAmount > 0 && invoice.paidAmount === 0
              ? "unpaid"
              : "unpaid";

          return {
            id: invoice.consultationId,
            patientId: invoice.patientId,
            patientName: `${invoice.Nom} ${invoice.Prenom}`,
            act: invoice.acts
              ? invoice.acts.split(",")[0]
              : invoice.Motif || "Consultation générale",
            amount: parseFloat(invoice.totalAmount),
            paidAmount: parseFloat(invoice.paidAmount),
            status: status,
            date: invoice.DateConsultation,
            factureItemCount: invoice.factureItemCount,
            patient: {
              ID: invoice.patientId,
              Nom: invoice.Nom,
              Prenom: invoice.Prenom,
              DateNaissance: invoice.DateNaissance,
            },
          };
        });

        res.json({
          invoices: formattedInvoices,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit),
          },
        });
      });
    });
  } catch (error) {
    console.error("Error in billing dashboard:", error);
    res.status(500).json({
      error:
        "Erreur serveur lors de la récupération des données de facturation",
    });
  }
};

// Get billing statistics - SIMPLIFIED AND WORKING VERSION
exports.getBillingStats = (req, res) => {
  try {
    const { timeRange = "today" } = req.query;

    let dateCondition = "";
    const params = [];

    const now = new Date();

    if (timeRange === "today") {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      dateCondition = "AND DateConsultation >= ? AND DateConsultation < ?";
      params.push(today, tomorrow);
    } else if (timeRange === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateCondition = "AND DateConsultation >= ?";
      params.push(weekAgo);
    } else if (timeRange === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateCondition = "AND DateConsultation >= ?";
      params.push(monthAgo);
    } else if (timeRange === "year") {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      dateCondition = "AND DateConsultation >= ?";
      params.push(yearAgo);
    }

    // Query 1: Basic consultation stats
    const basicStatsQuery = `
      SELECT 
        COUNT(DISTINCT c.ID) as totalConsultations,
        COALESCE(SUM(f.PrixAct), 0) as totalRevenue,
        COALESCE(SUM(fs.PaidAmount), 0) as totalPaid
      FROM consultation c
      LEFT JOIN facture f ON c.ID = f.IDConsultation
      LEFT JOIN facture_status fs ON c.ID = fs.ConsultationId
      WHERE 1=1 ${dateCondition}
    `;

    // Query 2: Count by status
    const statusCountQuery = `
      SELECT 
        fs.Status,
        COUNT(DISTINCT c.ID) as count
      FROM consultation c
      LEFT JOIN facture_status fs ON c.ID = fs.ConsultationId
      WHERE 1=1 ${dateCondition}
      GROUP BY fs.Status
    `;

    // Query 3: Facture stats
    const factureStatsQuery = `
      SELECT 
        COUNT(*) as totalFactures,
        COALESCE(SUM(PrixAct), 0) as totalMontant
      FROM facture
      WHERE 1=1 ${dateCondition.replace(/DateConsultation/g, "DateCreation")}
    `;

    const factureParams = [...params]; // Copy params for facture query

    // Execute all queries
    db.query(basicStatsQuery, params, (err, basicStats) => {
      if (err) {
        console.error("Error in basic stats query:", err);
        return res.status(500).json({
          error:
            "Erreur serveur lors de la récupération des statistiques de base",
        });
      }

      db.query(statusCountQuery, params, (statusErr, statusCounts) => {
        if (statusErr) {
          console.error("Error in status count query:", statusErr);
          return res.status(500).json({
            error: "Erreur serveur lors de la récupération des statuts",
          });
        }

        db.query(
          factureStatsQuery,
          factureParams,
          (factureErr, factureStats) => {
            if (factureErr) {
              console.error("Error in facture stats query:", factureErr);
              return res.status(500).json({
                error:
                  "Erreur serveur lors de la récupération des statistiques de facture",
              });
            }

            // Process status counts
            const statusMap = {};
            statusCounts.forEach((row) => {
              statusMap[row.Status || "unpaid"] = row.count;
            });

            const result = {
              ...basicStats[0],
              paidCount: statusMap["paid"] || 0,
              unpaidCount: statusMap["unpaid"] || 0,
              partialCount: statusMap["partial"] || 0,
              totalFactures: factureStats[0]?.totalFactures || 0,
              totalMontant: parseFloat(factureStats[0]?.totalMontant || 0),
            };

            res.json(result);
          }
        );
      });
    });
  } catch (error) {
    console.error("Error in billing stats:", error);
    res.status(500).json({
      error: "Erreur serveur lors de la récupération des statistiques",
    });
  }
};

// Get revenue by act type
exports.getRevenueByAct = (req, res) => {
  try {
    const { timeRange = "today" } = req.query;

    let dateCondition = "";
    const params = [];

    const now = new Date();

    if (timeRange === "today") {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      dateCondition = "AND c.DateConsultation >= ? AND c.DateConsultation < ?";
      params.push(today, tomorrow);
    } else if (timeRange === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateCondition = "AND c.DateConsultation >= ?";
      params.push(weekAgo);
    } else if (timeRange === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateCondition = "AND c.DateConsultation >= ?";
      params.push(monthAgo);
    } else if (timeRange === "year") {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      dateCondition = "AND c.DateConsultation >= ?";
      params.push(yearAgo);
    }

    const query = `
      SELECT 
        f.Act as name,
        SUM(f.PrixAct) as revenue
      FROM facture f
      LEFT JOIN consultation c ON f.IDConsultation = c.ID
      WHERE 1=1 ${dateCondition}
      GROUP BY f.Act
      ORDER BY revenue DESC
      LIMIT 10
    `;

    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Error in revenue by act query:", err);
        return res.status(500).json({
          error: "Erreur serveur lors de la récupération des revenus par acte",
        });
      }

      const formattedResults = results.map((row) => ({
        name: row.name || "Autre acte",
        revenue: parseFloat(row.revenue) || 0,
      }));

      res.json(formattedResults);
    });
  } catch (error) {
    console.error("Error in revenue by act:", error);
    res.status(500).json({
      error: "Erreur serveur lors de la récupération des revenus par acte",
    });
  }
};
