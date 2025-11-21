import React, { createContext, useState, useEffect } from "react";
import api from "../utils/api";

export const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");

  // ✅ Load token and user from localStorage on startup
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      api
        .get("/users/isverify")
        .then(() => {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setIsAuthenticated(false);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ✅ Save user and token after login
  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(userData);
    setIsAuthenticated(true);
  };

  // ✅ Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    setIsAuthenticated(false);
  };

  // ✅ Dark/light theme toggle
  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        setIsAuthenticated,
        loading,
        theme,
        toggleTheme,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

AppProvider.context = AppContext;
export default AppProvider;
