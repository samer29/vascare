// src/components/layout/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { LogoutIcon } from "../icons/LogoutIcon";
import { InfoIcon } from "../icons/InfoIcon";
import { UserGroupIcon } from "../icons/UserGroupIcon";
import { XIcon } from "../icons/XIcon";
import img from "../../assets/logoDrbradaiWhite.png";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

export default function Sidebar({
  isOpen,
  toggleSidebar,
  navItems,
  user,
  logout,
}) {
  // Remove setShowAbout prop
  const location = useLocation();
  useEffect(() => {
    toggleSidebar(false);
  }, [location.pathname]);

  return (
    <>
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* ---- Header ---- */}
        <div className="sidebar-header">
          <div className="flex items-center space-x-3">
            <img
              src={img}
              alt="VascCare Logo"
              className="h-12 w-12 object-contain drop-shadow-xl"
            />
            <div>
              <span className="sidebar-title">VascCare</span>
              <p className="text-xs  capitalize">{user?.grade}</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-700 dark:text-gray-300"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* ---- Navigation ---- */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => toggleSidebar(false)}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
              end
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* ---- User info + logout ---- */}
        <div className="mt-auto p-4 border-t border-green-300 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.username}
              </p>
              <p className="text-xs capitalize">{user?.grade}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white bg-gray-700 hover:bg-gray-800 rounded-lg transition"
          >
            <LogoutIcon className="h-4 w-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? "open" : ""}`}
        onClick={() => toggleSidebar(false)}
      />
    </>
  );
}
