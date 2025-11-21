import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../contexts/AppContext";
import { UploadCloudIcon } from "../components/Icons";
import { ShieldIcon } from "../components/icons/ShieldIcon";
import MedicamentsSettings from "./Settings/MedicamentsSettings";
import FormesSettings from "./Settings/FormesSettings";
import ExamensSettings from "./Settings/ExamensSettings";
import ProcedureTemplatesSettings from "./Settings/ProcedureTemplatesSettings";
import DynamicTemplatesSettings from "./Settings/DynamicTemplatesSettings";
import UserManagement from "../components/UserManagement";
import ActesSettings from "./Settings/ActesSettings";
import LicenceSettings from "./Settings/LicenceSettings";
import PrescriptionDurationsSettings from "./Settings/PrescriptionDurationsSettings";
import ColorSettings from "./Settings/ColorSettings";
import DataBaseExport from "./Settings/DataBaseExport";
import api from "../utils/api";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SettingsMain = () => {
  const { user: currentUser } = useContext(AppContext);
  const [localDoctorInfo, setLocalDoctorInfo] = useState({
    name: "",
    specialty: "",
    address: "",
    phone: "",
  });
  const [localHeaderInfo, setLocalHeaderInfo] = useState({
    line1: "",
    line2: "",
  });
  const [clinicInfo, setClinicInfo] = useState({
    name: "",
    address: "",
    nif: "",
    phone: "",
    email: "",
  });
  const [logo, setLogo] = useState("");
  const [signature, setSignature] = useState("");
  const [activeSection, setActiveSection] = useState("general");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [apiConfig, setApiConfig] = useState({
    baseURL: "http://localhost:4002",
    isOnline: false,
  });

  // Enhanced settings sections with admin-only sections
  const settingsSections = [
    { id: "general", name: "Général", icon: "⚙️", adminOnly: false },
    { id: "actes", name: "Actes Médicaux", icon: "💼", adminOnly: false },
    {
      id: "procedure-templates",
      name: "Modèles Procédures",
      icon: "📝",
      adminOnly: false,
    },
    {
      id: "dynamic-templates",
      name: "Modèles Doppler",
      icon: "🩺",
      adminOnly: false,
    },
    { id: "medicaments", name: "Médicaments", icon: "💊", adminOnly: false },
    { id: "formes", name: "Formes & Détails", icon: "📋", adminOnly: false },
    { id: "examens", name: "Examens", icon: "🔬", adminOnly: false },
    {
      id: "prescription-durations",
      name: "Durées de Prescription",
      icon: "⏳",
      adminOnly: false,
    },
    { id: "clinic-info", name: "Info Cabinet", icon: "🏥", adminOnly: true },
    {
      id: "api-config",
      name: "Configuration API",
      icon: "🌐",
      adminOnly: true,
    },
    { id: "users", name: "Utilisateurs", icon: "👥", adminOnly: true },
    {
      id: "colors",
      name: "Personnalisation Couleurs",
      icon: "🎨",
      adminOnly: true,
    },
    {
      id: "database-export",
      name: "Export Base de Données",
      icon: "💾",
      adminOnly: true,
    },
    { id: "license", name: "Licence", icon: "🔑", adminOnly: true },
  ];

  const isAdmin = currentUser?.grade === "admin";

  // Filter sections based on user role
  const filteredSections = settingsSections.filter(
    (section) => !section.adminOnly || isAdmin
  );

  // Charger les paramètres au démarrage
  useEffect(() => {
    loadSettings();
    loadClinicInfo();
  }, []);

  const loadSettings = async () => {
    try {
      setInitialLoading(true);
      console.log("Chargement des paramètres...");

      let res;
      try {
        res = await api.get("/settings");
      } catch (err) {
        console.log("Essai avec /settings échoué, essai avec /settings...");
        try {
          res = await api.get("/settings");
        } catch (err2) {
          console.log("Essai avec /settings échoué, ...");
          res = await api.get("/settings/");
        }
      }

      const settings = res.data;

      setLocalDoctorInfo({
        name: settings.doctor_name || "",
        specialty: settings.doctor_specialty || "",
        address: settings.doctor_address || "",
        phone: settings.doctor_phone || "",
      });

      setLocalHeaderInfo({
        line1: settings.header_line1 || "",
        line2: settings.header_line2 || "",
      });

      if (settings.logo) setLogo(settings.logo);
      if (settings.signature) setSignature(settings.signature);

      console.log("Paramètres chargés avec succès");
    } catch (err) {
      console.error("Erreur chargement paramètres:", err);
      console.error("Détails de l'erreur:", err.response?.data);
      toast.error("Erreur lors du chargement des paramètres");
    } finally {
      setInitialLoading(false);
    }
  };

  const loadClinicInfo = async () => {
    try {
      const response = await api.get("/settings/clinic-info");
      setClinicInfo(response.data);
    } catch (error) {
      console.error("Error loading clinic info:", error);
      // Fallback to default values
      setClinicInfo({
        name: "Cabinet du Dr El bradai",
        address: "Mascara, Algérie",
        nif: "19129060271518602980",
        phone: "+213 555 12 34 56",
        email: "contact@cabinet-elbradai.dz",
      });
    }
  };

  const handleSaveGeneral = async () => {
    setLoading(true);
    try {
      const settingsToSave = {
        doctor_name: localDoctorInfo.name,
        doctor_specialty: localDoctorInfo.specialty,
        doctor_address: localDoctorInfo.address,
        doctor_phone: localDoctorInfo.phone,
        header_line1: localHeaderInfo.line1,
        header_line2: localHeaderInfo.line2,
        logo: logo,
        signature: signature,
      };

      console.log("Sauvegarde des paramètres:", settingsToSave);

      try {
        await api.post("/settings/multiple", { settings: settingsToSave });
      } catch (err) {
        console.log(
          "Essai avec /api/settings/multiple échoué, essai avec /settings/multiple..."
        );
        await api.post("/settings/multiple", { settings: settingsToSave });
      }

      toast.success("Paramètres sauvegardés avec succès !");
    } catch (err) {
      console.error("Erreur sauvegarde paramètres:", err);
      console.error("Détails de l'erreur:", err.response?.data);
      toast.error("Erreur lors de la sauvegarde des paramètres");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClinicInfo = async () => {
    try {
      await api.post("/settings/clinic-info", clinicInfo);
      toast.success("Informations du cabinet sauvegardées !");
    } catch (error) {
      console.error("Error saving clinic info:", error);
      toast.error("Erreur lors de la sauvegarde des informations du cabinet");
    }
  };

  const handleFileChange = async (e, setter, settingKey) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("L'image est trop volumineuse (max 2MB)");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const result = reader.result;
          setter(result);

          try {
            await api.post("/settings", {
              key: settingKey,
              value: result,
            });
            toast.success("Image sauvegardée avec succès !");
          } catch (err) {
            console.error("Erreur sauvegarde image:", err);
            toast.error("Erreur lors de la sauvegarde de l'image");
          }
        } catch (err) {
          console.error("Erreur traitement image:", err);
          toast.error("Erreur lors du traitement de l'image");
        }
      };

      reader.onerror = () => {
        toast.error("Erreur lors de la lecture du fichier");
      };

      reader.readAsDataURL(file);
    }
  };

  const renderSection = () => {
    if (initialLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-3 text-text-main">
            Chargement des paramètres...
          </span>
        </div>
      );
    }

    switch (activeSection) {
      case "general":
        return (
          <div className="space-y-8 w-full">
            {/* Informations médecin */}
            <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm w-full">
              <h3 className="text-xl font-bold mb-6 text-text-main">
                Informations du Médecin
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-text-main">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={localDoctorInfo.name}
                    onChange={(e) =>
                      setLocalDoctorInfo((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                    placeholder="Dr. Nom Prénom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-3 text-text-main">
                    Spécialité
                  </label>
                  <input
                    type="text"
                    value={localDoctorInfo.specialty}
                    onChange={(e) =>
                      setLocalDoctorInfo((prev) => ({
                        ...prev,
                        specialty: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                    placeholder="Gastro-entérologue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-3 text-text-main">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={localDoctorInfo.address}
                    onChange={(e) =>
                      setLocalDoctorInfo((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                    placeholder="Adresse du cabinet"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-3 text-text-main">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={localDoctorInfo.phone}
                    onChange={(e) =>
                      setLocalDoctorInfo((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                    placeholder="+213 774 13 70 27"
                  />
                </div>
              </div>
            </div>

            {/* En-tête documents */}
            <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm w-full">
              <h3 className="text-xl font-bold mb-6 text-text-main">
                En-tête des documents
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-text-main">
                    Ligne 1
                  </label>
                  <input
                    type="text"
                    value={localHeaderInfo.line1}
                    onChange={(e) =>
                      setLocalHeaderInfo((prev) => ({
                        ...prev,
                        line1: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                    placeholder="Nom du cabinet médical"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-3 text-text-main">
                    Ligne 2
                  </label>
                  <input
                    type="text"
                    value={localHeaderInfo.line2}
                    onChange={(e) =>
                      setLocalHeaderInfo((prev) => ({
                        ...prev,
                        line2: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                    placeholder="Ville, Adresse"
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm w-full">
              <h3 className="text-xl font-bold mb-6 text-text-main">Images</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-text-main">
                    Logo du cabinet
                  </label>
                  <div
                    onClick={() =>
                      document.getElementById("logo-input").click()
                    }
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-secondary transition min-h-[200px] flex flex-col items-center justify-center"
                  >
                    {logo ? (
                      <>
                        <img
                          src={logo}
                          alt="Logo"
                          className="max-h-32 mx-auto mb-4"
                        />
                        <p className="text-sm text-text-secondary">
                          Cliquer pour changer
                        </p>
                      </>
                    ) : (
                      <>
                        <UploadCloudIcon className="mx-auto h-16 w-16 text-text-secondary mb-4" />
                        <p className="text-text-secondary">
                          Cliquer pour importer un logo
                        </p>
                      </>
                    )}
                    <input
                      id="logo-input"
                      type="file"
                      onChange={(e) => handleFileChange(e, setLogo, "logo")}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-3 text-text-main">
                    Signature du médecin
                  </label>
                  <div
                    onClick={() =>
                      document.getElementById("signature-input").click()
                    }
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-secondary transition min-h-[200px] flex flex-col items-center justify-center"
                  >
                    {signature ? (
                      <>
                        <img
                          src={signature}
                          alt="Signature"
                          className="max-h-32 mx-auto mb-4"
                        />
                        <p className="text-sm text-text-secondary">
                          Cliquer pour changer
                        </p>
                      </>
                    ) : (
                      <>
                        <UploadCloudIcon className="mx-auto h-16 w-16 text-text-secondary mb-4" />
                        <p className="text-text-secondary">
                          Cliquer pour importer une signature
                        </p>
                      </>
                    )}
                    <input
                      id="signature-input"
                      type="file"
                      onChange={(e) =>
                        handleFileChange(e, setSignature, "signature")
                      }
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-border">
              <button
                onClick={handleSaveGeneral}
                disabled={loading}
                className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 transition flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sauvegarde...
                  </>
                ) : (
                  "Sauvegarder les paramètres"
                )}
              </button>
            </div>
          </div>
        );

      case "clinic-info":
        if (!isAdmin) {
          return (
            <div className="text-center py-12">
              <ShieldIcon className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-red-600 mb-2">
                Accès Refusé
              </h3>
              <p className="text-text-secondary">
                Vous devez être administrateur pour accéder à cette section.
              </p>
            </div>
          );
        }
        return (
          <div className="space-y-8 w-full">
            <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm">
              <h3 className="text-xl font-bold mb-6 text-text-main">
                Informations du Cabinet
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-text-main">
                    Nom du Cabinet
                  </label>
                  <input
                    type="text"
                    value={clinicInfo.name || ""}
                    onChange={(e) =>
                      setClinicInfo((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-3 text-text-main">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={clinicInfo.address || ""}
                    onChange={(e) =>
                      setClinicInfo((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-3 text-text-main">
                    NIF
                  </label>
                  <input
                    type="text"
                    value={clinicInfo.nif || ""}
                    onChange={(e) =>
                      setClinicInfo((prev) => ({
                        ...prev,
                        nif: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-3 text-text-main">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={clinicInfo.phone || ""}
                    onChange={(e) =>
                      setClinicInfo((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold mb-3 text-text-main">
                    Email
                  </label>
                  <input
                    type="email"
                    value={clinicInfo.email || ""}
                    onChange={(e) =>
                      setClinicInfo((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-6 mt-6 border-t border-border">
                <button
                  onClick={handleSaveClinicInfo}
                  className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                >
                  Sauvegarder les informations
                </button>
              </div>
            </div>
          </div>
        );

      case "api-config":
        if (!isAdmin) {
          return (
            <div className="text-center py-12">
              <ShieldIcon className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-red-600 mb-2">
                Accès Refusé
              </h3>
              <p className="text-text-secondary">
                Vous devez être administrateur pour accéder à cette section.
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-8 w-full">
            <div className="bg-bg-card p-6 rounded-lg border border-border shadow-sm">
              <h3 className="text-xl font-bold mb-6 text-text-main">
                Configuration de l'API
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-text-main">
                    URL de Base de l'API
                  </label>
                  <input
                    type="text"
                    value={apiConfig.baseURL}
                    onChange={(e) =>
                      setApiConfig((prev) => ({
                        ...prev,
                        baseURL: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-bg-card text-text-main"
                    placeholder="http://localhost:4002"
                  />
                  <p className="text-sm text-text-secondary mt-2">
                    Changez cette URL pour passer de localhost à votre serveur
                    web
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isOnline"
                    checked={apiConfig.isOnline}
                    onChange={(e) =>
                      setApiConfig((prev) => ({
                        ...prev,
                        isOnline: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                  />
                  <label
                    htmlFor="isOnline"
                    className="text-sm font-semibold text-text-main"
                  >
                    Mode en ligne activé
                  </label>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    Configuration actuelle:
                  </h4>
                  <p className="text-blue-700 text-sm">
                    <strong>URL:</strong> {apiConfig.baseURL}
                    <br />
                    <strong>Mode:</strong>{" "}
                    {apiConfig.isOnline ? "En ligne 🌐" : "Local 🏠"}
                    <br />
                    <strong>Statut:</strong>{" "}
                    {apiConfig.baseURL.includes("localhost")
                      ? "Développement"
                      : "Production"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-6 mt-6 border-t border-border">
                <button className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition">
                  Appliquer la configuration
                </button>
              </div>
            </div>
          </div>
        );

      case "users":
        if (!isAdmin) {
          return (
            <div className="text-center py-12">
              <ShieldIcon className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-red-600 mb-2">
                Accès Refusé
              </h3>
              <p className="text-text-secondary">
                Vous devez être administrateur pour accéder à cette section.
              </p>
            </div>
          );
        }
        return <UserManagement />;
      case "colors":
        if (!isAdmin) {
          return (
            <div className="text-center py-12">
              <ShieldIcon className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-red-600 mb-2">
                Accès Refusé
              </h3>
              <p className="text-text-secondary">
                Vous devez être administrateur pour accéder à cette section.
              </p>
            </div>
          );
        }
        return <ColorSettings />;
      case "database-export":
        if (!isAdmin) {
          return (
            <div className="text-center py-12">
              <ShieldIcon className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-red-600 mb-2">
                Accès Refusé
              </h3>
              <p className="text-text-secondary">
                Vous devez être administrateur pour accéder à cette section.
              </p>
            </div>
          );
        }
        return <DataBaseExport />;
      case "license":
        if (!isAdmin) {
          return (
            <div className="text-center py-12">
              <ShieldIcon className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-red-600 mb-2">
                Accès Refusé
              </h3>
              <p className="text-text-secondary">
                Vous devez être administrateur pour accéder à cette section.
              </p>
            </div>
          );
        }
        return <LicenceSettings />;

      case "procedure-templates":
        return <ProcedureTemplatesSettings />;
      case "dynamic-templates":
        return <DynamicTemplatesSettings />;
      case "medicaments":
        return <MedicamentsSettings />;
      case "formes":
        return <FormesSettings />;
      case "prescription-durations":
        return <PrescriptionDurationsSettings />;
      case "examens":
        return <ExamensSettings />;
      case "actes":
        return <ActesSettings />;
      default:
        return <div>Section non trouvée</div>;
    }
  };

  return (
    <div className="min-h-screen bg-bg-main py-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-text-main">Paramètres</h2>
          {isAdmin && (
            <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
              <ShieldIcon className="h-4 w-4" />
              <span className="text-sm font-semibold">Mode Administrateur</span>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Navigation latérale */}
          <div className="lg:w-80 flex-shrink-0">
            <nav className="space-y-2 bg-bg-card rounded-lg border border-border p-4">
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-4 py-4 rounded-lg text-left transition ${
                    activeSection === section.id
                      ? "bg-primary text-white shadow-sm"
                      : "bg-bg-card text-text-main hover:bg-secondary"
                  } ${
                    section.adminOnly ? "border-l-4 border-l-yellow-500" : ""
                  }`}
                >
                  <span className="text-lg mr-3">{section.icon}</span>
                  <span className="font-medium">{section.name}</span>
                  {section.adminOnly && (
                    <ShieldIcon className="ml-auto h-4 w-4 opacity-70" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            <div className="bg-bg-card rounded-lg border border-border p-6">
              {renderSection()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsMain;
