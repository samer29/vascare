import React, { useState, useEffect } from "react";
import { SaveIcon, PlusCircleIcon, TrashIcon } from "./Icons";
import { toast } from "react-toastify";
import api from "../utils/api";
import EchographiePDF from "./reports/EchographiePDF";

const EchographieManager = ({
  patient,
  consultation,
  onSave,
  onQuickAddToInvoice,
}) => {
  const [echoType, setEchoType] = useState("normal_h");
  const [echographieForm, setEchographieForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Field configurations for each type
  const fieldConfigs = {
    normal_h: [
      "Foie",
      "Vesicule_biliaire",
      "Voies_biliaires",
      "TP_VCI_VSH",
      "Rein_droite",
      "Rein_gauche",
      "Pancreas",
      "Rate",
      "Vessie",
      "Prostate",
      "Conclusion",
    ],
    normal_f: [
      "Foie",
      "Vesicule_biliaire",
      "Voies_biliaires",
      "TP_VCI_VSH",
      "Rein_droite",
      "Rein_gauche",
      "Pancreas",
      "Rate",
      "Vessie",
      "Utérus",
      "Conclusion",
    ],
    lithiase_h: [
      "Aérocolie_diffuse",
      "Rein_gauche",
      "Rein_droite",
      "Vessie",
      "Prostate",
      "Foie",
      "Rate",
      "Pancreas",
      "Conclusion",
    ],
    lithiase_f: [
      "Aérocolie_diffuse",
      "Rein_gauche",
      "Rein_droite",
      "Vessie",
      "Utérus",
      "Foie",
      "Rate",
      "Pancreas",
      "Conclusion",
    ],
  };

  const typeLabels = {
    normal_h: "Normal - Homme",
    normal_f: "Normal - Femme",
    lithiase_h: "Lithiase - Homme",
    lithiase_f: "Lithiase - Femme",
  };

  // Load echographie data
  useEffect(() => {
    if (consultation?.id) {
      loadEchographie();
    }
  }, [consultation?.id]);

  const loadEchographie = async () => {
    if (!consultation?.id) return;

    try {
      console.log("Loading echographie for consultation:", consultation.id);
      const res = await api.get(
        `/echographies?consultationId=${consultation.id}`
      );

      if (res.data.length > 0) {
        const data = res.data[0];
        console.log("Loaded echographie data:", data);

        setEchoType(data.TypeEcho || "normal_h");

        // Parse all fields for the current type
        const formData = {};
        const currentFields = fieldConfigs[data.TypeEcho || "normal_h"];

        currentFields.forEach((field) => {
          if (data[field] && Array.isArray(data[field])) {
            formData[field] = data[field];
          } else {
            formData[field] = [""];
          }
        });

        setEchographieForm(formData);
        setInitialLoad(false);
      } else {
        // No existing data, load default template from database
        console.log(
          "No existing echographie, loading default template from database"
        );
        loadDefaultTemplate("normal_h");
      }
    } catch (err) {
      console.error("Error loading echographie:", err);
      toast.error("Erreur lors du chargement de l'échographie");
      loadDefaultTemplate("normal_h");
    }
  };

  const loadDefaultTemplate = async (type) => {
    try {
      console.log("Loading default template from database for type:", type);
      const res = await api.get(`/echographies/templates/default?type=${type}`);
      console.log("Database template response:", res.data);

      // Ensure all fields have at least empty array
      const templateData = { ...res.data };
      fieldConfigs[type].forEach((field) => {
        if (!templateData[field] || !Array.isArray(templateData[field])) {
          templateData[field] = [""];
        }
      });

      setEchographieForm(templateData);
      setInitialLoad(false);
    } catch (err) {
      console.error("Error loading default template from database:", err);
      // Fallback to empty form
      const emptyForm = {};
      fieldConfigs[type].forEach((field) => {
        emptyForm[field] = [""];
      });
      setEchographieForm(emptyForm);
      setInitialLoad(false);
    }
  };

  const handleTypeChange = async (newType) => {
    setEchoType(newType);
    await loadDefaultTemplate(newType);
  };

  const handleFieldChange = (field, index, value) => {
    setEchographieForm((prev) => {
      const newFieldValues = [...(prev[field] || [""])];
      newFieldValues[index] = value;
      return { ...prev, [field]: newFieldValues };
    });
  };

  const addFieldLine = (field) => {
    setEchographieForm((prev) => ({
      ...prev,
      [field]: [...(prev[field] || [""]), ""],
    }));
  };

  const removeFieldLine = (field, index) => {
    setEchographieForm((prev) => {
      const newFieldValues = prev[field].filter((_, i) => i !== index);
      return {
        ...prev,
        [field]: newFieldValues.length ? newFieldValues : [""],
      };
    });
  };

  const insertFieldLine = (field, index) => {
    setEchographieForm((prev) => {
      const newFieldValues = [...prev[field]];
      newFieldValues.splice(index + 1, 0, "");
      return { ...prev, [field]: newFieldValues };
    });
  };

  const handleSave = async () => {
    if (!consultation) {
      toast.error("Aucune consultation sélectionnée");
      return;
    }

    setLoading(true);
    try {
      console.log("=== FRONTEND SAVE DEBUG ===");
      console.log("EchoType:", echoType);
      console.log("Consultation ID:", consultation.id);

      // Simple data preparation - just stringify the arrays directly
      const prepareField = (fieldValue) => {
        if (!Array.isArray(fieldValue)) return JSON.stringify([]);

        // Filter out empty strings
        const nonEmptyValues = fieldValue.filter((v) => v && v.trim() !== "");

        console.log(
          "Field preparation - input:",
          fieldValue,
          "output:",
          nonEmptyValues
        );
        return JSON.stringify(nonEmptyValues.length > 0 ? nonEmptyValues : []);
      };

      const saveData = {
        IDConsultation: consultation.id,
        TypeEcho: echoType,
      };

      // Add all fields for current type
      fieldConfigs[echoType].forEach((field) => {
        const fieldData = echographieForm[field] || [""];
        saveData[field] = prepareField(fieldData);
      });

      console.log("Final save data structure:", saveData);

      const response = await api.post("/echographies", saveData);
      console.log("✅ Save response:", response.data);

      toast.success("Échographie sauvegardée avec succès ✅");
    } catch (err) {
      console.error("❌ Error saving echographie:", err);
      console.error("Error response:", err.response?.data);
      toast.error("Erreur lors de la sauvegarde ❌");
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field, label) => {
    const values = echographieForm[field] || [""];

    return (
      <div key={field} className="mb-6">
        <label className="block text-sm font-semibold mb-3 text-text-main">
          {label}
        </label>

        {values.map((value, idx) => (
          <div key={idx} className="flex items-start gap-2 mb-2">
            <input
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field, idx, e.target.value)}
              className="flex-1 px-4 py-3 border border-border rounded-lg bg-bg-card text-text-main"
              placeholder={`Saisir ${label.toLowerCase()}...`}
            />

            <div className="flex flex-col gap-1">
              {idx === 0 ? (
                <button
                  type="button"
                  onClick={() => addFieldLine(field)}
                  className="p-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                  title="Ajouter une ligne"
                >
                  <PlusCircleIcon className="h-4 w-4" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => removeFieldLine(field, idx)}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                    title="Supprimer cette ligne"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFieldLine(field, idx)}
                    className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                    title="Insérer une ligne après"
                  >
                    <PlusCircleIcon className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (initialLoad) {
    return (
      <div className="p-6 bg-bg-card rounded-lg border border-border shadow-sm">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-text-main">
            Chargement de l'échographie...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-bg-card rounded-lg border border-border shadow-sm">
      <h3 className="text-xl font-bold mb-6 text-text-main">
        Échographie Abdominale
      </h3>

      {/* Type Selection */}
      <div className="mb-8">
        <label className="block text-sm font-semibold mb-3 text-text-main">
          Type d'Échographie
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(typeLabels).map(([type, label]) => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`p-4 rounded-lg border-2 text-center transition ${
                echoType === type
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-bg-card text-text-main hover:border-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Fields */}
      <div className="space-y-6">
        {fieldConfigs[echoType].map((field) =>
          renderField(field, getFieldLabel(field))
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-border">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-5 py-2 bg-primary text-white rounded-md shadow hover:bg-primary-dark text-sm font-medium transition flex items-center gap-2"
        >
          <SaveIcon className="h-4 w-4" />
          {loading ? "Sauvegarde..." : "Sauvegarder Échographie"}
        </button>

        <button
          onClick={() => onQuickAddToInvoice("Echographie Abdominale", 2000)}
          className="px-5 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 text-sm font-medium transition flex items-center gap-2"
        >
          💰 Ajouter à Facture
        </button>

        <EchographiePDF
          patient={patient}
          consultation={consultation}
          echographieForm={echographieForm}
          echoType={echoType}
        />
      </div>
    </div>
  );
};

// Helper function to get display labels
const getFieldLabel = (field) => {
  const labels = {
    Foie: "Foie",
    Vesicule_biliaire: "Vésicule Biliaire",
    Voies_biliaires: "Voies Biliaires",
    TP_VCI_VSH: "TP, VCI et VSH",
    Rein_droite: "Rein Droit",
    Rein_gauche: "Rein Gauche",
    Pancreas: "Pancréas",
    Rate: "Rate",
    Vessie: "Vessie",
    Prostate: "Prostate",
    Utérus: "Utérus",
    Aérocolie_diffuse: "Aérocolie diffuse+++",
    Conclusion: "Conclusion",
  };
  return labels[field] || field;
};

export default EchographieManager;
