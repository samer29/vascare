import React, { useState, useEffect } from "react";
import { SaveIcon, PlusCircleIcon, TrashIcon, PlusIcon } from "./Icons";
import { BoldIcon } from "./icons/BoldIcon";
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
  const [boldFields, setBoldFields] = useState({});
  const [hiddenFields, setHiddenFields] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [newFieldTitle, setNewFieldTitle] = useState("");
  const [newFieldContent, setNewFieldContent] = useState("");

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
        
        // Load bold fields if available
        if (data.BoldFields) {
          try {
            const boldData = JSON.parse(data.BoldFields);
            setBoldFields(boldData);
          } catch (e) {
            console.error("Error parsing bold fields:", e);
          }
        }
        
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
      const newBoldFields = {};

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

        // Set Conclusion to bold by default
        if (field.toLowerCase().includes('conclusion')) {
          newBoldFields[field] = true;
        } else {
          newBoldFields[field] = false;
        }
      });

      setThyroideForm(templateData);
      setBoldFields(newBoldFields);
      setHiddenFields({});
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
      const newBoldFields = {};
      
      fieldConfigs[type].forEach((field) => {
        emptyForm[field] = [""];
        // Set Conclusion to bold by default
        if (field.toLowerCase().includes('conclusion')) {
          newBoldFields[field] = true;
        } else {
          newBoldFields[field] = false;
        }
      });
      
      setThyroideForm(emptyForm);
      setBoldFields(newBoldFields);
      setHiddenFields({});
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
            
            // Load bold fields if available
            if (existingData.BoldFields) {
              try {
                const boldData = JSON.parse(existingData.BoldFields);
                setBoldFields(boldData);
              } catch (e) {
                console.error("Error parsing bold fields:", e);
              }
            }
            
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

  const insertFieldLine = (field, index) => {
    setThyroideForm((prev) => {
      const newFieldValues = [...prev[field]];
      newFieldValues.splice(index + 1, 0, "");
      return { ...prev, [field]: newFieldValues };
    });
  };

  const deleteEntireField = (field) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer complètement le champ "${getFieldLabel(field)}" ? Cette action ne peut pas être annulée.`)) {
      // Hide the field from UI
      setHiddenFields((prev) => ({
        ...prev,
        [field]: true
      }));
      
      toast.success(`Champ "${getFieldLabel(field)}" supprimé`);
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

  const toggleBoldField = (field) => {
    setBoldFields((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleAddCustomField = () => {
    if (!newFieldTitle.trim()) {
      toast.error("Veuillez saisir un titre pour le champ");
      return;
    }

    const customFieldId = `custom_${Date.now()}`;
    const newCustomField = newFieldTitle.trim();

    // Update available fields for current type
    const updatedFields = [...fieldConfigs[thyroideType], customFieldId];
    fieldConfigs[thyroideType] = updatedFields;

    // Update form data
    setThyroideForm(prev => ({
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

      // Add all fields for current type (only visible ones)
      fieldConfigs[thyroideType].forEach((field) => {
        if (!hiddenFields[field]) {
          const fieldData = thyroideForm[field] || [""];
          saveData[field] = prepareField(fieldData);
        }
      });

      // Save bold fields
      saveData.BoldFields = JSON.stringify(boldFields);
      // Save hidden fields
      saveData.HiddenFields = JSON.stringify(hiddenFields);

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
    // Skip rendering if field is hidden
    if (hiddenFields[field]) return null;

    const values = thyroideForm[field] || [""];
    const isBold = boldFields[field] || false;
    const isConclusion = field.toLowerCase().includes('conclusion');
    const isCustom = field.startsWith('custom_');

    return (
      <div
        key={field}
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
              {label}
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
              onClick={() => toggleBoldField(field)}
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
              onClick={() => deleteEntireField(field)}
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
              onChange={(e) => handleFieldChange(field, idx, e.target.value)}
              rows={3}
              className={`flex-1 px-4 py-3 border rounded-lg resize-y focus:ring-2 focus:ring-blue-500 ${
                isConclusion ? 'border-yellow-400 bg-yellow-25' : 
                isCustom ? 'border-green-300 bg-green-25' : 'border-gray-300'
              } ${isBold ? 'font-bold' : ''}`}
              placeholder={`Saisir ${label.toLowerCase()}...`}
              style={isBold ? { fontWeight: 'bold', fontSize: '14px' } : {}}
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

        {/* Add first line button if no lines exist */}
        {values.length === 0 && (
          <div className="flex justify-center mt-4">
            <button
              type="button"
              onClick={() => addFieldLine(field)}
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

  const visibleFields = fieldConfigs[thyroideType].filter(field => !hiddenFields[field]);
  const hiddenFieldsCount = fieldConfigs[thyroideType].length - visibleFields.length;
  const customFieldsCount = fieldConfigs[thyroideType].filter(field => field.startsWith('custom_')).length;

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

      {/* Available Fields Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-blue-800">
              <strong>Champs disponibles:</strong> {visibleFields.length}{" "}
              champ(s) visible(s) sur {fieldConfigs[thyroideType].length} total
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
        {visibleFields.map((field) =>
          renderField(field, getFieldLabel(field))
        )}
        
        {visibleFields.length === 0 && fieldConfigs[thyroideType].length > 0 && (
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
          boldFields={boldFields}
          hiddenFields={hiddenFields}
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
    Conclusion: "Conclusion",
    CAT: "Conduite à Tenir (CAT)",
  };
  
  // For custom fields, use the stored title
  if (field.startsWith('custom_')) {
    return field.replace('custom_', '');
  }
  
  return labels[field] || field;
};

export default ThyroideManager;