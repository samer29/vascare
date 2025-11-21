import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Fonction AES-256-CBC pure JavaScript (fonctionne dans le navigateur)
async function encryptAES(plainText) {
  const secret = "12345678901234567890123456789012"; // TA clé actuelle
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);

  // IV = 16 zéros (exactement comme ton backend)
  const iv = new Uint8Array(16).fill(0);

  // Importer la clé
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );

  // Chiffrement
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    cryptoKey,
    data
  );

  // Convertir en hex
  return Array.from(new Uint8Array(encryptedBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const LicenceManager = () => {
  const [currentLicense, setCurrentLicense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    checkCurrentLicense();
  }, []);

  const checkCurrentLicense = async () => {
    try {
      const res = await api.get("/licence");
      setCurrentLicense(res.data.licence);
    } catch (err) {
      setCurrentLicense(null);
    } finally {
      setLoading(false);
    }
  };

  const generateLicenseKey = async () => {
    if (!startDate || !expiryDate) {
      toast.error("Veuillez sélectionner les deux dates");
      return;
    }

    setIsGenerating(true);
    try {
      const plainText = `${startDate}|${expiryDate}`;
      const key = await encryptAES(plainText);
      setGeneratedKey(key);
      toast.success("Clé générée avec succès !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  const registerLicense = async () => {
    if (!generatedKey) return;

    try {
      await api.post("/licence/register", { key: generatedKey });
      toast.success("Licence activée ! Rechargement...");
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      toast.error("Clé invalide ou erreur serveur");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Clé copiée dans le presse-papier !");
    });
  };

  if (loading)
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Vérification de la licence...</p>
        </div>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* État actuel */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">
          État de la Licence
        </h2>
        {currentLicense ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 text-green-800">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
              <p className="text-2xl font-bold">Licence Active</p>
            </div>
            <p className="text-lg">
              Expire le :{" "}
              <strong className="text-xl">
                {new Date(currentLicense.expiry_date).toLocaleDateString(
                  "fr-FR"
                )}
              </strong>
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-8 text-red-800">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
              <p className="text-2xl font-bold">Aucune licence active</p>
            </div>
          </div>
        )}
      </div>

      {/* Générateur */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h2 className="text-3xl font-bold mb-8 text-gray-800">
          Générer & Activer une Nouvelle Licence
        </h2>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block font-bold mb-3 text-gray-700">
              Date de début
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block font-bold mb-3 text-gray-700">
              Date d'expiration
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
        <button
          onClick={generateLicenseKey}
          disabled={isGenerating || !startDate || !expiryDate}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] mb-6 shadow-lg"
        >
          {isGenerating ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Génération en cours...
            </div>
          ) : (
            "Générer la Clé de Licence"
          )}
        </button>

        {generatedKey && (
          <div className="space-y-6">
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
              <div className="flex justify-between items-center mb-3">
                <p className="font-bold text-gray-700">Clé générée :</p>
                <button
                  onClick={() => copyToClipboard(generatedKey)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Copier</span>
                </button>
              </div>
              <div className="relative">
                <code className="block bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono break-all overflow-x-auto max-h-32 overflow-y-auto">
                  {generatedKey}
                </code>
              </div>
            </div>

            <button
              onClick={registerLicense}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg"
            >
              Activer Cette Licence Maintenant
            </button>
          </div>
        )}
      </div>

      {/* Clés rapides */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-2xl shadow-xl">
        <h3 className="text-2xl font-bold mb-6">
          Clés "permanentes" (prêtes à l'emploi)
        </h3>
        <div className="space-y-4">
          {[
            {
              year: "2030",
              key: "961efca5dd64cf9c616aef175c93ad639a5d5cfc5e1034e0c2ceb5309225d16c",
            },
            {
              year: "2035",
              key: "3f8a2c1d9e5b7f4a6d8c3e2b1f9a7d5c4e6b8a9f1c2d3e4f5a6b7c8d9e0f1a2b",
            },
            {
              year: "9999",
              key: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-5 hover:bg-opacity-30 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                <div className="flex items-center space-x-3">
                  <span className="bg-white bg-opacity-30 px-3 py-1 rounded-full text-sm font-bold">
                    {item.year}
                  </span>
                  <span className="text-sm opacity-90">→</span>
                </div>
                <div className="flex-1 min-w-0 mx-4">
                  <code className="text-sm font-mono break-all opacity-90">
                    {item.key}
                  </code>
                </div>
                <button
                  onClick={() => copyToClipboard(item.key)}
                  className="flex-shrink-0 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm">Copier</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LicenceManager;
