import React from "react";
import { useLocation } from "react-router-dom";
import clinicInfo from "../../config/clinicinfo.json";
import { MenuIcon } from "../icons/MenuIcon";
import { MoonIcon } from "../icons/MoonIcon";
import { SunIcon } from "../icons/SunIcon";

export default function Header({
  toggleSidebar,
  theme,
  toggleTheme,
  user,
  navItems,
}) {
  const location = useLocation();

  const getPageTitle = () => {
    const cur = navItems.find((i) => i.path === location.pathname);
    if (cur) return cur.name;
    if (location.pathname === "/admin/users" && user?.grade === "admin")
      return "Gestion des Utilisateurs";
    return clinicInfo.name;
  };

  // ✅ Role display mapping
  const getRoleLabel = (grade) => {
    switch (grade) {
      case "doctor":
        return "Médecin";
      case "secretaire":
        return "Secrétaire";
      case "admin":
        return "Administrateur";
      default:
        return grade || "Utilisateur";
    }
  };

  return (
    <header className="header">
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 md:hidden"
        >
          <MenuIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        </button>

        <h1 className="header-title">{getPageTitle()}</h1>

        {user?.grade && (
          <span className="px-2 py-1 text-xs bg-primary text-white rounded-full capitalize">
            {getRoleLabel(user.grade)}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
        <span className="hidden sm:block header-text">
          {clinicInfo.name} – {clinicInfo.address}
        </span>

        <button onClick={toggleTheme} className="header-button">
          {theme === "light" ? (
            <MoonIcon className="h-6 w-6" />
          ) : (
            <SunIcon className="h-6 w-6" />
          )}
        </button>
      </div>
    </header>
  );
}
