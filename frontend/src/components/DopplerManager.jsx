import React, { useState, useEffect } from "react";
import { SaveIcon, PlusCircleIcon, TrashIcon } from "./Icons";
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
  const [loading, setLoading] = useState(false);

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
      const fields = res.data.map((template) => ({
        key: template.ID,
        label: template.DisplayName || template.TemplateName,
        templateId: template.ID,
        content: template.Content,
      }));

      setAvailableFields(fields);

      // Initialize form with template content for each field ONLY if fields are empty
      const newForm = { ...dopplerForm };
      let hasNewFields = false;

      fields.forEach((field) => {
        if (!newForm[field.key] && field.content && field.content.length > 0) {
          newForm[field.key] = [...field.content];
          hasNewFields = true;
        } else if (!newForm[field.key]) {
          newForm[field.key] = [""];
          hasNewFields = true;
        }
      });

      if (hasNewFields) {
        setDopplerForm(newForm);
        toast.success("Templates chargés automatiquement");
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
      if (field && field.content && field.content.length > 0) {
        setDopplerForm((prev) => ({
          ...prev,
          [fieldKey]: [...field.content],
        }));
        toast.success(`Template "${field.label}" réinitialisé`);
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
      availableFields.forEach((field) => {
        const fieldContent = dopplerForm[field.key] || [""];
        dynamicFieldData[field.label] = prepareField(fieldContent);
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
    const values = dopplerForm[field.key] || [""];

    return (
      <div
        key={field.key}
        className="mb-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
      >
        <div className="flex justify-between items-center mb-4">
          <label className="block text-lg font-bold text-gray-800">
            {field.label}
          </label>
          <button
            onClick={() => resetTemplateData(field.key)}
            className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors"
            title="Réinitialiser à partir du template"
          >
            Reset
          </button>
        </div>

        {values.map((value, idx) => (
          <div key={idx} className="flex items-start gap-2 mb-3">
            <textarea
              value={value}
              onChange={(e) =>
                handleFieldChange(field.key, idx, e.target.value)
              }
              rows={3}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-blue-500"
              placeholder={`Saisir le contenu pour ${field.label}...`}
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
                <button
                  type="button"
                  onClick={() => removeFieldLine(field.key, idx)}
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
        <p className="text-sm text-blue-800">
          <strong>Champs disponibles:</strong> {availableFields.length}{" "}
          template(s) trouvé(s) pour {mainTypes[dopplerType]} -{" "}
          {subTypes[dopplerType]?.find((s) => s.id === dopplerSubType)?.name}
        </p>
        {availableFields.length === 0 && (
          <p className="text-sm text-blue-600 mt-1">
            Créez des templates dans les paramètres pour voir les champs ici.
          </p>
        )}
      </div>

      {/* Dynamic Fields */}
      <div className="space-y-6">
        {availableFields.map((field) => renderField(field))}
      </div>

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
          availableFields={availableFields}
        />
      </div>
    </div>
  );
};

export default DopplerManager;
