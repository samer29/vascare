// Initialize application colors on app start
export const initializeColors = async () => {
  try {
    const response = await fetch("/api/settings/colors");
    if (response.ok) {
      const colors = await response.json();

      if (colors && Object.keys(colors).length > 0) {
        console.log("Loaded custom colors:", colors);
        applyColors(colors);
        return true;
      }
    }
    console.log("No custom colors found, using defaults");
    return false;
  } catch (error) {
    console.log("Using default colors - API call failed:", error);
    return false;
  }
};

export const applyColors = (colors) => {
  const root = document.documentElement;

  // Map the color keys to the new CSS variable names
  const variableMapping = {
    primary: "custom-primary",
    primaryDark: "custom-primary-dark",
    success: "custom-success",
    warning: "custom-warning",
    error: "custom-error",
    bgMain: "custom-bg-main",
    bgHeader: "custom-bg-header",
    bgSidebar: "custom-bg-sidebar",
    bgCard: "custom-bg-card",
    textMain: "custom-text-main",
    textSecondary: "custom-text-secondary",
    border: "custom-border",
  };

  Object.entries(colors).forEach(([key, value]) => {
    const cssVar = variableMapping[key];
    if (cssVar && value) {
      root.style.setProperty(`--${cssVar}`, value);
      console.log(`Applied --${cssVar}: ${value}`);
    }
  });
};
