// components/Login.js
import React, { useState, useContext } from "react";
import { AppContext } from "../contexts/AppContext";
import api from "../utils/api";
import img from "../assets/logoDrbradai.png";
import clinicInfo from "../config/clinicinfo.json";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setUser, setIsAuthenticated } = useContext(AppContext);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/users/login", credentials);

      if (response.data) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        setUser(response.data.user);
        setIsAuthenticated(true);

        const roleMessages = {
          admin: "Administrateur",
          doctor: "Docteur",
          secretaire: "Secrétaire",
        };
        toast.success(
          `Bienvenue ${
            roleMessages[response.data.user.grade] || response.data.user.grade
          }`
        );
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container bg-main">
      <div className="login-content bg-card">
        {/* Logo */}
        <div className="logo-container">
          <img src={img} alt="VascCare Logo" className="logo-image" />
        </div>

        {/* Title */}
        <h1 className="login-title text-main">VascCare</h1>
        <p className="login-subtitle text-secondary">
          {clinicInfo.name} – {clinicInfo.address}
        </p>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-message status-error">{error}</div>}

          <div className="form-fields">
            <div className="form-group">
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleInputChange}
                placeholder="Nom d'utilisateur"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                placeholder="Mot de passe"
                className="form-input"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary login-button"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        {/* Admin Hint */}
        <p className="login-hint text-secondary">
          Accès réservé au personnel médical
        </p>
      </div>
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default Login;
