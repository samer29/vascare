import { useEffect, useCallback, useState, useMemo, useRef } from "react";
import { PlusCircleIcon, ArrowLeftIcon, SearchIcon } from "./Icons";
import api from "../utils/api";
import {
  calculateAge,
  formatDateEuropean,
  inputDateToDb,
  calculateAgeFromInput,
  ageToDobInput,
  calculateAgeFromDb,
  formatToDisplay,
  fixUTCDateToLocal,
} from "../utils/data.jsx";
import EchographieManager from "./EchographieManager.jsx";
import DopplerManager from "./DopplerManager.jsx";
import ThyroideManager from "./ThyroideManager.jsx";
import ECGManager from "./ECGManager.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import OrdonnancePDF from "./reports/OrdonnancePDF.jsx";
import PrintExamensPDF from "./reports/PrintExamensPDF.jsx";
import PrintCertificatPDF from "./reports/PrintCertificatPDF.jsx";
import PrintOrientationPDF from "./reports/PrintOrientationPDF.jsx";
import PrintConsultationPDF from "./reports/PrintConsultationPDF.jsx";
import FactureManager from "./FactureManager.jsx";
import DeletePatientModal from "../components/DeletePatientModal";

const PatientManager = (userRole) => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    patient: null,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const handleDeleteClick = (patient) => {
    // Fix: access userRole.userRole
    if (userRole.userRole === "secretaire") {
      toast.error("Action non autorisée ❌");
      console.log("Action non autorisée ❌", userRole);

      return;
    } else {
      setDeleteModal({
        isOpen: true,
        patient: patient,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.patient) return;

    setDeleteLoading(true);
    try {
      await api.delete(`/patients/${deleteModal.patient.id}`);
      setPatients((prev) =>
        prev.filter((p) => p.id !== deleteModal.patient.id)
      );
      setDeleteModal({ isOpen: false, patient: null });
      toast.success("Patient supprimé avec succès 🗑️");
    } catch (err) {
      console.error("Erreur suppression patient :", err);
      toast.error("Erreur lors de la suppression ❌");
    } finally {
      setDeleteLoading(false);
    }
  };
  const renderPatientActions = (patient) => {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteClick(patient);
        }}
        className="px-4 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition shadow-sm"
      >
        Supprimer
        <ToastContainer position="top-right" autoClose={2000} />
      </button>
    );
  };
  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, patient: null });
  };
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await api.get("/patients");
        const patientsData = response.data.map((p) => ({
          ...p,
          id: p.ID,
          name: `${p.Nom} ${p.Prenom}`.trim(),
          dob: p.DateNaissance || p.datenaissance || "",
          weight: p.Poids || p.poids || "",
          history: p.ATCD || p.atcd || "",
          consultations: [],
        }));

        const patientsWithConsultations = await Promise.all(
          patientsData.map(async (p) => {
            try {
              const res = await api.get(
                `/medical/consultations?patientId=${p.ID}`
              );
              return {
                ...p,
                consultations: res.data || [],
              };
            } catch (error) {
              console.error(
                `Error fetching consultations for patient ${p.ID}:`,
                error.message
              );
              return p;
            }
          })
        );

        setPatients(patientsWithConsultations);
        setLoading(false);
      } catch (err) {
        setError(
          "Erreur lors du chargement des patients : " +
            (err.response?.data?.error || err.message)
        );
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const filteredPatients = useMemo(
    () =>
      patients.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [patients, searchTerm]
  );

  const handleSelectPatient = async (patient) => {
    // Normalize incoming patient object: support both server and UI shapes
    const patientId = patient?.ID ?? patient?.id ?? patient?.Id ?? null;
    const nom = patient?.Nom ?? patient?.nom ?? "";
    const prenom = patient?.Prenom ?? patient?.prenom ?? "";
    const name =
      patient?.name ??
      (nom || prenom ? `${nom} ${prenom}`.trim() : patient?.NomComplet ?? "");
    const dob =
      patient?.DateNaissance ?? patient?.datenaissance ?? patient?.dob ?? "";
    const weight =
      patient?.Poids ??
      patient?.poids ??
      patient?.weight ??
      patient?.Weight ??
      null;
    const history = patient?.ATCD ?? patient?.atcd ?? patient?.history ?? "";

    if (!patientId) {
      console.error(
        "handleSelectPatient: patientId missing in provided patient:",
        patient
      );
      setError("Impossible de sélectionner le patient : ID manquant");
      return;
    }

    try {
      // fetch consultations for that patient
      const res = await api.get(
        `/medical/consultations?patientId=${patientId}`
      );
      const consultations = (res.data || []).map((c) => ({
        id: c.ID ?? c.id,
        date: c.DateConsultation || c.date || "", // ✅ normalize here
        diagnostic: c.Motif ?? c.motif ?? "Consultation",
        conclusion: c.Conclusion ?? c.conclusion ?? "",
        Prix: c.Prix ?? c.prix ?? 0,
      }));

      const normalized = {
        // canonical shape for the rest of the app
        id: patientId,
        name: name || `${nom} ${prenom}`.trim(),
        nom,
        prenom,
        dob,
        weight: weight ?? "",
        history: history ?? "",
        consultations,
        raw: patient, // keep original raw payload handy if needed
      };

      setSelectedPatient(normalized);
      setIsAddingPatient(false);
      // setLocalError(null);
    } catch (err) {
      console.error("Erreur lors du chargement des détails du patient :", err);
      setError(
        "Erreur lors du chargement des détails du patient : " +
          (err.response?.data?.error || err.message)
      );
    }
  };

  const onSelectExisting = async (patient) => {
    try {
      setIsAddingPatient(false);
      await handleSelectPatient(patient);
      toast.info(
        `Patient existant sélectionné : ${patient.Nom ?? patient.nom ?? ""} ${
          patient.Prenom ?? patient.prenom ?? ""
        }`
      );
    } catch (err) {
      console.error("Erreur lors de la sélection du patient existant :", err);
      toast.error("Erreur lors de la sélection du patient existant ❌");
    }
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
    setIsAddingPatient(false);
    setError(null);
  };

  const handleAddNewPatient = () => {
    setIsAddingPatient(true);
    setSelectedPatient(null);
    setError(null);
  };

  const handleSavePatient = async (patientData) => {
    try {
      const dbDob = inputDateToDb(patientData.dob);
      const newPatient = {
        nom: patientData.nom.trim(),
        prenom: patientData.prenom.trim(),
        datenaissance: dbDob,
        poids: Number(patientData.weight) || 0,
        atcd: patientData.history || null,
      };

      if (!newPatient.nom || !newPatient.prenom) {
        throw new Error("Le nom et le prénom sont requis");
      }

      const response = await api.post("/patients", newPatient);

      const createdPatient = {
        ...newPatient,
        id: response.data.insertId,
        name: `${newPatient.nom} ${newPatient.prenom}`.trim(),
        dob: newPatient.datenaissance,
        weight: newPatient.poids,
        history: newPatient.atcd || "",
        consultations: [],
      };

      setPatients((prev) => [createdPatient, ...prev]);
      setIsAddingPatient(false);

      // ✅ Automatically create first consultation for new patient
      await handleCreateFirstConsultation(createdPatient);

      toast.success("Patient ajouté avec succès ✅");
    } catch (err) {
      console.error("Erreur lors de la création du patient :", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Erreur lors de la création du patient. Veuillez réessayer."
      );
      toast.error("Erreur lors de l'ajout du Patient ❌");
    }
  };

  // ✅ New function to create first consultation
  const handleCreateFirstConsultation = async (patient) => {
    try {
      const motif = "Première consultation";
      await api.post("/medical/start-consultation", {
        IDPatient: patient.id,
        Motif: motif,
      });

      // Refresh consultations and select the patient
      await handleSelectPatient(patient);
    } catch (err) {
      console.error("Erreur création consultation initiale:", err);
      // Even if consultation creation fails, still select the patient
      await handleSelectPatient(patient);
    }
  };

  const handleUpdatePatient = async (updatedPatient) => {
    try {
      console.log("🔄 Updating patient with data:", updatedPatient); // Debug log

      // Use your existing inputDateToDb function which handles DD/MM/YYYY → YYYY-MM-DD
      const dbDob = inputDateToDb(updatedPatient.dob);

      console.log("✅ Converted DOB for DB:", dbDob); // Debug log

      if (!dbDob) {
        throw new Error("Format de date invalide");
      }

      const patientData = {
        nom: updatedPatient.nom.trim(),
        prenom: updatedPatient.prenom.trim(),
        datenaissance: dbDob,
        poids: Number(updatedPatient.weight) || 0,
        atcd: updatedPatient.history || null,
      };

      if (!patientData.nom || !patientData.prenom) {
        throw new Error("Le nom et le prénom sont requis");
      }
      // ✅ Update frontend states using backend's computed AGE
      setPatients((prev) =>
        prev.map((p) =>
          p.id === updatedPatient.id
            ? {
                ...p,
                name: `${patientData.nom} ${patientData.prenom}`.trim(),
                dob: formatToDisplay(dbDob),
                weight: patientData.poids,
                history: patientData.atcd || "",
                age: calculateAgeFromDb(dbDob), // ← compute from dob easily
              }
            : p
        )
      );

      setSelectedPatient((prev) => ({
        ...prev,
        name: `${patientData.nom} ${patientData.prenom}`.trim(),
        dob: formatToDisplay(dbDob),
        weight: patientData.poids,
        history: patientData.atcd || "",
        age: calculateAgeFromDb(dbDob),
      }));

      toast.success("Patient mis à jour avec succès ✅");
    } catch (err) {
      console.error("Erreur lors de la mise à jour du patient :", err);
      toast.error("Erreur lors de la mise à jour du patient ❌");
      setError(
        err.response?.data?.error ||
          err.message ||
          "Erreur lors de la mise à jour du patient"
      );
      return false;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-text-main">Chargement...</div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  if (isAddingPatient) {
    return (
      <PatientForm
        onSave={handleSavePatient}
        onCancel={handleBackToList}
        onSelectExisting={onSelectExisting}
      />
    );
  }

  if (selectedPatient) {
    return (
      <PatientDetail
        patient={selectedPatient}
        onBack={handleBackToList}
        onUpdate={handleUpdatePatient}
        updatePatient={setSelectedPatient}
        userRole={userRole} // ADDED THIS LINE
      />
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-text-main">
          Liste des Patients
        </h2>
        <button
          onClick={handleAddNewPatient}
          className="flex items-center bg-primary text-white px-6 py-3 rounded-md hover:bg-primary-dark transition shadow-lg"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Nouveau Patient
        </button>
      </div>
      <div className="relative mb-8">
        <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary" />
        <input
          type="text"
          placeholder="Rechercher un patient par nom..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg-card text-text-main shadow-sm"
        />
      </div>
      <div className="bg-bg-card shadow-lg rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-primary text-white">
            <tr>
              <th className="py-4 px-6 text-left text-xs font-medium uppercase tracking-wider">
                Nom
              </th>
              <th className="py-4 px-6 text-left text-xs font-medium uppercase tracking-wider">
                Date de Naissance
              </th>
              <th className="py-4 px-6 text-left text-xs font-medium uppercase tracking-wider">
                Âge
              </th>
              <th className="py-4 px-6 text-left text-xs font-medium uppercase tracking-wider">
                Dernière Visite
              </th>
              {userRole !== "secretaire" && ( // Hide actions column for secretaire
                <th className="py-4 px-6 text-left text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-bg-card divide-y divide-border">
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => {
                const latestCons =
                  patient.consultations?.length > 0
                    ? [...patient.consultations].sort(
                        (a, b) =>
                          new Date(b.DateConsultation) -
                          new Date(a.DateConsultation)
                      )[0]
                    : null;
                return (
                  <tr
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className="hover:bg-secondary cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-6 font-semibold text-text-main">
                      {patient.name}
                    </td>
                    <td className="py-4 px-6 text-text-main">
                      {fixUTCDateToLocal(patient.dob)}
                    </td>
                    <td className="py-4 px-6 text-text-main">
                      {calculateAge(patient.dob)}
                    </td>
                    <td className="py-4 px-6 text-text-main">
                      {latestCons
                        ? fixUTCDateToLocal(latestCons.DateConsultation)
                        : "Aucune"}
                    </td>
                    {userRole !== "secretaire" && ( // Hide actions for secretaire
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          {renderPatientActions(patient)}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={userRole === "secretaire" ? "4" : "5"}
                  className="py-12 text-center text-text-secondary"
                >
                  Aucun patient trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <DeletePatientModal
        isOpen={deleteModal.isOpen}
        patient={deleteModal.patient}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleteLoading}
      />
    </div>
  );
};

const PatientForm = ({ patient, onSave, onCancel, onSelectExisting }) => {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    dob: "",
    weight: "",
    history: "",
    age: "",
  });
  const dobTimeout = useRef(null);
  const ageTimeout = useRef(null);

  const handleDobChange = (e) => {
    let v = e.target.value.replace(/[^\d/]/g, "").slice(0, 10);
    if (v.length > 2 && v[2] !== "/") v = v.slice(0, 2) + "/" + v.slice(2);
    if (v.length > 5 && v[5] !== "/") v = v.slice(0, 5) + "/" + v.slice(5);

    setFormData((p) => ({ ...p, dob: v }));

    if (dobTimeout.current) clearTimeout(dobTimeout.current);
    dobTimeout.current = setTimeout(() => {
      const age = calculateAgeFromInput(v);
      setFormData((p) => ({ ...p, age }));
    }, 300);
  };
  const handleAgeChange = (e) => {
    const val = e.target.value.replace(/[^\d]/g, "");
    setFormData((p) => ({ ...p, age: val }));

    if (ageTimeout.current) clearTimeout(ageTimeout.current);
    ageTimeout.current = setTimeout(() => {
      if (val) {
        const dob = ageToDobInput(val);
        setFormData((p) => ({ ...p, dob }));
      }
    }, 400);
  };
  useEffect(() => {
    if (patient) {
      let dobInput;
      const rawDob =
        patient.dob || patient.DateNaissance || patient.datenaissance || "";

      console.log("🔄 Raw DOB from patient:", rawDob); // Debug log

      // Use your fixUTCDateToLocal function to handle the date conversion
      if (rawDob) {
        dobInput = fixUTCDateToLocal(rawDob);
      } else {
        dobInput = "";
      }

      console.log("✅ Converted DOB for form:", dobInput); // Debug log

      setFormData({
        nom: patient.Nom || patient.nom || "",
        prenom: patient.Prenom || patient.prenom || "",
        dob: dobInput,
        weight: patient.weight || patient.Poids || patient.poids || "",
        history: patient.history || patient.ATCD || patient.atcd || "",
        age: calculateAgeFromInput(dobInput),
      });
    } else {
      setFormData({
        nom: "",
        prenom: "",
        dob: "",
        weight: "",
        history: "",
        age: "",
      });
    }
    setError(null);
  }, [patient]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [similarPatients, setSimilarPatients] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (patient) {
      setShowSuggestions(false);
      return;
    }
    const timeout = setTimeout(async () => {
      if (formData.nom.length > 1 || formData.prenom.length > 1) {
        try {
          const res = await api.get(`/patients/search`, {
            params: { nom: formData.nom, prenom: formData.prenom },
          });
          setSimilarPatients(res.data);
          setShowSuggestions(res.data.length > 0);
        } catch (err) {
          console.error("Erreur recherche patient:", err);
        }
      } else {
        setSimilarPatients([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [formData.nom, formData.prenom, patient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nom.trim() || !formData.prenom.trim()) {
      setError("Le nom et le prénom sont requis");
      return;
    }
    if (!formData.dob || !formData.weight) {
      setError("La date de naissance et le poids sont requis");
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        history: formData.history.trim(),
        id: patient?.id,
      };
      const success = await onSave(dataToSave); // parent calls inputDateToDb
      if (success) {
        // Success is handled in the parent with toast
      }
    } catch (err) {
      setError(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const title = patient ? "Modifier Fiche Patient" : "Nouveau Patient";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-bg-card p-8 rounded-lg shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-text-main">{title}</h2>
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex items-center px-6 py-3 bg-secondary text-text-main rounded-md hover:bg-secondary-dark transition disabled:opacity-50"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Annuler
            </button>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold mb-3 text-text-main">
                  Nom *
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg-card text-text-main shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-3 text-text-main">
                  Prénom *
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg-card text-text-main shadow-sm"
                  required
                />
              </div>
              {showSuggestions && (
                <div className="mt-2 bg-white border border-border rounded-lg shadow-lg p-4 space-y-2">
                  <p className="text-sm text-text-secondary mb-2">
                    🔍 Patients similaires trouvés :
                  </p>
                  {similarPatients.map((p) => (
                    <div
                      key={p.ID}
                      onClick={() => onSelectExisting(p)}
                      className="flex justify-between items-center p-2 rounded hover:bg-secondary cursor-pointer transition"
                    >
                      <div>
                        <p className="font-semibold text-text-main">
                          {p.Nom} {p.Prenom}
                        </p>
                        <p className="text-sm text-text-secondary">
                          Né(e) le{" "}
                          {new Date(p.DateNaissance).toLocaleDateString()} •{" "}
                          {p.Age} ans
                        </p>
                      </div>
                      <span className="text-primary text-sm font-semibold">
                        ➜ Sélectionner
                      </span>
                    </div>
                  ))}

                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="w-full text-sm text-center text-blue-600 mt-3 hover:underline"
                  >
                    Continuer avec un nouveau patient
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-3 text-text-main">
                  Date de Naissance *
                </label>
                <input
                  type="text"
                  value={formData.dob}
                  onChange={handleDobChange}
                  placeholder="JJ/MM/AAAA"
                  maxLength={10}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-3 text-text-main">
                  Âge
                </label>
                <input
                  type="text"
                  value={formData.age}
                  onChange={handleAgeChange}
                  placeholder="ou entrez l’âge"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main shadow-sm"
                />
                {formData.age && (
                  <p className="mt-1 text-xs text-text-secondary">
                    {formData.age} an{formData.age !== "1" ? "s" : ""}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3 text-text-main">
                  Poids (kg) *
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg-card text-text-main shadow-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-3 text-text-main">
                Antécédents
              </label>
              <textarea
                name="history"
                value={formData.history}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg-card text-text-main shadow-sm"
                placeholder="Décrivez les antécédents médicaux..."
              />
            </div>
            <div className="flex justify-end space-x-4 pt-8 border-t border-border">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-8 py-3 bg-secondary text-text-main rounded-lg hover:bg-secondary-dark transition disabled:opacity-50 shadow-sm"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sauvegarde...
                  </>
                ) : (
                  "Sauvegarder"
                )}
              </button>
              <ToastContainer position="top-right" autoClose={2000} />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const detailTabs = [
  "Consultation",
  "Échographie",
  "Doppler",
  "Thyroide",
  "ECG",
  "Ordonnances",
  "Examens Complémentaires",
  "Certificats",
  "Orientation",
  "Factures",
];

const PatientDetail = ({
  patient,
  onBack,
  onUpdate,
  updatePatient,
  userRole,
}) => {
  // All hooks must be declared at the top level, before any conditional returns
  const [activeTab, setActiveTab] = useState("Consultation");
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [showMotifModal, setShowMotifModal] = useState(false);
  const [motif, setMotif] = useState("");
  const [medicaments, setMedicaments] = useState([]);
  const [formes, setFormes] = useState([]);
  const [filteredDetails, setFilteredDetails] = useState([]);
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [newMedication, setNewMedication] = useState({
    medicament: "",
    prescriptionType: "quantite",
    quantite: "1",
    forme: "",
    detail: "",
    duree: "",
  });

  // Echographie
  const [echographieForm, setEchographieForm] = useState({
    Foie: [""],
    Troncporte: [""],
    Veines: [""],
    vesicule: [""],
    voiebiliare: [""],
    rate: [""],
    pancrea: [""],
    reindroite: [""],
    reingauche: [""],
    autresecho: [""],
    conclusionecho: [""],
    catecho: [""],
  });
  // Doppler
  const [dopplerType, setDopplerType] = useState("MI");
  const [dopplerSubType, setDopplerSubType] = useState("normal");
  const [dopplerForm, setDopplerForm] = useState({});
  // Thyroide
  const [thyroideType, setThyroideType] = useState("avec_schema");
  const [thyroideForm, setThyroideForm] = useState({
    Indication: [""],
    Technique: [""],
    Resultats: [""],
    Conclusion: [""],
    CAT: [""],
  });
  //ECG
  const [ecgForm, setEcgForm] = useState({
    Examen: [""],
    Electrocardiogramme: [""],
    Conclusion: [""],
  });
  // Consultation edit
  const [consultForm, setConsultForm] = useState({
    motif: "",
    conclusion: "",
    prix: 0,
  });

  // Orientation
  const [orientationForm, setOrientationForm] = useState({
    atcd: "",
    presente: "",
    pour: "",
  });

  // Certificats
  const [dureeStop, setDureeStop] = useState(0);
  const [certificatDate, setCertificatDate] = useState(() => {
    const today = new Date().toISOString().split("T")[0];
    return today;
  });

  // Examens
  const [bioSelected, setBioSelected] = useState([]);
  const [explSelected, setExplSelected] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState("Biologiques");
  const [localError, setLocalError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [quickInvoiceItem, setQuickInvoiceItem] = useState({
    act: "",
    prix: "",
  });

  const [biologicalGroups, setBiologicalGroups] = useState([]);
  const [explorationGroups, setExplorationGroups] = useState([]);
  const [prescriptionDurations, setPrescriptionDurations] = useState([]);

  // Now the conditional return comes AFTER all hooks

  const handleQuickAddToInvoice = async (actName, defaultPrice = 0) => {
    if (!selectedConsultation) {
      toast.error("Veuillez sélectionner une consultation d'abord");
      return;
    }

    setQuickInvoiceItem({
      act: actName,
      prix: defaultPrice.toString(),
    });
    setShowInvoiceModal(true);
  };
  const loadPrescriptionDurations = async () => {
    try {
      const res = await api.get("/prescription-durations");
      setPrescriptionDurations(res.data || []);
    } catch (err) {
      console.error("Error loading prescription durations:", err);
      // Fallback to default durations if API fails
      const defaultDurations = [
        { ID: 1, DisplayText: "1 semaine", Days: 7 },
        { ID: 2, DisplayText: "2 semaines", Days: 14 },
        { ID: 3, DisplayText: "3 semaines", Days: 21 },
        { ID: 4, DisplayText: "4 semaines", Days: 28 },
        { ID: 5, DisplayText: "1 mois", Days: 30 },
        { ID: 6, DisplayText: "2 mois", Days: 60 },
        { ID: 7, DisplayText: "3 mois", Days: 90 },
      ];
      setPrescriptionDurations(defaultDurations);
    }
  };
  useEffect(() => {
    loadPrescriptionDurations();
  }, []);
  const getDisplayDuration = (days) => {
    const duration = prescriptionDurations.find(
      (d) => d.Days === parseInt(days)
    );
    return duration ? duration.DisplayText : `${days} jours`;
  };
  // Function to save quick invoice item
  const saveQuickInvoiceItem = async () => {
    if (!quickInvoiceItem.act || !quickInvoiceItem.prix) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      await api.post("/factures", {
        IDConsultation: selectedConsultation.id,
        Act: quickInvoiceItem.act,
        PrixAct: parseFloat(quickInvoiceItem.prix),
      });

      setShowInvoiceModal(false);
      setQuickInvoiceItem({ act: "", prix: "" });
      toast.success("Acte ajouté à la facture avec succès");

      // Refresh the facture items if we're on the Factures tab
      if (activeTab === "Factures") {
        // You might want to trigger a refresh here
      }
    } catch (err) {
      console.error("Error adding invoice item:", err);
      toast.error("Erreur lors de l'ajout à la facture");
    }
  };
  // Fetch common options
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const [medRes, formRes] = await Promise.all([
          api.get("/medicaments/all"),
          api.get("/formes"),
          api.get("/durees"),
        ]);
        setMedicaments(medRes.data || []);
        setFormes(formRes.data || []);
        //setDurees(durRes.data || []);
      } catch (err) {
        console.error("Erreur chargement options:", err);
      }
    };
    fetchBaseData();
  }, []);

  // Set initial consultations and selected
  // ✅ Fixed useEffect - only runs when patient changes
  useEffect(() => {
    const sortedCons = [...(patient.consultations || [])].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    setConsultations(sortedCons);

    // Only auto-select if we have consultations AND no consultation is currently selected
    if (sortedCons.length > 0 && !selectedConsultation) {
      setSelectedConsultation(sortedCons[0]);
      setActiveTab("Consultation");
    }
  }, [patient.id]); // Only depend on patient.id, not the entire consultations array
  const fetchConsultations = useCallback(async () => {
    try {
      const res = await api.get(
        `/medical/consultations?patientId=${patient.id}`
      );
      const mapped = res.data
        .map((c) => ({
          id: c.ID,
          date: c.DateConsultation || "",
          diagnostic: c.Motif || "Consultation",
          conclusion: c.Conclusion || "",
          Prix: c.Prix || 0,
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setConsultations(mapped);
    } catch (err) {
      console.error("Error fetching consultations:", err);
      toast.error("Erreur lors du chargement des consultations");
    }
  }, [patient.id]);

  // ✅ Fixed - only reset when patient actually changes
  const previousPatientId = useRef(patient.id);

  useEffect(() => {
    if (previousPatientId.current !== patient.id) {
      setSelectedConsultation(null);
      previousPatientId.current = patient.id;
    }
    fetchConsultations();
  }, [patient.id, fetchConsultations]);

  // Update handleDeleteConsultation to use api instead of fetch
  const handleDeleteConsultation = async (consultationId) => {
    console.log(userRole);
    if (userRole.userRole === "secretaire") {
      toast.error("Action non autorisée ❌");
      return;
    }
    if (
      !window.confirm("Êtes-vous sûr de vouloir supprimer cette consultation ?")
    ) {
      return;
    }

    try {
      const response = await api.delete(
        `/medical/consultations/${consultationId}`
      );

      if (response.status === 200) {
        // Refresh the consultations list
        await fetchConsultations();
        toast.success("Consultation supprimée avec succès");
      } else {
        toast.error("Erreur lors de la suppression de la consultation");
      }
    } catch (error) {
      console.error("Error deleting consultation:", error);
      toast.error("Erreur lors de la suppression de la consultation");
    }
  };
  // Load tab data when activeTab or selected changes
  // ✅ Fixed tab loading useEffect
  useEffect(() => {
    if (!selectedConsultation || !activeTab) return;

    const loadData = async () => {
      setLocalError(null);
      try {
        switch (activeTab) {
          case "Échographie":
            await loadEchographie(selectedConsultation.id);
            break;
          case "Doppler":
            await loadDataDoppler(selectedConsultation.id);
            break;
          case "Thyroide":
            await loadDataThyroide(selectedConsultation.id);
            break;
          case "ECG":
            await loadDataECG(selectedConsultation.id);
            break;
          case "Ordonnances":
            await loadOrdonnances(selectedConsultation.id);
            break;
          case "Examens Complémentaires":
            await Promise.all([
              loadExamensBio(selectedConsultation.id),
              loadExamensExploration(selectedConsultation.id),
            ]);
            break;
          case "Certificats":
            await loadCertificat(selectedConsultation.id);
            break;
          case "Orientation":
            await loadOrientation(selectedConsultation.id);
            break;
          case "Consultation":
            setConsultForm({
              motif: selectedConsultation.diagnostic || "",
              conclusion: selectedConsultation.conclusion || "",
              prix: selectedConsultation.Prix || 0,
            });
            break;
          default:
            break;
        }
      } catch (err) {
        setLocalError("Erreur lors du chargement des données");
        console.error(`Erreur load ${activeTab}:`, err);
      }
    };

    loadData();
  }, [activeTab, selectedConsultation?.id]); // ✅ Proper dependencies

  // Add this function to load default data
  const loadDefaultProcedureData = async (procedureType) => {
    try {
      const res = await api.get(
        `/procedure-templates/default-data?procedureType=${procedureType}`
      );
      return res.data;
    } catch (err) {
      console.error(`Error loading default data for ${procedureType}:`, err);
      return {};
    }
  };
  const loadEchographie = async (consultId) => {
    const parseField = (fieldValue) => {
      if (!fieldValue) return [""];

      try {
        const parsedArray = JSON.parse(fieldValue);

        if (Array.isArray(parsedArray)) {
          return parsedArray.map(
            (item) => item.desc || item.conc || item.cat || ""
          );
        }

        return [""];
      } catch {
        return [String(fieldValue)];
      }
    };

    try {
      const res = await api.get(`/echographies?consultationId=${consultId}`);
      if (res.data.length > 0) {
        const d = res.data[0];
        console.log("Données brutes de l'échographie:", d); // Pour debug

        setEchographieForm({
          Foie: parseField(d.Foie),
          Troncporte: parseField(d.Troncporte),
          Veines: parseField(d.Veines),
          vesicule: parseField(d.vesicule),
          voiebiliare: parseField(d.voiebiliare),
          rate: parseField(d.rate),
          pancrea: parseField(d.pancrea),
          reindroite: parseField(d.reindroite),
          reingauche: parseField(d.reingauche),
          autresecho: parseField(d.autresecho),
          conclusionecho: parseField(d.conclusionecho),
          catecho: parseField(d.catecho),
        });
      } else {
        // Load default template data for echographie
        const defaultData = await loadDefaultProcedureData("echographie");
        console.log("Default echographie data:", defaultData); // Debug log

        setEchographieForm({
          Foie: defaultData["Foie"] || [""],
          Troncporte: defaultData["Tronc porte"] || [""],
          Veines: defaultData["Veines"] || [""],
          vesicule: defaultData["Vésicule"] || [""],
          voiebiliare: defaultData["Voie biliaire"] || [""],
          rate: defaultData["Rate"] || [""],
          pancrea: defaultData["Pancréas"] || [""],
          reindroite: defaultData["Rein droit"] || [""],
          reingauche: defaultData["Rein gauche"] || [""],
          autresecho: defaultData["Autres"] || [""],
          conclusionecho: defaultData["Conclusion"] || [""],
          catecho: defaultData["CAT (Conduite à tenir)"] || [""],
        });
      }
    } catch (err) {
      console.error("Erreur load echographie:", err);
      // Fallback to empty form
      setEchographieForm({
        Foie: [""],
        Troncporte: [""],
        Veines: [""],
        vesicule: [""],
        voiebiliare: [""],
        rate: [""],
        pancrea: [""],
        reindroite: [""],
        reingauche: [""],
        autresecho: [""],
        conclusionecho: [""],
        catecho: [""],
      });
    }
  };
  const loadDataThyroide = async (consultId) => {
    const parseField = (fieldValue) => {
      if (!fieldValue) return [""];

      try {
        const parsedArray = JSON.parse(fieldValue);

        if (Array.isArray(parsedArray)) {
          return parsedArray.map(
            (item) => item.desc || item.conc || item.cat || item || ""
          );
        }

        return [""];
      } catch {
        return [String(fieldValue)];
      }
    };

    try {
      const res = await api.get(`/thyroide/data?consultationId=${consultId}`);
      if (res.data.length > 0) {
        const d = res.data[0];
        console.log("Données brutes de la thyroïde:", d); // Pour debug

        // Get the thyroide type and set it
        const thyroideType = d.ThyroideType || "avec_schema";
        setThyroideType(thyroideType);

        // Define field mappings based on thyroide type
        const fieldMappings = {
          avec_schema: [
            "Indication",
            "Technique",
            "Resultats",
            "Conclusion",
            "CAT",
          ],
          sans_schema: ["Technique", "Resultats", "Conclusion", "CAT"],
          thyroidectomie: ["Technique", "Resultats", "Conclusion", "CAT"],
          thyroidite: ["Technique", "Resultats", "Conclusion", "CAT"],
        };

        const currentFields =
          fieldMappings[thyroideType] || fieldMappings.avec_schema;

        // Build the thyroide form data
        const thyroideFormData = {};
        currentFields.forEach((field) => {
          thyroideFormData[field] = parseField(d[field]);
        });

        setThyroideForm(thyroideFormData);
        console.log("Données thyroïde chargées:", thyroideFormData);
      } else {
        // Load default template data for thyroide
        const defaultData = await loadDefaultProcedureData("thyroide");
        console.log("Default thyroide data:", defaultData); // Debug log

        // Initialize with default template data for "avec_schema" type
        setThyroideType("avec_schema");

        setThyroideForm({
          Indication: defaultData["Indication"] || [""],
          Technique: defaultData["Technique"] || [""],
          Resultats: defaultData["Resultats"] || [""],
          Conclusion: defaultData["Conclusion"] || [""],
          CAT: defaultData["CAT"] || [""],
        });
      }
    } catch (err) {
      console.error("Erreur load thyroide:", err);
      // Fallback to empty form for "avec_schema" type
      setThyroideType("avec_schema");
      setThyroideForm({
        Indication: [""],
        Technique: [""],
        Resultats: [""],
        Conclusion: [""],
        CAT: [""],
      });
    }
  };
  const loadDataECG = async (consultId) => {
    try {
      const res = await api.get(`/ecg/data?consultationId=${consultId}`);

      if (res.data.length > 0) {
        const d = res.data[0];
        console.log("Données brutes de l'ECG:", d);

        setEcgForm({
          Examen: Array.isArray(d.Examen) ? d.Examen : [d.Examen || ""],
          Electrocardiogramme: Array.isArray(d.Electrocardiogramme)
            ? d.Electrocardiogramme
            : [d.Electrocardiogramme || ""],
          Conclusion: Array.isArray(d.Conclusion)
            ? d.Conclusion
            : [d.Conclusion || ""],
        });
      } else {
        setEcgForm({
          Examen: [""],
          Electrocardiogramme: [""],
          Conclusion: [""],
        });
      }
    } catch (err) {
      console.error("Erreur load ECG:", err);
      setEcgForm({
        Examen: [""],
        Electrocardiogramme: [""],
        Conclusion: [""],
      });
    }
  };
  // In PatientManager.jsx
  const loadDataDoppler = async (consultId) => {
    try {
      const res = await api.get(`/doppler/data?consultationId=${consultId}`);

      if (res.data.length > 0) {
        const d = res.data[0];
        console.log("Données brutes du Doppler:", d);

        let dopplerFormData = {};

        // Parse the MI field which contains our dynamic data
        if (d.MI) {
          try {
            const miData = JSON.parse(d.MI);
            if (typeof miData === "object" && miData !== null) {
              // This is our dynamic field data structure
              console.log("Using MI dynamic field data:", miData);

              // We need to map field labels to template IDs
              // Load templates to get the mapping
              const templatesRes = await api.get(
                `/dynamic-templates/templates?category=${d.DopplerType}&subType=${d.DopplerSubType}`
              );

              const fieldMapping = {};
              templatesRes.data.forEach((template) => {
                fieldMapping[template.DisplayName || template.TemplateName] =
                  template.ID;
              });

              // Map the dynamic fields to template IDs
              Object.keys(miData).forEach((fieldName) => {
                const templateId = fieldMapping[fieldName];
                if (templateId && miData[fieldName]) {
                  dopplerFormData[templateId] = miData[fieldName];
                }
              });
            }
          } catch (parseError) {
            console.error("Error parsing MI data:", parseError);
          }
        }

        // If no dynamic data found, check other fields
        if (Object.keys(dopplerFormData).length === 0) {
          // Handle old static data format...
        }

        // Update DopplerManager state
        setDopplerForm(dopplerFormData);
        if (d.DopplerType) setDopplerType(d.DopplerType);
        if (d.DopplerSubType) setDopplerSubType(d.DopplerSubType);
      } else {
        // No existing data
        setDopplerForm({});
      }
    } catch (err) {
      console.error("Erreur load doppler:", err);
      setDopplerForm({});
    }
  };
  const loadOrdonnances = async (consultId) => {
    try {
      const res = await api.get(
        `/medical/ordonnances?consultationId=${consultId}`
      );

      setPrescriptionItems(
        (res.data || []).map((o) => {
          // Déterminer le type de prescription
          const prescriptionType = o.Quantite === "QSP" ? "duree" : "quantite";

          // Pour les prescriptions de durée, trouver le DisplayText
          let displayDuree = "";
          if (prescriptionType === "duree" && o.Duree) {
            const duration = prescriptionDurations.find(
              (d) => d.Days === parseInt(o.Duree)
            );
            displayDuree = duration ? duration.DisplayText : `${o.Duree} jours`;
          }

          return {
            id: o.ID,
            medicament: o.Article || "",
            prescriptionType: prescriptionType,
            quantite: o.Quantite || "",
            forme: o.Forme || "",
            detail: o.Detail || "",
            duree: o.Duree || "",
            displayDuree: displayDuree, // ← Ajouter cette ligne
          };
        })
      );
    } catch (err) {
      console.error("Erreur load ordonnances:", err);
      setPrescriptionItems([]);
    }
  };

  const loadExamensBio = async () => {
    if (!selectedConsultation) return;
    try {
      const { data } = await api.get(
        `/examens/by-consultation/${selectedConsultation.id}`
      );

      const loadedItems = data.map((r) => r.detail);
      setBioSelected(loadedItems);
    } catch (err) {
      toast.error("Erreur lors du chargement des examens biologiques !");
      console.error("Erreur load examens bio:", err);
    }
  };

  const loadExamensExploration = async (consultId) => {
    try {
      const res = await api.get(
        `/examens/by-consultation-exploration?consultationId=${consultId}`
      );

      if (res.data.length > 0) {
        // Collect all detail names directly
        const selectedItems = res.data.map((r) => r.detail).filter(Boolean);
        setExplSelected(selectedItems);
      } else {
        setExplSelected([]);
      }
    } catch (err) {
      console.error("Erreur load examens exploration:", err);
      setExplSelected([]);
    }
  };

  const loadCertificat = async (consultId) => {
    if (!consultId) {
      console.error("❌ No consultation ID provided");
      return;
    }

    try {
      console.log("🔍 Loading certificat for consultation:", consultId);
      const res = await api.get(`/certificats?consultationId=${consultId}`);

      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const certificatData = res.data[0];
        console.log("✅ Found existing certificat:", certificatData);

        if (certificatData && certificatData.DateDebut) {
          setDureeStop(certificatData.DureeStop || "");

          // ✅ Use your utility to fix UTC date to local
          const formattedDate = fixUTCDateToLocal(certificatData.DateDebut);
          console.log("📅 Local formatted date:", formattedDate);

          // If you want to store it as `YYYY-MM-DD` for input type="date"
          const [d, m, y] = formattedDate.split("/");
          const isoDate = `${y}-${m}-${d}`;

          setCertificatDate(isoDate);
          return;
        }
      }

      // No data found → default to today
      console.log("❌ No valid certificat found, using today's date");
      setDureeStop("");
      const today = new Date().toISOString().split("T")[0];
      setCertificatDate(today);
    } catch (err) {
      console.error("❌ Erreur load certificat:", err);
      setDureeStop("");
      const today = new Date().toISOString().split("T")[0];
      setCertificatDate(today);
    }
  };

  const loadOrientation = async (consultId) => {
    try {
      const res = await api.get(`/orientations?consultationId=${consultId}`);
      if (res.data.length > 0) {
        const d = res.data[0];
        setOrientationForm({
          atcd: d.ATCD || "",
          presente: d.Presente || "",
          pour: d.Pour || "",
        });
      } else {
        setOrientationForm({ atcd: "", presente: "", pour: "" });
      }
    } catch (err) {
      console.error("Erreur load orientation:", err);
      setOrientationForm({ atcd: "", presente: "", pour: "" });
    }
  };

  // Save functions
  const saveConsultation = async () => {
    if (!selectedConsultation) return;
    try {
      await api.put(`/medical/consultations/${selectedConsultation.id}`, {
        Motif: consultForm.motif,
        Conclusion: consultForm.conclusion,
        Prix: consultForm.prix,
      });
      setSelectedConsultation((prev) => ({
        ...prev,
        diagnostic: consultForm.motif,
        conclusion: consultForm.conclusion,
        Prix: consultForm.prix,
      }));
      setLocalError(null);
      toast.success("Consultation ajoutée avec succès ✅");
    } catch (err) {
      setLocalError("Erreur lors de la sauvegarde de la consultation");
      toast.error("Erreur lors de l'ajout de la consultation ❌");
      console.error(err);
    }
  };
  useEffect(() => {
    const sortedCons = [...(patient.consultations || [])].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    setConsultations(sortedCons);
    setSelectedConsultation(null); // ❌ stop auto-opening the last one
    setActiveTab("Consultation"); // ✅ default tab remains Consultation
  }, [patient.consultations]);

  const saveEchographie = async () => {
    if (!selectedConsultation) return;

    // Préparer le format correct pour la base de données
    const prepareField = (fieldValue, isConclusion = false, isCAT = false) => {
      // fieldValue = ["line1", "line2", ...]
      if (!Array.isArray(fieldValue)) return JSON.stringify([]);

      // build the correct array
      const mapped = fieldValue.map((v) => {
        if (isConclusion) return { conc: v };
        if (isCAT) return { cat: v };
        return { desc: v };
      });

      return JSON.stringify(mapped);
    };

    try {
      await api.post("/echographies", {
        IDConsultation: selectedConsultation.id || selectedConsultation.ID,
        Foie: prepareField(echographieForm.Foie),
        Troncporte: prepareField(echographieForm.Troncporte),
        Veines: prepareField(echographieForm.Veines),
        vesicule: prepareField(echographieForm.vesicule),
        voiebiliare: prepareField(echographieForm.voiebiliare),
        rate: prepareField(echographieForm.rate),
        pancrea: prepareField(echographieForm.pancrea),
        reindroite: prepareField(echographieForm.reindroite),
        reingauche: prepareField(echographieForm.reingauche),
        autresecho: prepareField(echographieForm.autresecho),
        conclusionecho: prepareField(echographieForm.conclusionecho, true),
        catecho: prepareField(echographieForm.catecho, false, true),
      });
      toast.success("Échographie sauvegardée avec succès ✅");
    } catch (err) {
      console.error("Erreur sauvegarde échographie:", err);
      toast.error("Erreur lors de la sauvegarde ❌");
    }
  };

  const handleAddPrescriptionItem = async () => {
    const { medicament, prescriptionType, quantite, forme, detail, duree } =
      newMedication;

    // Validation based on prescription type
    if (
      !medicament ||
      !forme ||
      !detail ||
      !selectedConsultation ||
      (prescriptionType === "quantite" && !quantite) ||
      (prescriptionType === "duree" && !duree)
    ) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }

    const medValue = medicament.trim();
    try {
      // Check if medicament exists in our local list
      const existing = medicaments.find((m) => m.NomMed === medValue);

      // If medicament doesn't exist in our list, create it in database
      if (!existing) {
        try {
          // Use the correct endpoint for creating medicaments
          const medRes = await api.post("/medicaments", { NomMed: medValue });
          const newMed = { id: medRes.data.id, NomMed: medValue };
          setMedicaments((prev) => [...prev, newMed]);
          toast.success(`Médicament "${medValue}" ajouté à la base de données`);
        } catch (medErr) {
          console.error("Error creating medicament:", medErr);
          // If medicament creation fails but it might exist in DB, continue anyway
          // We'll try to add the prescription regardless
        }
      }
      let displayDuree = "";
      if (prescriptionType === "duree") {
        const durationObj = prescriptionDurations.find(
          (d) => d.Days === parseInt(duree)
        );
        displayDuree = durationObj ? durationObj.DisplayText : `${duree} jours`;
      }
      // For database, store "QSP" when prescription type is duration
      const dbQuantite = prescriptionType === "duree" ? "QSP" : quantite;
      const dbDuree = prescriptionType === "duree" ? duree : "";

      const payload = {
        IDConsultation: selectedConsultation.id,
        Article: medValue,
        Quantite: dbQuantite,
        Forme: forme,
        Detail: detail,
        Duree: dbDuree,
        DisplayDuree: displayDuree, // ← Stocker directement en base
      };

      console.log("Sending payload:", payload);

      // Add the prescription
      const res = await api.post("/medical/ordonnances", payload);

      const newItem = {
        id: res.data.insertId,
        medicament: medValue,
        prescriptionType,
        quantite: prescriptionType === "quantite" ? quantite : "QSP",
        forme,
        detail,
        duree: prescriptionType === "duree" ? duree : "",
        displayDuree: displayDuree,
      };

      setPrescriptionItems((prev) => [...prev, newItem]);
      setNewMedication({
        medicament: "",
        prescriptionType: "quantite",
        quantite: "1",
        forme: "",
        detail: "",
        duree: "",
      });
      setFilteredDetails([]);
      setLocalError(null);

      toast.success("Médicament ajouté avec succès ✅");
    } catch (err) {
      console.error("Error adding prescription:", err);
      console.error("Error response:", err.response?.data);

      // More specific error handling
      if (err.response?.status === 404) {
        setLocalError(
          "Endpoint non trouvé - vérifiez la configuration du serveur"
        );
        toast.error("Erreur de configuration serveur ❌");
      } else if (err.response?.status === 500) {
        setLocalError("Erreur serveur - veuillez réessayer");
        toast.error("Erreur serveur ❌");
      } else {
        setLocalError("Erreur lors de l'ajout du médicament");
        toast.error("Erreur lors de l'ajout du médicament ❌");
      }
    }
  };

  const handleDeletePrescriptionItem = async (itemId) => {
    try {
      await api.delete(`/medical/ordonnances/${itemId}`);
      setPrescriptionItems((prev) => prev.filter((i) => i.id !== itemId));
      setLocalError(null);
    } catch (err) {
      setLocalError("Erreur lors de la suppression");
      console.error(err);
    }
  };

  const handleFormeChange = async (e) => {
    const selectedFormeName = e.target.value;
    setNewMedication((prev) => ({
      ...prev,
      forme: selectedFormeName,
      detail: "", // reset detail when forme changes
    }));

    if (!selectedFormeName) {
      setFilteredDetails([]);
      return;
    }

    // find the selected forme ID from formes list
    const selectedForme = formes.find((f) => f.NomForme === selectedFormeName);
    if (!selectedForme) {
      setFilteredDetails([]);
      return;
    }

    try {
      const res = await api.get(`/details?formeId=${selectedForme.ID}`);
      setFilteredDetails(res.data || []);
    } catch (err) {
      console.error("Erreur lors du chargement des détails:", err);
      setFilteredDetails([]);
    }
  };

  const saveExamensBio = async () => {
    if (!selectedConsultation) return;

    const selectedTests = [];
    for (const group of biologicalGroups) {
      for (const item of group.items) {
        if (bioSelected.includes(item)) {
          selectedTests.push({
            group: group.name,
            detail: item,
          });
        }
      }
    }

    try {
      await api.post("/examens/save-bio", {
        IDConsultation: selectedConsultation.id,
        type: "biologique",
        selectedTests,
      });

      toast.success("Examens biologiques sauvegardés !");
    } catch (err) {
      toast.error("Erreur lors de la sauvegarde !");
      console.error(err);
    }
  };

  const saveExamensExploration = async () => {
    if (!selectedConsultation) return;

    const selectedTests = [];
    for (const group of explorationGroups) {
      for (const item of group.items) {
        if (explSelected.includes(item)) {
          selectedTests.push({
            group: group.name,
            detail: item,
          });
        }
      }
    }

    try {
      await api.post("/examens/save-bio", {
        IDConsultation: selectedConsultation.id,
        type: "exploration",
        selectedTests,
      });

      toast.success("Examens d'exploration sauvegardés !");
    } catch (err) {
      toast.error("Erreur lors de la sauvegarde !");
      console.error(err);
    }
  };

  const saveCertificat = async () => {
    if (!selectedConsultation) return;
    try {
      const res = await api.post("/certificats", {
        IDConsultation: selectedConsultation.id,
        DureeStop: dureeStop || 0,
        DateDebut: certificatDate, // ✅ directly in YYYY-MM-DD
      });

      toast.success(res.data.message || "Certificat sauvegardé ✅");
      setLocalError(null);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du certificat:", err);
      setLocalError("Erreur lors de la sauvegarde du certificat");
      toast.error("Erreur lors de la sauvegarde ❌");
    }
  };

  const saveOrientation = async () => {
    if (!selectedConsultation) return;
    try {
      const res = await api.post("/orientations", {
        IDConsultation: selectedConsultation.id,
        ATCD: orientationForm.atcd,
        Presente: orientationForm.presente,
        Pour: orientationForm.pour,
      });

      toast.success(res.data.message || "Orientation sauvegardée ✅");
      setLocalError(null);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde de l'orientation:", err);
      setLocalError("Erreur lors de la sauvegarde");
      toast.error("Erreur lors de la sauvegarde ❌");
    }
  };

  const handleStartConsultation = () => {
    if (userRole.userRole === "secretaire") {
      toast.error("Action non autorisée ❌");
      return;
    }
    setShowMotifModal(true);
    setMotif("");
  };

  const handleSubmitMotif = async () => {
    if (!motif.trim()) return;
    setLoading(true);
    try {
      await api.post("/medical/start-consultation", {
        IDPatient: patient.id,
        Motif: motif,
      });
      // Refetch consultations
      const res = await api.get(
        `/medical/consultations?patientId=${patient.id}`
      );
      const mapped = res.data
        .map((c) => ({
          id: c.ID,
          date: c.DateConsultation || "",
          diagnostic: c.Motif || "Consultation",
          conclusion: c.Conclusion || "",
          Prix: c.Prix || 0,
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      setConsultations(mapped);
      if (mapped.length > 0) {
        setSelectedConsultation(mapped[0]);
        setActiveTab("Consultation");
      }
      setShowMotifModal(false);
      setMotif("");
      toast.success("Consultation démarrée avec succès ✅");
    } catch (err) {
      setLocalError("Erreur lors du démarrage de la consultation");
      toast.error("Erreur lors du démarrage de la consultation ❌");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Biological groups for examens
  useEffect(() => {
    api
      .get("/biological-groups/biological-groups")
      .then((res) => {
        const transformedGroups = res.data.map((group) => ({
          ...group,
          items: group.items.map((item) => item.name || item), // Extract names
        }));
        setBiologicalGroups(transformedGroups);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    api
      .get("/explorations/exploration-groups")
      .then((res) => {
        const transformedGroups = res.data.map((group) => ({
          ...group,
          items: group.items.map((item) => item.name || item), // Extract names
        }));
        setExplorationGroups(transformedGroups);
      })
      .catch((err) => console.error("Erreur chargement explorations:", err));
  }, []);
  if (userRole === "secretaire") {
    return (
      <div className="bg-bg-card p-8 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-text-main">
              Fiche Patient - Vue Limitée
            </h2>
            <p className="text-text-secondary mt-2">
              {patient.name} • {calculateAge(patient.dob)} ans •{" "}
              {patient.weight || "—"} kg
            </p>
          </div>
          <button
            onClick={onBack}
            className="flex items-center bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition shadow-sm"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Retour à la liste
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="p-4 bg-secondary rounded-lg">
            <h3 className="font-semibold text-text-main mb-2">
              Informations Personnelles
            </h3>
            <p>
              <strong>Nom:</strong> {patient.nom}
            </p>
            <p>
              <strong>Prénom:</strong> {patient.prenom}
            </p>
            <p>
              <strong>Date de naissance:</strong>{" "}
              {fixUTCDateToLocal(patient.dob)}
            </p>
            <p>
              <strong>Âge:</strong> {calculateAge(patient.dob)} ans
            </p>
            <p>
              <strong>Poids:</strong> {patient.weight || "—"} kg
            </p>
          </div>

          <div className="p-4 bg-secondary rounded-lg">
            <h3 className="font-semibold text-text-main mb-2">Antécédents</h3>
            <p>{patient.history || "Aucun antécédent renseigné"}</p>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-center">
            🔒 Accès limité - Seul le personnel médical peut accéder aux
            consultations et examens
          </p>
        </div>
      </div>
    );
  }
  const renderContent = () => {
    if (localError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
          {localError}
        </div>
      );
    }

    switch (activeTab) {
      case "Consultation":
        return (
          <div className="max-w-4xl space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-3 text-text-main">
                  Date
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={formatDateEuropean(selectedConsultation?.date || "")}
                    readOnly
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-text-main"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-3 text-text-main">
                  Prix de Consultation(DZD)
                </label>
                <input
                  type="number"
                  value={consultForm.prix}
                  onChange={(e) =>
                    setConsultForm((prev) => ({
                      ...prev,
                      prix: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg-card text-text-main"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ce prix sera utilisé pour la facture
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-3 text-text-main">
                Motif
              </label>
              <textarea
                rows={4}
                value={consultForm.motif}
                onChange={(e) =>
                  setConsultForm((prev) => ({ ...prev, motif: e.target.value }))
                }
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg-card text-text-main"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-3 text-text-main">
                Conclusion
              </label>
              <textarea
                rows={8}
                value={consultForm.conclusion}
                onChange={(e) =>
                  setConsultForm((prev) => ({
                    ...prev,
                    conclusion: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg-card text-text-main"
              />
            </div>
            <div className="flex justify-end space-x-4 pt-6 border-t border-border">
              <button
                onClick={saveConsultation}
                className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center transition shadow-sm"
              >
                Sauvegarder
              </button>
              <PrintConsultationPDF
                patient={patient}
                consultation={selectedConsultation}
                consultForm={consultForm}
              />
            </div>
          </div>
        );
      // In the PatientDetail component, replace the current Échographie case with:

      case "Échographie":
        return (
          <EchographieManager
            patient={patient}
            consultation={selectedConsultation}
            onSave={saveEchographie}
            onQuickAddToInvoice={handleQuickAddToInvoice}
          />
        );
      case "Doppler":
        return (
          <DopplerManager
            patient={patient}
            consultation={selectedConsultation}
            dopplerType={dopplerType}
            dopplerSubType={dopplerSubType}
            dopplerForm={dopplerForm}
            setDopplerType={setDopplerType}
            setDopplerSubType={setDopplerSubType}
            setDopplerForm={setDopplerForm}
            onSave={() => {}}
            onQuickAddToInvoice={handleQuickAddToInvoice}
          />
        );
      case "Thyroide":
        return (
          <ThyroideManager
            patient={patient}
            consultation={selectedConsultation}
            onSave={() => {}}
            onQuickAddToInvoice={handleQuickAddToInvoice}
          />
        );
      case "ECG":
        return (
          <ECGManager
            patient={patient}
            consultation={selectedConsultation}
            ecgForm={ecgForm}
            setEcgForm={setEcgForm}
            onQuickAddToInvoice={handleQuickAddToInvoice}
          />
        );
      case "Ordonnances":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-text-main">Ordonnances</h3>
              <OrdonnancePDF
                patient={patient}
                consultation={selectedConsultation}
                prescriptionItems={prescriptionItems}
                prescriptionDurations={prescriptionDurations}
              />
            </div>
            <div className="p-6 bg-bg-card rounded-lg border border-border shadow-sm">
              <h4 className="text-lg font-semibold mb-6 text-text-main">
                Ajouter un médicament
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-text-main">
                    Médicament
                  </label>
                  <input
                    type="text"
                    value={newMedication.medicament}
                    onChange={(e) =>
                      setNewMedication((prev) => ({
                        ...prev,
                        medicament: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                    placeholder="Tapez le nom du médicament..."
                    list="med-list"
                  />
                  <datalist id="med-list">
                    {medicaments.map((med) => (
                      <option key={med.id} value={med.NomMed} />
                    ))}
                  </datalist>
                </div>

                {/* --- Type de prescription --- */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-text-main">
                    Type
                  </label>
                  <select
                    value={newMedication.prescriptionType}
                    onChange={(e) =>
                      setNewMedication((prev) => ({
                        ...prev,
                        prescriptionType: e.target.value,
                        quantite:
                          e.target.value === "duree" ? "QSP" : prev.quantite,
                        duree: e.target.value === "quantite" ? "" : prev.duree,
                      }))
                    }
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                  >
                    <option key="quantite" value="quantite">
                      Quantité
                    </option>
                    <option key="duree" value="duree">
                      Durée (QSP)
                    </option>
                  </select>
                </div>

                {/* --- Quantité (only show if type is "quantite") --- */}
                {newMedication.prescriptionType === "quantite" && (
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-text-main">
                      Quantité
                    </label>
                    <select
                      value={newMedication.quantite || "1"}
                      onChange={(e) =>
                        setNewMedication((prev) => ({
                          ...prev,
                          quantite: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((q) => (
                        <option key={q} value={q}>
                          {q} boite{q > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* --- Durée (only show if type is "duree") --- */}
                {newMedication.prescriptionType === "duree" && (
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-text-main">
                      Durée
                    </label>
                    <select
                      value={newMedication.duree}
                      onChange={(e) =>
                        setNewMedication((prev) => ({
                          ...prev,
                          duree: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                    >
                      <option key="empty-duree" value="">
                        Choisir...
                      </option>
                      {prescriptionDurations.map((duration) => (
                        <option key={duration.ID} value={duration.Days}>
                          {duration.DisplayText}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* --- Forme --- */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-text-main">
                    Forme
                  </label>
                  <select
                    value={newMedication.forme}
                    onChange={handleFormeChange}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                  >
                    <option key="empty-forme" value="">
                      Choisir...
                    </option>
                    {formes.map((f) => (
                      <option key={f.ID} value={f.NomForme}>
                        {f.NomForme}
                      </option>
                    ))}
                  </select>
                </div>

                {/* --- Détail --- */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-text-main">
                    Détail
                  </label>
                  <select
                    value={newMedication.detail}
                    onChange={(e) =>
                      setNewMedication((prev) => ({
                        ...prev,
                        detail: e.target.value,
                      }))
                    }
                    disabled={
                      !newMedication.forme || filteredDetails.length === 0
                    }
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main disabled:bg-secondary disabled:cursor-not-allowed"
                  >
                    <option key="empty-detail" value="">
                      Choisir...
                    </option>
                    {filteredDetails.map((d) => (
                      <option key={d.ID} value={d.NomDetail}>
                        {d.NomDetail}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleAddPrescriptionItem}
                  disabled={
                    !newMedication.medicament ||
                    !newMedication.forme ||
                    !newMedication.detail ||
                    (newMedication.prescriptionType === "quantite" &&
                      !newMedication.quantite) ||
                    (newMedication.prescriptionType === "duree" &&
                      !newMedication.duree)
                  }
                  className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center transition shadow-sm"
                >
                  <PlusCircleIcon className="h-4 w-4 mr-2" />
                  Ajouter Médicament
                </button>
              </div>
            </div>

            {/* Rest of the component remains the same for displaying the list */}
            {prescriptionItems.length > 0 && (
              <div className="p-6 bg-bg-card rounded-lg border border-border shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-lg font-semibold text-text-main">
                    Liste des médicaments ({prescriptionItems.length})
                  </h4>
                  <OrdonnancePDF
                    patient={patient}
                    consultation={selectedConsultation}
                    prescriptionItems={prescriptionItems}
                  />
                </div>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-primary text-white">
                      <tr>
                        <th className="py-3 px-6 text-left text-xs font-medium uppercase tracking-wider">
                          Médicament
                        </th>
                        <th className="py-3 px-6 text-left text-xs font-medium uppercase tracking-wider">
                          Type
                        </th>
                        <th className="py-3 px-6 text-left text-xs font-medium uppercase tracking-wider">
                          Valeur
                        </th>
                        <th className="py-3 px-6 text-left text-xs font-medium uppercase tracking-wider">
                          Forme
                        </th>
                        <th className="py-3 px-6 text-left text-xs font-medium uppercase tracking-wider">
                          Détail
                        </th>
                        <th className="py-3 px-6 text-left text-xs font-medium uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-bg-card">
                      {prescriptionItems.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-secondary/50 transition"
                        >
                          <td className="py-4 px-6 font-medium text-text-main">
                            {item.medicament}
                          </td>
                          <td className="py-4 px-6 font-medium text-text-main">
                            {item.prescriptionType === "quantite"
                              ? "Quantité"
                              : "Durée"}
                          </td>
                          <td className="py-4 px-6 text-text-main">
                            {item.prescriptionType === "quantite"
                              ? `${item.quantite} boite${
                                  item.quantite > 1 ? "s" : ""
                                }`
                              : `Pendant ${getDisplayDuration(item.duree)}`}
                          </td>
                          <td className="py-4 px-6 text-text-main">
                            {item.forme}
                          </td>
                          <td className="py-4 px-6 text-text-main">
                            {item.detail}
                          </td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() =>
                                handleDeletePrescriptionItem(item.id)
                              }
                              className="text-red-500 hover:text-red-700 font-medium transition"
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {prescriptionItems.length === 0 && (
              <div className="text-center py-12 bg-secondary/20 rounded-lg border-2 border-dashed border-secondary">
                <PlusCircleIcon className="h-16 w-16 text-text-secondary mx-auto mb-4" />
                <p className="text-lg text-text-secondary font-medium">
                  Aucun médicament ajouté
                </p>
                <p className="text-text-secondary mt-2">
                  Utilisez le formulaire ci-dessus pour ajouter des médicaments
                  à l'ordonnance.
                </p>
              </div>
            )}
          </div>
        );

      case "Examens Complémentaires":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-text-main">
                Examens Complémentaires
              </h3>
              <PrintExamensPDF
                patient={patient}
                consultation={selectedConsultation}
                bioSelected={bioSelected}
                explSelected={explSelected}
                biologicalGroups={biologicalGroups}
                explorationGroups={explorationGroups}
              />
            </div>
            <div className="border-b border-border pb-6">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveSubTab("Biologiques")}
                  className={`py-2 px-6 rounded-t-lg font-medium transition ${
                    activeSubTab === "Biologiques"
                      ? "bg-primary text-white shadow-sm"
                      : "bg-bg-card text-text-secondary hover:text-text-main"
                  }`}
                >
                  Examens Biologiques
                </button>
                <button
                  onClick={() => setActiveSubTab("Explorations")}
                  className={`py-2 px-6 rounded-t-lg font-medium transition ${
                    activeSubTab === "Explorations"
                      ? "bg-primary text-white shadow-sm"
                      : "bg-bg-card text-text-secondary hover:text-text-main"
                  }`}
                >
                  Explorations
                </button>
              </nav>
            </div>

            {activeSubTab === "Biologiques" && (
              <div className="space-y-8">
                {biologicalGroups.map((group, gIdx) => {
                  const groupItems = group.items || [];
                  const selectedItemsInGroup = bioSelected.filter((item) =>
                    groupItems.includes(item)
                  );
                  const allSelected =
                    groupItems.length > 0 &&
                    selectedItemsInGroup.length === groupItems.length;
                  const someSelected =
                    selectedItemsInGroup.length > 0 && !allSelected;

                  const handleGroupToggle = (checked) => {
                    if (checked) {
                      // Add all items from this group that aren't already selected
                      const itemsToAdd = groupItems.filter(
                        (item) => !bioSelected.includes(item)
                      );
                      setBioSelected((prev) => [...prev, ...itemsToAdd]);
                    } else {
                      // Remove all items from this group
                      setBioSelected((prev) =>
                        prev.filter((item) => !groupItems.includes(item))
                      );
                    }
                  };

                  return (
                    <div
                      key={gIdx}
                      className="bg-bg-card p-6 rounded-lg border border-border shadow-sm"
                    >
                      <div className="flex items-center space-x-3 mb-6">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) {
                              el.indeterminate = someSelected;
                            }
                          }}
                          onChange={(e) => handleGroupToggle(e.target.checked)}
                          className="h-5 w-5 text-primary focus:ring-primary rounded"
                        />
                        <h4 className="text-lg font-bold text-text-main">
                          {group.name}
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {groupItems.map((item, iIdx) => (
                          <label
                            key={iIdx}
                            className="flex items-center p-4 bg-secondary rounded-lg cursor-pointer hover:bg-secondary-dark transition"
                          >
                            <input
                              type="checkbox"
                              checked={bioSelected.includes(item)}
                              onChange={(e) => {
                                setBioSelected((prev) =>
                                  e.target.checked
                                    ? [...prev, item]
                                    : prev.filter((i) => i !== item)
                                );
                              }}
                              className="h-5 w-5 text-primary focus:ring-primary rounded"
                            />
                            <span className="ml-3 text-sm text-text-main">
                              {item}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-end space-x-4 pt-6 border-t border-border">
                  <button
                    onClick={saveExamensBio}
                    className="px-5 py-2 bg-primary text-white rounded-md shadow hover:bg-primary-dark text-sm font-medium transition"
                  >
                    Sauvegarder Examens Biologiques
                  </button>
                  <PrintExamensPDF
                    patient={patient}
                    consultation={selectedConsultation}
                    bioSelected={bioSelected}
                    explSelected={explSelected}
                    biologicalGroups={biologicalGroups}
                    explorationGroups={explorationGroups}
                  />
                </div>
              </div>
            )}

            {activeSubTab === "Explorations" && (
              <div className="space-y-8">
                {explorationGroups.map((group, gIdx) => {
                  const groupItems = group.items || [];
                  const selectedItemsInGroup = explSelected.filter((item) =>
                    groupItems.includes(item)
                  );
                  const allSelected =
                    groupItems.length > 0 &&
                    selectedItemsInGroup.length === groupItems.length;
                  const someSelected =
                    selectedItemsInGroup.length > 0 && !allSelected;

                  const handleGroupToggle = (checked) => {
                    if (checked) {
                      // Add all items from this group that aren't already selected
                      const itemsToAdd = groupItems.filter(
                        (item) => !explSelected.includes(item)
                      );
                      setExplSelected((prev) => [...prev, ...itemsToAdd]);
                    } else {
                      // Remove all items from this group
                      setExplSelected((prev) =>
                        prev.filter((item) => !groupItems.includes(item))
                      );
                    }
                  };

                  return (
                    <div
                      key={gIdx}
                      className="bg-bg-card p-6 rounded-lg border border-border shadow-sm"
                    >
                      <div className="flex items-center space-x-3 mb-6">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) {
                              el.indeterminate = someSelected;
                            }
                          }}
                          onChange={(e) => handleGroupToggle(e.target.checked)}
                          className="h-5 w-5 text-primary focus:ring-primary rounded"
                        />
                        <h4 className="text-lg font-bold text-text-main">
                          {group.name}
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {groupItems.map((item, iIdx) => (
                          <label
                            key={iIdx}
                            className="flex items-center p-4 bg-secondary rounded-lg cursor-pointer hover:bg-secondary-dark transition"
                          >
                            <input
                              type="checkbox"
                              checked={explSelected.includes(item)}
                              onChange={(e) => {
                                setExplSelected((prev) =>
                                  e.target.checked
                                    ? [...prev, item]
                                    : prev.filter((i) => i !== item)
                                );
                              }}
                              className="h-5 w-5 text-primary focus:ring-primary rounded"
                            />
                            <span className="ml-3 text-sm text-text-main">
                              {item}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <div className="flex justify-end space-x-4 pt-6 border-t border-border">
                  <button
                    onClick={saveExamensExploration}
                    className="px-5 py-2 bg-primary text-white rounded-md shadow hover:bg-primary-dark text-sm font-medium transition"
                  >
                    💾 Sauvegarder Explorations
                  </button>
                  <PrintExamensPDF
                    patient={patient}
                    consultation={selectedConsultation}
                    bioSelected={bioSelected}
                    explSelected={explSelected}
                    biologicalGroups={biologicalGroups}
                    explorationGroups={explorationGroups}
                  />
                </div>
              </div>
            )}
            <ToastContainer position="top-right" autoClose={2000} />
          </div>
        );

      case "Certificats":
        return (
          <div className="w-full p-6 bg-bg-card rounded-lg border border-border shadow-sm">
            <h3 className="text-2xl font-bold mb-6 text-text-main text-center">
              Certificat d'arrêt de travail
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Durée d'arrêt */}
              <div className="col-span-1 md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-semibold mb-3 text-text-main">
                  Durée d'arrêt (jours)
                </label>
                <input
                  type="number"
                  value={dureeStop}
                  onChange={(e) => setDureeStop(e.target.value)}
                  min="1"
                  placeholder="Ex : 7"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                />
              </div>
              <div className="col-span-1 md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-semibold mb-3 text-text-main">
                  Date de début
                </label>
                <input
                  type="text"
                  value={fixUTCDateToLocal(certificatDate)} // ✅ Use your function here
                  onChange={(e) => {
                    // Allow typing like 27/10/2025
                    const inputValue = e.target.value;
                    // Convert DD/MM/YYYY back to YYYY-MM-DD for storage
                    if (inputValue.includes("/")) {
                      const [day, month, year] = inputValue.split("/");
                      setCertificatDate(`${year}-${month}-${day}`);
                    } else {
                      setCertificatDate(inputValue);
                    }
                  }}
                  placeholder="jj/mm/aaaa"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end flex-wrap gap-4 mt-8 pt-6 border-t border-border">
              <button
                onClick={saveCertificat}
                className="px-5 py-2 bg-primary text-white rounded-md shadow hover:bg-primary-dark text-sm font-medium transition"
              >
                Sauvegarder Certificat
              </button>
              <PrintCertificatPDF
                patient={patient}
                consultation={selectedConsultation}
                dureeStop={dureeStop}
                certificatDate={certificatDate}
              />
            </div>
            <ToastContainer position="top-right" autoClose={2000} />
          </div>
        );

      case "Orientation":
        return (
          <div className="w-full p-6 bg-bg-card rounded-lg border border-border shadow-sm">
            <h3 className="text-2xl font-bold mb-6 text-text-main text-center">
              Lettre d'orientation
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Antécédents */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-semibold text-text-main">
                    Antécédents
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOrientationForm((prev) => ({
                        ...prev,
                        atcd: patient.history || patient.atcd || "",
                      }));
                      toast.success("Antécédents du patient chargés ✅");
                    }}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition"
                  >
                    📋 Charger du patient
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={orientationForm.atcd}
                  onChange={(e) =>
                    setOrientationForm((prev) => ({
                      ...prev,
                      atcd: e.target.value,
                    }))
                  }
                  placeholder="Antécédents médicaux..."
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main resize-y"
                />
                {patient.history &&
                  orientationForm.atcd !== patient.history && (
                    <p className="text-xs text-text-secondary mt-1">
                      Patient: {patient.history.substring(0, 100)}
                      {patient.history.length > 100 ? "..." : ""}
                    </p>
                  )}
              </div>

              {/* Présenté pour */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-text-main">
                  Présenté pour
                </label>
                <textarea
                  rows={6}
                  value={orientationForm.presente}
                  onChange={(e) =>
                    setOrientationForm((prev) => ({
                      ...prev,
                      presente: e.target.value,
                    }))
                  }
                  placeholder="Raison de la présentation..."
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main resize-y"
                />
              </div>
            </div>

            {/* Pour */}
            <div className="mt-6">
              <label className="block text-sm font-semibold mb-3 text-text-main">
                Pour
              </label>
              <textarea
                rows={8}
                value={orientationForm.pour}
                onChange={(e) =>
                  setOrientationForm((prev) => ({
                    ...prev,
                    pour: e.target.value,
                  }))
                }
                placeholder="Objet de l'orientation..."
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main resize-y"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end flex-wrap gap-4 mt-8 pt-6 border-t border-border">
              <button
                onClick={saveOrientation}
                className="px-5 py-2 bg-primary text-white rounded-md shadow hover:bg-primary-dark text-sm font-medium transition"
              >
                Sauvegarder Orientation
              </button>
              <PrintOrientationPDF
                patient={patient}
                consultation={selectedConsultation}
                orientationForm={orientationForm}
              />
            </div>
            <ToastContainer position="top-right" autoClose={2000} />
          </div>
        );
      case "Factures":
        return (
          <FactureManager
            patient={patient}
            consultation={selectedConsultation}
            consultForm={consultForm}
          />
        );

      default:
        return <div>Tab non implémentée</div>;
    }
  };

  if (showMotifModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-bg-card p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6 text-text-main">
            Démarrer Nouvelle Consultation
          </h2>
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-3 text-text-main">
              Motif de consultation
            </label>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg-card text-text-main shadow-sm"
              placeholder="Décrivez le motif de la visite du patient..."
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                setShowMotifModal(false);
                setMotif("");
              }}
              disabled={loading}
              className="px-6 py-3 bg-secondary text-text-main rounded-lg hover:bg-secondary-dark transition disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmitMotif}
              disabled={!motif.trim() || loading}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Création...
                </>
              ) : (
                "Créer Consultation"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isEditingPatient) {
    return (
      <PatientForm
        patient={patient}
        onSave={onUpdate}
        onCancel={() => setIsEditingPatient(false)}
      />
    );
  }

  if (!selectedConsultation) {
    // Consultations list view
    return (
      <div className="bg-bg-card p-8 rounded-lg shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-6">
          <div>
            {/* Add back button here */}
            <button
              onClick={onBack}
              className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition shadow-sm mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Retour à la liste des patients
            </button>

            <h2 className="text-3xl font-bold text-text-main">Consultations</h2>
            <p className="text-text-secondary mt-2">{patient.name}</p>
            <p className="text-text-secondary">
              {calculateAge(patient.dob)} ans • {patient.weight || "—"} kg
            </p>
            {patient.history && (
              <p className="text-sm text-text-secondary mt-1">
                Antécédents: {patient.history}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setIsEditingPatient(true)}
              className="flex items-center justify-center px-6 py-3 bg-secondary text-text-main rounded-lg hover:bg-secondary-dark transition shadow-sm"
            >
              ✏️ Modifier Patient
            </button>
            <button
              onClick={handleStartConsultation}
              className="flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition shadow-lg"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Nouvelle Consultation
            </button>
            <ToastContainer position="top-right" autoClose={2000} />
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-primary text-white">
              <tr>
                <th className="py-4 px-6 text-left text-xs font-medium uppercase tracking-wider">
                  Date
                </th>
                <th className="py-4 px-6 text-left text-xs font-medium uppercase tracking-wider">
                  Motif
                </th>
                <th className="py-4 px-6 text-left text-xs font-medium uppercase tracking-wider">
                  Conclusion
                </th>
                <th className="py-4 px-6 text-left text-xs font-medium uppercase tracking-wider">
                  Prix
                </th>
                <th className="py-4 px-6 text-left text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-bg-card divide-y divide-border">
              {consultations.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-secondary/50 transition-colors"
                >
                  <td
                    className="py-4 px-6 font-semibold text-text-main cursor-pointer"
                    onClick={() => {
                      setSelectedConsultation(c);
                      setActiveTab("Consultation");
                    }}
                  >
                    {fixUTCDateToLocal(c.date)}
                  </td>
                  <td
                    className="py-4 px-6 max-w-xs cursor-pointer"
                    onClick={() => {
                      setSelectedConsultation(c);
                      setActiveTab("Consultation");
                    }}
                  >
                    <div className="truncate" title={c.diagnostic}>
                      {c.diagnostic}
                    </div>
                  </td>
                  <td
                    className="py-4 px-6 max-w-xs cursor-pointer"
                    onClick={() => {
                      setSelectedConsultation(c);
                      setActiveTab("Consultation");
                    }}
                  >
                    <div className="truncate" title={c.conclusion || "—"}>
                      {c.conclusion || "—"}
                    </div>
                  </td>
                  <td
                    className="py-4 px-6 font-semibold text-text-main cursor-pointer"
                    onClick={() => {
                      setSelectedConsultation(c);
                      setActiveTab("Consultation");
                    }}
                  >
                    {c.Prix || 0} DZD
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      <PrintConsultationPDF
                        patient={patient}
                        consultation={c}
                        consultForm={{
                          motif: c.diagnostic,
                          conclusion: c.conclusion,
                          prix: c.Prix,
                        }}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConsultation(c.id);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center transition"
                      >
                        🗑 Supprimer
                      </button>
                      <ToastContainer position="top-right" autoClose={2000} />
                    </div>
                  </td>
                </tr>
              ))}
              {consultations.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-text-secondary"
                  >
                    <PlusCircleIcon className="h-16 w-16 mx-auto mb-4 text-text-secondary/50" />
                    <p className="text-lg font-medium">Aucune consultation</p>
                    <p className="mt-2">
                      Commencez par créer la première consultation
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Selected consultation tabs view
  return (
    <div className="space-y-6">
      {/* Quick Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-text-main">
              Ajouter à la Facture
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-main">
                  Acte Médical
                </label>
                <input
                  type="text"
                  value={quickInvoiceItem.act}
                  onChange={(e) =>
                    setQuickInvoiceItem((prev) => ({
                      ...prev,
                      act: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-border rounded-lg bg-bg-card text-text-main"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-main">
                  Prix (DZD)
                </label>
                <input
                  type="number"
                  value={quickInvoiceItem.prix}
                  onChange={(e) =>
                    setQuickInvoiceItem((prev) => ({
                      ...prev,
                      prix: e.target.value,
                    }))
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-bg-card text-text-main"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 bg-secondary text-text-main rounded-lg hover:bg-secondary-dark transition"
              >
                Annuler
              </button>
              <button
                onClick={saveQuickInvoiceItem}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
              >
                Ajouter à la Facture
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-6 p-6 bg-bg-card rounded-lg border border-border shadow-sm">
        <div className="flex-1">
          <button
            onClick={() => setSelectedConsultation(null)}
            className="flex items-center bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition shadow-sm"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Retour aux consultations
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 items-end sm:items-center">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold text-text-main">
              Consultation du {fixUTCDateToLocal(selectedConsultation.date)}
            </h2>
            <p className="text-text-secondary mt-2">
              {selectedConsultation.diagnostic}
            </p>
          </div>
          <button
            onClick={() => setIsEditingPatient(true)}
            className="flex items-center px-6 py-3 bg-secondary text-text-main rounded-lg hover:bg-secondary-dark transition shadow-sm"
          >
            ✏️ Modifier Patient
          </button>
        </div>
      </div>
      <div className="bg-bg-card rounded-lg border border-border shadow-xl overflow-hidden">
        {/* Tabs Navigation */}
        <div className="border-b border-border">
          <nav className="flex space-x-1 overflow-x-auto py-2 -mx-2 px-2 scrollbar-hide">
            {detailTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 inline-flex items-center font-medium text-sm whitespace-nowrap transition flex-shrink-0 border-b-2 ${
                  activeTab === tab
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-text-secondary hover:text-text-main hover:border-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content - THIS LINE IS ESSENTIAL */}
        <div className="p-8">{renderContent()}</div>
      </div>
      <ToastContainer position="top-right" reverseOrder={false} />
    </div>
  );
};

export default PatientManager;
