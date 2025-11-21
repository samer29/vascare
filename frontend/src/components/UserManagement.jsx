// components/UserManagement.js
import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../contexts/AppContext";
import api from "../utils/api";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import { EditIcon } from "./icons/EditIcon";
import { PlusIcon } from "./Icons";
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { user: currentUser } = useContext(AppContext);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    grade: "user",
    avatar: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.ID}`, formData);
        toast.success("Utilisateur modifié avec succès ✅");
      } else {
        await api.post("/users/register", formData);
        toast.success("Utilisateur ajouté avec succès ✅");
      }

      await fetchUsers();
      resetForm();
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("Erreur lors de l'opération");
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      email: "",
      grade: "user",
      avatar: "",
    });
    setEditingUser(null);
    setShowForm(false);
  };

  const handleEdit = (user) => {
    setFormData({
      username: user.username,
      password: "", // Don't fill password for security
      email: user.email || "",
      grade: user.grade,
      avatar: user.avatar || "",
    });
    setEditingUser(user);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-text-main">
            Gestion des Utilisateurs
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Gérer les comptes utilisateurs de l'application
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm"
        >
          <PlusIcon className="h-4 w-4" />
          Nouvel Utilisateur
        </button>
      </div>

      {/* User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card rounded-xl shadow-xl max-w-md w-full p-6 border border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-text-main">
                {editingUser ? "Modifier l'utilisateur" : "Nouvel Utilisateur"}
              </h3>
              <button
                onClick={resetForm}
                className="text-text-secondary hover:text-text-main"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nom d'utilisateur</label>
                <input
                  type="text"
                  placeholder="Nom d'utilisateur"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {editingUser ? "Nouveau mot de passe" : "Mot de passe"}
                </label>
                <input
                  type="password"
                  placeholder={
                    editingUser
                      ? "Laisser vide pour ne pas changer"
                      : "Mot de passe"
                  }
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="form-input"
                  required={!editingUser}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rôle</label>
                <select
                  value={formData.grade}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, grade: e.target.value }))
                  }
                  className="form-select"
                >
                  <option value="admin">Administrateur</option>
                  <option value="doctor">Médecin</option>
                  <option value="secretaire">Secrétaire</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 btn btn-primary">
                  {editingUser ? "Modifier" : "Créer"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 btn btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-bg-card rounded-lg border border-border overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-3 text-text-secondary">Chargement...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-main uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-main uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-main uppercase tracking-wider">
                    Dernière connexion
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-main uppercase tracking-wider w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr
                    key={user.ID}
                    className="hover:bg-secondary/50 transition"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt=""
                            className="h-8 w-8 rounded-full mr-3"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center mr-3">
                            <span className="text-white text-sm font-medium">
                              {user.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-text-main text-sm">
                            {user.username}
                          </div>
                          {user.email && (
                            <div className="text-xs text-text-secondary">
                              {user.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.grade === "admin"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : user.grade === "doctor"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        }`}
                      >
                        {user.grade === "admin" && "Administrateur"}
                        {user.grade === "doctor" && "Médecin"}
                        {user.grade === "secretaire" && "Secrétaire"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {user.last_login
                        ? new Date(user.last_login).toLocaleDateString("fr-FR")
                        : "Jamais connecté"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 transition"
                        title="Modifier l'utilisateur"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {users.length === 0 && !loading && (
          <div className="text-center py-8 text-text-secondary">
            <div className="text-4xl mb-2">👥</div>
            <p>Aucun utilisateur trouvé</p>
            <p className="text-sm mt-1">Créez le premier utilisateur</p>
          </div>
        )}
      </div>

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default UserManagement;
