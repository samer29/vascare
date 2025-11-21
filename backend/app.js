const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, "public")));

// Import routes
const userRoutes = require("./routes/userRoute");
const patientRoutes = require("./routes/patientRoute");
const dashboardRoutes = require("./routes/dashboardRoute");
const medicalRoutes = require("./routes/medicalRoutes");
const examenRoutes = require("./routes/examenRoute");
const medicamentRoutes = require("./routes/medicamentRoute");
const dureeMedicamentRoutes = require("./routes/dureeMedicamentRoute");
const formeRoutes = require("./routes/formeRoute");
const certificatRoutes = require("./routes/certificatRoute");
const orrientationRoutes = require("./routes/orientationRoute");
const echographieRoute = require("./routes/echographieRoute");
const settingsRoute = require("./routes/settingsRoute");
const detailRoutes = require("./routes/detailRoute");
const biologicalRoute = require("./routes/biologicalRoute");
const explorationRoute = require("./routes/explorationRoute");
const billingsRoute = require("./routes/billingsRoute");
const factureRoute = require("./routes/factureRoute");
const procedureTempRoute = require("./routes/procedureTempRoute");
const medicalActRoute = require("./routes/medicalActRoute");
const prescriptionDurationRoute = require("./routes/prescriptionDurationsRoute");
const billingDashboardRoutes = require("./routes/billingDashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const dopplerRoutes = require("./routes/dopplerRoute");
const dynamicTemplatesRoutes = require("./routes/dynamicTemplatesRoute");
const thyroideRoute = require("./routes/thyroideRoute");
const ecgRoute = require("./routes/ecgRoute");

app.use("/billing", billingDashboardRoutes);
const SettingsController = require("./controllers/settingsController");

const licenceRoute = require("./routes/licenceRoute");
const licenseCheck = require("./middlewares/licenceCheck");

// Public endpoints BEFORE licenseCheck
app.use("/licence", licenceRoute);
app.get("/health", SettingsController.healthCheck);

// Protected routes
app.use("/users", userRoutes);
// License check middleware (protect everything after)
app.use(licenseCheck);
app.use("/patients", patientRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/medical", medicalRoutes);
app.use("/examens", examenRoutes);
app.use("/medicaments", medicamentRoutes);
app.use("/durees", dureeMedicamentRoutes);
app.use("/formes", formeRoutes);
app.use("/details", detailRoutes);
app.use("/certificats", certificatRoutes);
app.use("/orientations", orrientationRoutes);
app.use("/echographies", echographieRoute);
app.use("/doppler", dopplerRoutes);
app.use("/thyroide", thyroideRoute);
app.use("/ecg", ecgRoute);
app.use("/dynamic-templates", dynamicTemplatesRoutes);
app.use("/biological-groups", biologicalRoute);
app.use("/explorations", explorationRoute);
app.use("/settings", settingsRoute);
app.use("/billings", billingsRoute);
app.use("/factures", factureRoute);
app.use("/procedure-templates", procedureTempRoute);
app.use("/medical-acts", medicalActRoute);
app.use("/prescription-durations", prescriptionDurationRoute);
app.use("/billing-dashboard", billingDashboardRoutes);
app.use("/admin", adminRoutes);
// Generic error handler
app.use((err, req, res, next) => {
  console.error("Unexpected error:", err);
  res.status(500).json({ error: "Server Error" });
});

module.exports = app;
