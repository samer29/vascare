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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { CalendarIcon, UploadCloudIcon } from "./Icons";
import { DollarSignIcon } from "./icons/DollarSignIcon";
import { UserIcon } from "./icons/UserIcon";
import api from "../utils/api";

const Billing = () => {
  const { theme } = useContext(AppContext);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("today");
  const [selectedPatient, setSelectedPatient] = useState("all");
  const [factureStats, setFactureStats] = useState({
    totalFactures: 0,
    totalMontant: 0,
  });
  const [actData, setActData] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get(
          `/billing-dashboard/stats?range=${timeRange}`
        );
        setFactureStats(res.data);
      } catch (err) {
        console.error("Error fetching facture stats:", err);
      }
    };

    fetchStats();
  }, [timeRange]);

  useEffect(() => {
    fetchBillingData();
  }, [timeRange, selectedPatient]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [dashboardRes, statsRes, revenueRes] = await Promise.all([
        api.get(
          `/billing-dashboard?timeRange=${timeRange}&patientId=${selectedPatient}&limit=100`
        ),
        api.get(`/billing-dashboard/stats?timeRange=${timeRange}`),
        api.get(`/billing-dashboard/revenue-by-act?timeRange=${timeRange}`),
      ]);

      setInvoices(dashboardRes.data.invoices || []);
      setFactureStats(statsRes.data || {});
      setActData(revenueRes.data || []);

      setLoading(false);
    } catch (err) {
      console.error("Billing fetch error:", err);
      setError("Échec de la récupération des données de facturation.");
      setLoading(false);
    }
  };

  // Calculate statistics based on API data
  const totalPaid = invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);

  const totalUnpaid = invoices
    .filter((i) => i.status === "unpaid")
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  // Total revenue from all invoices
  const totalRevenue = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);

  // Status distribution for pie chart
  const statusData = [
    {
      name: "Payé",
      value: invoices.filter((i) => i.status === "paid").length,
      color: "#10B981",
    },
    {
      name: "Impayé",
      value: invoices.filter((i) => i.status === "unpaid").length,
      color: "#EF4444",
    },
    {
      name: "Partiel",
      value: invoices.filter((i) => i.status === "partial").length,
      color: "#F59E0B",
    },
  ];

  const COLORS = ["#10B981", "#EF4444", "#F59E0B"];

  const handleExportReport = () => {
    const csvContent = [
      [
        "Date",
        "Patient",
        "Acte",
        "Montant Total",
        "Montant Payé",
        "Reste à Payer",
        "Statut",
        "Nombre d'Actes",
      ],
      ...invoices.map((invoice) => [
        invoice.date ? new Date(invoice.date).toLocaleDateString("fr-FR") : "—",
        invoice.patientName,
        invoice.act,
        `${invoice.amount || 0} DZD`,
        `${invoice.paidAmount || 0} DZD`,
        `${invoice.amount - invoice.paidAmount || 0} DZD`,
        invoice.status === "paid"
          ? "Payé"
          : invoice.status === "unpaid"
          ? "Impayé"
          : invoice.status === "partial"
          ? "Partiellement Payé"
          : "En retard",
        invoice.factureItemCount || 0,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `rapport-facturation-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Enhanced tooltip formatter
  const customTooltipFormatter = (value, name) => {
    if (name === "revenue") {
      return [`${value.toLocaleString("fr-DZ")} DZD`, "Revenu"];
    }
    return [value, name];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Chargement des données de facturation...</p>
          <p className="text-sm mt-1">
            Récupération des données des factures en cours
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-8">
        <p className="text-lg font-semibold mb-2">{error}</p>
        <p className="text-sm mb-4">
          Vérifiez que le serveur est en cours d'exécution et que les endpoints
          sont accessibles.
        </p>
        <button
          onClick={fetchBillingData}
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
          Facturation et Finances
        </h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-4 lg:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-surface text-gray-800 dark:text-white"
          >
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
            <option value="all">Tout</option>
          </select>

          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-surface text-gray-800 dark:text-white"
          >
            <option value="all">Tous les patients</option>
            {Array.from(new Set(invoices.map((i) => i.patientId)))
              .map((patientId) => {
                const patient = invoices.find(
                  (i) => i.patientId === patientId
                )?.patient;
                return patient ? (
                  <option key={patientId} value={patientId}>
                    {patient.Nom || patient.nom}{" "}
                    {patient.Prenom || patient.prenom}
                  </option>
                ) : null;
              })
              .filter(Boolean)}
          </select>

          <button
            onClick={handleExportReport}
            disabled={invoices.length === 0}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            <UploadCloudIcon className="h-4 w-4 mr-2" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md flex items-center">
          <div className="p-3 rounded-full mr-4 bg-green-500">
            <DollarSignIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Facturé
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {totalRevenue.toLocaleString("fr-DZ")} DZD
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {invoices.length} consultations
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md flex items-center">
          <div className="p-3 rounded-full mr-4 bg-blue-500">
            <DollarSignIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Encaissé
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalPaid.toLocaleString("fr-DZ")} DZD
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {invoices.filter((i) => i.paidAmount > 0).length} paiements
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md flex items-center">
          <div className="p-3 rounded-full mr-4 bg-red-500">
            <DollarSignIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Impayé
            </p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {totalUnpaid.toLocaleString("fr-DZ")} DZD
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {invoices.filter((i) => i.status === "unpaid").length} impayés
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md flex items-center">
          <div className="p-3 rounded-full mr-4 bg-purple-500">
            <CalendarIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Factures Générées
            </p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {factureStats.totalFactures}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Montant :{" "}
              {(factureStats.totalMontant || 0).toLocaleString("fr-DZ")} DZD
            </p>
          </div>
        </div>
      </div>

      {/* Show data summary */}
      {invoices.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <UserIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Aucune donnée de facturation trouvée
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300">
            Les données de facturation seront disponibles une fois que des
            factures auront été créées dans le gestionnaire de patients.
          </p>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Act */}
            <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md">
              <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">
                Revenus par Type d'Acte (Factures)
              </h3>
              {actData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={actData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-gray-200 dark:stroke-gray-600"
                    />
                    <XAxis
                      type="number"
                      className="text-xs"
                      tickFormatter={(value) =>
                        `${value.toLocaleString("fr-DZ")} DZD`
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      className="text-xs"
                    />
                    <Tooltip
                      formatter={customTooltipFormatter}
                      labelStyle={{ color: theme === "dark" ? "#fff" : "#000" }}
                    />
                    <Bar dataKey="revenue" fill="#74B49B" name="Revenu" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-64 text-gray-500">
                  Aucune donnée de revenu disponible
                </div>
              )}
            </div>

            {/* Status Distribution */}
            <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md">
              <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">
                Répartition des Statuts de Paiement
              </h3>
              {statusData.some((item) => item.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData.filter((item) => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData
                        .filter((item) => item.value > 0)
                        .map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-64 text-gray-500">
                  Aucune donnée de statut disponible
                </div>
              )}
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                Liste des Factures ({invoices.length})
              </h3>
              <div className="text-sm text-gray-500">
                Période:{" "}
                {timeRange === "today"
                  ? "Aujourd'hui"
                  : timeRange === "week"
                  ? "Cette semaine"
                  : timeRange === "month"
                  ? "Ce mois"
                  : timeRange === "year"
                  ? "Cette année"
                  : "Toutes les périodes"}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b dark:border-gray-600">
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Patient</th>
                    <th className="py-3 px-4 font-semibold">Acte Principal</th>
                    <th className="py-3 px-4 font-semibold">Montant Total</th>
                    <th className="py-3 px-4 font-semibold">Payé</th>
                    <th className="py-3 px-4 font-semibold">Reste</th>
                    <th className="py-3 px-4 font-semibold">Statut</th>
                    <th className="py-3 px-4 font-semibold">Actes</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
                    const remainingAmount =
                      (invoice.amount || 0) - (invoice.paidAmount || 0);
                    return (
                      <tr
                        key={`${invoice.id}-${invoice.patientName}`}
                        className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="py-3 px-4">
                          {invoice.date
                            ? new Date(invoice.date).toLocaleDateString("fr-FR")
                            : "—"}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {invoice.patientName}
                        </td>
                        <td className="py-3 px-4">{invoice.act}</td>
                        <td className="py-3 px-4 font-semibold">
                          {(invoice.amount || 0).toLocaleString("fr-DZ")} DZD
                        </td>
                        <td className="py-3 px-4 text-green-600">
                          {(invoice.paidAmount || 0).toLocaleString("fr-DZ")}{" "}
                          DZD
                        </td>
                        <td className="py-3 px-4 text-red-600">
                          {remainingAmount.toLocaleString("fr-DZ")} DZD
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              invoice.status === "paid"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : invoice.status === "unpaid"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : invoice.status === "partial"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                            }`}
                          >
                            {invoice.status === "paid"
                              ? "Payé"
                              : invoice.status === "unpaid"
                              ? "Impayé"
                              : invoice.status === "partial"
                              ? "Partiel"
                              : "Inconnu"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                            {invoice.factureItemCount || 0}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {invoices.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <UserIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune facture trouvée pour les critères sélectionnés</p>
                <p className="text-sm mt-2">
                  Période:{" "}
                  {timeRange === "today"
                    ? "Aujourd'hui"
                    : timeRange === "week"
                    ? "Cette semaine"
                    : timeRange === "month"
                    ? "Ce mois"
                    : timeRange === "year"
                    ? "Cette année"
                    : "Toutes les périodes"}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Billing;
