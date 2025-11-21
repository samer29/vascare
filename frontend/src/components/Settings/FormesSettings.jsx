import React, { useState, useEffect } from "react";
import {
  PlusCircleIcon,
  SaveIcon,
  SearchIcon,
} from "../Icons";
import { InfoIcon } from "../icons/InfoIcon";
import { EditIcon } from "../icons/EditIcon";
import { XIcon } from "../icons/XIcon";
import api from "../../utils/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FormesSettings = () => {
  const [formes, setFormes] = useState([]);
  const [filteredFormes, setFilteredFormes] = useState([]);
  const [details, setDetails] = useState([]);
  const [filteredDetails, setFilteredDetails] = useState([]);
  const [newForme, setNewForme] = useState("");
  const [selectedForme, setSelectedForme] = useState("");
  const [newDetail, setNewDetail] = useState("");
  const [editingFormeId, setEditingFormeId] = useState(null);
  const [editingDetailId, setEditingDetailId] = useState(null);
  const [editFormeName, setEditFormeName] = useState("");
  const [editDetailName, setEditDetailName] = useState("");
  const [searchFormeTerm, setSearchFormeTerm] = useState("");
  const [searchDetailTerm, setSearchDetailTerm] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    loadFormes();
  }, []);

  useEffect(() => {
    if (selectedForme) {
      loadDetails(selectedForme);
    }
  }, [selectedForme]);

  useEffect(() => {
    // Filter formes based on search term
    if (searchFormeTerm) {
      const filtered = formes.filter((forme) =>
        forme.NomForme.toLowerCase().includes(searchFormeTerm.toLowerCase())
      );
      setFilteredFormes(filtered);
    } else {
      setFilteredFormes(formes);
    }
  }, [searchFormeTerm, formes]);

  useEffect(() => {
    // Filter details based on search term
    if (searchDetailTerm) {
      const filtered = details.filter((detail) =>
        detail.NomDetail.toLowerCase().includes(searchDetailTerm.toLowerCase())
      );
      setFilteredDetails(filtered);
    } else {
      setFilteredDetails(details);
    }
  }, [searchDetailTerm, details]);

  const loadFormes = async () => {
    try {
      const res = await api.get("/formes");
      setFormes(res.data || []);
      setFilteredFormes(res.data || []);
    } catch (err) {
      console.error("Erreur chargement formes:", err);
      toast.error("Erreur lors du chargement des formes");
    }
  };

  const loadDetails = async (formeId) => {
    try {
      const res = await api.get(`/details?formeId=${formeId}`);
      setDetails(res.data || []);
      setFilteredDetails(res.data || []);
    } catch (err) {
      console.error("Erreur chargement détails:", err);
      toast.error("Erreur lors du chargement des détails");
    }
  };

  const handleAddForme = async () => {
    if (!newForme.trim()) {
      toast.error("Veuillez saisir un nom pour la forme");
      return;
    }

    try {
      await api.post("/formes", { NomForme: newForme.trim() });
      setNewForme("");
      toast.success("Forme ajoutée avec succès");
      await loadFormes();
    } catch (err) {
      console.error("Erreur ajout forme:", err);
      toast.error("Erreur lors de l'ajout de la forme");
    }
  };

  const handleAddDetail = async () => {
    if (!newDetail.trim()) {
      toast.error("Veuillez saisir un nom pour le détail");
      return;
    }
    if (!selectedForme) {
      toast.error("Veuillez sélectionner une forme");
      return;
    }

    try {
      await api.post("/details", {
        NomDetail: newDetail.trim(),
        IDForme: selectedForme,
      });
      setNewDetail("");
      toast.success("Détail ajouté avec succès");
      await loadDetails(selectedForme);
    } catch (err) {
      console.error("Erreur ajout détail:", err);
      console.error("Détails de l'erreur:", err.response?.data);
      toast.error("Erreur lors de l'ajout du détail");
    }
  };

  const handleDeleteForme = async (id) => {
    if (!window.confirm("Supprimer cette forme et tous ses détails ?")) return;

    try {
      await api.delete(`/formes/${id}`);
      toast.success("Forme supprimée avec succès");
      await loadFormes();
      setSelectedForme("");
    } catch (err) {
      console.error("Erreur suppression forme:", err);
      toast.error("Erreur lors de la suppression de la forme");
    }
  };

  const handleDeleteDetail = async (id) => {
    if (!window.confirm("Supprimer ce détail ?")) return;

    try {
      await api.delete(`/details/${id}`);
      toast.success("Détail supprimé avec succès");
      await loadDetails(selectedForme);
    } catch (err) {
      console.error("Erreur suppression détail:", err);
      toast.error("Erreur lors de la suppression du détail");
    }
  };

  const startEditingForme = (forme) => {
    setEditingFormeId(forme.ID);
    setEditFormeName(forme.NomForme);
  };

  const startEditingDetail = (detail) => {
    setEditingDetailId(detail.ID);
    setEditDetailName(detail.NomDetail);
  };

  const cancelEditing = () => {
    setEditingFormeId(null);
    setEditingDetailId(null);
    setEditFormeName("");
    setEditDetailName("");
  };

  const handleUpdateForme = async (formeId) => {
    if (!editFormeName.trim()) {
      toast.error("Le nom de la forme ne peut pas être vide");
      return;
    }

    try {
      await api.put(`/formes/${formeId}`, { NomForme: editFormeName.trim() });
      toast.success("Forme modifiée avec succès");
      cancelEditing();
      await loadFormes();
    } catch (err) {
      console.error("Erreur modification forme:", err);
      toast.error("Erreur lors de la modification de la forme");
    }
  };

  const handleUpdateDetail = async (detailId) => {
    if (!editDetailName.trim()) {
      toast.error("Le nom du détail ne peut pas être vide");
      return;
    }

    try {
      await api.put(`/details/${detailId}`, {
        NomDetail: editDetailName.trim(),
      });
      toast.success("Détail modifié avec succès");
      cancelEditing();
      await loadDetails(selectedForme);
    } catch (err) {
      console.error("Erreur modification détail:", err);
      toast.error("Erreur lors de la modification du détail");
    }
  };

  const handleKeyPress = (e, action, id = null) => {
    if (e.key === "Enter") {
      if (action === "addForme") {
        handleAddForme();
      } else if (action === "addDetail") {
        handleAddDetail();
      } else if (action === "editForme" && id) {
        handleUpdateForme(id);
      } else if (action === "editDetail" && id) {
        handleUpdateDetail(id);
      }
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  const selectedFormeData = formes.find((f) => f.ID === selectedForme);

  return (
    <div className="space-y-8">
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header with Tooltip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-text-main">
            Gestion des Formes et Détails
          </h3>
          <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <InfoIcon className="h-5 w-5 text-blue-500 cursor-help" />
            {showTooltip && (
              <div className="absolute left-6 top-0 w-64 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-10">
                💡 <strong>Fonctionnalités :</strong>
                <br />
                • Gérer les formes galéniques
                <br />
                • Ajouter des détails (dosages, etc.)
                <br />
                • Recherche et édition en ligne
                <br />• Organisation hiérarchique
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-text-secondary">
          {formes.length} forme(s)
        </div>
      </div>

      {/* Search Bar for Formes */}
      <div className="bg-bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchFormeTerm}
            onChange={(e) => setSearchFormeTerm(e.target.value)}
            placeholder="Rechercher une forme galénique..."
            className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
          />
          {searchFormeTerm && (
            <button
              onClick={() => setSearchFormeTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <XIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        {searchFormeTerm && (
          <p className="text-sm text-text-secondary mt-2">
            {filteredFormes.length} résultat(s) trouvé(s) pour "
            {searchFormeTerm}"
          </p>
        )}
      </div>

      {/* Gestion des formes */}
      <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm">
        <h4 className="text-lg font-semibold mb-4 text-text-main">
          Formes Galéniques
        </h4>

        <div className="flex gap-4 items-end mb-6">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2 text-text-main">
              Nouvelle forme
            </label>
            <input
              type="text"
              value={newForme}
              onChange={(e) => setNewForme(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, "addForme")}
              placeholder="Ex: Comprimé, Gélule, Sirop..."
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
            />
          </div>
          <button
            onClick={handleAddForme}
            disabled={!newForme.trim()}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 flex items-center transition"
          >
            <PlusCircleIcon className="h-4 w-4 mr-2" />
            Ajouter
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFormes.map((forme) => (
            <div
              key={forme.ID}
              className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition ${
                selectedForme === forme.ID
                  ? "bg-primary text-white"
                  : "bg-secondary text-text-main hover:bg-secondary-dark"
              }`}
              onClick={() => {
                setSelectedForme(forme.ID);
                setSearchDetailTerm(""); // Reset detail search when selecting new forme
              }}
            >
              {editingFormeId === forme.ID ? (
                // Edit Forme Mode
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={editFormeName}
                    onChange={(e) => setEditFormeName(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, "editForme", forme.ID)}
                    onKeyDown={(e) => e.key === "Escape" && cancelEditing()}
                    className="flex-1 px-3 py-1 border border-border rounded focus:ring-1 focus:ring-primary bg-bg-card text-text-main text-sm"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateForme(forme.ID);
                      }}
                      className="p-1 text-green-600 hover:text-green-800 transition"
                      title="Sauvegarder"
                    >
                      <SaveIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelEditing();
                      }}
                      className="p-1 text-gray-600 hover:text-gray-800 transition"
                      title="Annuler"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                // View Forme Mode
                <>
                  <div className="flex-1">
                    <div className="font-medium">{forme.NomForme}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingForme(forme);
                      }}
                      className={`p-1 transition ${
                        selectedForme === forme.ID
                          ? "text-white hover:text-gray-200"
                          : "text-blue-600 hover:text-blue-800"
                      }`}
                      title="Modifier la forme"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteForme(forme.ID);
                      }}
                      className={`p-1 transition ${
                        selectedForme === forme.ID
                          ? "text-white hover:text-gray-200"
                          : "text-red-500 hover:text-red-700"
                      }`}
                      title="Supprimer la forme"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {filteredFormes.length === 0 && (
          <div className="text-center py-8 text-text-secondary">
            {searchFormeTerm ? (
              <div>
                <p>Aucune forme trouvée pour "{searchFormeTerm}"</p>
                <button
                  onClick={() => setSearchFormeTerm("")}
                  className="mt-2 text-primary hover:underline"
                >
                  Voir toutes les formes
                </button>
              </div>
            ) : (
              "Aucune forme configurée"
            )}
          </div>
        )}
      </div>

      {/* Gestion des détails */}
      {selectedForme && selectedFormeData && (
        <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-text-main">
              Détails pour {selectedFormeData.NomForme}
            </h4>
            <span className="text-sm text-text-secondary">
              {details.length} détail(s)
            </span>
          </div>

          {/* Search Bar for Details */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchDetailTerm}
                onChange={(e) => setSearchDetailTerm(e.target.value)}
                placeholder="Rechercher un détail..."
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
              />
              {searchDetailTerm && (
                <button
                  onClick={() => setSearchDetailTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <XIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            {searchDetailTerm && (
              <p className="text-sm text-text-secondary mt-2">
                {filteredDetails.length} résultat(s) trouvé(s) pour "
                {searchDetailTerm}"
              </p>
            )}
          </div>

          <div className="flex gap-4 items-end mb-6">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2 text-text-main">
                Nouveau détail
              </label>
              <input
                type="text"
                value={newDetail}
                onChange={(e) => setNewDetail(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, "addDetail")}
                placeholder="Ex: 500mg, 20mg/ml, 100mg..."
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
              />
            </div>
            <button
              onClick={handleAddDetail}
              disabled={!newDetail.trim()}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 flex items-center transition"
            >
              <PlusCircleIcon className="h-4 w-4 mr-2" />
              Ajouter
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDetails.map((detail) => (
              <div
                key={detail.ID}
                className="flex items-center justify-between p-4 bg-secondary rounded-lg hover:bg-secondary-dark transition"
              >
                {editingDetailId === detail.ID ? (
                  // Edit Detail Mode
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editDetailName}
                      onChange={(e) => setEditDetailName(e.target.value)}
                      onKeyPress={(e) =>
                        handleKeyPress(e, "editDetail", detail.ID)
                      }
                      onKeyDown={(e) => e.key === "Escape" && cancelEditing()}
                      className="flex-1 px-3 py-1 border border-border rounded focus:ring-1 focus:ring-primary bg-bg-card text-text-main text-sm"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleUpdateDetail(detail.ID)}
                        className="p-1 text-green-600 hover:text-green-800 transition"
                        title="Sauvegarder"
                      >
                        <SaveIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-1 text-gray-600 hover:text-gray-800 transition"
                        title="Annuler"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Detail Mode
                  <>
                    <span className="text-text-main font-medium flex-1">
                      {detail.NomDetail}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditingDetail(detail)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition"
                        title="Modifier le détail"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDetail(detail.ID)}
                        className="p-1 text-red-500 hover:text-red-700 transition"
                        title="Supprimer le détail"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {filteredDetails.length === 0 && (
            <div className="text-center py-8 text-text-secondary">
              {searchDetailTerm ? (
                <div>
                  <p>Aucun détail trouvé pour "{searchDetailTerm}"</p>
                  <button
                    onClick={() => setSearchDetailTerm("")}
                    className="mt-2 text-primary hover:underline"
                  >
                    Voir tous les détails
                  </button>
                </div>
              ) : (
                "Aucun détail configuré pour cette forme"
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Astuces :</strong> Utilisez Entrée pour valider rapidement,
          Échap pour annuler. Les détails sont organisés par forme galénique.
        </p>
      </div>
    </div>
  );
};

export default FormesSettings;
