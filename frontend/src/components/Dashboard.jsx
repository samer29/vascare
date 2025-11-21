import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../contexts/AppContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { CalendarIcon } from "./Icons";
import { DollarSignIcon } from "./icons/DollarSignIcon";
import { UserIcon } from "./icons/UserIcon";
import { StethoscopeIcon } from "./icons/StethoscopeIcon";
import api from "../utils/api";

const StatCard = ({ title, value, icon, color }) => (
  <div className="flex items-center bg-white dark:bg-[#2d3748] p-5 rounded-2xl shadow-md transition-transform hover:scale-[1.02] duration-200">
    <div
      className={`p-4 rounded-full mr-4 flex items-center justify-center ${color}`}
    >
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-800 dark:text-white">
        {value}
      </p>
    </div>
  </div>
);

const Dashboard = () => {
  const { theme } = useContext(AppContext);
  const [revenueData, setRevenueData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [todayPatients, setTodayPatients] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalRevenue: 0,
    totalPatients: 0,
    todayPatientsCount: 0,
    monthlyConsultations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dbConnected, setDbConnected] = useState(false);

  // Test database connection first
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await api.get("/dashboard/test");
        console.log("Database connection test:", response.data);
        setDbConnected(true);
        fetchDashboardData();
      } catch (err) {
        console.error("Database connection failed:", err);
        setDbConnected(false);
        setError(
          "Connexion à la base de données échouée. Vérifiez que le serveur MySQL est démarré."
        );
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log("Starting dashboard data fetch...");

      // Try to fetch stats first
      let statsData = {
        totalRevenue: 0,
        totalPatients: 0,
        todayPatientsCount: 0,
        monthlyConsultations: 0,
      };

      try {
        const statsRes = await api.get("/dashboard/stats");
        statsData = statsRes.data;
        console.log("Stats loaded:", statsData);
      } catch (statsErr) {
        console.warn("Stats endpoint failed, using defaults");
      }

      // Try to fetch other data
      let revenueData = [];
      let activityData = [];
      let todayData = [];

      try {
        const revenueRes = await api.get("/dashboard/revenue");
        revenueData = revenueRes.data;
        console.log("Revenue data loaded:", revenueData);
      } catch (revenueErr) {
        console.warn("Revenue endpoint failed, using empty data");
        revenueData = generateEmptyRevenueData();
      }

      try {
        const activityRes = await api.get("/dashboard/activity");
        activityData = activityRes.data;
        console.log("Activity data loaded:", activityData);
      } catch (activityErr) {
        console.warn("Activity endpoint failed, using empty data");
        activityData = generateEmptyActivityData();
      }

      try {
        const todayRes = await api.get("/dashboard/today-appointments");
        todayData = todayRes.data;
        console.log("Today appointments loaded:", todayData);
      } catch (todayErr) {
        console.warn("Today appointments endpoint failed, using empty data");
        todayData = [];
      }

      // Set all data
      setDashboardStats(statsData);
      setRevenueData(revenueData);
      setActivityData(activityData);
      setTodayPatients(todayData);

      setLoading(false);
      console.log("Dashboard data loaded successfully");
    } catch (err) {
      console.error("Dashboard fetch error:", err);

      // Set fallback data
      setRevenueData(generateEmptyRevenueData());
      setActivityData(generateEmptyActivityData());
      setTodayPatients([]);

      setError(
        "Certaines données ne sont pas disponibles. Affichage des données de démonstration."
      );
      setLoading(false);
    }
  };
  // Add this useEffect to fetch financial stats
  useEffect(() => {
    const fetchFinancialStats = async () => {
      try {
        const financialRes = await api.get("/dashboard/financial-stats");
        console.log("Financial stats:", financialRes.data);

        // Update the dashboard stats with real financial data
        setDashboardStats((prev) => ({
          ...prev,
          totalRevenue: financialRes.data.totalRevenue || 0,
          todayPatientsCount: financialRes.data.todayConsultations || 0,
        }));
      } catch (err) {
        console.error("Error fetching financial stats:", err);
      }
    };

    fetchFinancialStats();
  }, []);
  // Generate empty data for charts
  const generateEmptyRevenueData = () => {
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
    return months.map((month) => ({
      name: month,
      month: month,
      revenue: 0,
    }));
  };

  const generateEmptyActivityData = () => {
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
    return months.map((month) => ({
      name: month,
      month: month,
      consultations: 0,
      echographies: 0,
      thyroide: 0,
      ecg: 0,
    }));
  };

  // Format currency for display
  const formatCurrency = (value) => {
    return (
      new Intl.NumberFormat("fr-DZ", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value) + " DZD"
    );
  };

  // Format time for appointments
  const formatTime = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "—";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh] text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Chargement du tableau de bord...</p>
          {!dbConnected && (
            <p className="mt-2 text-sm text-yellow-600">
              Connexion à la base de données en cours...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error && !dbConnected) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="text-center text-red-500 max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <svg
              className="h-12 w-12 text-red-400 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h3 className="text-lg font-semibold mb-2">Erreur de Connexion</h3>
            <p className="mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 md:px-10 lg:px-16 py-8 space-y-10 bg-[var(--bg-main)] transition-colors duration-200">
      {/* Warning Message if using fallback data */}
      {error && dbConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message if connected */}
      {dbConnected && !error && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Connecté à la base de données
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rest of your dashboard JSX remains the same */}
      {/* 🟩 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Revenu Cette Année"
          value={formatCurrency(dashboardStats.totalRevenue)}
          icon={<DollarSignIcon className="h-6 w-6 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="Total Patients"
          value={dashboardStats.totalPatients.toLocaleString("fr-FR")}
          icon={<UserIcon className="h-6 w-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Patients Aujourd'hui"
          value={dashboardStats.todayPatientsCount}
          icon={<CalendarIcon className="h-6 w-6 text-white" />}
          color="bg-yellow-500"
        />
        <StatCard
          title="Consultations Ce Mois"
          value={dashboardStats.monthlyConsultations}
          icon={<StethoscopeIcon className="h-6 w-6 text-white" />}
          color="bg-purple-500"
        />
      </div>

      {/* 🟨 Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-[#2d3748] p-6 rounded-2xl shadow-md">
          <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">
            Revenus Mensuels ({new Date().getFullYear()})
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-gray-200 dark:stroke-gray-600"
              />
              <XAxis
                dataKey="month"
                tick={{
                  fill: theme === "dark" ? "#fff" : "#000",
                  fontSize: 12,
                }}
              />
              <YAxis
                tick={{
                  fill: theme === "dark" ? "#fff" : "#000",
                  fontSize: 12,
                }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(value), "Revenu"]}
                labelFormatter={(label) => `Mois: ${label}`}
                contentStyle={{
                  backgroundColor:
                    theme === "dark"
                      ? "rgba(0,0,0,0.9)"
                      : "rgba(255,255,255,0.95)",
                  borderRadius: "8px",
                  border: "none",
                  color: theme === "dark" ? "#fff" : "#000",
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: "#10B981", r: 4 }}
                activeDot={{ r: 6, fill: "#059669" }}
                name="Revenu"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Chart */}
        <div className="bg-white dark:bg-[#2d3748] p-6 rounded-2xl shadow-md">
          <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">
            Activité Médicale ({new Date().getFullYear()})
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-gray-200 dark:stroke-gray-600"
              />
              <XAxis
                dataKey="month"
                tick={{
                  fill: theme === "dark" ? "#fff" : "#000",
                  fontSize: 12,
                }}
              />
              <YAxis
                tick={{
                  fill: theme === "dark" ? "#fff" : "#000",
                  fontSize: 12,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor:
                    theme === "dark"
                      ? "rgba(0,0,0,0.9)"
                      : "rgba(255,255,255,0.95)",
                  borderRadius: "8px",
                  border: "none",
                  color: theme === "dark" ? "#fff" : "#000",
                }}
              />
              <Legend />
              <Bar
                dataKey="consultations"
                fill="#3B82F6"
                name="Consultations"
              />
              <Bar dataKey="echographies" fill="#10B981" name="Échographies" />
              <Bar dataKey="thyroide" fill="#8B5CF6" name="Thyroïde" />
              <Bar dataKey="ecg" fill="#F59E0B" name="ECG" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 🟦 Today's Patients Table */}
      <div className="bg-white dark:bg-[#2d3748] p-6 rounded-2xl shadow-md">
        <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">
          Rendez-vous du Jour ({todayPatients.length})
        </h3>
        <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="py-3 px-4 text-gray-600 dark:text-gray-300 font-semibold text-sm">
                  Patient
                </th>
                <th className="py-3 px-4 text-gray-600 dark:text-gray-300 font-semibold text-sm">
                  Âge
                </th>
                <th className="py-3 px-4 text-gray-600 dark:text-gray-300 font-semibold text-sm">
                  Motif
                </th>
                <th className="py-3 px-4 text-gray-600 dark:text-gray-300 font-semibold text-sm">
                  Poids
                </th>
                <th className="py-3 px-4 text-gray-600 dark:text-gray-300 font-semibold text-sm">
                  Heure
                </th>
              </tr>
            </thead>
            <tbody>
              {todayPatients.length > 0 ? (
                todayPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-100 font-medium text-sm">
                      {patient.name}
                    </td>
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-100 text-sm">
                      {patient.age} ans
                    </td>
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-100 text-sm">
                      {patient.diagnostic || "Consultation"}
                    </td>
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-100 text-sm">
                      {patient.weight ? `${patient.weight} kg` : "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-100 text-sm">
                      {formatTime(patient.DateConsultation)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      Aucun rendez-vous prévu pour aujourd'hui
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
