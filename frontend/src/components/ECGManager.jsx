import React, { useState, useEffect } from "react";
import { SaveIcon, PlusCircleIcon, TrashIcon } from "./Icons";
import { toast } from "react-toastify";
import api from "../utils/api";
import ECGPDF from "./reports/ECGPDF";

const ECGManager = ({ patient, consultation, onQuickAddToInvoice }) => {
  const [ecgForm, setEcgForm] = useState({
    Examen: [""],
    Electrocardiogramme: [""],
    ConclusionECG: [""],
  });
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Load ECG data when consultation changes
  useEffect(() => {
    if (consultation?.id) {
      loadDataECG(consultation.id);
    }
  }, [consultation?.id]);

  const loadDataECG = async (consultId) => {
    try {
      const res = await api.get(`/ecg/data?consultationId=${consultId}`);
      console.log("Raw ECG API response:", res.data);

      if (res.data.length > 0) {
        const d = res.data[0];
        console.log("Données brutes de l'ECG:", d);

        // Helper function to safely parse field data
        const parseFieldData = (fieldData, fieldName) => {
          if (!fieldData) return [""];

          try {
            // If it's already an array, return it
            if (Array.isArray(fieldData)) {
              return fieldData.length > 0 ? fieldData : [""];
            }

            // If it's a string, try to parse it as JSON
            if (typeof fieldData === "string") {
              const parsed = JSON.parse(fieldData);
              return Array.isArray(parsed) && parsed.length > 0 ? parsed : [""];
            }

            // If it's any other type, convert to array
            return [String(fieldData)];
          } catch (error) {
            console.warn(`Error parsing ${fieldName}:`, error);
            return [String(fieldData || "")];
          }
        };

        // Handle different field name variations
        const electroField =
          d.Electrocardiogramme ||
          d.Electrocardiogramme ||
          d.Electrocardiogramme;

        setEcgForm({
          Examen: parseFieldData(d.Examen, "Examen"),
          Electrocardiogramme: parseFieldData(
            electroField,
            "Electrocardiogramme"
          ),
          Conclusion: parseFieldData(d.Conclusion, "Conclusion"),
        });

        setInitialLoad(false);
        toast.success("Données ECG chargées avec succès");
      } else {
        // No existing data - load default templates
        await loadDefaultTemplates();
      }
    } catch (err) {
      console.error("Erreur load ECG:", err);
      // Load default templates on error
      await loadDefaultTemplates();
    }
  };

  // Load default ECG templates from procedure templates
  const loadDefaultTemplates = async () => {
    try {
      console.log("Loading default ECG templates...");
      const res = await api.get(
        "/procedure-templates?procedureType=ecg&subType=standard"
      );
      console.log("Default templates response:", res.data);

      const defaultForm = {
        Examen: [""],
        Electrocardiogramme: [""],
        Conclusion: [""],
      };

      if (res.data && res.data.length > 0) {
        res.data.forEach((template) => {
          try {
            const lines = JSON.parse(template.DefaultLines);
            if (Array.isArray(lines) && lines.length > 0) {
              switch (template.SectionName) {
                case "Examen":
                  defaultForm.Examen = lines;
                  break;
                case "Electrocardiogramme":
                  defaultForm.Electrocardiogramme = lines;
                  break;
                case "Conclusion":
                  defaultForm.Conclusion = lines;
                  break;
                default:
                  console.warn("Unknown section:", template.SectionName);
              }
            }
          } catch (e) {
            console.warn(
              "Error parsing template lines for",
              template.SectionName,
              e
            );
            // Use the raw value if JSON parsing fails
            const rawValue = template.DefaultLines || "";
            // eslint-disable-next-line default-case
            switch (template.SectionName) {
              case "Examen":
                defaultForm.Examen = [rawValue];
                break;
              case "Electrocardiogramme":
                defaultForm.Electrocardiogramme = [rawValue];
                break;
              case "Conclusion":
                defaultForm.Conclusion = [rawValue];
                break;
            }
          }
        });
      } else {
        // No templates found, use hardcoded defaults
        console.log("No templates found, using hardcoded defaults");
        defaultForm.Examen = ["Examen ECG standard"];
        defaultForm.Electrocardiogramme = [
          "Rythme sinusal régulier",
          "Fréquence cardiaque: ___ bpm",
          "Axe électrique: ___ degrés",
          "Ondes P: normales",
          "Complexes QRS: normaux",
          "Segment ST: isoélectrique",
          "Ondes T: normales",
        ];
        defaultForm.Conclusion = ["ECG normal"];
      }

      console.log("Final default form:", defaultForm);
      setEcgForm(defaultForm);
      setInitialLoad(false);
      toast.info("Modèles par défaut chargés pour l'ECG");
    } catch (error) {
      console.error("Error loading default templates:", error);
      // Fallback to hardcoded defaults
      setEcgForm({
        Examen: ["Examen ECG standard"],
        Electrocardiogramme: [
          "Rythme sinusal régulier",
          "Fréquence cardiaque: ___ bpm",
          "Axe électrique: ___ degrés",
          "Ondes P: normales",
          "Complexes QRS: normaux",
          "Segment ST: isoélectrique",
          "Ondes T: normales",
        ],
        Conclusion: ["ECG normal"],
      });
      setInitialLoad(false);
      toast.info("Modèles par défaut utilisés pour l'ECG");
    }
  };

  const handleFieldChange = (fieldKey, index, value) => {
    setEcgForm((prev) => {
      const newFieldValues = [...(prev[fieldKey] || [""])];
      newFieldValues[index] = value;
      return { ...prev, [fieldKey]: newFieldValues };
    });
  };

  const addFieldLine = (fieldKey) => {
    setEcgForm((prev) => ({
      ...prev,
      [fieldKey]: [...(prev[fieldKey] || [""]), ""],
    }));
  };

  const removeFieldLine = (fieldKey, index) => {
    setEcgForm((prev) => {
      const newFieldValues = prev[fieldKey].filter((_, i) => i !== index);
      return {
        ...prev,
        [fieldKey]: newFieldValues.length ? newFieldValues : [""],
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
      const prepareField = (fieldValue) => {
        if (!Array.isArray(fieldValue)) return JSON.stringify([]);
        const nonEmptyValues = fieldValue.filter((v) => v && v.trim() !== "");
        return JSON.stringify(nonEmptyValues.length > 0 ? nonEmptyValues : []);
      };

      const saveData = {
        IDConsultation: consultation.id,
        Examen: prepareField(ecgForm.Examen),
        Electrocardiogramme: prepareField(ecgForm.Electrocardiogramme),
        Conclusion: prepareField(ecgForm.Conclusion),
      };

      console.log("Final ECG save data:", saveData);

      const response = await api.post("/ecg/data", saveData);
      console.log("✅ ECG save response:", response.data);

      toast.success("ECG sauvegardé avec succès ✅");
    } catch (err) {
      console.error("❌ Error saving ECG:", err);
      console.error("Error details:", err.response?.data);
      toast.error("Erreur lors de la sauvegarde ❌");
    } finally {
      setLoading(false);
    }
  };

  const renderField = (fieldKey, fieldLabel) => {
    const values = ecgForm[fieldKey] || [""];

    return (
      <div
        key={fieldKey}
        className="mb-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
      >
        <div className="flex justify-between items-center mb-4">
          <label className="block text-lg font-bold text-gray-800">
            {fieldLabel}
          </label>
        </div>

        {values.map((value, idx) => (
          <div key={idx} className="flex items-start gap-2 mb-3">
            <textarea
              value={value}
              onChange={(e) => handleFieldChange(fieldKey, idx, e.target.value)}
              rows={4}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-blue-500"
              placeholder={`Saisir le contenu pour ${fieldLabel}...`}
            />
            <div className="flex flex-col gap-1">
              {idx === 0 ? (
                <button
                  type="button"
                  onClick={() => addFieldLine(fieldKey)}
                  className="p-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                  title="Ajouter une ligne"
                >
                  <PlusCircleIcon className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => removeFieldLine(fieldKey, idx)}
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
          <span className="ml-3 text-text-main">Chargement de l'ECG...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-bg-card rounded-lg border border-border shadow-sm">
      <h3 className="text-xl font-bold mb-6 text-text-main">
        Électrocardiogramme (ECG)
      </h3>

      {/* Dynamic Fields */}
      <div className="space-y-6">
        {renderField("Examen", "EXAMEN")}
        {renderField("Electrocardiogramme", "Electrocardiogramme")}
        {renderField("Conclusion", "CONCLUSION")}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-border">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-5 py-2 bg-primary text-white rounded-md shadow hover:bg-primary-dark text-sm font-medium transition flex items-center gap-2"
        >
          <SaveIcon className="h-4 w-4" />
          {loading ? "Sauvegarde..." : "Sauvegarder ECG"}
        </button>

        <button
          onClick={() => onQuickAddToInvoice("Électrocardiogramme (ECG)", 1500)}
          className="px-5 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 text-sm font-medium transition flex items-center gap-2"
        >
          💰 Ajouter à Facture
        </button>

        <ECGPDF
          patient={patient}
          consultation={consultation}
          ecgForm={ecgForm}
        />
      </div>
    </div>
  );
};

export default ECGManager;
