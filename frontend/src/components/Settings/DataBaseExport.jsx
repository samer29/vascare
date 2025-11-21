import React, { useState, useEffect } from "react";
import { DatabaseIcon } from "../icons/DatabaseIcon";
import { DownloadIcon } from "../icons/DownloadIcon";
import { ShieldIcon } from "../icons/ShieldIcon";
import { ChartBarIcon } from "../icons/ChartBarIcon";

import api from "../../utils/api";
import { toast } from "react-toastify";

const DatabaseExport = () => {
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState("sql");
  const [databaseStats, setDatabaseStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Charger les statistiques de la base de données
  useEffect(() => {
    loadDatabaseStats();
  }, []);

  const loadDatabaseStats = async () => {
    try {
      const response = await api.get("/admin/stats");
      setDatabaseStats(response.data);
    } catch (error) {
      console.error("Error loading database stats:", error);
      toast.error("Erreur lors du chargement des statistiques");
    } finally {
      setLoadingStats(false);
    }
  };

  const handleExportDatabase = async () => {
    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir exporter toute la base de données en format ${exportType.toUpperCase()} ? Cette opération peut prendre du temps.`
      )
    ) {
      return;
    }

    setExporting(true);
    setExportProgress(0);

    try {
      // Simuler une progression
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 300);

      const response = await api.get(`/admin/export/${exportType}`, {
        responseType: "blob",
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      // Créer un lien de téléchargement
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Extraire le nom de fichier de l'en-tête Content-Disposition ou utiliser un nom par défaut
      const contentDisposition = response.headers["content-disposition"];
      let filename = `mediconnect_backup.${exportType}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Base de données exportée avec succès !`);

      // Recharger les statistiques après l'export
      setTimeout(() => {
        loadDatabaseStats();
      }, 1000);
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      if (error.response?.status === 403) {
        toast.error("Accès refusé. Vous devez être administrateur.");
      } else {
        toast.error("Erreur lors de l'export de la base de données");
      }
    } finally {
      setExporting(false);
      setTimeout(() => setExportProgress(0), 1000);
    }
  };

  const getFileSizeEstimate = () => {
    if (!databaseStats) return "~5-10 MB";

    const baseSize = databaseStats.totalSize;
    switch (exportType) {
      case "sql":
        return `~${Math.round(baseSize * 0.7)}-${Math.round(
          baseSize * 1.2
        )} MB`;
      case "csv":
        return `~${Math.round(baseSize * 0.5)}-${Math.round(
          baseSize * 0.8
        )} MB`;
      case "json":
        return `~${Math.round(baseSize * 0.6)}-${Math.round(
          baseSize * 1.0
        )} MB`;
      default:
        return "~5 MB";
    }
  };

  const getExportDescription = () => {
    switch (exportType) {
      case "sql":
        return "Export SQL complet avec structure, données et contraintes. Idéal pour la sauvegarde et la restauration complète.";
      case "csv":
        return "Export CSV par table dans une archive ZIP. Facile à ouvrir dans Excel ou autres tableurs.";
      case "json":
        return "Export JSON structuré avec métadonnées. Idéal pour l'analyse de données et les intégrations.";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-8 w-full">
      {/* Statistiques de la base de données */}
      {databaseStats && (
        <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center mb-4">
            <ChartBarIcon className="h-6 w-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-bold text-text-main">
              Statistiques de la Base de Données
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {databaseStats.totalTables}
              </div>
              <div className="text-blue-800">Tables</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {databaseStats.totalSize} MB
              </div>
              <div className="text-green-800">Taille totale</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {databaseStats.exportFormats.length}
              </div>
              <div className="text-purple-800">Formats disponibles</div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration de l'export */}
      <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm">
        <div className="flex items-center mb-6">
          <DatabaseIcon className="h-8 w-8 text-primary mr-3" />
          <h3 className="text-xl font-bold text-text-main">
            Export de la Base de Données
          </h3>
        </div>

        <div className="space-y-6">
          {/* Type d'export */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-text-main">
              Type d'export
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setExportType("sql")}
                disabled={exporting}
                className={`p-4 border-2 rounded-lg text-left transition ${
                  exportType === "sql"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                } ${exporting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="font-semibold text-text-main">SQL Complet</div>
                <div className="text-sm text-text-secondary mt-1">
                  Structure + Données
                </div>
              </button>

              <button
                onClick={() => setExportType("csv")}
                disabled={exporting}
                className={`p-4 border-2 rounded-lg text-left transition ${
                  exportType === "csv"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                } ${exporting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="font-semibold text-text-main">CSV</div>
                <div className="text-sm text-text-secondary mt-1">
                  Archive ZIP
                </div>
              </button>

              <button
                onClick={() => setExportType("json")}
                disabled={exporting}
                className={`p-4 border-2 rounded-lg text-left transition ${
                  exportType === "json"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                } ${exporting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="font-semibold text-text-main">JSON</div>
                <div className="text-sm text-text-secondary mt-1">
                  Données structurées
                </div>
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">
              {exportType.toUpperCase()} - {getFileSizeEstimate()}
            </h4>
            <p className="text-blue-700 text-sm">{getExportDescription()}</p>
          </div>

          {/* Avertissement de sécurité */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <ShieldIcon className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">
                  Sécurité des données
                </h4>
                <p className="text-yellow-700 text-sm">
                  Cet export contient toutes les données sensibles de votre
                  application (patients, consultations, factures, etc.).
                  Conservez ce fichier en lieu sûr et ne le partagez qu'avec des
                  personnes autorisées.
                </p>
              </div>
            </div>
          </div>

          {/* Barre de progression */}
          {exporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-text-main">
                <span>Export en cours... ({exportType.toUpperCase()})</span>
                <span>{exportProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Bouton d'export */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleExportDatabase}
              disabled={exporting || loadingStats}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Export en cours...
                </>
              ) : (
                <>
                  <DownloadIcon className="h-5 w-5 mr-2" />
                  Exporter la Base de Données
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tables incluses */}
      {databaseStats && (
        <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm">
          <h4 className="text-lg font-semibold mb-4 text-text-main">
            Tables incluses dans l'export (
            {Object.keys(databaseStats.tables).length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm max-h-96 overflow-y-auto">
            {Object.entries(databaseStats.tables).map(([table, stats]) => (
              <div
                key={table}
                className="bg-secondary px-3 py-2 rounded text-text-main"
              >
                <div className="font-medium">{table}</div>
                <div className="text-xs text-text-secondary">
                  {stats.rows} enregistrements • {stats.size} MB
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseExport;
