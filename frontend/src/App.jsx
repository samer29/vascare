import React, { useEffect, useState } from "react";
import AppProvider from "./contexts/AppContext";
import AppRoutes from "./components/routes/AppRoutes";
import { initializeColors } from "./utils/colorInitializer";

export default function App() {
  const [colorsLoaded, setColorsLoaded] = useState(false);

  useEffect(() => {
    const loadColors = async () => {
      const loaded = await initializeColors();
      setColorsLoaded(true);

      // Debug: Check what colors are currently set
      if (loaded) {
        setTimeout(() => {
          const root = document.documentElement;
          const primary = getComputedStyle(root)
            .getPropertyValue("--custom-primary")
            .trim();
          const bgMain = getComputedStyle(root)
            .getPropertyValue("--custom-bg-main")
            .trim();
          console.log(
            "Current custom colors - Primary:",
            primary,
            "BG Main:",
            bgMain
          );
        }, 100);
      }
    };

    loadColors();
  }, []);

  // Optional: Show loading spinner while colors load
  if (!colorsLoaded) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
