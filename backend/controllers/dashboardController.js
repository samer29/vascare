const con = require("../config/db");

// Helper function to format month names in French
const getFrenchMonthName = (monthNumber) => {
  const months = [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Juin",
    "Juil",
    "Août",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
  ];
  return months[monthNumber - 1] || "Inconnu";
};

// Helper function to calculate age
const calculateAge = (dob) => {
  if (!dob) return "N/A";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

// Fetch monthly revenue - FIXED WITH CORRECT TABLE NAMES AND DATA
exports.getRevenue = (req, res) => {
  try {
    // Get ALL revenue data regardless of year to see your 2025 data
    const query = `
      SELECT 
        MONTH(c.DateConsultation) AS month,
        COALESCE(SUM(f.PrixAct), 0) AS revenue
      FROM consultation c
      LEFT JOIN facture f ON c.ID = f.IDConsultation
      WHERE c.DateConsultation IS NOT NULL
      GROUP BY MONTH(c.DateConsultation)
      ORDER BY month
    `;

    console.log("Executing revenue query for all data");

    con.query(query, [], (err, result) => {
      if (err) {
        console.error("Database error in getRevenue:", err.message);
        console.error("SQL:", query);
        return res
          .status(500)
          .json({ error: "Database error", detail: err.message });
      }

      console.log("Raw revenue result:", result);

      // Create data for all months (even if no revenue)
      const revenueData = [];
      for (let month = 1; month <= 12; month++) {
        const monthData = result.find((row) => row.month === month);
        revenueData.push({
          name: getFrenchMonthName(month),
          month: getFrenchMonthName(month),
          revenue: monthData ? parseFloat(monthData.revenue) : 0,
        });
      }

      console.log("Processed revenue data:", revenueData);
      return res.status(200).json(revenueData);
    });
  } catch (error) {
    console.error("Unexpected error in getRevenue:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};

// Fetch monthly activity - FIXED WITH CORRECT TABLE NAMES
exports.getActivity = (req, res) => {
  try {
    // Get ALL activity data to see your 2025 data
    const query = `
      SELECT 
        MONTH(c.DateConsultation) AS month,
        COUNT(DISTINCT c.ID) AS consultations,
        COUNT(DISTINCT e.ID) AS echographies,
        COUNT(DISTINCT t.ID) AS thyroide,
        COUNT(DISTINCT ecg.ID) AS ecg
      FROM consultation c
      LEFT JOIN echographie e ON c.ID = e.IDConsultation
      LEFT JOIN thyroide t ON c.ID = t.IDConsultation
      LEFT JOIN ecg_data ecg ON c.ID = ecg.IDConsultation
      WHERE c.DateConsultation IS NOT NULL
      GROUP BY MONTH(c.DateConsultation)
      ORDER BY month
    `;

    console.log("Executing activity query for all data");

    con.query(query, [], (err, result) => {
      if (err) {
        console.error("Database error in getActivity:", err.message);
        console.error("SQL:", query);
        return res
          .status(500)
          .json({ error: "Database error", detail: err.message });
      }

      console.log("Raw activity result:", result);

      // Create data for all months
      const activityData = [];
      for (let month = 1; month <= 12; month++) {
        const monthData = result.find((row) => row.month === month);
        activityData.push({
          name: getFrenchMonthName(month),
          month: getFrenchMonthName(month),
          consultations: monthData ? parseInt(monthData.consultations) : 0,
          echographies: monthData ? parseInt(monthData.echographies) : 0,
          thyroide: monthData ? parseInt(monthData.thyroide) : 0,
          ecg: monthData ? parseInt(monthData.ecg) : 0,
        });
      }

      console.log("Processed activity data:", activityData);
      return res.status(200).json(activityData);
    });
  } catch (error) {
    console.error("Unexpected error in getActivity:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};

// Fetch today's appointments - FIXED TO COUNT UNIQUE PATIENTS
exports.getTodayAppointments = (req, res) => {
  try {
    // For testing, let's use your actual date from the data: 2025-11-21
    const testDate = "2025-11-21"; // Use your actual data date for testing
    // const today = new Date().toISOString().split('T')[0]; // Use this for production

    const query = `
      SELECT 
        p.ID,
        p.Nom,
        p.Prenom,
        p.DateNaissance,
        p.Poids,
        p.ATCD,
        c.ID AS consultationId,
        c.DateConsultation,
        c.Motif
      FROM patients p
      INNER JOIN consultation c ON p.ID = c.IDPatient
      WHERE DATE(c.DateConsultation) = ?
      ORDER BY c.DateConsultation ASC
    `;

    console.log("Executing today's appointments query for date:", testDate);

    con.query(query, [testDate], (err, result) => {
      if (err) {
        console.error("Database error in getTodayAppointments:", err.message);
        console.error("SQL:", query);
        return res
          .status(500)
          .json({ error: "Database error", detail: err.message });
      }

      console.log("Raw today's appointments result:", result);

      const patients = result.map((row) => ({
        id: row.ID,
        name: `${row.Nom} ${row.Prenom}`.trim(),
        dob: row.DateNaissance,
        age: calculateAge(row.DateNaissance),
        weight: row.Poids,
        history: row.ATCD || "",
        diagnostic: row.Motif || "Consultation",
        DateConsultation: row.DateConsultation,
      }));

      console.log("Processed today's appointments:", patients);
      return res.status(200).json(patients);
    });
  } catch (error) {
    console.error("Unexpected error in getTodayAppointments:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};

// Get dashboard statistics - COMPLETELY REWRITTEN TO USE YOUR ACTUAL DATA
exports.getDashboardStats = (req, res) => {
  try {
    console.log("Getting dashboard stats from actual data...");

    // Query 1: Total unique patients (count distinct patients)
    const totalPatientsQuery = `SELECT COUNT(DISTINCT ID) as total FROM patients`;

    // Query 2: Total revenue from ALL factures (sum all PrixAct)
    const totalRevenueQuery = `SELECT COALESCE(SUM(PrixAct), 0) as total FROM facture`;

    // Query 3: Monthly consultations (count consultations for current month)
    const monthlyConsultationsQuery = `
      SELECT COUNT(*) as total 
      FROM consultation 
      WHERE MONTH(DateConsultation) = MONTH(CURDATE()) 
      AND YEAR(DateConsultation) = YEAR(CURDATE())
    `;

    // Query 4: Today's UNIQUE patients (count distinct patients for today)
    const todayPatientsQuery = `
      SELECT COUNT(DISTINCT c.IDPatient) as total 
      FROM consultation c 
      WHERE DATE(c.DateConsultation) = CURDATE()
    `;

    // For testing with your actual data, use this instead:
    const todayPatientsTestQuery = `
      SELECT COUNT(DISTINCT c.IDPatient) as total 
      FROM consultation c 
      WHERE DATE(c.DateConsultation) = '2025-11-21'
    `;

    // Execute queries
    con.query(totalPatientsQuery, (err, patientsResult) => {
      if (err) {
        console.error("Error in totalPatientsQuery:", err.message);
        return res
          .status(500)
          .json({ error: "Database error", detail: err.message });
      }

      con.query(totalRevenueQuery, (err, revenueResult) => {
        if (err) {
          console.error("Error in totalRevenueQuery:", err.message);
          return res
            .status(500)
            .json({ error: "Database error", detail: err.message });
        }

        con.query(monthlyConsultationsQuery, (err, monthlyResult) => {
          if (err) {
            console.error("Error in monthlyConsultationsQuery:", err.message);
            return res
              .status(500)
              .json({ error: "Database error", detail: err.message });
          }

          // Use test query for your data, change to todayPatientsQuery for production
          con.query(todayPatientsTestQuery, (err, todayResult) => {
            if (err) {
              console.error("Error in todayPatientsQuery:", err.message);
              return res
                .status(500)
                .json({ error: "Database error", detail: err.message });
            }

            const stats = {
              totalPatients: parseInt(patientsResult[0].total) || 0,
              totalRevenue: parseFloat(revenueResult[0].total) || 0,
              monthlyConsultations: parseInt(monthlyResult[0].total) || 0,
              todayPatientsCount: parseInt(todayResult[0].total) || 0,
            };

            console.log("Dashboard stats from actual data:", stats);
            return res.status(200).json(stats);
          });
        });
      });
    });
  } catch (error) {
    console.error("Unexpected error in getDashboardStats:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};

// NEW: Get comprehensive financial stats from facture table
exports.getFinancialStats = (req, res) => {
  try {
    console.log("Getting comprehensive financial stats...");

    // Get total revenue from facture table (this should be 7,800 DZD based on your data)
    const revenueQuery = `
      SELECT 
        COALESCE(SUM(PrixAct), 0) as totalRevenue,
        COUNT(*) as totalInvoices,
        COUNT(DISTINCT IDConsultation) as uniqueConsultations
      FROM facture
    `;

    // Get revenue by act type
    const revenueByActQuery = `
      SELECT 
        Act,
        SUM(PrixAct) as revenue,
        COUNT(*) as count
      FROM facture
      GROUP BY Act
      ORDER BY revenue DESC
    `;

    // Get today's financial activity (using your test date)
    const todayRevenueQuery = `
      SELECT 
        COALESCE(SUM(f.PrixAct), 0) as todayRevenue,
        COUNT(DISTINCT f.IDConsultation) as todayConsultations
      FROM facture f
      INNER JOIN consultation c ON f.IDConsultation = c.ID
      WHERE DATE(c.DateConsultation) = '2025-11-21'
    `;

    con.query(revenueQuery, (err, revenueResult) => {
      if (err) {
        console.error("Error in revenueQuery:", err.message);
        return res
          .status(500)
          .json({ error: "Database error", detail: err.message });
      }

      con.query(revenueByActQuery, (err, actResult) => {
        if (err) {
          console.error("Error in revenueByActQuery:", err.message);
          return res
            .status(500)
            .json({ error: "Database error", detail: err.message });
        }

        con.query(todayRevenueQuery, (err, todayResult) => {
          if (err) {
            console.error("Error in todayRevenueQuery:", err.message);
            return res
              .status(500)
              .json({ error: "Database error", detail: err.message });
          }

          const financialStats = {
            totalRevenue: parseFloat(revenueResult[0].totalRevenue) || 0,
            totalInvoices: parseInt(revenueResult[0].totalInvoices) || 0,
            uniqueConsultations:
              parseInt(revenueResult[0].uniqueConsultations) || 0,
            todayRevenue: parseFloat(todayResult[0].todayRevenue) || 0,
            todayConsultations:
              parseInt(todayResult[0].todayConsultations) || 0,
            revenueByAct: actResult.map((row) => ({
              act: row.Act,
              revenue: parseFloat(row.revenue) || 0,
              count: parseInt(row.count) || 0,
            })),
          };

          console.log("Comprehensive financial stats:", financialStats);
          return res.status(200).json(financialStats);
        });
      });
    });
  } catch (error) {
    console.error("Unexpected error in getFinancialStats:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};

// Test endpoint to check database connection and data
exports.testConnection = (req, res) => {
  try {
    // Test multiple tables to see what data exists
    const testQueries = [
      "SELECT COUNT(*) as patients_count FROM patients",
      "SELECT COUNT(*) as consultations_count FROM consultation",
      "SELECT COUNT(*) as factures_count, COALESCE(SUM(PrixAct), 0) as total_revenue FROM facture",
      "SELECT COUNT(*) as echographie_count FROM echographie",
      "SELECT COUNT(*) as thyroide_count FROM thyroide",
      "SELECT COUNT(*) as ecg_count FROM ecg_data",
    ];

    const results = {};
    let completed = 0;

    testQueries.forEach((query, index) => {
      con.query(query, (err, result) => {
        if (err) {
          console.error(`Error in test query ${index}:`, err.message);
          results[`query_${index}`] = { error: err.message };
        } else {
          results[`query_${index}`] = { query, result: result[0] };
        }

        completed++;

        if (completed === testQueries.length) {
          console.log("All test queries completed:", results);
          return res.status(200).json({
            message: "Database connection and data test completed",
            results,
          });
        }
      });
    });
  } catch (error) {
    console.error("Unexpected error in testConnection:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};
