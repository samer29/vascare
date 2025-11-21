// src/routes/AppRoutes.jsx
import React, { useContext, useEffect, useState } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import AppProvider from "../../contexts/AppContext";
import Dashboard from "../../components/Dashboard";
import PatientManager from "../../components/PatientManager";
import Billing from "../../components/Billing";
import Settings from "../../components/Settings";
import Login from "../../components/Login";
import UserManagement from "../../components/UserManagement";
import About from "../../components/pages/About"; // Import About component
import ProtectedRoute from "../../components/ProtectedRoute";

import MainLayout from "../../components/layout/MainLayout";
import { StethoscopeIcon } from "../icons/StethoscopeIcon";
import { UserIcon } from "../icons/UserIcon";
import { DollarSignIcon } from "../icons/DollarSignIcon";
import { SettingsIcon } from "../icons/SettingsIcon";
import { InfoIcon } from "../icons/InfoIcon"; // Add InfoIcon

export default function AppRoutes() {
  const { isAuthenticated, loading, user } = useContext(AppProvider.context);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Remove showAbout state since we don't need modal anymore

  const { theme } = useContext(AppProvider.context);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const navItems = React.useMemo(() => {
    const base = [
      {
        path: "/",
        name: "Dashboard",
        icon: <StethoscopeIcon className="icon" />,
        roles: ["admin", "doctor"],
      },
      {
        path: "/patients",
        name: "Patients",
        icon: <UserIcon className="icon" />,
        roles: ["admin", "doctor", "secretaire"],
      },
      {
        path: "/billing",
        name: "Facturation",
        icon: <DollarSignIcon className="icon" />,
        roles: ["admin", "doctor"],
      },
      {
        path: "/settings",
        name: "Paramètres",
        icon: <SettingsIcon className="icon" />,
        roles: ["admin", "doctor"],
      },
      {
        path: "/about",
        name: "À Propos",
        icon: <InfoIcon className="icon" />,
        roles: ["admin", "doctor", "secretaire"], // All roles can see About
      },
    ];
    return base.filter((i) => i.roles.includes(user?.grade));
  }, [user?.grade]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        {/* ---------- PUBLIC ---------- */}
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />}
        />

        {/* ---------- PROTECTED ---------- */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <MainLayout
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                navItems={navItems} // Remove showAbout props
              >
                <InnerRoutes user={user} navItems={navItems} />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </HashRouter>
  );
}

function InnerRoutes({ user, navItems }) {
  return (
    <Routes>
      {/* Dashboard - Protected by license */}
      {(user?.grade === "admin" || user?.grade === "doctor") && (
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      )}

      {/* Patients – all roles - Protected by license */}
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <PatientManager userRole={user?.grade} />
          </ProtectedRoute>
        }
      />

      {/* Billing - Protected by license */}
      {(user?.grade === "admin" || user?.grade === "doctor") && (
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <Billing />
            </ProtectedRoute>
          }
        />
      )}

      {/* Settings - Only admin can access when expired */}
      {(user?.grade === "admin" || user?.grade === "doctor") && (
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
      )}

      {/* About - All authenticated users */}
      <Route
        path="/about"
        element={
          <ProtectedRoute>
            <About />
          </ProtectedRoute>
        }
      />

      {/* Admin – Users - Only admin can access when expired */}
      {user?.grade === "admin" && (
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredGrade="admin">
              <UserManagement />
            </ProtectedRoute>
          }
        />
      )}

      {/* Fallback redirect */}
      <Route
        path="*"
        element={
          <Navigate
            to={user?.grade === "secretaire" ? "/patients" : "/"}
            replace
          />
        }
      />
    </Routes>
  );
}
