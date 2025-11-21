import React, { useState, useEffect } from "react";
import { PlusCircleIcon, SaveIcon, SearchIcon } from "../Icons";
import { XIcon } from "../icons/XIcon";
import api from "../../utils/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { EditIcon } from "../icons/EditIcon";

const ExamensSettings = () => {
  const [biologicalGroups, setBiologicalGroups] = useState([]);
  const [explorationGroups, setExplorationGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [groupType, setGroupType] = useState("biological");
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editItemName, setEditItemName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadBiologicalGroups();
    loadExplorationGroups();
  }, []);

  const loadBiologicalGroups = async () => {
    try {
      const res = await api.get("/biological-groups/biological-groups");
      setBiologicalGroups(res.data || []);
    } catch (err) {
      console.error("Erreur chargement groupes biologiques:", err);
      toast.error("Erreur lors du chargement des groupes biologiques");
    } finally {
    }
  };

  const loadExplorationGroups = async () => {
    try {
      const res = await api.get("/explorations/exploration-groups");
      setExplorationGroups(res.data || []);
    } catch (err) {
      console.error("Erreur chargement groupes exploration:", err);
      toast.error("Erreur lors du chargement des groupes d'exploration");
    } finally {
    }
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("Veuillez saisir un nom pour le groupe");
      return;
    }

    const endpoint =
      groupType === "biological"
        ? "/biological-groups/biological-groups"
        : "/explorations/exploration-groups";

    try {
      await api.post(endpoint, { name: newGroupName.trim() });
      setNewGroupName("");
      toast.success("Groupe ajouté avec succès");

      if (groupType === "biological") {
        await loadBiologicalGroups();
      } else {
        await loadExplorationGroups();
      }
    } catch (err) {
      console.error("Erreur ajout groupe:", err);
      toast.error("Erreur lors de l'ajout du groupe");
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      toast.error("Veuillez saisir un nom pour l'item");
      return;
    }
    if (!selectedGroup) {
      toast.error("Veuillez sélectionner un groupe");
      return;
    }

    const endpoint =
      groupType === "biological"
        ? "/biological-groups/biological-items"
        : "/explorations/exploration-items";

    try {
      await api.post(endpoint, {
        groupId: selectedGroup,
        name: newItemName.trim(),
      });
      setNewItemName("");
      toast.success("Item ajouté avec succès");

      if (groupType === "biological") {
        await loadBiologicalGroups();
      } else {
        await loadExplorationGroups();
      }
    } catch (err) {
      console.error("Erreur ajout item:", err);
      toast.error("Erreur lors de l'ajout de l'item");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Supprimer ce groupe et tous ses items ?")) return;

    const endpoint =
      groupType === "biological"
        ? `/biological-groups/biological-groups/${groupId}`
        : `/explorations/exploration-groups/${groupId}`;

    try {
      await api.delete(endpoint);
      toast.success("Groupe supprimé avec succès");

      if (groupType === "biological") {
        await loadBiologicalGroups();
      } else {
        await loadExplorationGroups();
      }
      setSelectedGroup("");
    } catch (err) {
      console.error("Erreur suppression groupe:", err);
      toast.error("Erreur lors de la suppression du groupe");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Supprimer cet item ?")) return;

    const endpoint =
      groupType === "biological"
        ? `/biological-groups/biological-items/${itemId}`
        : `/explorations/exploration-items/${itemId}`;

    try {
      await api.delete(endpoint);
      toast.success("Item supprimé avec succès");

      if (groupType === "biological") {
        await loadBiologicalGroups();
      } else {
        await loadExplorationGroups();
      }
    } catch (err) {
      console.error("Erreur suppression item:", err);
      toast.error("Erreur lors de la suppression de l'item");
    }
  };

  const startEditingGroup = (group) => {
    setEditingGroupId(group.id);
    setEditGroupName(group.name);
  };

  const startEditingItem = (item) => {
    setEditingItemId(item.id);
    setEditItemName(item.name);
  };

  const cancelEditing = () => {
    setEditingGroupId(null);
    setEditingItemId(null);
    setEditGroupName("");
    setEditItemName("");
  };

  const handleUpdateGroup = async (groupId) => {
    if (!editGroupName.trim()) {
      toast.error("Le nom du groupe ne peut pas être vide");
      return;
    }

    const endpoint =
      groupType === "biological"
        ? `/biological-groups/biological-groups/${groupId}`
        : `/explorations/exploration-groups/${groupId}`;

    try {
      await api.put(endpoint, { name: editGroupName.trim() });
      toast.success("Groupe modifié avec succès");
      cancelEditing();

      if (groupType === "biological") {
        await loadBiologicalGroups();
      } else {
        await loadExplorationGroups();
      }
    } catch (err) {
      console.error("Erreur modification groupe:", err);
      toast.error("Erreur lors de la modification du groupe");
    }
  };

  const handleUpdateItem = async (itemId) => {
    if (!editItemName.trim()) {
      toast.error("Le nom de l'item ne peut pas être vide");
      return;
    }

    const endpoint =
      groupType === "biological"
        ? `/biological-groups/biological-items/${itemId}`
        : `/explorations/exploration-items/${itemId}`;

    try {
      await api.put(endpoint, { name: editItemName.trim() });
      toast.success("Item modifié avec succès");
      cancelEditing();

      if (groupType === "biological") {
        await loadBiologicalGroups();
      } else {
        await loadExplorationGroups();
      }
    } catch (err) {
      console.error("Erreur modification item:", err);
      toast.error("Erreur lors de la modification de l'item");
    }
  };

  const handleKeyPress = (e, action, id = null) => {
    if (e.key === "Enter") {
      if (action === "addGroup") {
        handleAddGroup();
      } else if (action === "addItem") {
        handleAddItem();
      } else if (action === "editGroup" && id) {
        handleUpdateGroup(id);
      } else if (action === "editItem" && id) {
        handleUpdateItem(id);
      }
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  const currentGroups =
    groupType === "biological" ? biologicalGroups : explorationGroups;
  const selectedGroupData = currentGroups.find((g) => g.id === selectedGroup);

  // Filter groups based on search term
  const filteredGroups = currentGroups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.items?.some((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <div className="space-y-8">
      <ToastContainer position="top-right" autoClose={2000} />

      <h3 className="text-xl font-bold text-text-main">Gestion des Examens</h3>

      {/* Sélection du type */}
      <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              setGroupType("biological");
              setSelectedGroup("");
              setSearchTerm("");
              cancelEditing();
            }}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              groupType === "biological"
                ? "bg-primary text-white"
                : "bg-secondary text-text-main hover:bg-secondary-dark"
            }`}
          >
            Examens Biologiques
          </button>
          <button
            onClick={() => {
              setGroupType("exploration");
              setSelectedGroup("");
              setSearchTerm("");
              cancelEditing();
            }}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              groupType === "exploration"
                ? "bg-primary text-white"
                : "bg-secondary text-text-main hover:bg-secondary-dark"
            }`}
          >
            Explorations
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Rechercher dans les groupes ${
                groupType === "biological" ? "biologiques" : "d'exploration"
              }...`}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <XIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="text-sm text-text-secondary mt-2">
              {filteredGroups.length} groupe(s) trouvé(s) pour "{searchTerm}"
            </p>
          )}
        </div>

        {/* Ajout de groupe */}
        <div className="flex gap-4 items-end mb-6">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2 text-text-main">
              Nouveau groupe
            </label>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, "addGroup")}
              placeholder={`Nom du groupe ${
                groupType === "biological" ? "biologique" : "d'exploration"
              }...`}
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
            />
          </div>
          <button
            onClick={handleAddGroup}
            disabled={!newGroupName.trim()}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 flex items-center transition"
          >
            <PlusCircleIcon className="h-4 w-4 mr-2" />
            Ajouter Groupe
          </button>
        </div>

        {/* Liste des groupes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition ${
                selectedGroup === group.id
                  ? "bg-primary text-white"
                  : "bg-secondary text-text-main hover:bg-secondary-dark"
              }`}
              onClick={() => setSelectedGroup(group.id)}
            >
              {editingGroupId === group.id ? (
                // Edit Group Mode
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, "editGroup", group.id)}
                    onKeyDown={(e) => e.key === "Escape" && cancelEditing()}
                    className="flex-1 px-3 py-1 border border-border rounded focus:ring-1 focus:ring-primary bg-bg-card text-text-main text-sm"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateGroup(group.id);
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
                // View Group Mode
                <>
                  <div className="flex-1">
                    <div className="font-medium">{group.name}</div>
                    <div className="text-sm opacity-75">
                      ({group.items?.length || 0} items)
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingGroup(group);
                      }}
                      className={`p-1 transition ${
                        selectedGroup === group.id
                          ? "text-white hover:text-gray-200"
                          : "text-blue-600 hover:text-blue-800"
                      }`}
                      title="Modifier le groupe"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGroup(group.id);
                      }}
                      className={`p-1 transition ${
                        selectedGroup === group.id
                          ? "text-white hover:text-gray-200"
                          : "text-red-500 hover:text-red-700"
                      }`}
                      title="Supprimer le groupe"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {filteredGroups.length === 0 && (
          <div className="text-center py-8 text-text-secondary">
            {searchTerm ? (
              <div>
                <p>Aucun groupe trouvé pour "{searchTerm}"</p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-2 text-primary hover:underline"
                >
                  Voir tous les groupes
                </button>
              </div>
            ) : (
              "Aucun groupe configuré"
            )}
          </div>
        )}

        {/* Ajout d'item au groupe sélectionné */}
        {selectedGroup && selectedGroupData && (
          <div className="border-t border-border pt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-text-main">
                Items pour {selectedGroupData.name}
              </h4>
              <span className="text-sm text-text-secondary">
                {selectedGroupData.items?.length || 0} item(s)
              </span>
            </div>

            <div className="flex gap-4 items-end mb-6">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-2 text-text-main">
                  Nouvel item
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, "addItem")}
                  placeholder="Nom de l'examen..."
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                />
              </div>
              <button
                onClick={handleAddItem}
                disabled={!newItemName.trim()}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 flex items-center transition"
              >
                <PlusCircleIcon className="h-4 w-4 mr-2" />
                Ajouter
              </button>
            </div>

            {/* Liste des items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedGroupData.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-secondary rounded-lg hover:bg-secondary-dark transition"
                >
                  {editingItemId === item.id ? (
                    // Edit Item Mode
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editItemName}
                        onChange={(e) => setEditItemName(e.target.value)}
                        onKeyPress={(e) =>
                          handleKeyPress(e, "editItem", item.id)
                        }
                        onKeyDown={(e) => e.key === "Escape" && cancelEditing()}
                        className="flex-1 px-3 py-1 border border-border rounded focus:ring-1 focus:ring-primary bg-bg-card text-text-main text-sm"
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleUpdateItem(item.id)}
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
                    // View Item Mode
                    <>
                      <span className="text-text-main font-medium flex-1">
                        {item.name}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditingItem(item)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition"
                          title="Modifier l'item"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-red-500 hover:text-red-700 transition"
                          title="Supprimer l'item"
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {(!selectedGroupData.items ||
              selectedGroupData.items.length === 0) && (
              <div className="text-center py-8 text-text-secondary">
                Aucun item dans ce groupe
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Astuces :</strong> Utilisez Entrée pour valider rapidement,
          Échap pour annuler. Double-cliquez sur un groupe ou un item pour le
          modifier.
        </p>
      </div>
    </div>
  );
};

export default ExamensSettings;
