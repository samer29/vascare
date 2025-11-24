import React, { useState, useEffect } from "react";
import { SaveIcon, PlusCircleIcon, TrashIcon, PlusIcon } from "./Icons";
import { BoldIcon } from "./icons/BoldIcon";
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
  const [boldFields, setBoldFields] = useState({});
  const [hiddenFields, setHiddenFields] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [newFieldTitle, setNewFieldTitle] = useState("");
  const [newFieldContent, setNewFieldContent] = useState("");

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

  const [customFields, setCustomFields] = useState({});

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

        // Load custom fields if available
        let loadedCustomFields = {};
        if (data.CustomFields) {
          try {
            loadedCustomFields = JSON.parse(data.CustomFields);
            // Add custom fields to form
            Object.keys(loadedCustomFields).forEach((fieldKey) => {
              formData[fieldKey] = loadedCustomFields[fieldKey].content || [""];
            });
          } catch (e) {
            console.error("Error parsing custom fields:", e);
          }
        }

        setEchographieForm(formData);

        // Load bold fields if available
        let loadedBoldFields = {};
        if (data.BoldFields) {
          try {
            loadedBoldFields = JSON.parse(data.BoldFields);
          } catch (e) {
            console.error("Error parsing bold fields:", e);
          }
        }

        // Set Conclusion to bold by default if not set
        if (loadedBoldFields.Conclusion === undefined) {
          loadedBoldFields.Conclusion = true;
        }

        // Set bold state for custom fields
        Object.keys(loadedCustomFields).forEach((fieldKey) => {
          if (loadedBoldFields[fieldKey] === undefined) {
            loadedBoldFields[fieldKey] = false;
          }
        });

        setBoldFields(loadedBoldFields);

        // Load hidden fields if available
        let loadedHiddenFields = {};
        if (data.HiddenFields) {
          try {
            loadedHiddenFields = JSON.parse(data.HiddenFields);
          } catch (e) {
            console.error("Error parsing hidden fields:", e);
          }
        }

        setHiddenFields(loadedHiddenFields);
        setCustomFields(loadedCustomFields);
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
      const newBoldFields = {};

      fieldConfigs[type].forEach((field) => {
        if (!templateData[field] || !Array.isArray(templateData[field])) {
          templateData[field] = [""];
        }
        // Set Conclusion to bold by default
        if (field === "Conclusion") {
          newBoldFields[field] = true;
        } else {
          newBoldFields[field] = false;
        }
      });

      setEchographieForm(templateData);
      setBoldFields(newBoldFields);
      setHiddenFields({});
      setCustomFields({});
      setInitialLoad(false);
    } catch (err) {
      console.error("Error loading default template from database:", err);
      // Fallback to empty form
      const emptyForm = {};
      const newBoldFields = {};

      fieldConfigs[type].forEach((field) => {
        emptyForm[field] = [""];
        // Set Conclusion to bold by default
        if (field === "Conclusion") {
          newBoldFields[field] = true;
        } else {
          newBoldFields[field] = false;
        }
      });

      setEchographieForm(emptyForm);
      setBoldFields(newBoldFields);
      setHiddenFields({});
      setCustomFields({});
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

  const deleteEntireField = (field) => {
    const fieldLabel =
      getAllFields().find((f) => f.key === field)?.label ||
      getFieldLabel(field);
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer complètement le champ "${fieldLabel}" ? Cette action ne peut pas être annulée.`
      )
    ) {
      // Hide the field from UI
      setHiddenFields((prev) => ({
        ...prev,
        [field]: true,
      }));

      // If it's a custom field, remove it from custom fields
      if (field.startsWith("custom_")) {
        setCustomFields((prev) => {
          const newCustomFields = { ...prev };
          delete newCustomFields[field];
          return newCustomFields;
        });
      }

      toast.success(`Champ "${fieldLabel}" supprimé`);
    }
  };

  const restoreHiddenFields = () => {
    const hiddenCount = Object.values(hiddenFields).filter(
      (hidden) => hidden
    ).length;
    if (hiddenCount > 0) {
      setHiddenFields({});
      toast.success("Tous les champs cachés ont été restaurés");
    } else {
      toast.info("Aucun champ caché à restaurer");
    }
  };

  const toggleBoldField = (field) => {
    setBoldFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleAddCustomField = () => {
    if (!newFieldTitle.trim()) {
      toast.error("Veuillez saisir un titre pour le champ");
      return;
    }

    const customFieldId = `custom_${Date.now()}`;
    const newCustomField = {
      label: newFieldTitle.trim(),
      content: newFieldContent.trim() ? [newFieldContent.trim()] : [""],
    };

    // Update custom fields
    setCustomFields((prev) => ({
      ...prev,
      [customFieldId]: newCustomField,
    }));

    // Update form data
    setEchographieForm((prev) => ({
      ...prev,
      [customFieldId]: newFieldContent.trim() ? [newFieldContent.trim()] : [""],
    }));

    // Update bold fields
    setBoldFields((prev) => ({
      ...prev,
      [customFieldId]: false,
    }));

    // Make sure field is visible
    setHiddenFields((prev) => ({
      ...prev,
      [customFieldId]: false,
    }));

    setShowAddFieldModal(false);
    setNewFieldTitle("");
    setNewFieldContent("");
    toast.success(`Champ "${newFieldTitle}" ajouté avec succès`);
  };

  const getAllFields = () => {
    const defaultFieldsList = fieldConfigs[echoType].map((field) => ({
      key: field,
      label: getFieldLabel(field),
      isCustom: false,
    }));

    const customFieldsList = Object.keys(customFields).map((fieldKey) => ({
      key: fieldKey,
      label: customFields[fieldKey].label,
      isCustom: true,
    }));

    return [...defaultFieldsList, ...customFieldsList];
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
        BoldFields: JSON.stringify(boldFields),
        HiddenFields: JSON.stringify(hiddenFields),
        CustomFields: JSON.stringify(customFields),
      };

      // Add all fields for current type (only visible ones)
      getAllFields().forEach(({ key, isCustom }) => {
        if (!hiddenFields[key]) {
          const fieldData = echographieForm[key] || [""];
          if (isCustom) {
            // For custom fields, we need to handle them differently in the backend
            saveData[key] = prepareField(fieldData);
          } else {
            saveData[key] = prepareField(fieldData);
          }
        }
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

  const renderField = (field) => {
    // Skip rendering if field is hidden
    if (hiddenFields[field.key]) return null;

    const values = echographieForm[field.key] || [""];
    const isBold = boldFields[field.key] || false;
    const isConclusion = field.key === "Conclusion";
    const isCustom = field.isCustom;

    return (
      <div
        key={field.key}
        className={`mb-8 bg-white p-6 rounded-lg border-2 shadow-sm ${
          isConclusion
            ? "border-yellow-400 bg-yellow-50"
            : isCustom
            ? "border-green-400 bg-green-50"
            : "border-gray-200"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <label
              className={`block text-lg font-bold ${
                isConclusion
                  ? "text-yellow-800"
                  : isCustom
                  ? "text-green-800"
                  : "text-gray-800"
              }`}
            >
              {field.label}
              {isConclusion && " (Mise en évidence)"}
              {isCustom && " (Personnalisé)"}
            </label>
            {isCustom && (
              <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                Personnalisé
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Bold Toggle */}
            <button
              onClick={() => toggleBoldField(field.key)}
              className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
                isBold
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
              onChange={(e) =>
                handleFieldChange(field.key, idx, e.target.value)
              }
              rows={3}
              className={`flex-1 px-4 py-3 border rounded-lg resize-y focus:ring-2 focus:ring-blue-500 ${
                isConclusion
                  ? "border-yellow-400 bg-yellow-25"
                  : isCustom
                  ? "border-green-300 bg-green-25"
                  : "border-gray-300"
              } ${isBold ? "font-bold" : ""}`}
              placeholder={`Saisir ${field.label.toLowerCase()}...`}
              style={isBold ? { fontWeight: "bold", fontSize: "14px" } : {}}
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
  const visibleFields = allFields.filter((field) => !hiddenFields[field.key]);
  const hiddenFieldsCount = allFields.length - visibleFields.length;
  const customFieldsCount = Object.keys(customFields).length;

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
            <p className="text-gray-600 mb-4">
              Tous les champs sont actuellement cachés.
            </p>
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
            <h3 className="text-lg font-bold mb-4">
              Ajouter un Champ Personnalisé
            </h3>

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
          boldFields={boldFields}
          hiddenFields={hiddenFields}
          customFields={customFields}
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
