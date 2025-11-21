import { useEffect } from "react";
import { calculateAge, formatDate } from "../utils/data.jsx";

const DeletePatientModal = ({
  isOpen,
  patient,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white text-center">
            Confirmer la suppression
          </h3>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="text-center mb-2">
            <p className="text-lg font-semibold text-gray-900 mb-2">
              Êtes-vous sûr de vouloir supprimer le patient ?
            </p>
            <p className="text-xl font-bold text-red-600 mb-4">
              {patient?.name}
            </p>
          </div>

          {/* Warning Box */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-800 mb-1">
                  Cette action est irréversible !
                </p>
                <p className="text-sm text-red-700">
                  Toutes les données associées seront définitivement supprimées
                  :
                </p>
                <ul className="text-xs text-red-600 mt-2 space-y-1">
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                    Toutes les consultations
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                    Ordonnances et prescriptions
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                    Examens et résultats
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                    Doppler,Thyroide,ECG et Echographie
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                    Certificats et factures
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                    Images et documents
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Patient Info Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-semibold text-gray-600">Âge:</span>
                <p className="text-gray-900">
                  {patient ? calculateAge(patient.dob) : "—"} ans
                </p>
              </div>
              <div>
                <span className="font-semibold text-gray-600">
                  Dernière visite:
                </span>
                <p className="text-gray-900">
                  {patient?.consultations?.length > 0
                    ? formatDate(patient.consultations[0].date)
                    : "Aucune"}
                </p>
              </div>
              <div className="col-span-2">
                <span className="font-semibold text-gray-600">
                  Nombre de consultations:
                </span>
                <p className="text-gray-900">
                  {patient?.consultations?.length || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Suppression...
                </>
              ) : (
                "Supprimer définitivement"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeletePatientModal;
