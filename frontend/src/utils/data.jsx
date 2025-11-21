export const calculateAge = (dob) => {
  if (!dob) return "—";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age > 0 ? age : "—";
};
// 🧩 FRONTEND SAFE DATE PARSER
export const fixUTCDateToLocal = (dateString) => {
  // console.log("🔄 fixUTCDateToLocal input:", dateString);

  if (!dateString) return "";

  // If backend already sends YYYY-MM-DD → just reformat
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [y, m, d] = dateString.split("-");
    const result = `${d}/${m}/${y}`;
    console.log("✅ YYYY-MM-DD converted to:", result);
    return result;
  }

  // Handle ISO date like "2025-11-05T23:00:00.000Z"
  if (dateString.includes("T")) {
    const date = new Date(dateString);

    // ✅ Add 1 day to fix timezone offset issue
    date.setDate(date.getDate());

    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();

    const result = `${d}/${m}/${y}`;
    // console.log("✅ ISO date fixed (with +1 day):", result);
    return result;
  }

  // Already DD/MM/YYYY
  if (dateString.includes("/")) {
    console.log("✅ Already DD/MM/YYYY:", dateString);
    return dateString;
  }

  console.log("❌ Unknown date format:", dateString);
  return "";
};

// Format YYYY-MM-DD → DD/MM/YYYY
export const formatToDisplay = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

// Compute age directly (same logic backend uses)
export const calculateAgeFromDb = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  const birthDate = new Date(y, m - 1, d);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const diffMonth = today.getMonth() - birthDate.getMonth();
  if (
    diffMonth < 0 ||
    (diffMonth === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

export const formatDate = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
export const formatDateEuropean = (dateString) => {
  if (!dateString) return "—";

  // Handle both "2025-10-26" and "10/26/2025" formats
  let date;
  if (dateString.includes("-")) {
    // Already in YYYY-MM-DD format
    date = new Date(dateString);
  } else if (dateString.includes("/")) {
    // In MM/DD/YYYY format
    const [month, day, year] = dateString.split("/");
    date = new Date(`${year}-${month}-${day}`);
  } else {
    return "—";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
// ---- 1. FIX: inputDateToDb (must accept DD/MM/YYYY) ----
export const inputDateToDb = (inputDate) => {
  if (!inputDate) return "";
  // inputDate = "DD/MM/YYYY" (what the user types)
  const parts = inputDate
    .split("/")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length !== 3) return ""; // incomplete → empty
  const [d, m, y] = parts.map(Number);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return "";
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

// ---- 2. FIX: dbDateToInput (must return DD/MM/YYYY) ----
export const dbDateToInput = (dbDate) => {
  if (!dbDate) return "";
  // dbDate = "YYYY-MM-DD"
  const [y, m, d] = dbDate.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
};

// ---- 3. NEW: calculateAge from DD/MM/YYYY string (live) ----
export const calculateAgeFromInput = (dobInput) => {
  if (!dobInput) return "";
  const parts = dobInput.split("/").filter(Boolean);
  if (parts.length !== 3) return "";
  const [d, m, y] = parts.map(Number);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return "";

  const birth = new Date(y, m - 1, d);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? String(age) : "";
};

// ---- 4. NEW: age → DD/MM/YYYY (today - age years) ----
export const ageToDobInput = (ageStr) => {
  const age = Number(ageStr);
  if (isNaN(age) || age < 0) return "";
  const today = new Date();
  const year = today.getFullYear() - age;
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
};
// Add this function to your PatientDetail component or utils
export const convertNumberToWords = (number) => {
  const units = [
    "",
    "un",
    "deux",
    "trois",
    "quatre",
    "cinq",
    "six",
    "sept",
    "huit",
    "neuf",
  ];
  const teens = [
    "dix",
    "onze",
    "douze",
    "treize",
    "quatorze",
    "quinze",
    "seize",
    "dix-sept",
    "dix-huit",
    "dix-neuf",
  ];
  const tens = [
    "",
    "dix",
    "vingt",
    "trente",
    "quarante",
    "cinquante",
    "soixante",
    "soixante",
    "quatre-vingt",
    "quatre-vingt",
  ];

  if (number === 0) return "zéro";
  if (number > 999999) return "montant trop élevé";

  let words = "";

  // Thousands
  if (number >= 1000) {
    const thousands = Math.floor(number / 1000);
    if (thousands === 1) {
      words += "mille ";
    } else {
      words += convertNumberToWords(thousands) + " mille ";
    }
    number %= 1000;
  }

  // Hundreds
  if (number >= 100) {
    const hundreds = Math.floor(number / 100);
    if (hundreds === 1) {
      words += "cent ";
    } else {
      words += units[hundreds] + " cent ";
    }
    number %= 100;
    if (number === 0) words = words.trim() + "s ";
  }

  // Tens and units
  if (number > 0) {
    if (number < 10) {
      words += units[number] + " ";
    } else if (number < 20) {
      words += teens[number - 10] + " ";
    } else {
      const ten = Math.floor(number / 10);
      const unit = number % 10;
      words += tens[ten] + " ";
      if (unit > 0) {
        if (unit === 1 && ten !== 8) {
          words += "et ";
        }
        words += units[unit] + " ";
      }
    }
  }

  return words.trim();
};
