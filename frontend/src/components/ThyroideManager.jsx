import React, { useState, useEffect } from "react";
import { SaveIcon, PlusCircleIcon, TrashIcon } from "./Icons";
import { toast } from "react-toastify";
import api from "../utils/api";
import ThyroidePDF from "./reports/ThyroidePDF";

const ThyroideManager = ({
  patient,
  consultation,
  onSave,
  onQuickAddToInvoice,
}) => {
  const [thyroideType, setThyroideType] = useState("avec_schema");
  const [thyroideForm, setThyroideForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Field configurations for each type
  const fieldConfigs = {
    avec_schema: ["Indication", "Technique", "Resultats", "Conclusion", "CAT"],
    sans_schema: ["Technique", "Resultats", "Conclusion", "CAT"],
    thyroidectomie: ["Technique", "Resultats", "Conclusion", "CAT"],
    thyroidite: ["Technique", "Resultats", "Conclusion", "CAT"],
  };

  const typeLabels = {
    avec_schema: "Thyroïde avec Schéma",
    sans_schema: "Thyroïde sans Schéma",
    thyroidectomie: "Thyroïdectomie",
    thyroidite: "Thyroïdite",
  };

  // Load thyroide data when consultation changes
  useEffect(() => {
    if (consultation?.id) {
      loadThyroide();
    }
  }, [consultation?.id]);

  const loadThyroide = async () => {
    if (!consultation?.id) return;

    try {
      console.log("Loading thyroide for consultation:", consultation.id);
      const res = await api.get(
        `/thyroide/data?consultationId=${consultation.id}`
      );

      if (res.data.length > 0) {
        const data = res.data[0];
        console.log("Loaded thyroide data:", data);

        setThyroideType(data.ThyroideType || "avec_schema");

        // Parse all fields for the current type
        const formData = {};
        const currentFields = fieldConfigs[data.ThyroideType || "avec_schema"];

        currentFields.forEach((field) => {
          if (data[field] && Array.isArray(data[field])) {
            formData[field] = data[field];
          } else {
            formData[field] = [""];
          }
        });

        setThyroideForm(formData);
        setInitialLoad(false);
      } else {
        // No existing data, load default template for current type
        console.log("No existing thyroide, loading default template");
        loadDefaultTemplate(thyroideType);
      }
    } catch (err) {
      console.error("Error loading thyroide:", err);
      toast.error("Erreur lors du chargement de la thyroïde");
      loadDefaultTemplate(thyroideType);
    }
  };

  const loadDefaultTemplate = async (type) => {
    try {
      console.log("Loading default template for type:", type);

      // Load templates with the specific subtype
      const res = await api.get(
        `/procedure-templates?procedureType=thyroide&subType=${type}`
      );
      console.log("Database template response:", res.data);

      // Create form structure with default template data
      const templateData = {};

      fieldConfigs[type].forEach((field) => {
        // Find template for this specific field and subtype
        const fieldTemplate = res.data.find(
          (template) =>
            template.SectionName === field && template.SubType === type
        );

        if (fieldTemplate) {
          try {
            templateData[field] = JSON.parse(fieldTemplate.DefaultLines);
          } catch (e) {
            templateData[field] = [fieldTemplate.DefaultLines || ""];
          }
        } else {
          // If no template found, use empty field
          templateData[field] = [""];
        }
      });

      setThyroideForm(templateData);
      setInitialLoad(false);

      if (res.data.length === 0) {
        toast.info(
          `Aucun template trouvé pour ${typeLabels[type]}. Créez-en dans les paramètres.`
        );
      } else {
        toast.success(`Template ${typeLabels[type]} chargé`);
      }
    } catch (err) {
      console.error("Error loading default template from database:", err);
      // Fallback to empty form
      const emptyForm = {};
      fieldConfigs[type].forEach((field) => {
        emptyForm[field] = [""];
      });
      setThyroideForm(emptyForm);
      setInitialLoad(false);
      toast.error("Erreur lors du chargement du template");
    }
  };

  const handleTypeChange = async (newType) => {
    setThyroideType(newType);

    // Check if we have existing data for this consultation and type
    if (consultation?.id) {
      try {
        const res = await api.get(
          `/thyroide/data?consultationId=${consultation.id}`
        );

        if (res.data.length > 0) {
          const existingData = res.data[0];

          // If existing data is for the same type, load it
          if (existingData.ThyroideType === newType) {
            const formData = {};
            fieldConfigs[newType].forEach((field) => {
              if (existingData[field] && Array.isArray(existingData[field])) {
                formData[field] = existingData[field];
              } else {
                formData[field] = [""];
              }
            });
            setThyroideForm(formData);
            toast.info(
              `Données existantes chargées pour ${typeLabels[newType]}`
            );
          } else {
            // Load default template for new type
            await loadDefaultTemplate(newType);
          }
        } else {
          // No existing data, load default template
          await loadDefaultTemplate(newType);
        }
      } catch (err) {
        console.error("Error checking existing data:", err);
        // Load default template on error
        await loadDefaultTemplate(newType);
      }
    } else {
      // No consultation selected, just load default template
      await loadDefaultTemplate(newType);
    }
  };

  const handleFieldChange = (field, index, value) => {
    setThyroideForm((prev) => {
      const newFieldValues = [...(prev[field] || [""])];
      newFieldValues[index] = value;
      return { ...prev, [field]: newFieldValues };
    });
  };

  const addFieldLine = (field) => {
    setThyroideForm((prev) => ({
      ...prev,
      [field]: [...(prev[field] || [""]), ""],
    }));
  };

  const removeFieldLine = (field, index) => {
    setThyroideForm((prev) => {
      const newFieldValues = prev[field].filter((_, i) => i !== index);
      return {
        ...prev,
        [field]: newFieldValues.length ? newFieldValues : [""],
      };
    });
  };

  const handleSave = async () => {
    if (!consultation) {
      toast.error("Aucune consultation sélectionnée");
      return;
    }

    setLoading(true);
    try {
      console.log("=== THYROIDE SAVE DEBUG ===");
      console.log("ThyroideType:", thyroideType);
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
        ThyroideType: thyroideType,
      };

      // Add all fields for current type
      fieldConfigs[thyroideType].forEach((field) => {
        const fieldData = thyroideForm[field] || [""];
        saveData[field] = prepareField(fieldData);
      });

      console.log("Final thyroide save data structure:", saveData);

      const response = await api.post("/thyroide/data", saveData);
      console.log("✅ Thyroide save response:", response.data);

      toast.success("Thyroïde sauvegardé avec succès ✅");
    } catch (err) {
      console.error("❌ Error saving thyroide:", err);
      console.error("Error response:", err.response?.data);
      toast.error("Erreur lors de la sauvegarde ❌");
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field, label) => {
    const values = thyroideForm[field] || [""];

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
                <button
                  type="button"
                  onClick={() => removeFieldLine(field, idx)}
                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                  title="Supprimer cette ligne"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
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
            Chargement de la thyroïde...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-bg-card rounded-lg border border-border shadow-sm">
      <h3 className="text-xl font-bold mb-6 text-text-main">
        Échographie Thyroïdienne
      </h3>

      {/* Type Selection */}
      <div className="mb-8">
        <label className="block text-sm font-semibold mb-3 text-text-main">
          Type d'Examen Thyroïdien
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(typeLabels).map(([type, label]) => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`p-4 rounded-lg border-2 text-center transition ${
                thyroideType === type
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
        {fieldConfigs[thyroideType].map((field) =>
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
          {loading ? "Sauvegarde..." : "Sauvegarder Thyroïde"}
        </button>

        <button
          onClick={() =>
            onQuickAddToInvoice(
              `Écho Thyroïde ${typeLabels[thyroideType]}`,
              1800
            )
          }
          className="px-5 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 text-sm font-medium transition flex items-center gap-2"
        >
          💰 Ajouter à Facture
        </button>

        <ThyroidePDF
          patient={patient}
          consultation={consultation}
          thyroideForm={thyroideForm}
          thyroideType={thyroideType}
        />
      </div>
    </div>
  );
};

// Helper function to get display labels
const getFieldLabel = (field) => {
  const labels = {
    Indication: "Indication",
    Technique: "Technique",
    Resultats: "Résultats",
    ConclusionThyroide: "Conclusion",
    CATThyroide: "Conduite à Tenir (CAT)",
  };
  return labels[field] || field;
};

export default ThyroideManager;
