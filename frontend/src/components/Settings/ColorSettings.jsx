import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { toast } from "react-toastify";

const ColorSettings = () => {
  const [colors, setColors] = useState({
    primary: "#1059b9",
    primaryDark: "#0c4a9c",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    bgMain: "#d6f4ff",
    bgHeader: "#ffffff",
    bgSidebar: "#1059b9",
    bgCard: "#ffffff",
    textMain: "#1f2937",
    textSecondary: "#6b7280",
    border: "#e5e7eb",
  });

  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Load saved colors on component mount
  useEffect(() => {
    loadColors();
  }, []);

  const loadColors = async () => {
    try {
      const response = await api.get("/settings/colors");
      if (response.data && Object.keys(response.data).length > 0) {
        setColors(response.data);
        applyColors(response.data);
      }
    } catch (error) {
      console.log("No custom colors found, using defaults");
    }
  };

  const handleColorChange = (key, value) => {
    const newColors = { ...colors, [key]: value };
    setColors(newColors);

    if (previewMode) {
      applyColors(newColors);
    }
  };

  const applyColors = (colorSet) => {
    const root = document.documentElement;

    // Map the color keys to the new CSS variable names
    const variableMapping = {
      primary: "custom-primary",
      primaryDark: "custom-primary-dark",
      success: "custom-success",
      warning: "custom-warning",
      error: "custom-error",
      bgMain: "custom-bg-main",
      bgHeader: "custom-bg-header",
      bgSidebar: "custom-bg-sidebar",
      bgCard: "custom-bg-card",
      textMain: "custom-text-main",
      textSecondary: "custom-text-secondary",
      border: "custom-border",
    };

    Object.entries(colorSet).forEach(([key, value]) => {
      const cssVar = variableMapping[key];
      if (cssVar && value) {
        root.style.setProperty(`--${cssVar}`, value);
        console.log(`Applied --${cssVar}: ${value}`);
      }
    });
  };

  const saveColors = async () => {
    setLoading(true);
    try {
      await api.post("/settings/colors", { colors });
      toast.success("Couleurs sauvegardées avec succès !");

      // Apply colors immediately after saving
      applyColors(colors);
    } catch (error) {
      console.error("Error saving colors:", error);
      toast.error("Erreur lors de la sauvegarde des couleurs");
    } finally {
      setLoading(false);
    }
  };

  const resetToDefault = () => {
    const defaultColors = {
      primary: "#1059b9",
      primaryDark: "#0c4a9c",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      bgMain: "#d6f4ff",
      bgHeader: "#ffffff",
      bgSidebar: "#1059b9",
      bgCard: "#ffffff",
      textMain: "#1f2937",
      textSecondary: "#6b7280",
      border: "#e5e7eb",
    };

    setColors(defaultColors);
    if (previewMode) {
      applyColors(defaultColors);
    }
  };

  const togglePreview = () => {
    if (previewMode) {
      // Reload saved colors when turning off preview
      loadColors();
    }
    setPreviewMode(!previewMode);
  };

  const colorGroups = [
    {
      title: "Couleurs Principales",
      colors: [
        {
          key: "primary",
          label: "Couleur Primaire",
          description: "Boutons, liens, éléments actifs",
        },
        {
          key: "primaryDark",
          label: "Primaire Foncé",
          description: "Boutons au survol, éléments sélectionnés",
        },
      ],
    },
    {
      title: "Couleurs de Statut",
      colors: [
        {
          key: "success",
          label: "Succès",
          description: "Messages de réussite, indicateurs positifs",
        },
        {
          key: "warning",
          label: "Avertissement",
          description: "Alertes, notifications d'attention",
        },
        {
          key: "error",
          label: "Erreur",
          description: "Messages d'erreur, indicateurs négatifs",
        },
      ],
    },
    {
      title: "Arrière-plans",
      colors: [
        {
          key: "bgMain",
          label: "Arrière-plan Principal",
          description: "Fond de l'application",
        },
        {
          key: "bgHeader",
          label: "Arrière-plan En-tête",
          description: "Fond de la barre supérieure",
        },
        {
          key: "bgSidebar",
          label: "Arrière-plan Menu",
          description: "Fond de la barre latérale",
        },
        {
          key: "bgCard",
          label: "Arrière-plan Cartes",
          description: "Fond des cartes et conteneurs",
        },
      ],
    },
    {
      title: "Textes et Bordures",
      colors: [
        {
          key: "textMain",
          label: "Texte Principal",
          description: "Textes principaux, titres",
        },
        {
          key: "textSecondary",
          label: "Texte Secondaire",
          description: "Textes secondaires, labels",
        },
        {
          key: "border",
          label: "Bordure",
          description: "Bordures des éléments",
        },
      ],
    },
  ];

  return (
    <div className="space-y-8 w-full">
      {/* Preview Mode Toggle */}
      <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-main mb-2">
              Mode Aperçu
            </h3>
            <p className="text-text-secondary text-sm">
              Activez l'aperçu pour voir les changements en temps réel sans
              sauvegarder
            </p>
          </div>
          <button
            onClick={togglePreview}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              previewMode
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {previewMode ? "Aperçu Activé" : "Activer Aperçu"}
          </button>
        </div>
      </div>

      {/* Color Picker Groups */}
      {colorGroups.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className="bg-bg-card p-6 rounded-lg border border-border shadow-sm"
        >
          <h3 className="text-xl font-bold mb-6 text-text-main">
            {group.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {group.colors.map((color) => (
              <div key={color.key} className="space-y-3">
                <label className="block text-sm font-semibold text-text-main">
                  {color.label}
                </label>
                <p className="text-xs text-text-secondary mb-2">
                  {color.description}
                </p>
                <div className="flex items-center space-x-4">
                  <input
                    type="color"
                    value={colors[color.key]}
                    onChange={(e) =>
                      handleColorChange(color.key, e.target.value)
                    }
                    className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={colors[color.key]}
                      onChange={(e) =>
                        handleColorChange(color.key, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg bg-bg-card text-text-main font-mono text-sm"
                    />
                    <div className="flex items-center space-x-2 mt-2">
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: colors[color.key] }}
                      ></div>
                      <span className="text-xs text-text-secondary">
                        {colors[color.key]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Preview Section */}
      <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm">
        <h3 className="text-xl font-bold mb-6 text-text-main">
          Aperçu des Composants
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border border-border bg-bg-card">
            <div className="text-sm font-semibold text-text-main mb-2">
              Carte
            </div>
            <div className="space-y-2">
              <div className="h-3 rounded bg-primary"></div>
              <div className="h-2 rounded bg-text-secondary"></div>
              <div className="h-2 rounded bg-text-secondary w-3/4"></div>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-border bg-bg-card">
            <div className="text-sm font-semibold text-text-main mb-2">
              Boutons
            </div>
            <div className="space-y-2">
              <button className="w-full py-2 px-4 bg-primary text-white rounded text-sm">
                Primaire
              </button>
              <button className="w-full py-2 px-4 bg-success text-white rounded text-sm">
                Succès
              </button>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-border bg-bg-card">
            <div className="text-sm font-semibold text-text-main mb-2">
              Statuts
            </div>
            <div className="space-y-2">
              <span className="inline-block px-2 py-1 bg-success text-white rounded text-xs">
                Succès
              </span>
              <span className="inline-block px-2 py-1 bg-warning text-white rounded text-xs">
                Avertissement
              </span>
              <span className="inline-block px-2 py-1 bg-error text-white rounded text-xs">
                Erreur
              </span>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-border bg-bg-card">
            <div className="text-sm font-semibold text-text-main mb-2">
              Texte
            </div>
            <div className="space-y-1">
              <div className="text-text-main font-semibold">
                Texte Principal
              </div>
              <div className="text-text-secondary text-sm">
                Texte Secondaire
              </div>
              <div className="text-primary text-sm">Lien/Actif</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-border">
        <button
          onClick={resetToDefault}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
        >
          Réinitialiser aux valeurs par défaut
        </button>

        <div className="flex space-x-4">
          {previewMode && (
            <button
              onClick={togglePreview}
              className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
            >
              Annuler Aperçu
            </button>
          )}
          <button
            onClick={saveColors}
            disabled={loading}
            className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 transition flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sauvegarde...
              </>
            ) : (
              "Sauvegarder les Couleurs"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorSettings;
