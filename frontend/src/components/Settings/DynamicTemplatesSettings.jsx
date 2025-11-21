import React, { useState, useEffect } from "react";
import {
  Save,
  Plus,
  Trash2,
  Edit3,
  X,
  Check,
  Loader2,
  FileText,
} from "lucide-react";
import api from "../../utils/api";
import { toast } from "react-toastify";

const DynamicTemplatesSettings = () => {
  const [mainTypes] = useState(["MI", "MS", "Porte", "Renal", "TSA"]);
  const [activeMainType, setActiveMainType] = useState("MI");
  const [activeSubType, setActiveSubType] = useState("normal");
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [newTemplate, setNewTemplate] = useState({
    TemplateName: "",
    DisplayName: "",
    Content: [""],
  });
  const [loading, setLoading] = useState(false);

  // Labels & colors
  const mainTypeLabels = {
    MI: { label: "Membres Inférieurs", color: "blue" },
    MS: { label: "Membres Supérieurs", color: "emerald" },
    Porte: { label: "Système Porte", color: "purple" },
    Renal: { label: "Artères Rénales", color: "orange" },
    TSA: { label: "Troncs Supra-Aortiques", color: "pink" },
  };

  const colorClasses = {
    blue: "bg-blue-500 hover:bg-blue-600 text-white",
    emerald: "bg-emerald-500 hover:bg-emerald-600 text-white",
    purple: "bg-purple-500 hover:bg-purple-600 text-white",
    orange: "bg-orange-500 hover:bg-orange-600 text-white",
    pink: "bg-pink-500 hover:bg-pink-600 text-white",
  };

  // Sub-types
  const subTypes = {
    MI: [
      { id: "normal", name: "Doppler Normal" },
      { id: "pathological", name: "Pathologique" },
      { id: "pathological2", name: "Pathologique 2" },
      { id: "MIAVNORM", name: "MI + VV Normal" },
      { id: "VMIControl", name: "Contrôle VMI" },
      { id: "VMINormal", name: "VMI Normal" },
      { id: "VMINormal2", name: "VMI Normal 2" },
      { id: "VMIPath", name: "VMI Pathologique" },
      { id: "VMISuperf", name: "VMI Superficiel" },
    ],
    MS: [
      { id: "AMSnormal", name: "Normal" },
      { id: "AMSnormal2", name: "Normal 2" },
      { id: "AMSPatho", name: "Pathologique" },
      { id: "VMSNormal", name: "VMS Normal" },
      { id: "VMSPatho", name: "VMS Pathologique" },
      { id: "VMSPatho2", name: "VMS Pathologique 2" },
      { id: "VMSoedem", name: "Œdème par compression" },
    ],
    Porte: [
      { id: "path1", name: "Pathologique 1" },
      { id: "path2", name: "Pathologique 2" },
      { id: "path3", name: "Pathologique 3" },
      { id: "path4", name: "Pathologique 4" },
      { id: "path5", name: "Pathologique 5" },
    ],
    Renal: [
      { id: "normal", name: "Normales" },
      { id: "path", name: "Pathologiques" },
      { id: "confectionFavNorm", name: "Confection FAV Normale" },
      { id: "confectionFavPath", name: "Confection FAV Pathologique" },
      { id: "evaluationFavBrachioBasilic", name: "Éval. FAV Brachio-Basilic" },
      { id: "evalutionFavBrachioCephal", name: "Éval. FAV Brachio-Céphalique" },
      { id: "transplantationRenal", name: "Transplantation Rénale" },
      { id: "vrnormal", name: "VR Normal" },
    ],
    TSA: [
      { id: "normal", name: "Normal" },
      { id: "aborddialyse", name: "Abord Dialyse" },
      { id: "chambreconfection", name: "Chambre Implantable" },
      { id: "chambrethrombosse", name: "Chambre Thrombosée" },
      { id: "tsaplaque", name: "Plaque TSA" },
      { id: "vcervical", name: "Veine Cervicale" },
    ],
  };

  const parseContent = (content) => {
    if (!content) return [""];
    if (Array.isArray(content)) return content.filter(Boolean);
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [String(parsed)];
    } catch {
      return content
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
    }
  };

  useEffect(() => {
    loadTemplates(activeMainType, activeSubType);
  }, [activeMainType, activeSubType]);

  const loadTemplates = async (mainType, subType) => {
    setLoading(true);
    try {
      const res = await api.get(
        `/dynamic-templates/templates?category=${mainType}&subType=${subType}`
      );
      setTemplates(
        res.data.map((t) => ({ ...t, Content: parseContent(t.Content) }))
      );
    } catch {
      toast.error("Erreur chargement des templates");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.TemplateName.trim() || !newTemplate.DisplayName.trim()) {
      toast.error("Nom technique et affiché requis");
      return;
    }
    try {
      await api.post("/dynamic-templates/templates", {
        Category: activeMainType,
        SubType: activeSubType,
        TemplateName: newTemplate.TemplateName.trim(),
        DisplayName: newTemplate.DisplayName.trim(),
        Content: JSON.stringify(newTemplate.Content.filter((l) => l.trim())),
        DisplayOrder: templates.length,
      });
      toast.success("Template créé !");
      setNewTemplate({ TemplateName: "", DisplayName: "", Content: [""] });
      loadTemplates(activeMainType, activeSubType);
    } catch {
      toast.error("Erreur création");
    }
  };

  const handleUpdate = async () => {
    const clean = editingTemplate.Content.filter((l) => l.trim());
    try {
      await api.put(`/dynamic-templates/templates/${editingTemplate.ID}`, {
        DisplayName: editingTemplate.DisplayName.trim(),
        Content: JSON.stringify(clean),
        SubType: activeSubType,
      });
      toast.success("Template mis à jour !");
      setEditingTemplate(null);
      loadTemplates(activeMainType, activeSubType);
    } catch {
      toast.error("Erreur mise à jour");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce template définitivement ?")) return;
    try {
      await api.delete(`/dynamic-templates/templates/${id}`);
      toast.success("Template supprimé");
      loadTemplates(activeMainType, activeSubType);
    } catch {
      toast.error("Erreur suppression");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Gestion des Templates Doppler
          </h1>
          <p className="text-lg text-gray-600">
            Créer et modifier vos conclusions types
          </p>
        </div>

        {/* Main Type Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Catégorie d'examen
          </h2>
          <div className="flex flex-wrap gap-4">
            {mainTypes.map((type) => {
              const { label, color } = mainTypeLabels[type];
              const isActive = activeMainType === type;
              return (
                <button
                  key={type}
                  onClick={() => {
                    setActiveMainType(type);
                    setActiveSubType(subTypes[type][0]?.id || "normal");
                  }}
                  className={`px-8 py-5 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                    isActive
                      ? `${colorClasses[color]} shadow-2xl scale-105`
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* SubType Pills */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-10">
          <h3 className="text-xl font-semibold text-gray-800 mb-5">
            {mainTypeLabels[activeMainType].label}
          </h3>
          <div className="flex flex-wrap gap-3">
            {subTypes[activeMainType].map((sub) => (
              <button
                key={sub.id}
                onClick={() => setActiveSubType(sub.id)}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  activeSubType === sub.id
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </div>

        {/* Create New Template */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-xl p-8 mb-12 border border-indigo-100">
          <div className="flex items-center gap-3 mb-6">
            <Plus className="w-8 h-8 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-800">
              Nouveau template •{" "}
              {
                subTypes[activeMainType].find((s) => s.id === activeSubType)
                  ?.name
              }
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <input
              type="text"
              placeholder="Nom technique (ex: MI_NORMAL)"
              value={newTemplate.TemplateName}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, TemplateName: e.target.value })
              }
              className="px-6 py-4 rounded-xl border border-gray-300 focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 text-lg"
            />
            <input
              type="text"
              placeholder="Nom affiché dans la liste"
              value={newTemplate.DisplayName}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, DisplayName: e.target.value })
              }
              className="px-6 py-4 rounded-xl border border-gray-300 focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 text-lg"
            />
          </div>

          <div className="space-y-5 mb-6">
            {newTemplate.Content.map((line, i) => (
              <div key={i} className="flex gap-4">
                <textarea
                  rows={6}
                  value={line}
                  onChange={(e) => {
                    const updated = [...newTemplate.Content];
                    updated[i] = e.target.value;
                    setNewTemplate({ ...newTemplate, Content: updated });
                  }}
                  placeholder={`Paragraphe ${i + 1}...`}
                  className="flex-1 px-6 py-4 rounded-xl border border-gray-300 focus:ring-4 focus:ring-indigo-200 resize-none text-base font-medium"
                />
                {i > 0 && (
                  <button
                    onClick={() =>
                      setNewTemplate({
                        ...newTemplate,
                        Content: newTemplate.Content.filter(
                          (_, idx) => idx !== i
                        ),
                      })
                    }
                    className="p-4 text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() =>
                setNewTemplate({
                  ...newTemplate,
                  Content: [...newTemplate.Content, ""],
                })
              }
              className="flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-800"
            >
              <Plus className="w-5 h-5" /> Ajouter un paragraphe
            </button>
          </div>

          <button
            onClick={handleCreateTemplate}
            className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-xl flex items-center gap-3"
          >
            <Check className="w-7 h-7" /> Créer le Template
          </button>
        </div>

        {/* Existing Templates - ONE PER LINE */}
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-4">
            <FileText className="w-10 h-10 text-indigo-600" />
            Templates existants
          </h2>

          {loading ? (
            <div className="flex flex-col items-center py-24">
              <Loader2 className="w-14 h-14 animate-spin text-indigo-600" />
              <p className="mt-4 text-lg text-gray-600">Chargement...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-24 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
              <p className="text-2xl text-gray-500">
                Aucun template pour le moment
              </p>
              <p className="text-gray-400 mt-3">Créez le premier en haut</p>
            </div>
          ) : (
            <div className="space-y-10">
              {templates.map((template) => (
                <div
                  key={template.ID}
                  className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  {editingTemplate?.ID === template.ID ? (
                    /* EDIT MODE */
                    <div className="p-10 space-y-8 bg-gradient-to-b from-indigo-50 to-white">
                      <input
                        type="text"
                        value={editingTemplate.DisplayName}
                        onChange={(e) =>
                          setEditingTemplate({
                            ...editingTemplate,
                            DisplayName: e.target.value,
                          })
                        }
                        className="text-3xl font-bold w-full px-6 py-5 rounded-xl border-2 border-indigo-300 focus:ring-4 focus:ring-indigo-200"
                        placeholder="Nom affiché"
                      />

                      <div className="space-y-6">
                        {editingTemplate.Content.map((line, i) => (
                          <div key={i} className="flex gap-5 items-start">
                            <textarea
                              rows={10}
                              value={line}
                              onChange={(e) => {
                                const updated = [...editingTemplate.Content];
                                updated[i] = e.target.value;
                                setEditingTemplate({
                                  ...editingTemplate,
                                  Content: updated,
                                });
                              }}
                              className="flex-1 px-6 py-5 rounded-xl border border-gray-300 focus:ring-4 focus:ring-indigo-200 resize-none text-base font-medium leading-relaxed"
                              style={{ fontSize: "15px" }}
                            />
                            <button
                              onClick={() =>
                                setEditingTemplate({
                                  ...editingTemplate,
                                  Content: editingTemplate.Content.filter(
                                    (_, idx) => idx !== i
                                  ),
                                })
                              }
                              className="mt-3 p-4 text-red-600 hover:bg-red-50 rounded-xl"
                            >
                              <Trash2 className="w-7 h-7" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            setEditingTemplate({
                              ...editingTemplate,
                              Content: [...editingTemplate.Content, ""],
                            })
                          }
                          className="flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800"
                        >
                          <Plus className="w-6 h-6" /> Ajouter un paragraphe
                        </button>
                      </div>

                      <div className="flex gap-6 pt-6">
                        <button
                          onClick={handleUpdate}
                          className="flex-1 py-5 bg-green-600 text-white rounded-xl font-bold text-xl hover:bg-green-700 flex items-center justify-center gap-4"
                        >
                          <Save className="w-7 h-7" /> Sauvegarder
                        </button>
                        <button
                          onClick={() => setEditingTemplate(null)}
                          className="px-12 py-5 bg-gray-600 text-white rounded-xl font-bold text-xl hover:bg-gray-700 flex items-center gap-3"
                        >
                          <X className="w-7 h-7" /> Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* VIEW MODE */
                    <div className="p-10">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <h3 className="text-3xl font-bold text-gray-900">
                            {template.DisplayName}
                          </h3>
                          <code className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg mt-3 inline-block">
                            {template.TemplateName}
                          </code>
                        </div>
                        <div className="flex gap-4">
                          <button
                            onClick={() =>
                              setEditingTemplate({
                                ...template,
                                Content: parseContent(template.Content),
                              })
                            }
                            className="p-5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg"
                          >
                            <Edit3 className="w-6 h-6" />
                          </button>
                          <button
                            onClick={() => handleDelete(template.ID)}
                            className="p-5 bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-lg"
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-8 text-gray-700 leading-relaxed space-y-5 text-base font-medium">
                        {parseContent(template.Content).map((line, i) => (
                          <p key={i} className="min-h-6">
                            {line || "\u00A0"}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicTemplatesSettings;
