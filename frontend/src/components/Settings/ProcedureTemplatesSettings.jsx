import React, { useState, useEffect } from "react";
import { SaveIcon, PlusIcon, TrashIcon } from "../Icons";
import api from "../../utils/api";
import { toast } from "react-toastify";

const ProcedureTemplatesSettings = () => {
  const [templates, setTemplates] = useState({});
  const [activeProcedure, setActiveProcedure] = useState("echographie");
  const [activeEchoType, setActiveEchoType] = useState("normal");
  const [activeThyroideType, setActiveThyroideType] = useState("avec_schema");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});

  const procedureTypes = [
    { id: "echographie", name: "Échographie", icon: "📡" },
    { id: "thyroide", name: "Thyroïde", icon: "🦋" },
    { id: "ecg", name: "ECG", icon: "❤️" },
  ];

  const echoTypes = [
    {
      id: "normal",
      name: "Normal",
      sections: [
        "Foie",
        "Vésicule_biliaire",
        "Voies_biliaires",
        "TP_VCI_VSH",
        "Rein_droite",
        "Rein_gauche",
        "Pancreas",
        "Rate",
        "Vessie",
        "Prostate",
        "Utérus",
        "Ovaire_droit",
        "Ovaire_gauche",
        "Anses_intestinales",
        "Adénopathies",
        "Ascite",
        "Conclusion",
        "CAT",
      ],
    },
    {
      id: "lithiase",
      name: "Lithiase",
      sections: [
        "Aérocolie_diffuse",
        "Rein_droite",
        "Rein_gauche",
        "Lithiase_Rein_gauche",
        "Lithiase_Rein_droite",
        "Vessie",
        "Prostate",
        "Utérus",
        "Foie",
        "Rate",
        "Pancreas",
        "Conclusion_Lithiase",
        "Conclusion",
        "CAT",
      ],
    },
    { id: "all", name: "Tous les champs", sections: ["all"] },
  ];

  const thyroideTypes = [
    {
      id: "avec_schema",
      name: "Avec Schéma",
      sections: ["Indication", "Technique", "Resultats", "Conclusion", "CAT"],
    },
    {
      id: "sans_schema",
      name: "Sans Schéma",
      sections: ["Technique", "Resultats", "Conclusion", "CAT"],
    },
    {
      id: "thyroidectomie",
      name: "Thyroïdectomie",
      sections: ["Technique", "Resultats", "Conclusion", "CAT"],
    },
    {
      id: "thyroidite",
      name: "Thyroïdite",
      sections: ["Technique", "Resultats", "Conclusion", "CAT"],
    },
  ];

  // ECG has static fields - no subtypes needed
  const ecgSections = ["Examen", "Electrocardiogramme", "Conclusion"];

  // Load templates when procedure type or subtype changes
  useEffect(() => {
    loadTemplates();
  }, [activeProcedure, activeEchoType, activeThyroideType]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      let url = `/procedure-templates?procedureType=${activeProcedure}`;

      // Add subtype based on active procedure
      if (activeProcedure === "echographie") {
        url += `&subType=${activeEchoType}`;
      } else if (activeProcedure === "thyroide") {
        url += `&subType=${activeThyroideType}`;
      }
      // ECG doesn't need subtype

      const res = await api.get(url);
      const templatesBySection = {};

      res.data.forEach((template) => {
        try {
          templatesBySection[template.SectionName] = {
            id: template.ID,
            lines: JSON.parse(template.DefaultLines),
            subType: template.SubType,
          };
        } catch (e) {
          templatesBySection[template.SectionName] = {
            id: template.ID,
            lines: [template.DefaultLines],
            subType: template.SubType,
          };
        }
      });

      setTemplates(templatesBySection);
    } catch (err) {
      console.error("Error loading templates:", err);
      toast.error("Erreur lors du chargement des templates");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLine = (sectionName) => {
    setTemplates((prev) => ({
      ...prev,
      [sectionName]: {
        ...prev[sectionName],
        lines: [...(prev[sectionName]?.lines || []), ""],
      },
    }));
  };

  const handleRemoveLine = (sectionName, index) => {
    setTemplates((prev) => ({
      ...prev,
      [sectionName]: {
        ...prev[sectionName],
        lines: prev[sectionName].lines.filter((_, i) => i !== index),
      },
    }));
  };

  const handleLineChange = (sectionName, index, value) => {
    setTemplates((prev) => ({
      ...prev,
      [sectionName]: {
        ...prev[sectionName],
        lines: prev[sectionName].lines.map((line, i) =>
          i === index ? value : line
        ),
      },
    }));
  };

  const handleSaveSection = async (sectionName) => {
    setSaving((prev) => ({ ...prev, [sectionName]: true }));

    try {
      const templateData = templates[sectionName];

      // Determine subtype based on active procedure
      let currentSubType;
      if (activeProcedure === "echographie") {
        currentSubType = activeEchoType;
      } else if (activeProcedure === "thyroide") {
        currentSubType = activeThyroideType;
      } else {
        currentSubType = "standard"; // ECG uses "standard" subtype
      }

      // For ECG, we need to ensure we're not sending empty lines
      const linesToSave = templateData.lines || [""];

      if (templateData.id) {
        // Update existing template
        await api.put(`/procedure-templates/${templateData.id}`, {
          DefaultLines: linesToSave,
          SubType: currentSubType,
        });
      } else {
        // Create new template
        await api.post("/procedure-templates", {
          ProcedureType: activeProcedure,
          SubType: currentSubType,
          SectionName: sectionName,
          DefaultLines: linesToSave,
        });
      }

      toast.success(`Section "${sectionName}" sauvegardée`);
      loadTemplates(); // Reload to get updated IDs
    } catch (err) {
      console.error("Error saving template:", err);
      console.error("Error details:", err.response?.data);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving((prev) => ({ ...prev, [sectionName]: false }));
    }
  };

  const getSectionLabels = () => {
    if (activeProcedure === "echographie") {
      return getEchographieSections();
    } else if (activeProcedure === "thyroide") {
      return getThyroideSections();
    } else if (activeProcedure === "ecg") {
      return getECGSections();
    }
    return [];
  };

  const getEchographieSections = () => {
    const allSections = {
      Foie: "Foie",
      Vésicule_biliaire: "Vésicule Biliaire",
      Voies_biliaires: "Voies Biliaires",
      Rate: "Rate",
      Pancreas: "Pancréas",
      Vessie: "Vessie",
      Conclusion: "Conclusion",
      CAT: "CAT (Conduite à tenir)",
      TP_VCI_VSH: "TP, VCI et VSH",
      Rein_droite: "Rein Droit",
      Rein_gauche: "Rein Gauche",
      Prostate: "Prostate",
      Utérus: "Utérus",
      Ovaire_droit: "Ovaire Droit",
      Ovaire_gauche: "Ovaire Gauche",
      Aérocolie_diffuse: "Aérocolie diffuse+++",
      Lithiase_Rein_gauche: "Lithiase Rein Gauche",
      Lithiase_Rein_droite: "Lithiase Rein Droit",
      Conclusion_Lithiase: "Conclusion Lithiase",
      Anses_intestinales: "Anses Intestinales",
      Adénopathies: "Adénopathies",
      Ascite: "Ascite",
    };

    const currentType = echoTypes.find((t) => t.id === activeEchoType);
    const filteredSections = currentType
      ? currentType.sections
      : Object.keys(allSections);

    return filteredSections.map((section) => ({
      key: section,
      label: allSections[section] || section,
    }));
  };

  const getThyroideSections = () => {
    const allSections = {
      Indication: "Indication",
      Technique: "Technique",
      Resultats: "Résultats",
      Conclusion: "Conclusion",
      CAT: "CAT (Conduite à tenir)",
    };

    const currentType = thyroideTypes.find((t) => t.id === activeThyroideType);
    const filteredSections = currentType
      ? currentType.sections
      : Object.keys(allSections);

    return filteredSections.map((section) => ({
      key: section,
      label: allSections[section] || section,
    }));
  };

  const getECGSections = () => {
    const allSections = {
      Examen: "Examen",
      Electrocardiogramme: "Electrocardiogramme",
      Conclusion: "Conclusion",
    };

    return ecgSections.map((section) => ({
      key: section,
      label: allSections[section] || section,
    }));
  };

  const getSectionDescription = (sectionKey) => {
    const descriptions = {
      // Echographie descriptions
      Foie: "Description de la taille, contours et échostructure du foie",
      Vésicule_biliaire:
        "État de la vésicule biliaire (paroi, contenu, lithiase)",
      Voies_biliaires:
        "Voie biliaire principale et voies biliaires intra-hépatiques",
      TP_VCI_VSH: "Tronc porte, veine cave inférieure et veines sus-hépatiques",
      Rein_droite: "Description du rein droit",
      Rein_gauche: "Description du rein gauche",
      Pancreas: "Pancréas (taille, échostructure, visualisation)",
      Rate: "Rate (taille et échostructure)",
      Vessie: "Vessie (réplétion, paroi, contenu)",
      Prostate:
        "Prostate (taille, volume, contours, échostructure) - Homme uniquement",
      Utérus:
        "Utérus (taille, contours, échostructure, ligne de vacuité) - Femme uniquement",
      Ovaire_droit: "Ovaire droit (taille, échostructure) - Femme uniquement",
      Ovaire_gauche: "Ovaire gauche (taille, échostructure) - Femme uniquement",
      Aérocolie_diffuse: "Présence d'aérocolie diffuse - Lithiase uniquement",
      Lithiase_Rein_gauche: "Lithiase du rein gauche - Lithiase uniquement",
      Lithiase_Rein_droite: "Lithiase du rein droit - Lithiase uniquement",
      Anses_intestinales: "État des anses intestinales",
      Adénopathies: "Présence d'adénopathies",
      Ascite: "Présence d'ascite",
      Conclusion: "Conclusion générale de l'échographie",
      Conclusion_Lithiase: "Conclusion spécifique pour les cas de lithiase",
      CAT: "Conduite à tenir (surveillance, contrôle, etc.)",

      // Thyroïde descriptions
      Indication: "Motif de consultation et indication de l'examen",
      Technique: "Description de la technique utilisée et de la sonde",
      Resultats: "Résultats détaillés de l'examen thyroïdien",
      ConclusionThyroide: "Conclusion et synthèse de l'examen",
      CATThyroide: "Conduite à tenir recommandée",

      // ECG descriptions
      Examen: "Informations générales sur l'examen ECG",
      Electrocardiogramme: "Résultats détaillés de l'électrocardiogramme",
      ConclusionECG: "Conclusion et interprétation de l'ECG",
    };

    return descriptions[sectionKey] || "Section de procédure médicale";
  };

  const renderProcedureTypeSelector = () => {
    if (activeProcedure === "echographie") {
      return (
        <div className="border-t border-border pt-6">
          <h4 className="text-lg font-semibold mb-4 text-text-main">
            Type d'Échographie
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {echoTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveEchoType(type.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  activeEchoType === type.id
                    ? "border-blue-500 bg-blue-500/10 text-blue-600"
                    : "border-border bg-bg-card text-text-main hover:bg-secondary"
                }`}
              >
                <div className="font-semibold">{type.name}</div>
              </button>
            ))}
          </div>
        </div>
      );
    } else if (activeProcedure === "thyroide") {
      return (
        <div className="border-t border-border pt-6">
          <h4 className="text-lg font-semibold mb-4 text-text-main">
            Type d'Échographie Thyroïdienne
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {thyroideTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveThyroideType(type.id)}
                className={`p-3 rounded-lg border-2 text-center transition-all min-h-[80px] flex items-center justify-center ${
                  activeThyroideType === type.id
                    ? "border-purple-500 bg-purple-500/10 text-purple-600"
                    : "border-border bg-bg-card text-text-main hover:bg-secondary"
                }`}
              >
                <div className="font-semibold text-sm leading-tight px-1">
                  {type.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }
    // ECG doesn't need subtype selector
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3 text-text-main">Chargement des templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Procedure Type Selection */}
      <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm">
        <h3 className="text-xl font-bold mb-6 text-text-main">
          Modèles des Procédures Médicales
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {procedureTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveProcedure(type.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeProcedure === type.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-bg-card text-text-main hover:bg-secondary"
              }`}
            >
              <div className="text-2xl mb-2">{type.icon}</div>
              <div className="font-semibold">{type.name}</div>
            </button>
          ))}
        </div>

        {renderProcedureTypeSelector()}
      </div>

      {/* Templates Editor */}
      <div className="space-y-6">
        {getSectionLabels().map(({ key, label }) => (
          <div
            key={key}
            className="bg-bg-card p-6 rounded-lg border border-border shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-bold text-text-main">{label}</h4>
                <p className="text-sm text-text-secondary mt-1">
                  {getSectionDescription(key)}
                </p>
                <p className="text-xs text-text-tertiary mt-1">
                  Type:{" "}
                  {activeProcedure === "echographie"
                    ? echoTypes.find((t) => t.id === activeEchoType)?.name
                    : activeProcedure === "thyroide"
                    ? thyroideTypes.find((t) => t.id === activeThyroideType)
                        ?.name
                    : "ECG Standard"}
                </p>
              </div>
              <button
                onClick={() => handleSaveSection(key)}
                disabled={saving[key]}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 transition"
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                {saving[key] ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>

            <div className="space-y-3">
              {(templates[key]?.lines || []).map((line, index) => (
                <div key={index} className="flex items-center gap-3">
                  <textarea
                    value={line}
                    onChange={(e) =>
                      handleLineChange(key, index, e.target.value)
                    }
                    rows={3}
                    className="flex-1 px-4 py-3 border border-border rounded-lg bg-bg-card text-text-main focus:ring-2 focus:ring-primary resize-y"
                    placeholder={`Contenu du template ${index + 1}...`}
                  />
                  <button
                    onClick={() => handleRemoveLine(key, index)}
                    className="p-2 text-red-500 hover:text-red-700 transition"
                    title="Supprimer cette ligne"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>

            {(!templates[key] || templates[key].lines.length === 0) && (
              <div className="text-center py-4 text-text-secondary border-2 border-dashed border-border rounded-lg">
                Aucun template défini pour cette section
              </div>
            )}

            <button
              onClick={() => handleAddLine(key)}
              className="mt-4 flex items-center px-4 py-2 bg-secondary text-text-main rounded-lg hover:bg-secondary-dark transition"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Ajouter un template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcedureTemplatesSettings;
