import React, { useState, useEffect } from "react";
import { SaveIcon, PlusCircleIcon, TrashIcon, PlusIcon } from "./Icons";
import { BoldIcon } from "./icons/BoldIcon";
import { toast } from "react-toastify";
import api from "../utils/api";
import ECGPDF from "./reports/ECGPDF";

const ECGManager = ({ patient, consultation, onQuickAddToInvoice }) => {
  const [ecgForm, setEcgForm] = useState({
    Examen: [""],
    Electrocardiogramme: [""],
    Conclusion: [""],
  });
  const [boldFields, setBoldFields] = useState({
    Examen: false,
    Electrocardiogramme: false,
    Conclusion: true, // Conclusion bold by default
  });
  const [hiddenFields, setHiddenFields] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [newFieldTitle, setNewFieldTitle] = useState("");
  const [newFieldContent, setNewFieldContent] = useState("");

  // Default fields configuration
  const defaultFields = [
    { key: "Examen", label: "EXAMEN" },
    { key: "Electrocardiogramme", label: "Electrocardiogramme" },
    { key: "Conclusion", label: "CONCLUSION" },
  ];

  const [customFields, setCustomFields] = useState([]);

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

        const loadedForm = {
          Examen: parseFieldData(d.Examen, "Examen"),
          Electrocardiogramme: parseFieldData(
            electroField,
            "Electrocardiogramme"
          ),
          Conclusion: parseFieldData(d.Conclusion, "Conclusion"),
        };

        // Load bold fields if available
        let loadedBoldFields = { ...boldFields };
        if (d.BoldFields) {
          try {
            const boldData = JSON.parse(d.BoldFields);
            loadedBoldFields = { ...loadedBoldFields, ...boldData };
          } catch (e) {
            console.error("Error parsing bold fields:", e);
          }
        }

        // Load hidden fields if available
        let loadedHiddenFields = {};
        if (d.HiddenFields) {
          try {
            loadedHiddenFields = JSON.parse(d.HiddenFields);
          } catch (e) {
            console.error("Error parsing hidden fields:", e);
          }
        }

        // Load custom fields if available
        let loadedCustomFields = [];
        if (d.CustomFields) {
          try {
            loadedCustomFields = JSON.parse(d.CustomFields);
            // Add custom fields to form
            loadedCustomFields.forEach(customField => {
              loadedForm[customField.key] = parseFieldData(customField.content, customField.label);
              loadedBoldFields[customField.key] = false;
            });
          } catch (e) {
            console.error("Error parsing custom fields:", e);
          }
        }

        setEcgForm(loadedForm);
        setBoldFields(loadedBoldFields);
        setHiddenFields(loadedHiddenFields);
        setCustomFields(loadedCustomFields);
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

      const defaultBoldFields = {
        Examen: false,
        Electrocardiogramme: false,
        Conclusion: true, // Conclusion bold by default
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
      setBoldFields(defaultBoldFields);
      setHiddenFields({});
      setCustomFields([]);
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
      setBoldFields({
        Examen: false,
        Electrocardiogramme: false,
        Conclusion: true,
      });
      setHiddenFields({});
      setCustomFields([]);
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

  const insertFieldLine = (fieldKey, index) => {
    setEcgForm((prev) => {
      const newFieldValues = [...prev[fieldKey]];
      newFieldValues.splice(index + 1, 0, "");
      return { ...prev, [fieldKey]: newFieldValues };
    });
  };

  const deleteEntireField = (fieldKey) => {
    const fieldLabel = getAllFields().find(f => f.key === fieldKey)?.label || fieldKey;
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer complètement le champ "${fieldLabel}" ? Cette action ne peut pas être annulée.`)) {
      // Hide the field from UI
      setHiddenFields((prev) => ({
        ...prev,
        [fieldKey]: true
      }));

      // If it's a custom field, remove it from custom fields
      if (fieldKey.startsWith('custom_')) {
        setCustomFields(prev => prev.filter(field => field.key !== fieldKey));
      }
      
      toast.success(`Champ "${fieldLabel}" supprimé`);
    }
  };

  const restoreHiddenFields = () => {
    const hiddenCount = Object.values(hiddenFields).filter(hidden => hidden).length;
    if (hiddenCount > 0) {
      setHiddenFields({});
      toast.success("Tous les champs cachés ont été restaurés");
    } else {
      toast.info("Aucun champ caché à restaurer");
    }
  };

  const toggleBoldField = (fieldKey) => {
    setBoldFields((prev) => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };

  const handleAddCustomField = () => {
    if (!newFieldTitle.trim()) {
      toast.error("Veuillez saisir un titre pour le champ");
      return;
    }

    const customFieldId = `custom_${Date.now()}`;
    const newCustomField = {
      key: customFieldId,
      label: newFieldTitle.trim(),
      content: newFieldContent.trim() ? [newFieldContent.trim()] : [""],
    };

    // Update custom fields
    setCustomFields(prev => [...prev, newCustomField]);

    // Update form data
    setEcgForm(prev => ({
      ...prev,
      [customFieldId]: newFieldContent.trim() ? [newFieldContent.trim()] : [""]
    }));

    // Update bold fields
    setBoldFields(prev => ({
      ...prev,
      [customFieldId]: false
    }));

    // Make sure field is visible
    setHiddenFields(prev => ({
      ...prev,
      [customFieldId]: false
    }));

    setShowAddFieldModal(false);
    setNewFieldTitle("");
    setNewFieldContent("");
    toast.success(`Champ "${newFieldTitle}" ajouté avec succès`);
  };

  const getAllFields = () => {
    return [
      ...defaultFields,
      ...customFields.map(field => ({
        key: field.key,
        label: field.label,
        isCustom: true
      }))
    ];
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
        BoldFields: JSON.stringify(boldFields),
        HiddenFields: JSON.stringify(hiddenFields),
        CustomFields: JSON.stringify(customFields),
      };

      // Add custom fields to save data
      customFields.forEach(customField => {
        if (!hiddenFields[customField.key]) {
          const fieldData = ecgForm[customField.key] || [""];
          saveData[customField.key] = prepareField(fieldData);
        }
      });

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

  const renderField = (field) => {
    // Skip rendering if field is hidden
    if (hiddenFields[field.key]) return null;

    const values = ecgForm[field.key] || [""];
    const isBold = boldFields[field.key] || false;
    const isConclusion = field.key.toLowerCase().includes('conclusion');
    const isCustom = field.isCustom || false;

    return (
      <div
        key={field.key}
        className={`mb-8 bg-white p-6 rounded-lg border-2 shadow-sm ${
          isConclusion ? 'border-yellow-400 bg-yellow-50' : 
          isCustom ? 'border-green-400 bg-green-50' : 'border-gray-200'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <label className={`block text-lg font-bold ${
              isConclusion ? 'text-yellow-800' : 
              isCustom ? 'text-green-800' : 'text-gray-800'
            }`}>
              {field.label}
              {isConclusion && " (Mise en évidence)"}
              {isCustom && " (Personnalisé)"}
            </label>
            {isCustom && (
              <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">Personnalisé</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Bold Toggle */}
            <button
              onClick={() => toggleBoldField(field.key)}
              className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
                isBold 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Texte en gras dans le PDF"
            >
              <BoldIcon className="h-4 w-4" />
              Gras
            </button>

            {/* Delete Entire Field */}
            <button
              onClick={() => deleteEntireField(field.key)}
              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
              title="Supprimer complètement ce champ"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {values.map((value, idx) => (
          <div key={idx} className="flex items-start gap-2 mb-3">
            <textarea
              value={value}
              onChange={(e) => handleFieldChange(field.key, idx, e.target.value)}
              rows={3}
              className={`flex-1 px-4 py-3 border rounded-lg resize-y focus:ring-2 focus:ring-blue-500 ${
                isConclusion ? 'border-yellow-400 bg-yellow-25' : 
                isCustom ? 'border-green-300 bg-green-25' : 'border-gray-300'
              } ${isBold ? 'font-bold' : ''}`}
              placeholder={`Saisir le contenu pour ${field.label}...`}
              style={isBold ? { fontWeight: 'bold', fontSize: '14px' } : {}}
            />
            <div className="flex flex-col gap-1">
              {idx === 0 ? (
                <button
                  type="button"
                  onClick={() => addFieldLine(field.key)}
                  className="p-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                  title="Ajouter une ligne"
                >
                  <PlusCircleIcon className="h-4 w-4" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => removeFieldLine(field.key, idx)}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                    title="Supprimer cette ligne"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFieldLine(field.key, idx)}
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

        {/* Add first line button if no lines exist */}
        {values.length === 0 && (
          <div className="flex justify-center mt-4">
            <button
              type="button"
              onClick={() => addFieldLine(field.key)}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors flex items-center gap-2"
            >
              <PlusCircleIcon className="h-4 w-4" />
              Ajouter la première ligne
            </button>
          </div>
        )}
      </div>
    );
  };

  const allFields = getAllFields();
  const visibleFields = allFields.filter(field => !hiddenFields[field.key]);
  const hiddenFieldsCount = allFields.length - visibleFields.length;
  const customFieldsCount = customFields.length;

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

      {/* Available Fields Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-blue-800">
              <strong>Champs disponibles:</strong> {visibleFields.length}{" "}
              champ(s) visible(s) sur {allFields.length} total
              {hiddenFieldsCount > 0 && (
                <span className="text-orange-600 ml-2">
                  ({hiddenFieldsCount} champ(s) caché(s))
                </span>
              )}
              {customFieldsCount > 0 && (
                <span className="text-green-600 ml-2">
                  ({customFieldsCount} personnalisé(s))
                </span>
              )}
            </p>
          </div>
          
          <div className="flex gap-2">
            {hiddenFieldsCount > 0 && (
              <button
                onClick={restoreHiddenFields}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
              >
                Restaurer tous les champs
              </button>
            )}
            
            {/* Add Custom Field Button */}
            <button
              onClick={() => setShowAddFieldModal(true)}
              className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors flex items-center gap-1"
            >
              <PlusIcon className="h-4 w-4" />
              Nouveau Champ
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Fields */}
      <div className="space-y-6">
        {visibleFields.map((field) => renderField(field))}
        
        {visibleFields.length === 0 && allFields.length > 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">Tous les champs sont actuellement cachés.</p>
            <button
              onClick={restoreHiddenFields}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Restaurer tous les champs
            </button>
          </div>
        )}
      </div>

      {/* Add Custom Field Modal */}
      {showAddFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Ajouter un Champ Personnalisé</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre du Champ *
                </label>
                <input
                  type="text"
                  value={newFieldTitle}
                  onChange={(e) => setNewFieldTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Observation Spéciale, Note, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenu (Optionnel)
                </label>
                <textarea
                  value={newFieldContent}
                  onChange={(e) => setNewFieldContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Saisir le contenu initial..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddFieldModal(false);
                  setNewFieldTitle("");
                  setNewFieldContent("");
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddCustomField}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
              >
                Ajouter le Champ
              </button>
            </div>
          </div>
        </div>
      )}

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
          boldFields={boldFields}
          hiddenFields={hiddenFields}
          customFields={customFields}
        />
      </div>
    </div>
  );
};

export default ECGManager;