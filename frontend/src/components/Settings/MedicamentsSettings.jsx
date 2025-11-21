import React, { useState, useEffect, useCallback } from "react";
import { PlusCircleIcon, SaveIcon, SearchIcon } from "../Icons";
import { XIcon } from "../icons/XIcon";
import api from "../../utils/api";
import { EditIcon } from "../icons/EditIcon";
import { InfoIcon } from "../icons/InfoIcon";
import { ChevronLeftIcon } from "../icons/ChevronLeftIcon";
import { ChevronRightIcon } from "../icons/ChevronRightIcon";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";

const MedicamentsSettings = () => {
  const [medicaments, setMedicaments] = useState([]);
  const [newMedicament, setNewMedicament] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNext: false,
    hasPrev: false,
  });

  const [searchTimeout, setSearchTimeout] = useState(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    (term, page = 1) => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        loadMedicaments(page, term);
      }, 300);

      setSearchTimeout(timeout);
    },
    [searchTimeout]
  );

  useEffect(() => {
    loadMedicaments(1);
  }, []);

  useEffect(() => {
    debouncedSearch(searchTerm, 1);
  }, [searchTerm, debouncedSearch]);

  const loadMedicaments = async (
    page = 1,
    search = "",
    customItemsPerPage = null
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: (customItemsPerPage || pagination.itemsPerPage).toString(),
      });

      if (search) {
        params.append("search", search);
      }

      const res = await api.get(`/medicaments?${params}`);
      setMedicaments(res.data.medicaments || []);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Erreur chargement médicaments:", err);
      toast.error("Erreur lors du chargement des médicaments");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicament = async () => {
    if (!newMedicament.trim()) return;

    setLoading(true);
    try {
      await api.post("/medicaments", { NomMed: newMedicament.trim() });
      setNewMedicament("");
      toast.success("Médicament ajouté avec succès ✅");
      loadMedicaments(pagination.currentPage, searchTerm);
    } catch (err) {
      console.error("Erreur ajout médicament:", err);
      toast.error("Erreur lors de l'ajout du médicament");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedicament = async (id) => {
    if (!window.confirm("Supprimer ce médicament ?")) return;

    try {
      await api.delete(`/medicaments/${id}`);
      toast.success("Médicament supprimé avec succès 🗑️");
      if (medicaments.length === 1 && pagination.currentPage > 1) {
        loadMedicaments(pagination.currentPage - 1, searchTerm);
      } else {
        loadMedicaments(pagination.currentPage, searchTerm);
      }
    } catch (err) {
      console.error("Erreur suppression médicament:", err);
      toast.error("Erreur lors de la suppression ❌");
    }
  };

  const startEditing = (medicament) => {
    setEditingId(medicament.ID);
    setEditValue(medicament.NomMed);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleUpdateMedicament = async (id) => {
    if (!editValue.trim()) {
      toast.error("Le nom du médicament ne peut pas être vide");
      return;
    }

    try {
      await api.put(`/medicaments/${id}`, { NomMed: editValue.trim() });
      setEditingId(null);
      setEditValue("");
      toast.success("Médicament mis à jour avec succès ✅");
      loadMedicaments(pagination.currentPage, searchTerm);
    } catch (err) {
      console.error("Erreur modification médicament:", err);
      toast.error("Erreur lors de la mise à jour du médicament ❌");
    }
  };

  const handleKeyPress = (e, action, id = null) => {
    if (e.key === "Enter") {
      if (action === "add") {
        handleAddMedicament();
      } else if (action === "edit" && id) {
        handleUpdateMedicament(id);
      }
    } else if (e.key === "Escape") {
      if (action === "edit") {
        cancelEditing();
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadMedicaments(newPage, searchTerm);
    }
  };

  const handleItemsPerPageChange = (newLimit) => {
    setPagination((prev) => ({
      ...prev,
      itemsPerPage: newLimit,
      currentPage: 1,
    }));
    loadMedicaments(1, searchTerm, newLimit);
  };

  // Function to truncate long text with ellipsis
  const truncateText = (text, maxLength = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="space-y-6">
      {/* Header with Tooltip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-text-main">
            Gestion des Médicaments
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
                • Gestion de 5000+ médicaments
                <br />
                • Recherche et pagination
                <br />
                • Édition en ligne
                <br />• Affichage tableau optimisé
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-text-secondary">
          {pagination.totalItems.toLocaleString()} médicament(s)
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un médicament (min. 2 caractères)..."
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
            {pagination.totalItems} résultat(s) trouvé(s) pour "{searchTerm}"
          </p>
        )}
      </div>

      {/* Add New Medicament Form */}
      <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm">
        <h4 className="text-lg font-semibold mb-4 text-text-main">
          Ajouter un nouveau médicament
        </h4>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2 text-text-main">
              Nom du médicament
            </label>
            <input
              type="text"
              value={newMedicament}
              onChange={(e) => setNewMedicament(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, "add")}
              placeholder="Saisir le nom du médicament..."
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
            />
          </div>
          <button
            onClick={handleAddMedicament}
            disabled={!newMedicament.trim() || loading}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 flex items-center transition min-w-[120px] justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <PlusCircleIcon className="h-4 w-4 mr-2" />
                Ajouter
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-text-secondary mt-2">
          Appuyez sur Entrée pour ajouter rapidement
        </p>
      </div>

      {/* Pagination Controls - Top */}
      <div className="bg-bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-main">
              Affichage:{" "}
              <select
                value={pagination.itemsPerPage}
                onChange={(e) =>
                  handleItemsPerPageChange(parseInt(e.target.value))
                }
                className="ml-2 px-2 py-1 border border-border rounded bg-bg-card text-text-main"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>{" "}
              par page
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev || loading}
              className="p-2 rounded border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>

            <span className="text-sm text-text-main px-3">
              Page {pagination.currentPage} sur {pagination.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext || loading}
              className="p-2 rounded border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="text-sm text-text-secondary">
            {(
              (pagination.currentPage - 1) * pagination.itemsPerPage +
              1
            ).toLocaleString()}{" "}
            -{" "}
            {Math.min(
              pagination.currentPage * pagination.itemsPerPage,
              pagination.totalItems
            ).toLocaleString()}{" "}
            sur {pagination.totalItems.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Medicaments Table */}
      <div className="bg-bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h4 className="text-lg font-semibold text-text-main">
            Liste des médicaments
          </h4>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Chargement...
            </div>
          )}
        </div>

        {medicaments.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            {searchTerm ? (
              <div>
                <p className="text-lg mb-2">Aucun médicament trouvé</p>
                <p className="text-sm mb-4">pour "{searchTerm}"</p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                >
                  Voir tous les médicaments
                </button>
              </div>
            ) : (
              <div>
                <p className="text-lg mb-2">Aucun médicament configuré</p>
                <p className="text-sm">
                  Utilisez le formulaire ci-dessus pour ajouter des médicaments
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-text-main uppercase tracking-wider">
                    Nom du Médicament
                  </th>
                  <th className="py-4 px-6 text-right text-sm font-semibold text-text-main uppercase tracking-wider w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {medicaments.map((med) => (
                  <tr
                    key={med.ID}
                    className="hover:bg-secondary/50 transition group"
                  >
                    <td className="py-4 px-6">
                      {editingId === med.ID ? (
                        // Edit Mode
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyPress={(e) =>
                              handleKeyPress(e, "edit", med.ID)
                            }
                            onKeyDown={(e) =>
                              e.key === "Escape" && cancelEditing()
                            }
                            className="flex-1 px-3 py-2 border border-border rounded focus:ring-1 focus:ring-primary bg-bg-card text-text-main text-sm"
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleUpdateMedicament(med.ID)}
                              className="p-2 text-green-600 hover:text-green-800 transition bg-green-50 hover:bg-green-100 rounded"
                              title="Sauvegarder"
                            >
                              <SaveIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-2 text-gray-600 hover:text-gray-800 transition bg-gray-50 hover:bg-gray-100 rounded"
                              title="Annuler"
                            >
                              <XIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div
                          className="flex items-center group cursor-help"
                          title={med.NomMed} // Full name on hover
                        >
                          <span className="text-text-main text-sm leading-relaxed">
                            {truncateText(med.NomMed, 120)}
                          </span>
                          {med.NomMed.length > 120 && (
                            <span className="ml-2 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              🔍
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {editingId !== med.ID && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEditing(med)}
                            className="p-2 text-blue-600 hover:text-blue-800 transition bg-blue-50 hover:bg-blue-100 rounded"
                            title="Modifier le médicament"
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMedicament(med.ID)}
                            className="p-2 text-red-500 hover:text-red-700 transition bg-red-50 hover:bg-red-100 rounded"
                            title="Supprimer le médicament"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-text-secondary">
              Affichage de{" "}
              {(
                (pagination.currentPage - 1) * pagination.itemsPerPage +
                1
              ).toLocaleString()}{" "}
              à{" "}
              {Math.min(
                pagination.currentPage * pagination.itemsPerPage,
                pagination.totalItems
              ).toLocaleString()}{" "}
              sur {pagination.totalItems.toLocaleString()} médicaments
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => handlePageChange(1)}
                disabled={!pagination.hasPrev || loading}
                className="px-3 py-1 rounded border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition text-sm"
              >
                Première
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev || loading}
                  className="p-2 rounded border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>

                <span className="text-sm text-text-main px-3">
                  Page {pagination.currentPage} sur {pagination.totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext || loading}
                  className="p-2 rounded border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={!pagination.hasNext || loading}
                className="px-3 py-1 rounded border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition text-sm"
              >
                Dernière
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default MedicamentsSettings;
