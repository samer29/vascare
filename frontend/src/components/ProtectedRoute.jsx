// components/ProtectedRoute.js
import React, { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AppContext } from "../contexts/AppContext";
import api from "../utils/api"; // Axios instance

const ProtectedRoute = ({ children, requiredGrade = null }) => {
  const { isAuthenticated, user, loading } = useContext(AppContext);
  const [checkingLicense, setCheckingLicense] = useState(true);
  const [licenseValid, setLicenseValid] = useState(false);

  useEffect(() => {
    const checkLicense = async () => {
      // ADMIN CAN ALWAYS PASS (even if no license or expired)
      if (
        user &&
        (user.grade === "admin" || user.role === "admin" || user.isAdmin)
      ) {
        setLicenseValid(true);
        setCheckingLicense(false);
        return;
      }

      try {
        const res = await api.get("/licence");
        setLicenseValid(
          res.status === 200 && res.data?.message === "Licence is valid"
        );
      } catch (err) {
        setLicenseValid(false);
      } finally {
        setCheckingLicense(false);
      }
    };

    if (isAuthenticated) {
      checkLicense();
    } else {
      setCheckingLicense(false);
    }
  }, [isAuthenticated, user]);

  if (loading || checkingLicense) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!licenseValid) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-red-600 mb-4">
            Licence Expirée ou Manquante
          </h2>
          <p className="text-gray-700">
            {user?.grade === "admin"
              ? "Vous êtes connecté en tant qu'administrateur."
              : "L'application est désactivée. Veuillez contacter l'administrateur."}
          </p>
        </div>
      </div>
    );
  }

  // Grade/permission check (keep your existing logic)
  if (requiredGrade && user.grade !== requiredGrade && user.grade !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <h2 className="text-2xl font-bold text-red-600">Accès Refusé</h2>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
