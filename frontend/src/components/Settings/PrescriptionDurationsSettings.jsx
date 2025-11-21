import React, { useState, useEffect } from "react";
import { SaveIcon, PlusIcon, TrashIcon } from "../Icons";
import { EditIcon } from "../icons/EditIcon";
import api from "../../utils/api";
import { toast } from "react-toastify";

const PrescriptionDurationsSettings = () => {
  const [durations, setDurations] = useState([]);
  const [newDuration, setNewDuration] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDurations();
  }, []);

  const loadDurations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/prescription-durations");
      setDurations(res.data || []);
    } catch (err) {
      console.error("Error loading durations:", err);
      toast.error("Erreur lors du chargement des durées");
    } finally {
      setLoading(false);
    }
  };

  const parseDurationInput = (input) => {
    const inputLower = input.toLowerCase().trim();

    // Parse common patterns
    if (inputLower.includes("semaine") || inputLower.includes("sem")) {
      const weeks = parseInt(inputLower.match(/\d+/)?.[0]) || 1;
      return {
        displayText: `${weeks} semaine${weeks > 1 ? "s" : ""}`,
        days: weeks * 7,
      };
    }

    if (inputLower.includes("mois")) {
      const months = parseInt(inputLower.match(/\d+/)?.[0]) || 1;
      return {
        displayText: `${months} mois`,
        days: months * 30,
      };
    }

    if (inputLower.includes("jour") || inputLower.includes("j")) {
      const days = parseInt(inputLower.match(/\d+/)?.[0]) || 1;
      return {
        displayText: `${days} jour${days > 1 ? "s" : ""}`,
        days: days,
      };
    }

    // Default: assume days
    const days = parseInt(inputLower) || 7;
    return {
      displayText: `${days} jour${days > 1 ? "s" : ""}`,
      days: days,
    };
  };

  const handleAddDuration = async () => {
    if (!newDuration.trim()) {
      toast.error("Veuillez saisir une durée");
      return;
    }

    try {
      const { displayText, days } = parseDurationInput(newDuration);

      const res = await api.post("/prescription-durations", {
        DisplayText: displayText,
        Days: days,
      });

      setDurations((prev) => [...prev, res.data]);
      setNewDuration("");
      toast.success("Durée ajoutée avec succès");
    } catch (err) {
      console.error("Error adding duration:", err);
      const errorMsg =
        err.response?.data?.error || "Erreur lors de l'ajout de la durée";
      toast.error(errorMsg);
    }
  };

  const handleEditDuration = (duration) => {
    setEditingId(duration.ID);
    setEditValue(duration.DisplayText);
  };

  const handleUpdateDuration = async (id) => {
    if (!editValue.trim()) {
      toast.error("La durée ne peut pas être vide");
      return;
    }

    try {
      const { displayText, days } = parseDurationInput(editValue);

      await api.put(`/prescription-durations/${id}`, {
        DisplayText: displayText,
        Days: days,
      });

      setDurations((prev) =>
        prev.map((d) =>
          d.ID === id ? { ...d, DisplayText: displayText, Days: days } : d
        )
      );

      setEditingId(null);
      setEditValue("");
      toast.success("Durée modifiée avec succès");
    } catch (err) {
      console.error("Error updating duration:", err);
      const errorMsg =
        err.response?.data?.error || "Erreur lors de la modification";
      toast.error(errorMsg);
    }
  };

  const handleDeleteDuration = async (id) => {
    if (!window.confirm("Supprimer cette durée ?")) return;

    try {
      await api.delete(`/prescription-durations/${id}`);
      setDurations((prev) => prev.filter((d) => d.ID !== id));
      toast.success("Durée supprimée avec succès");
    } catch (err) {
      console.error("Error deleting duration:", err);
      const errorMsg =
        err.response?.data?.error || "Erreur lors de la suppression";
      toast.error(errorMsg);
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleKeyPress = (e, action, id = null) => {
    if (e.key === "Enter") {
      if (action === "add") {
        handleAddDuration();
      } else if (action === "edit" && id) {
        handleUpdateDuration(id);
      }
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  // Separate default and custom durations
  const defaultDurations = durations.filter((d) => !d.IsCustom);
  const customDurations = durations.filter((d) => d.IsCustom);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3 text-text-main">Chargement des durées...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm">
        <h3 className="text-xl font-bold mb-2 text-text-main">
          Gestion des Durées de Prescription
        </h3>
        <p className="text-text-secondary">
          Configurez les durées disponibles pour les prescriptions de type
          "Durée (QSP)"
        </p>
      </div>

      {/* Add New Duration */}
      <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm">
        <h4 className="text-lg font-semibold mb-4 text-text-main">
          Ajouter une nouvelle durée
        </h4>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2 text-text-main">
              Durée (ex: "2 semaines", "1 mois", "15 jours")
            </label>
            <input
              type="text"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, "add")}
              placeholder="Ex: 2 semaines, 1 mois, 45 jours..."
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
            />
          </div>
          <button
            onClick={handleAddDuration}
            disabled={!newDuration.trim()}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 flex items-center transition whitespace-nowrap mb-[20px]"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Ajouter
          </button>
        </div>
        <p className="text-sm text-text-secondary mt-2">
          💡 Vous pouvez saisir: "2 semaines", "1 mois", "15 jours", etc.
        </p>
      </div>

      {/* Default Durations */}
      <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm">
        <h4 className="text-lg font-semibold mb-4 text-text-main">
          Durées par défaut
        </h4>
        <p className="text-text-secondary mb-4">
          Ces durées sont prédéfinies et ne peuvent pas être modifiées
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {defaultDurations.map((duration) => (
            <div
              key={duration.ID}
              className="flex items-center justify-between p-3 bg-secondary rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-text-main text-sm">
                  {duration.DisplayText}
                </span>
                <span className="text-xs text-text-secondary bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  {duration.Days}j
                </span>
              </div>
              <span className="text-xs text-text-secondary bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                Défaut
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Durations */}
      <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-text-main">
            Durées personnalisées
          </h4>
          <span className="text-sm text-text-secondary">
            {customDurations.length} durée(s) personnalisée(s)
          </span>
        </div>

        {customDurations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {customDurations.map((duration) => (
              <div
                key={duration.ID}
                className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                {editingId === duration.ID ? (
                  // Edit Mode
                  <div className="flex-1 flex gap-2 items-center">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, "edit", duration.ID)}
                      onKeyDown={(e) => e.key === "Escape" && cancelEditing()}
                      className="flex-1 px-3 py-1 border border-border rounded focus:ring-1 focus:ring-primary bg-bg-card text-text-main text-sm"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleUpdateDuration(duration.ID)}
                        className="p-1 text-green-600 hover:text-green-800 transition"
                        title="Sauvegarder"
                      >
                        <SaveIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-1 text-gray-600 hover:text-gray-800 transition"
                        title="Annuler"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-main text-sm">
                        {duration.DisplayText}
                      </span>
                      <span className="text-xs text-text-secondary bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        {duration.Days}j
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditDuration(duration)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition"
                        title="Modifier la durée"
                      >
                        <EditIcon className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteDuration(duration.ID)}
                        className="p-1 text-red-500 hover:text-red-700 transition"
                        title="Supprimer la durée"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-text-secondary">
            <p>Aucune durée personnalisée configurée</p>
            <p className="text-sm mt-2">
              Utilisez le formulaire ci-dessus pour ajouter vos propres durées
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionDurationsSettings;
