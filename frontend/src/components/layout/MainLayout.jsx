// src/components/layout/MainLayout.jsx
import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import AppProvider from "../../contexts/AppContext";

export default function MainLayout({
  children,
  sidebarOpen,
  setSidebarOpen,
  navItems, // Remove showAbout props
}) {
  const { theme, toggleTheme, user, logout } = React.useContext(
    AppProvider.context
  );

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="main-layout">
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        navItems={navItems}
        user={user}
        logout={logout}
      />

      <div className="main-content">
        <Header
          toggleSidebar={toggleSidebar}
          theme={theme}
          toggleTheme={toggleTheme}
          user={user}
          navItems={navItems}
        />
        <main className="main-content-inner">{children}</main>
      </div>

    </div>
  );
}
