import React, { useState, useEffect } from "react";
import { SaveIcon, PlusIcon, TrashIcon } from "../Icons";
import { EditIcon } from "../icons/EditIcon";
import api from "../../utils/api";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";

const ActesSettings = () => {
  const [actes, setActes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newActe, setNewActe] = useState({
    name: "",
    defaultPrice: "",
    description: "",
  });

  // Default acts to initialize if none exist
  const defaultActes = [
    {
      name: "Consultation",
      defaultPrice: 2000,
      description: "Consultation médicale standard",
    },
    { name: "Doppler", defaultPrice: 3500, description: "Echo Doppler" },
    {
      name: "Électrocardiogramme (ECG)",
      defaultPrice: 15000,
      description: "Enregistrement ECG complet",
    },
    {
      name: "Thyroïde",
      defaultPrice: 12000,
      description: "Examen de la thyroïde",
    },
    {
      name: "Échographie Abdominale",
      defaultPrice: 8000,
      description: "Échographie de l'abdomen",
    },
    {
      name: "Ordonnance",
      defaultPrice: 500,
      description: "Émission d'ordonnance",
    },
    {
      name: "Examen Biologique",
      defaultPrice: 3000,
      description: "Analyse biologique",
    },
    {
      name: "Examen d'Exploration",
      defaultPrice: 6000,
      description: "Examen d'exploration fonctionnelle",
    },
    {
      name: "Certificat Médical",
      defaultPrice: 1000,
      description: "Émission de certificat médical",
    },
    {
      name: "Lettre d'Orientation",
      defaultPrice: 800,
      description: "Lettre d'orientation vers un spécialiste",
    },
  ];

  useEffect(() => {
    loadActes();
  }, []);

  const loadActes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/medical-acts");
      if (res.data && res.data.length > 0) {
        setActes(res.data);
      } else {
        // If no acts exist, initialize with defaults
        await initializeDefaultActes();
      }
    } catch (err) {
      console.error("Error loading medical acts:", err);
      // If endpoint doesn't exist, initialize with defaults
      await initializeDefaultActes();
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultActes = async () => {
    try {
      // Try to create default acts
      const createdActes = [];
      for (const acte of defaultActes) {
        try {
          const res = await api.post("/medical-acts", acte);
          createdActes.push(res.data);
        } catch (err) {
          console.error(`Error creating acte ${acte.name}:`, err);
        }
      }
      setActes(createdActes);
      toast.success("Actes médicaux initialisés avec les valeurs par défaut");
    } catch (err) {
      // If API calls fail, set local state only
      setActes(defaultActes);
      toast.info("Utilisation des actes médicaux locaux");
    }
  };

  const handleCreateActe = async () => {
    if (!newActe.name.trim()) {
      toast.error("Le nom de l'acte est requis");
      return;
    }

    setSaving(true);
    try {
      const acteData = {
        name: newActe.name.trim(),
        defaultPrice: parseFloat(newActe.defaultPrice) || 0,
        description: newActe.description.trim() || "",
      };

      const res = await api.post("/medical-acts", acteData);
      setActes((prev) => [...prev, res.data]);
      setNewActe({ name: "", defaultPrice: "", description: "" });
      toast.success("Acte médical créé avec succès");
    } catch (err) {
      console.error("Error creating medical act:", err);
      toast.error("Erreur lors de la création de l'acte");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateActe = async (acteId, updatedData) => {
    setSaving(true);
    try {
      const res = await api.put(`/medical-acts/${acteId}`, updatedData);
      setActes((prev) =>
        prev.map((acte) =>
          acte.id === acteId || acte.ID === acteId ? res.data : acte
        )
      );
      setEditingId(null);
      toast.success("Acte médical mis à jour avec succès");
    } catch (err) {
      console.error("Error updating medical act:", err);
      toast.error("Erreur lors de la mise à jour de l'acte");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteActe = async (acteId) => {
    if (
      !window.confirm("Êtes-vous sûr de vouloir supprimer cet acte médical ?")
    ) {
      return;
    }

    try {
      await api.delete(`/medical-acts/${acteId}`);
      setActes((prev) =>
        prev.filter((acte) => acte.id !== acteId && acte.ID !== acteId)
      );
      toast.success("Acte médical supprimé avec succès");
    } catch (err) {
      console.error("Error deleting medical act:", err);
      toast.error("Erreur lors de la suppression de l'acte");
    }
  };

  const startEditing = (acte) => {
    setEditingId(acte.id || acte.ID);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleEditChange = (acteId, field, value) => {
    setActes((prev) =>
      prev.map((acte) => {
        if (acte.id === acteId || acte.ID === acteId) {
          return { ...acte, [field]: value };
        }
        return acte;
      })
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3 text-text-main">
          Chargement des actes médicaux...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm">
        <h3 className="text-xl font-bold mb-2 text-text-main">
          Gestion des Actes Médicaux
        </h3>
        <p className="text-text-secondary">
          Configurez les actes médicaux disponibles avec leurs prix par défaut
        </p>
      </div>

      {/* Add New Acte Form */}
      <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm">
        <h4 className="text-lg font-bold mb-4 text-text-main">
          Ajouter un nouvel acte médical
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-text-main">
              Nom de l'acte *
            </label>
            <input
              type="text"
              value={newActe.name}
              onChange={(e) =>
                setNewActe((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
              placeholder="Ex: Consultation"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-text-main">
              Prix par défaut (DZD) *
            </label>
            <input
              type="number"
              value={newActe.defaultPrice}
              onChange={(e) =>
                setNewActe((prev) => ({
                  ...prev,
                  defaultPrice: e.target.value,
                }))
              }
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-text-main">
              Description
            </label>
            <input
              type="text"
              value={newActe.description}
              onChange={(e) =>
                setNewActe((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
              placeholder="Description optionnelle"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={handleCreateActe}
            disabled={saving || !newActe.name.trim() || !newActe.defaultPrice}
            className="flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 transition"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {saving ? "Création..." : "Ajouter l'acte"}
          </button>
        </div>
      </div>

      {/* Actes List */}
      <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm">
        <h4 className="text-lg font-bold mb-4 text-text-main">
          Liste des actes médicaux ({actes.length})
        </h4>

        {actes.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            Aucun acte médical configuré
          </div>
        ) : (
          <div className="space-y-4">
            {actes.map((acte) => (
              <div
                key={acte.id || acte.ID}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary transition"
              >
                {editingId === (acte.id || acte.ID) ? (
                  // Edit Mode
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <input
                        type="text"
                        value={acte.name}
                        onChange={(e) =>
                          handleEditChange(
                            acte.id || acte.ID,
                            "name",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-border rounded focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={acte.defaultPrice}
                        onChange={(e) =>
                          handleEditChange(
                            acte.id || acte.ID,
                            "defaultPrice",
                            e.target.value
                          )
                        }
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-border rounded focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={acte.description || ""}
                        onChange={(e) =>
                          handleEditChange(
                            acte.id || acte.ID,
                            "description",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-border rounded focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                        placeholder="Description"
                      />
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="font-semibold text-text-main">
                        {acte.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-main">
                        {parseFloat(
                          acte.defaultPrice || acte.default_price || 0
                        ).toLocaleString("fr-DZ")}{" "}
                        DZD
                      </span>
                    </div>
                    <div>
                      <span className="text-text-secondary text-sm">
                        {acte.description || acte.desc || "Aucune description"}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 ml-4">
                  {editingId === (acte.id || acte.ID) ? (
                    <>
                      <button
                        onClick={() =>
                          handleUpdateActe(acte.id || acte.ID, {
                            name: acte.name,
                            defaultPrice: parseFloat(
                              acte.defaultPrice || acte.default_price
                            ),
                            description: acte.description || acte.desc || "",
                          })
                        }
                        disabled={saving}
                        className="p-2 text-green-600 hover:text-green-800 transition"
                        title="Sauvegarder"
                      >
                        <SaveIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-2 text-gray-600 hover:text-gray-800 transition"
                        title="Annuler"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(acte)}
                        className="p-2 text-blue-600 hover:text-blue-800 transition"
                        title="Modifier"
                      >
                        <EditIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteActe(acte.id || acte.ID)}
                        className="p-2 text-red-600 hover:text-red-800 transition"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Comment utiliser :</strong> Ces actes médicaux seront
          disponibles dans le gestionnaire de factures. Les prix par défaut
          seront pré-remplis mais pourront être modifiés pour chaque patient.
        </p>
      </div>
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default ActesSettings;
