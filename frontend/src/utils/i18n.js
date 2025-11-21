import i18n from "i18next";
import { initReactI18next } from "react-i18next";
const resources = {
  en: {
    translation: {
      Dashboard: "Dashboard",
      Patients: "Patients",
      Billing: "Billing",
      Settings: "Settings",
    },
  },
  fr: {
    translation: {
      Dashboard: "Tableau de bord",
      Patients: "Patients",
      Billing: "Facturation",
      Settings: "Paramètres",
      // Add more translations as needed
    },
  },
};
i18n.use(initReactI18next).init({
  resources,
  lng: "fr", // default language
  interpolation: {
    escapeValue: false,
  },
});
export default i18n;
