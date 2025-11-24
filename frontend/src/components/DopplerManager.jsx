import React, { useState, useEffect } from "react";
import {
  SaveIcon,
  PlusCircleIcon,
  TrashIcon,
  PlusIcon,
} from "./Icons";
import { BoldIcon } from "./icons/BoldIcon";
import { toast } from "react-toastify";
import api from "../utils/api";
import DopplerPDF from "./reports/DopplerPDF";

const DopplerManager = ({
  patient,
  consultation,
  dopplerType,
  dopplerSubType,
  dopplerForm,
  setDopplerType,
  setDopplerSubType,
  setDopplerForm,
  onQuickAddToInvoice,
}) => {
  const [availableFields, setAvailableFields] = useState([]);
  const [boldFields, setBoldFields] = useState({}); // Track bold state for each field
  const [hiddenFields, setHiddenFields] = useState({}); // Track which fields are hidden
  const [loading, setLoading] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [newFieldTitle, setNewFieldTitle] = useState("");
  const [newFieldContent, setNewFieldContent] = useState("");

  // Main types
  const mainTypes = {
    MI: "Membres Inférieurs",
    MS: "Membres Supérieurs",
    Porte: "Système Porte",
    Renal: "Artères Rénales",
    TSA: "Troncs Supra-Aortiques",
  };

  // Sub-types for each main type
  const subTypes = {
    MI: [
      { id: "normal", name: "Doppler Normal" },
      { id: "pathological", name: "Doppler Pathologique" },
      { id: "pathological2", name: "Doppler Pathologique 2" },
      { id: "MIAVNORM", name: "Doppler MI et V Norm" },
      { id: "VMIControl", name: "Doppler VMI Contrôle" },
      { id: "VMINormal", name: "Doppler VMI Normal" },
      { id: "VMINormal2", name: "Doppler VMI Normal 2" },
      { id: "VMIPath", name: "Doppler VMI Pathologique" },
      { id: "VMISuperf", name: "Doppler VMI Superficiel" },
    ],
    MS: [
      { id: "AMSnormal", name: "Doppler Normal" },
      { id: "AMSnormal2", name: "Doppler Normal 2" },
      { id: "AMSPatho", name: "Doppler Pathologique" },
      { id: "VMSNormal", name: "VMS Normal" },
      { id: "VMSPatho", name: "VMS Pathologique" },
      { id: "VMSPatho2", name: "VMS Pathologique 2" },
      { id: "VMSoedem", name: "VMS Œdème par compression" },
    ],
    Porte: [
      { id: "path1", name: "Porte Pathologique 1" },
      { id: "path2", name: "Porte Pathologique 2" },
      { id: "path3", name: "Porte Pathologique 3" },
      { id: "path4", name: "Porte Pathologique 4" },
      { id: "path5", name: "Porte Pathologique 5" },
    ],
    Renal: [
      { id: "normal", name: "Artères Rénales Normales" },
      { id: "path", name: "Artères Rénales Pathologiques" },
      { id: "confectionFavNorm", name: "Bilan Confection Fav Norm" },
      { id: "confectionFavPath", name: "Bilan Confection Fav Path" },
      {
        id: "evaluationFavBrachioBasilic",
        name: "Evaluation Fav Brachio Basilic",
      },
      {
        id: "evalutionFavBrachioCephal",
        name: "Evaluation Fav Brachio Cephal",
      },
      { id: "confectionFavNorm", name: "Bilan Confection Fav Norm" },
      { id: "transplantationRenal", name: "Transplantation Rénale" },
      { id: "vrnormal", name: "VR Normal" },
    ],
    TSA: [
      { id: "normal", name: "TSA Normal" },
      { id: "aborddialyse", name: "A Bord Dialyse" },
      { id: "chambreconfection", name: "Chambre Implantable Confection" },
      { id: "chambrethrombosse", name: "Chambre Implantable Thrombosée" },
      { id: "tsaplaque", name: "TSA Plaque" },
      { id: "vcervical", name: "V Cervical" },
    ],
  };

  // Load available fields when type/subtype changes
  useEffect(() => {
    if (dopplerType && dopplerSubType) {
      loadAvailableFields();
    }
  }, [dopplerType, dopplerSubType]);

  const loadAvailableFields = async () => {
    try {
      // Load all templates for this main type and sub-type
      const res = await api.get(
        `/dynamic-templates/templates?category=${dopplerType}&subType=${dopplerSubType}`
      );

      // Extract unique field names from templates
      const templateFields = res.data.map((template) => ({
        key: template.ID,
        label: template.DisplayName || template.TemplateName,
        templateId: template.ID,
        content: template.Content,
        isCustom: false, // Mark as template field
      }));

      // Load custom fields from localStorage or initialize empty
      const savedCustomFields =
        JSON.parse(
          localStorage.getItem(
            `dopplerCustomFields_${dopplerType}_${dopplerSubType}`
          )
        ) || [];

      const customFields = savedCustomFields.map((customField, index) => ({
        key: `custom_${customField.id || Date.now() + index}`,
        label: customField.title,
        templateId: null,
        content: customField.content ? [customField.content] : [""],
        isCustom: true, // Mark as custom field
      }));

      // Combine template fields and custom fields
      const allFields = [...templateFields, ...customFields];
      setAvailableFields(allFields);

      // Initialize form with template content for each field ONLY if fields are empty
      const newForm = { ...dopplerForm };
      const newBoldFields = { ...boldFields };
      const newHiddenFields = { ...hiddenFields };
      let hasNewFields = false;

      allFields.forEach((field) => {
        if (!newForm[field.key] && field.content && field.content.length > 0) {
          newForm[field.key] = [...field.content];
          // Set Conclusion to bold by default
          if (field.label.toLowerCase().includes("conclusion")) {
            newBoldFields[field.key] = true;
          } else {
            newBoldFields[field.key] = newBoldFields[field.key] || false;
          }
          // Make sure field is visible by default
          newHiddenFields[field.key] = false;
          hasNewFields = true;
        } else if (!newForm[field.key]) {
          newForm[field.key] = [""];
          // Set Conclusion to bold by default
          if (field.label.toLowerCase().includes("conclusion")) {
            newBoldFields[field.key] = true;
          } else {
            newBoldFields[field.key] = newBoldFields[field.key] || false;
          }
          // Make sure field is visible by default
          newHiddenFields[field.key] = false;
          hasNewFields = true;
        }
      });

      if (hasNewFields) {
        setDopplerForm(newForm);
        setBoldFields(newBoldFields);
        setHiddenFields(newHiddenFields);
        if (templateFields.length > 0) {
          toast.success("Templates chargés automatiquement");
        }
      }
    } catch (err) {
      console.error("Error loading available fields:", err);
      setAvailableFields([]);
    }
  };

  const handleMainTypeChange = async (newType) => {
    setDopplerType(newType);
    setDopplerSubType(subTypes[newType]?.[0]?.id || "normal");
  };

  const handleSubTypeChange = async (newSubType) => {
    setDopplerSubType(newSubType);
  };

  const resetTemplateData = async (fieldKey) => {
    try {
      const field = availableFields.find(
        (f) => f.key.toString() === fieldKey.toString()
      );
      if (
        field &&
        field.content &&
        field.content.length > 0 &&
        !field.isCustom
      ) {
        setDopplerForm((prev) => ({
          ...prev,
          [fieldKey]: [...field.content],
        }));
        toast.success(`Template "${field.label}" réinitialisé`);
      } else if (field && field.isCustom) {
        toast.info(
          "Les champs personnalisés ne peuvent pas être réinitialisés"
        );
      }
    } catch (err) {
      console.error("Error resetting template data:", err);
      toast.error("Erreur lors de la réinitialisation");
    }
  };

  const handleFieldChange = (fieldKey, index, value) => {
    setDopplerForm((prev) => {
      const newFieldValues = [...(prev[fieldKey] || [""])];
      newFieldValues[index] = value;
      return { ...prev, [fieldKey]: newFieldValues };
    });
  };

  const addFieldLine = (fieldKey) => {
    setDopplerForm((prev) => ({
      ...prev,
      [fieldKey]: [...(prev[fieldKey] || [""]), ""],
    }));
  };

  const removeFieldLine = (fieldKey, index) => {
    setDopplerForm((prev) => {
      const newFieldValues = prev[fieldKey].filter((_, i) => i !== index);
      return {
        ...prev,
        [fieldKey]: newFieldValues.length ? newFieldValues : [""],
      };
    });
  };

  const insertFieldLine = (fieldKey, index) => {
    setDopplerForm((prev) => {
      const newFieldValues = [...prev[fieldKey]];
      newFieldValues.splice(index + 1, 0, "");
      return { ...prev, [fieldKey]: newFieldValues };
    });
  };

  const deleteEntireField = (fieldKey) => {
    const field = availableFields.find((f) => f.key === fieldKey);
    if (
      field &&
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer complètement le champ "${field.label}" ? Cette action ne peut pas être annulée.`
      )
    ) {
      // Hide the field from UI
      setHiddenFields((prev) => ({
        ...prev,
        [fieldKey]: true,
      }));

      // If it's a custom field, remove it from storage
      if (field.isCustom) {
        const savedCustomFields =
          JSON.parse(
            localStorage.getItem(
              `dopplerCustomFields_${dopplerType}_${dopplerSubType}`
            )
          ) || [];
        const updatedCustomFields = savedCustomFields.filter(
          (cf) => cf.id !== field.key.replace("custom_", "")
        );
        localStorage.setItem(
          `dopplerCustomFields_${dopplerType}_${dopplerSubType}`,
          JSON.stringify(updatedCustomFields)
        );
      }

      toast.success(`Champ "${field.label}" supprimé`);
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

  const toggleBoldField = (fieldKey) => {
    setBoldFields((prev) => ({
      ...prev,
      [fieldKey]: !prev[fieldKey],
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
      templateId: null,
      content: newFieldContent.trim() ? [newFieldContent.trim()] : [""],
      isCustom: true,
    };

    // Save to localStorage
    const savedCustomFields =
      JSON.parse(
        localStorage.getItem(
          `dopplerCustomFields_${dopplerType}_${dopplerSubType}`
        )
      ) || [];
    const updatedCustomFields = [
      ...savedCustomFields,
      {
        id: customFieldId.replace("custom_", ""),
        title: newFieldTitle.trim(),
        content: newFieldContent.trim(),
      },
    ];
    localStorage.setItem(
      `dopplerCustomFields_${dopplerType}_${dopplerSubType}`,
      JSON.stringify(updatedCustomFields)
    );

    // Update state
    setAvailableFields((prev) => [...prev, newCustomField]);
    setDopplerForm((prev) => ({
      ...prev,
      [customFieldId]: newFieldContent.trim() ? [newFieldContent.trim()] : [""],
    }));
    setBoldFields((prev) => ({
      ...prev,
      [customFieldId]: false,
    }));
    setHiddenFields((prev) => ({
      ...prev,
      [customFieldId]: false,
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
      const prepareField = (fieldValue) => {
        if (!Array.isArray(fieldValue)) return [];
        const nonEmptyValues = fieldValue.filter((v) => v && v.trim() !== "");
        return nonEmptyValues.length > 0 ? nonEmptyValues : [];
      };

      const dynamicFieldData = {};
      const boldFieldData = {};

      availableFields.forEach((field) => {
        // Only include fields that are not hidden
        if (!hiddenFields[field.key]) {
          const fieldContent = dopplerForm[field.key] || [""];
          dynamicFieldData[field.label] = prepareField(fieldContent);
          boldFieldData[field.label] = boldFields[field.key] || false;
        }
      });

      const saveData = {
        IDConsultation: consultation.id,
        DopplerType: dopplerType,
        DopplerSubType: dopplerSubType,
        MI: JSON.stringify(dynamicFieldData),
        MS: JSON.stringify([]),
        Porte: JSON.stringify([]),
        Renal: JSON.stringify([]),
        TSA: JSON.stringify([]),
        Conclusion: JSON.stringify([]),
        CAT: JSON.stringify([]),
        BoldFields: JSON.stringify(boldFieldData), // Save bold preferences
        HiddenFields: JSON.stringify(hiddenFields), // Save hidden fields state
      };

      console.log("Final doppler save data:", saveData);

      const response = await api.post("/doppler/data", saveData);
      console.log("✅ Doppler save response:", response.data);

      toast.success("Doppler sauvegardé avec succès ✅");
    } catch (err) {
      console.error("❌ Error saving doppler:", err);
      console.error("Error details:", err.response?.data);
      toast.error("Erreur lors de la sauvegarde ❌");
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    // Skip rendering if field is hidden
    if (hiddenFields[field.key]) return null;

    const values = dopplerForm[field.key] || [""];
    const isBold = boldFields[field.key] || false;
    const isConclusion = field.label.toLowerCase().includes("conclusion");

    return (
      <div
        key={field.key}
        className={`mb-8 bg-white p-6 rounded-lg border-2 shadow-sm ${
          isConclusion
            ? "border-yellow-400 bg-yellow-50"
            : field.isCustom
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
                  : field.isCustom
                  ? "text-green-800"
                  : "text-gray-800"
              }`}
            >
              {field.label}
              {isConclusion && " (Mise en évidence)"}
              {field.isCustom && " (Personnalisé)"}
            </label>
            {field.isCustom && (
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

            {/* Reset Template - Only for template fields */}
            {!field.isCustom && (
              <button
                onClick={() => resetTemplateData(field.key)}
                className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors"
                title="Réinitialiser à partir du template"
              >
                Reset
              </button>
            )}

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
                  : field.isCustom
                  ? "border-green-300 bg-green-25"
                  : "border-gray-300"
              } ${isBold ? "font-bold" : ""}`}
              placeholder={`Saisir le contenu pour ${field.label}...`}
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

  const visibleFields = availableFields.filter(
    (field) => !hiddenFields[field.key]
  );
  const hiddenFieldsCount = availableFields.length - visibleFields.length;
  const customFieldsCount = availableFields.filter(
    (field) => field.isCustom
  ).length;

  return (
    <div className="p-6 bg-bg-card rounded-lg border border-border shadow-sm">
      <h3 className="text-xl font-bold mb-6 text-text-main">
        Écho-Doppler Vasculaire
      </h3>

      {/* Main Type Selection */}
      <div className="mb-8">
        <label className="block text-sm font-semibold mb-3 text-text-main">
          Type d'Examen Doppler
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {Object.entries(mainTypes).map(([type, label]) => (
            <button
              key={type}
              onClick={() => handleMainTypeChange(type)}
              className={`p-4 rounded-lg border-2 text-center transition ${
                dopplerType === type
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-bg-card text-text-main hover:border-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sub-Type Selection */}
        <label className="block text-sm font-semibold mb-3 text-text-main">
          Sous-type - {mainTypes[dopplerType]}
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {subTypes[dopplerType]?.map((subType) => (
            <button
              key={subType.id}
              onClick={() => handleSubTypeChange(subType.id)}
              className={`p-3 rounded-lg border-2 text-center transition text-sm ${
                dopplerSubType === subType.id
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-border bg-bg-card text-text-main hover:border-blue-500"
              }`}
            >
              {subType.name}
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
              template(s) visible(s) sur {availableFields.length} total
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
            {availableFields.length === 0 && (
              <p className="text-sm text-blue-600 mt-1">
                Créez des templates dans les paramètres ou ajoutez des champs
                personnalisés.
              </p>
            )}
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

        {visibleFields.length === 0 && availableFields.length > 0 && (
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
          {loading ? "Sauvegarde..." : "Sauvegarder Doppler"}
        </button>

        <button
          onClick={() =>
            onQuickAddToInvoice(
              `Doppler ${mainTypes[dopplerType]} - ${
                subTypes[dopplerType]?.find((s) => s.id === dopplerSubType)
                  ?.name
              }`,
              2500
            )
          }
          className="px-5 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 text-sm font-medium transition flex items-center gap-2"
        >
          💰 Ajouter à Facture
        </button>

        <DopplerPDF
          patient={patient}
          consultation={consultation}
          dopplerForm={dopplerForm}
          dopplerType={dopplerType}
          dopplerSubType={dopplerSubType}
          availableFields={availableFields.filter(
            (field) => !hiddenFields[field.key]
          )} // Only pass visible fields to PDF
          boldFields={boldFields}
        />
      </div>
    </div>
  );
};

export default DopplerManager;
